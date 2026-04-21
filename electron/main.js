const {
  app,
  BrowserWindow,
  screen,
  globalShortcut,
  ipcMain,
  session,
  protocol,
  net,
  dialog
} = require("electron");
const path = require("path");
const { pathToFileURL } = require('url');

// Register the scheme as privileged (this helps with fetch and other web features)
protocol.registerSchemesAsPrivileged([
  { 
    scheme: 'warden', 
    privileges: { 
      standard: true, 
      secure: true, 
      supportFetchAPI: true,
      bypassCSP: true,
      corsEnabled: true
    } 
  }
]);

const db = require("./database");
const { handleSignUp, handleLogin } = require("./auth");
const activeWin = require("active-win");

let mainWindow;
let veilWindow;
let loadingWindow;
let wardenLoop;
let lastState = "focused";
let sessionsStartTime = null;
let initializationTimeout = null;
let sessionExpiryTimeout = null;
let activeSessionUrl = "Warden_Focus_Session";

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

  loadingWindow = new BrowserWindow({
    width,
    height,
    x: 0,
    y: 0,
    backgroundColor: "#000000",
    transparent: true,
    frame: false,
    show: false,
    skipTaskbar: true,
    kiosk: true,
    webPreferences: { nodeIntegration: true },
  });

  loadingWindow.loadURL(
    `data:text/html;charset=utf-8,${encodeURIComponent(`
    <style>
      body {
        margin: 0;
        background: radial-gradient(circle at center, rgba(15, 23, 42, 0.92), rgba(7, 10, 15, 0.98));
        backdrop-filter: blur(50px) saturate(200%);
        color: white;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100vh;
        font-family: 'Inter', system-ui, sans-serif;
        overflow: hidden;
      }
      .container {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 40px;
        position: relative;
        z-index: 10;
        animation: poppy-in 1s cubic-bezier(0.19, 1, 0.22, 1) forwards;
      }
      @keyframes poppy-in {
        from { transform: scale(0.9); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
      }
      .spinner {
        width: 100px;
        height: 100px;
        border-radius: 50%;
        border: 4px solid transparent;
        border-top-color: #3b82f6;
        border-bottom-color: #3b82f6;
        animation: spin 1.5s cubic-bezier(0.5, 0, 0.5, 1) infinite;
        position: relative;
        filter: drop-shadow(0 0 25px rgba(59, 130, 246, 0.8));
      }
      .spinner:before {
        content: '';
        position: absolute;
        inset: -15px;
        border-radius: 50%;
        border: 1px solid #3b82f6;
        opacity: 0.2;
        animation: pulse-ring 2.5s ease-in-out infinite;
      }
      @keyframes spin { to { transform: rotate(360deg); } }
      @keyframes pulse-ring {
        0%, 100% { transform: scale(1); opacity: 0.05; }
        50% { transform: scale(1.4); opacity: 0.2; }
      }
      .status {
        text-align: center;
        margin-top: 15px;
      }
      h2 {
        font-size: 42px;
        font-weight: 900;
        font-style: italic;
        letter-spacing: -2px;
        text-transform: uppercase;
        margin: 0;
        background: linear-gradient(to bottom, #fff, #94a3b8);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        filter: drop-shadow(0 0 30px rgba(255, 255, 255, 0.4));
      }
      p {
        font-size: 11px;
        font-weight: 900;
        letter-spacing: 0.6em;
        text-transform: uppercase;
        color: #3b82f6;
        opacity: 0.6;
        margin: 12px 0 0;
        filter: drop-shadow(0 0 10px rgba(59, 130, 246, 0.3));
      }
      /* Vignette Overlay */
      .vignette {
        position: absolute;
        inset: 0;
        background: radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.6) 100%);
        pointer-events: none;
      }
    </style>
    <body>
      <div class="vignette"></div>
      <div class="container">
        <div class="spinner"></div>
        <div class="status">
          <h2 id="status_text">INITIALIZING_PROTOCOL</h2>
          <p>Protocol: Alpha Enforcement</p>
        </div>
      </div>
      <script>
        const statusText = document.getElementById('status_text');
        setTimeout(() => statusText.innerText = "DEPLOYING_CAGE", 1200);
        setTimeout(() => statusText.innerText = "KERNEL_ISOLATION_ACTIVE", 2500);
        setTimeout(() => statusText.innerText = "SYSTEM_LOCKED", 3800);
      </script>
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

  if (app.isPackaged) {
    mainWindow.loadURL("warden://app/auth.html");
  } else {
    mainWindow.loadURL("http://localhost:3000/auth");
  }

  globalShortcut.register("CommandOrControl+Shift+X", () => {
    if (sessionsStartTime) {
      console.log(">>> [WARDEN] SAFE_EXIT_TRIGGERED: DISABLING_CAGE");
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

ipcMain.handle("system:open-file", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openFile"],
    filters: [
      { name: "Documents & Images", extensions: ["pdf", "jpg", "png", "webp", "jfif"] },
    ],
  });

  if (!result.canceled && result.filePaths.length > 0) {
    // Convert path to file:// URL for proper loading in Electron
    return pathToFileURL(result.filePaths[0]).toString();
  }
  return null;
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
        enableWebAuthn: false
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
        // Auto-close on success to avoid manual overhead
        if (loginWin && !loginWin.isDestroyed()) {
          loginWin.close();
        }
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
  // 1. DATA CLEANING: This kills the "Illegal Invocation" flood in your terminal
  const finalUrl = String(targetUrl);
  const wardenSession = mainWindow.webContents.session;

  return new Promise((resolve) => {
    const urlLower = finalUrl.toLowerCase();
    const isGoogleOrYT = urlLower.includes("google.com") || urlLower.includes("youtube.com");

    // 2. IDENTITY FIX: Firefox 115 is the "Legacy" sweet spot. 
    // It forces Google/YT to skip the Passkey check and use the Password box.
    const userAgent = isGoogleOrYT
      ? "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:115.0) Gecko/20100101 Firefox/115.0"
      : "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

    const loginWin = new BrowserWindow({
      width: isGoogleOrYT ? 500 : 1000,
      height: isGoogleOrYT ? 650 : 800,
      parent: mainWindow,
      modal: true,
      show: true,
      webPreferences: { 
        session: wardenSession,
        nodeIntegration: false,
        contextIsolation: true,
        webSecurity: true,
        // 3. HARDWARE SILENCER: Tells Google not to even look for a Fingerprint/PIN
        enableWebAuthn: false,
        disableBlinkFeatures: 'WebAuthentication,WebBluetooth,WebUSB'
      },
    });

    let loginActionDetected = false;
    const cookieListener = (event, details) => {
      if (
        details &&
        details.cookie &&
        !details.removed &&
        (details.cookie.httpOnly || details.cookie.name.includes("SID"))
      ) {
        loginActionDetected = true;
        // Auto-close on successful handshake detection
        if (loginWin && !loginWin.isDestroyed()) {
          loginWin.close();
        }
      }
    };

    wardenSession.cookies.on("changed", cookieListener);
    
    loginWin.webContents.on("did-start-navigation", () => {
      loginWin.webContents.executeJavaScript(
        `try { Object.defineProperty(navigator.__proto__, 'webdriver', {get: () => undefined}); } catch(e) {}`,
      );
    });

    // Load using the cleaned finalUrl
    loginWin.loadURL(finalUrl, { userAgent });

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

ipcMain.handle("get-recent-paths", async () => {
  return new Promise((resolve) => {
    if (!global.currentUserId) return resolve({ success: true, nodes: [] });
    // This query gets the latest single occurrence of each site visited by the user
    const query = `
      SELECT target_site, MAX(start_time) as last_visited
      FROM sessions 
      WHERE user_id = ? AND target_site NOT LIKE 'file://%'
      GROUP BY target_site 
      ORDER BY last_visited DESC 
      LIMIT 3
    `;
    db.all(query, [global.currentUserId], (err, rows) => {
      if (err) return resolve({ success: false, error: err.message });
      resolve({ success: true, nodes: rows || [] });
    });
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
                // ADD THIS LINE: It creates the "15 Jan", "16 Jan" strings dynamically
                dayLabels: currentWeek.map((_, i) => {
                  const d = new Date(startDateObj);
                  d.setDate(d.getDate() + i);
                  return `${d.getDate()} ${d.toLocaleString("en-US", { month: "short" })}`;
                }),
                startDayNumber: startDateObj.getDate(),
                startMonthName: startDateObj.toLocaleDateString("en-US", { month: "short" }),
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
ipcMain.handle("save-session-data", async (event, data) => {
  return new Promise((resolve) => {
    if (!global.currentUserId) return resolve({ success: false });
    const todayDateOnly = new Date().toISOString().split("T")[0];
    
    db.get(
      "SELECT session_id FROM sessions WHERE user_id = ? AND substr(start_time, 1, 10) = ? AND target_site = ?",
      [global.currentUserId, todayDateOnly, data.target_site],
      (err, row) => {
        if (row) {
          db.run(
            "UPDATE sessions SET actual_minutes = actual_minutes + ? WHERE session_id = ?",
            [data.actual_minutes, row.session_id],
            () => resolve({ success: true })
          );
        } else {
          db.run(
            `INSERT INTO sessions (user_id, target_site, actual_minutes, goal_minutes, status, start_time) VALUES (?, ?, ?, ?, 'SUCCESS', ?)`,
            [
              global.currentUserId,
              data.target_site,
              data.actual_minutes,
              data.goal_minutes,
              data.start_time
            ],
            () => resolve({ success: true })
          );
        }
      }
    );
  });
});

ipcMain.on("engage-warden", (event, config) => {
  // Clear any existing session first to be safe
  if (sessionsStartTime) releaseSystem();

  sessionsStartTime = Date.now();
  activeSessionUrl = config.url || "Warden_Focus_Session";
  veilWindow.hide();

  // INSTANT PERSISTENCE: Create a session entry immediately so it shows in "Recent Paths" right away
  if (global.currentUserId) {
    const todayStr = new Date().toISOString().split("T")[0];
    const timestamp = `${todayStr} ${new Date().toTimeString().split(" ")[0]}`;
    db.run(
      `INSERT INTO sessions (user_id, target_site, actual_minutes, goal_minutes, status, start_time) VALUES (?, ?, ?, ?, 'SUCCESS', ?)`,
      [global.currentUserId, activeSessionUrl, 0, config.duration || 120, timestamp]
    );
  }
  
  // Show Loading Overlay immediately while site loads
  loadingWindow.show();
  loadingWindow.setAlwaysOnTop(true, "screen-saver", 10);
  
  lastState = "focused";
  mainWindow.setKiosk(true);
  mainWindow.setAlwaysOnTop(true, "screen-saver", 2);
  
  const userAgent =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
  
  // Start loading target site immediately
  mainWindow.loadURL(config.url, { userAgent });
  
  // Manage the 5s Loading Screen simultaneous with site loading
  let domReady = false;
  let timerExpired = false;

  const checkFinish = () => {
    if (domReady && timerExpired) {
      if (!sessionsStartTime) return; // Aborted
      loadingWindow.hide();
      veilWindow.show();
      veilWindow.setAlwaysOnTop(true, "screen-saver", 1);
      mainWindow.focus();
      startSurgicalWarden();
    }
  };

  mainWindow.webContents.once("dom-ready", () => {
    domReady = true;
    checkFinish();
  });

  initializationTimeout = setTimeout(() => {
    timerExpired = true;
    checkFinish();
    initializationTimeout = null;
  }, 5000);

  // Track the session expiry timeout
  sessionExpiryTimeout = setTimeout(() => {
    if (sessionsStartTime) releaseSystem();
  }, config.duration * 60 * 1000);
});

function releaseSystem() {
  // 1. CLEAR HEARTBEATS & LOOPS
  if (wardenLoop) clearInterval(wardenLoop);
  if (initializationTimeout) {
    clearTimeout(initializationTimeout);
    initializationTimeout = null;
  }
  if (sessionExpiryTimeout) {
    clearTimeout(sessionExpiryTimeout);
    sessionExpiryTimeout = null;
  }

  // 2. SAVE SESSION STATE
  if (sessionsStartTime) {
    const sessionMinutes = Math.round((Date.now() - sessionsStartTime) / 60000);
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
                activeSessionUrl,
                sessionMinutes,
                120,
                timestamp,
              ],
            );
        },
      );
    });
    sessionsStartTime = null;
  }

  // 3. RESET WINDOWS HARD
  mainWindow.setKiosk(false);
  mainWindow.setAlwaysOnTop(false);
  
  // Explicitly reset veil state
  veilWindow.setKiosk(false);
  veilWindow.setAlwaysOnTop(false);
  veilWindow.hide();

  // Reset loading window state
  if (loadingWindow) {
    loadingWindow.setKiosk(false);
    loadingWindow.setAlwaysOnTop(false);
    loadingWindow.hide();
  }

  // 4. RESTORE UI
  if (app.isPackaged) {
    mainWindow.loadURL("warden://app/dashboard.html");
  } else {
    mainWindow.loadURL("http://localhost:3000/dashboard");
  }
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

app.whenReady().then(() => {
  // Protocol handler for 'warden://app/...' MUST be registered on the session window uses!
  const customSession = session.fromPartition("persist:warden_session");
  customSession.protocol.handle('warden', async (request) => {
    try {
      const url = new URL(request.url);
      let pathname = url.pathname;
      
      // Default to auth.html if root
      if (pathname === '/' || pathname === '') {
        pathname = '/auth.html';
      } else if (!require('path').extname(pathname)) {
        // Automatically append .html for Next.js routes like /dashboard
        pathname += '.html';
      }
      
      const filePath = path.join(__dirname, '../out', decodeURIComponent(pathname));
      
      // Use fs to check existence before fetching to avoid throwing an error
      if (require('fs').existsSync(filePath)) {
        return await net.fetch(pathToFileURL(filePath).toString());
      } else {
        // Return a proper 404 response instead of failing
        return new Response('Warden Protocol: File not found (' + pathname + ')', {
          status: 404,
          statusText: 'Not Found'
        });
      }
    } catch (e) {
      console.error("Warden protocol error:", e);
      return new Response('Warden Protocol: Internal Error', { status: 500 });
    }
  });

  createWindows();
});

// Quite when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindows()
  }
})
