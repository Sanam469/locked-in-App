const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  // Auth & Stats (Existing)
  signUp: (userData) => ipcRenderer.invoke("auth:signup", userData),
  login: (credentials) => ipcRenderer.invoke("auth:login", credentials),
  getDailyStats: () => ipcRenderer.invoke("get-daily-stats"),

  // Warden Logic (Existing)
  engage: (config) => ipcRenderer.send("engage-warden", config),
  prepareUrlLogin: (url) => ipcRenderer.invoke("prepare-url-login", url),

  getProfile: () => ipcRenderer.invoke("user:get-profile"),

  prepareLogin: (url) => ipcRenderer.invoke("prepare-login", url),

  syncSession: (email) => ipcRenderer.invoke("session:sync", email),

  // Add this to your contextBridge.exposeInMainWorld("electronAPI", { ... })
  logout: () => ipcRenderer.invoke("auth:logout"),

  // Primary data fetcher
  getPerformancePulse: () => ipcRenderer.invoke("get-performance-pulse"),
  // Sync version for "Instant-On" UI rendering
  getInitialPerformance: () =>
    ipcRenderer.sendSync("get-initial-performance-cache"),
});
