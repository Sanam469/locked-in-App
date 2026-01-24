const {
  app,
  BrowserWindow,
  screen,
  globalShortcut,
  ipcMain,
  session,
} = require("electron");
const path = require("path");
const db = require("./database");
const { handleSignUp, handleLogin } = require("./auth");
const activeWin = require("active-win");

let mainWindow;
let veilWindow;
let wardenLoop;
let lastState = "focused";
let sessionStartTime = null;

// --- WINDOW CREATION ---
function createWindows() {
  const { width, height } = screen.getPrimaryDisplay().bounds;

  veilWindow = new BrowserWindow({
    width,
    height,
    x: 0,
    y: 0,
    backgroundColor: "#000000",
    frame: false,
    show: false,
    skipTaskbar: true,
    kiosk: true,
    webPreferences: { nodeIntegration: true },
  });

  veilWindow.loadURL(
    `data:text/html;charset=utf-8,${encodeURIComponent(`
    <body style="background:#000000; color:white; display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; margin:0; font-family: 'Segoe UI', sans-serif; overflow:hidden; border: 4px solid #ef4444;">
        <div style="text-align:center; border: 1px solid #333; padding: 60px; background: rgba(255,255,255,0.02); border-radius: 4px;">
           <h1 style="font-size: 60px; font-weight: 900; color:#ef4444; margin:0; letter-spacing:-3px; font-style: italic; text-transform: uppercase;">Containment Active</h1>
           <div style="height:2px; width:100%; background:linear-gradient(90deg, transparent, #ef4444, transparent); margin: 30px 0;"></div>
           <p style="letter-spacing:10px; font-size:14px; color:#888; margin:0; text-transform:uppercase; font-weight: bold;">Return to Terminal Node to Resume Session</p>
        </div>
    </body>
  `)}`,
  );

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    center: true,
    frame: true,
    backgroundColor: "#0b0b0e",
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      partition: "persist:warden_session",
    },
  });

  mainWindow.maximize();
  mainWindow.show();
  mainWindow.loadURL("http://localhost:3000/auth");

  globalShortcut.register("CommandOrControl+Shift+X", () => {
    if (sessionStartTime) {
      releaseSystem();
    } else {
      app.quit();
    }
  });
}

// --- GLOBAL STATE ---
global.currentUserId = null;
global.performanceCache = {
  currentWeek: new Array(10).fill(0),
  activeIndex: 8,
  rangeLabel: "Jan 15 - Jan 25",
};

