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

function createWindows() {
  const { width, height } = screen.getPrimaryDisplay().bounds;

  // 1. THE VEIL
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

  // 2. MAIN APP
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

  // CHANGE THIS:
  globalShortcut.register("CommandOrControl+Shift+X", () => {
    // If the Warden is active (sessionStartTime exists), we release the system
    // instead of killing the whole app.
    if (sessionStartTime) {
      releaseSystem();
    } else {
      // If we aren't in a session, maybe you still want it to quit the app?
      // If so, keep this line. If you only want it to exit sessions, remove it.
      app.quit();
    }
  });
}

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
        // We make the window as "standard" as possible
        nodeIntegration: false,
        contextIsolation: true,
        webSecurity: true,
      },
    });

    // LIE ABOUT BEING FIREFOX: Google is more lenient with Firefox UAs in Electron
    const firefoxAgent =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0";

    // Standard Login URL without the "passive" flags that trigger bot-check
    loginWin.loadURL("https://accounts.google.com/ServiceLogin?hl=en", {
      userAgent: firefoxAgent,
    });

    let loginVerified = false;

    const cookieHandler = async () => {
      const cookies = await wardenSession.cookies.get({});
      const hasRealAuth = cookies.some(
        (c) => c.name === "SID" || c.name === "__Secure-3PSID",
      );

      if (hasRealAuth && !loginVerified) {
        loginVerified = true;
        console.log(":: SECURE_HANDSHAKE_VERIFIED");
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

    // ONLY detect if a NEW secure cookie is added (Actual Login Action)
    const cookieListener = (event, details) => {
      if (details && details.cookie && !details.removed) {
        // Look for HttpOnly or Google SID cookies being set/updated
        if (details.cookie.httpOnly || details.cookie.name.includes("SID")) {
          loginActionDetected = true;
        }
      }
    };

    wardenSession.cookies.on("changed", cookieListener);

    // Navigation check: move from /login to somewhere else
    loginWin.webContents.on("did-navigate", (event, url) => {
      const startUrl = targetUrl.toLowerCase();
      const currentUrl = url.toLowerCase();
      if (
        (startUrl.includes("login") || startUrl.includes("auth")) &&
        !currentUrl.includes("login") &&
        !currentUrl.includes("auth")
      ) {
        loginActionDetected = true;
      }
    });

    // Stealth Injection for Cloudflare
    loginWin.webContents.on("did-start-navigation", () => {
      loginWin.webContents.executeJavaScript(`
        try { Object.defineProperty(navigator.__proto__, 'webdriver', {get: () => undefined}); } catch(e) {}
      `);
    });

    loginWin.loadURL(targetUrl, { userAgent });

    loginWin.on("closed", () => {
      wardenSession.cookies.removeListener("changed", cookieListener);
      // resolve only if a NEW login happened
      resolve(loginActionDetected);
    });
  });
});
// At the top of main.js
global.currentUserId = null;
ipcMain.handle("session:sync", async (event, email) => {
  return new Promise((resolve) => {
    db.get("SELECT user_id FROM users WHERE email = ?", [email], (err, row) => {
      if (row) {
        global.currentUserId = row.user_id;
        resolve({ success: true });
      } else {
        resolve({ success: false });
      }
    });
  });
});

// --- AUTH: SIGNUP ---
ipcMain.handle("auth:signup", async (event, userData) => {
  try {
    const result = await handleSignUp(
      userData.email,
      userData.password,
      userData.username,
    );
    // If successful, capture the ID in memory
    if (result && result.success && result.user) {
      global.currentUserId = result.user.user_id;
    }
    return result;
  } catch (error) {
    return { success: false, error: error.message || error };
  }
});

// --- AUTH: LOGIN ---
ipcMain.handle("auth:login", async (event, credentials) => {
  try {
    const result = await handleLogin(credentials.email, credentials.password);
    // If successful, capture the ID in memory
    if (result && result.success && result.user) {
      global.currentUserId = result.user.user_id;
    }
    return result;
  } catch (error) {
    return { success: false, error: error.message || error };
  }
});

// Add this to your main.js handlers
ipcMain.handle("user:get-profile", async () => {
  return new Promise((resolve) => {
    const userId = global.currentUserId;

    if (!userId) {
      return resolve({ success: false, error: "No active session found" });
    }

    db.get(
      "SELECT user_id, username, email FROM users WHERE user_id = ?",
      [userId],
      (err, row) => {
        if (err || !row) {
          return resolve({ success: false, error: "User record not found" });
        }

        resolve({
          success: true,
          data: {
            // Format the ID (e.g., USR-001) for the UI
            userId: `USR-${row.user_id.toString().padStart(3, "0")}`,
            username: row.username,
            email: row.email,
          },
        });
      },
    );
  });
});

// Add this to your IPC handlers in main.js
ipcMain.handle("auth:logout", () => {
  global.currentUserId = null;
  console.log("SESSION_TERMINATED: Global ID cleared.");
  return { success: true };
});

// --- TELEMETRY HANDLER (Corrected for specific User ID) ---
ipcMain.handle("get-daily-stats", async () => {
  return new Promise((resolve) => {
    // If no one is logged in, return 0
    if (!global.currentUserId) {
      return resolve({ success: true, minutes: 0 });
    }

    const today = new Date().toISOString().split("T")[0];

    db.get(
      "SELECT total_mins_today, last_session_date FROM users WHERE user_id = ?",
      [global.currentUserId], // <--- Use the global ID here
      (err, row) => {
        if (err || !row) return resolve({ success: true, minutes: 0 });

        // Reset minutes to 0 if the last session was from a previous day
        if (row.last_session_date !== today) {
          resolve({ success: true, minutes: 0 });
        } else {
          resolve({ success: true, minutes: row.total_mins_today });
        }
      },
    );
  });
});
// --- WARDEN LOGIC ---
ipcMain.on("engage-warden", (event, config) => {
  sessionStartTime = Date.now();
  veilWindow.hide();
  lastState = "focused";
  mainWindow.setKiosk(true);
  mainWindow.setAlwaysOnTop(true, "screen-saver", 2);

  // ONLY CHANGE: Updated 120 to 122 to pass the "Human" check
  const userAgent =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";
  mainWindow.webContents.on("dom-ready", () => {
    mainWindow.webContents.executeJavaScript(`
    Object.defineProperty(navigator, 'webdriver', {get: () => undefined});
  `);
  });

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
    const today = new Date().toISOString().split("T")[0];

    db.run(
      `UPDATE users SET total_mins_today = CASE WHEN last_session_date = ? THEN total_mins_today + ? ELSE ? END, last_session_date = ?`,
      [today, sessionMinutes, sessionMinutes, today],
    );
    sessionStartTime = null;
  }

  if (wardenLoop) clearInterval(wardenLoop);
  mainWindow.setKiosk(false);
  mainWindow.setAlwaysOnTop(false);
  veilWindow.hide();
  mainWindow.loadURL("http://localhost:3000/dashboard");
  lastState = "focused";
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