// --- AUTH & PROFILE HANDLERS ---
ipcMain.handle("auth:signup", async (event, userData) => {
  try {
    const result = await handleSignUp(
      userData.email,
      userData.password,
      userData.username,
    );
    if (result && result.success && result.user)
      global.currentUserId = result.user.user_id;
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle("auth:login", async (event, credentials) => {
  try {
    const result = await handleLogin(credentials.email, credentials.password);
    if (result && result.success && result.user)
      global.currentUserId = result.user.user_id;
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle("session:sync", async (event, email) => {
  return new Promise((resolve) => {
    db.get("SELECT user_id FROM users WHERE email = ?", [email], (err, row) => {
      if (row) {
        global.currentUserId = row.user_id;
        resolve({ success: true });
      } else resolve({ success: false });
    });
  });
});

ipcMain.handle("user:get-profile", async () => {
  return new Promise((resolve) => {
    if (!global.currentUserId)
      return resolve({ success: false, error: "No active session" });
    db.get(
      "SELECT user_id, username, email FROM users WHERE user_id = ?",
      [global.currentUserId],
      (err, row) => {
        if (err || !row) return resolve({ success: false });
        resolve({
          success: true,
          data: {
            userId: `USR-${row.user_id.toString().padStart(3, "0")}`,
            username: row.username,
            email: row.email,
          },
        });
      },
    );
  });
});

ipcMain.handle("auth:logout", () => {
  global.currentUserId = null;
  return { success: true };
});

// --- GOOGLE/URL LOGIN HELPERS ---
ipcMain.handle("prepare-login", async (event, targetUrl) => {
  const wardenSession = mainWindow.webContents.session;
  return new Promise((resolve) => {
    const loginWin = new BrowserWindow({
      width: 500,
      height: 650,
      parent: mainWindow,
      modal: true,
      show: true,
      webPreferences: {
        session: wardenSession,
        nodeIntegration: false,
        contextIsolation: true,
        webSecurity: true,
      },
    });
    const firefoxAgent =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0";
    loginWin.loadURL("https://accounts.google.com/ServiceLogin?hl=en", {
      userAgent: firefoxAgent,
    });
    let loginVerified = false;
    const cookieHandler = async () => {
      const cookies = await wardenSession.cookies.get({});
      if (
        cookies.some((c) => c.name === "SID" || c.name === "__Secure-3PSID") &&
        !loginVerified
      ) {
        loginVerified = true;
      }
    };
    wardenSession.cookies.on("changed", cookieHandler);
    loginWin.on("closed", () => {
      wardenSession.cookies.removeListener("changed", cookieHandler);
      resolve(!!loginVerified);
    });
  });
});

ipcMain.handle("prepare-url-login", async (event, targetUrl) => {
  const wardenSession = mainWindow.webContents.session;
  return new Promise((resolve) => {
    const isGoogle = targetUrl.toLowerCase().includes("google.com");
    const userAgent = isGoogle
      ? "Mozilla/5.0 (Windows NT 10.0; Win64; x64) rv:125.0 Gecko/20100101 Firefox/125.0"
      : "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";
    const loginWin = new BrowserWindow({
      width: isGoogle ? 500 : 1000,
      height: isGoogle ? 650 : 800,
      parent: mainWindow,
      modal: true,
      show: true,
      webPreferences: { session: wardenSession },
    });
    let loginActionDetected = false;
    const cookieListener = (event, details) => {
      if (
        details &&
        details.cookie &&
        !details.removed &&
        (details.cookie.httpOnly || details.cookie.name.includes("SID"))
      )
        loginActionDetected = true;
    };
    wardenSession.cookies.on("changed", cookieListener);
    loginWin.webContents.on("did-start-navigation", () => {
      loginWin.webContents.executeJavaScript(
        `try { Object.defineProperty(navigator.__proto__, 'webdriver', {get: () => undefined}); } catch(e) {}`,
      );
    });
    loginWin.loadURL(targetUrl, { userAgent });
    loginWin.on("closed", () => {
      wardenSession.cookies.removeListener("changed", cookieListener);
      resolve(loginActionDetected);
    });
  });
});

// --- DASHBOARD & PERFORMANCE (THE MIRROR FIX) ---
ipcMain.on("get-initial-performance-cache", (event) => {
  event.returnValue = global.performanceCache;
});

ipcMain.handle("get-daily-stats", async () => {
  return new Promise((resolve) => {
    if (!global.currentUserId) return resolve({ success: true, minutes: 0 });
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    db.get(
      "SELECT total_mins_today, last_session_date FROM users WHERE user_id = ?",
      [global.currentUserId],
      (err, row) => {
        if (err || !row || row.last_session_date !== today)
          return resolve({ success: true, minutes: 0 });
        resolve({ success: true, minutes: row.total_mins_today });
      },
    );
  });
});

ipcMain.handle("get-performance-pulse", async () => {
  return new Promise((resolve) => {
    if (!global.currentUserId)
      return resolve({ success: false, error: "NO_USER" });

    const anchorDate = new Date("2026-01-15T00:00:00");
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const daysSinceAnchor = Math.floor(
      (today - anchorDate) / (1000 * 60 * 60 * 24),
    );
    const blockStartOffset = Math.floor(daysSinceAnchor / 10) * 10;
    const startDateObj = new Date(anchorDate);
    startDateObj.setDate(anchorDate.getDate() + blockStartOffset);
    const endDateObj = new Date(startDateObj);
    endDateObj.setDate(startDateObj.getDate() + 9);
    const startDate = startDateObj.toISOString().split("T")[0];
    const endDate = endDateObj.toISOString().split("T")[0];
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    // --- STEP 1: CALCULATE DYNAMIC STREAK ---
    const streakQuery = `
      SELECT DISTINCT substr(start_time, 1, 10) as session_day 
      FROM sessions 
      WHERE user_id = ? 
      ORDER BY session_day DESC
    `;

    db.all(streakQuery, [global.currentUserId], (err, sessionRows) => {
      let streak = 0;
      const sessionDays = sessionRows
        ? sessionRows.map((r) => r.session_day)
        : [];

      // Check the Dashboard table (users) for today's live minutes
      db.get(
        "SELECT total_mins_today, last_session_date FROM users WHERE user_id = ?",
        [global.currentUserId],
        (err, userRow) => {
          let hasMinsToday =
            userRow &&
            userRow.last_session_date === todayStr &&
            userRow.total_mins_today > 0;
          let checkDate = new Date(today);

          // If no minutes today in dashboard AND no sessions in table, check yesterday
          if (!hasMinsToday && !sessionDays.includes(todayStr)) {
            checkDate.setDate(checkDate.getDate() - 1);
            const yesterdayStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, "0")}-${String(checkDate.getDate()).padStart(2, "0")}`;

            if (!sessionDays.includes(yesterdayStr)) {
              checkDate = null; // No work today or yesterday = 0 streak
            }
          }

          if (checkDate) {
            for (let i = 0; i < 1000; i++) {
              const dateStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, "0")}-${String(checkDate.getDate()).padStart(2, "0")}`;

              // Current checkDate is "today" and we have dashboard mins OR it's in the sessions table
              if (
                (dateStr === todayStr && hasMinsToday) ||
                sessionDays.includes(dateStr)
              ) {
                streak++;
                checkDate.setDate(checkDate.getDate() - 1);
              } else {
                break;
              }
            }
          }

          // --- STEP 2: PROCEED WITH PULSE LOGIC ---
          db.all(
            `SELECT substr(start_time, 1, 10) as session_date, SUM(actual_minutes) as daily_total FROM sessions WHERE user_id = ? AND session_date >= ? AND session_date <= ? GROUP BY session_date`,
            [global.currentUserId, startDate, endDate],
            (err, rows) => {
              let currentWeek = new Array(10).fill(0);
              const startAnchorTime = startDateObj.getTime();
              if (rows) {
                rows.forEach((row) => {
                  const [rYear, rMonth, rDay] = row.session_date
                    .split("-")
                    .map(Number);
                  const entryDate = new Date(rYear, rMonth - 1, rDay).getTime();
                  const diffDays = Math.round(
                    (entryDate - startAnchorTime) / (1000 * 60 * 60 * 24),
                  );
                  if (diffDays >= 0 && diffDays < 10)
                    currentWeek[diffDays] = row.daily_total || 0;
                });
              }
              const activeIndex = Math.round(
                (today.getTime() - startAnchorTime) / (1000 * 60 * 60 * 24),
              );

              // Apply Mirror for the Bar UI
              if (hasMinsToday) {
                currentWeek[activeIndex] = userRow.total_mins_today;
              }

              const result = {
                currentWeek,
                activeIndex,
                streak,
                rangeLabel: `${startDateObj.toLocaleDateString("en-US", { day: "numeric", month: "short" })} - ${endDateObj.toLocaleDateString("en-US", { day: "numeric", month: "short" })}`,
                startDayNumber: startDateObj.getDate(),
                startMonthName: startDateObj.toLocaleDateString("en-US", {
                  month: "short",
                }),
              };

              global.performanceCache = result;
              resolve({ success: true, data: result });
            },
          );
        },
      );
    });
  });
});

// --- WARDEN ENGINE ---
ipcMain.on("engage-warden", (event, config) => {
  sessionStartTime = Date.now();
  veilWindow.hide();
  lastState = "focused";
  mainWindow.setKiosk(true);
  mainWindow.setAlwaysOnTop(true, "screen-saver", 2);
  const userAgent =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";
  mainWindow.loadURL(config.url, { userAgent });
  mainWindow.webContents.once("dom-ready", () => {
    setTimeout(() => {
      veilWindow.show();
      veilWindow.setAlwaysOnTop(true, "screen-saver", 1);
      mainWindow.focus();
      startSurgicalWarden();
    }, 3000);
  });
  setTimeout(() => releaseSystem(), config.duration * 60 * 1000);
});

function releaseSystem() {
  if (sessionStartTime) {
    const sessionMinutes = Math.round((Date.now() - sessionStartTime) / 60000);
    const now = new Date();
    const todayDateOnly = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const timestamp = `${todayDateOnly} ${now.toTimeString().split(" ")[0]}`;
    db.serialize(() => {
      db.run(
        `UPDATE users SET total_mins_today = CASE WHEN last_session_date = ? THEN total_mins_today + ? ELSE ? END, last_session_date = ? WHERE user_id = ?`,
        [
          todayDateOnly,
          sessionMinutes,
          sessionMinutes,
          todayDateOnly,
          global.currentUserId,
        ],
      );
      db.get(
        "SELECT session_id FROM sessions WHERE user_id = ? AND substr(start_time, 1, 10) = ?",
        [global.currentUserId, todayDateOnly],
        (err, row) => {
          if (row)
            db.run(
              "UPDATE sessions SET actual_minutes = actual_minutes + ? WHERE session_id = ?",
              [sessionMinutes, row.session_id],
            );
          else
            db.run(
              `INSERT INTO sessions (user_id, target_site, actual_minutes, goal_minutes, status, start_time) VALUES (?, ?, ?, ?, 'SUCCESS', ?)`,
              [
                global.currentUserId,
                "Warden_Focus_Session",
                sessionMinutes,
                120,
                timestamp,
              ],
            );
        },
      );
    });
    sessionStartTime = null;
  }
  if (wardenLoop) clearInterval(wardenLoop);
  mainWindow.setKiosk(false);
  mainWindow.setAlwaysOnTop(false);
  veilWindow.hide();
  mainWindow.loadURL("http://localhost:3000/dashboard");
}

function startSurgicalWarden() {
  if (wardenLoop) clearInterval(wardenLoop);
  wardenLoop = setInterval(async () => {
    try {
      const active = await activeWin();
      if (!active) return;
      const isOurApp =
        active.owner.name.toLowerCase().includes("electron") ||
        active.title.toLowerCase().includes("locked-in") ||
        active.title.toLowerCase().includes("codeforces");
      if (!isOurApp && lastState === "focused") {
        lastState = "breached";
        veilWindow.setAlwaysOnTop(true, "screen-saver", 3);
        veilWindow.focus();
      } else if (isOurApp && lastState === "breached") {
        lastState = "focused";
        veilWindow.setAlwaysOnTop(true, "screen-saver", 1);
        mainWindow.focus();
      }
    } catch (e) {}
  }, 200);
}

app.whenReady().then(createWindows);
