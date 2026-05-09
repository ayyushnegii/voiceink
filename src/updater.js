const ipcMainModule = require("electron");
let ipcMain = null;
let autoUpdater = null;

class UpdateManager {
  constructor() {
    this.mainWindow = null;
    this.controlPanelWindow = null;
    this.updateAvailable = false;
    this.updateDownloaded = false;

    // Lazy-load autoUpdater and ipcMain to avoid issues during module initialization
    this.getAutoUpdater();
    this.getIPCMain();

    this.setupAutoUpdater();
    this.setupIPCHandlers();
  }

  getAutoUpdater() {
    if (!autoUpdater) {
      try {
        const { autoUpdater: updater } = require("electron-updater");
        autoUpdater = updater;
      } catch (error) {
        console.warn("⚠️ electron-updater not available:", error.message);
        return null;
      }
    }
    return autoUpdater;
  }

  getIPCMain() {
    if (!ipcMain) {
      try {
        ipcMain = ipcMainModule.ipcMain;
      } catch (error) {
        console.warn("⚠️ ipcMain not available:", error.message);
        return null;
      }
    }
    return ipcMain;
  }

  setWindows(mainWindow, controlPanelWindow) {
    this.mainWindow = mainWindow;
    this.controlPanelWindow = controlPanelWindow;
  }

  setupAutoUpdater() {
    // Only configure auto-updater in production
    if (process.env.NODE_ENV === "development") {
      console.log("⚠️ Auto-updater disabled in development mode");
      return;
    }

    const au = this.getAutoUpdater();
    if (!au) return;

    // Configure auto-updater for GitHub releases
    au.setFeedURL({
      provider: "github",
      owner: "HeroTools",
      repo: "open-wispr",
      private: false,
    });

    au.logger = console;

    // Set up event handlers
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    const au = this.getAutoUpdater();
    if (!au) return;

    au.on("checking-for-update", () => {
      console.log("🔍 Checking for updates...");
    });

    au.on("update-available", (info) => {
      console.log("📥 Update available:", info);
      this.updateAvailable = true;

      // Send notification to renderer processes
      this.notifyRenderers("update-available", info);
    });

    au.on("update-not-available", (info) => {
      console.log("✅ Update not available:", info);
      this.updateAvailable = false;

      // Send notification to renderer processes
      this.notifyRenderers("update-not-available", info);
    });

    au.on("error", (err) => {
      console.error("❌ Auto-updater error:", err);
      this.updateAvailable = false;
      this.updateDownloaded = false;

      // Send error notification to renderer processes
      this.notifyRenderers("update-error", err);
    });

    au.on("download-progress", (progressObj) => {
      let logMessage = `📊 Download speed: ${progressObj.bytesPerSecond}`;
      logMessage += ` - Downloaded ${progressObj.percent}%`;
      logMessage += ` (${progressObj.transferred}/${progressObj.total})`;
      console.log(logMessage);

      // Send progress to renderer processes
      this.notifyRenderers("update-download-progress", progressObj);
    });

    au.on("update-downloaded", (info) => {
      console.log("✅ Update downloaded:", info);
      this.updateDownloaded = true;

      // Send notification to renderer processes
      this.notifyRenderers("update-downloaded", info);
    });
  }

  notifyRenderers(channel, data) {
    if (this.mainWindow && this.mainWindow.webContents) {
      this.mainWindow.webContents.send(channel, data);
    }
    if (this.controlPanelWindow && this.controlPanelWindow.webContents) {
      this.controlPanelWindow.webContents.send(channel, data);
    }
  }

  setupIPCHandlers() {
    const ipc = this.getIPCMain();
    if (!ipc) return;

    // Check for updates manually
    ipc.handle("check-for-updates", async () => {
      try {
        if (process.env.NODE_ENV === "development") {
          console.log("⚠️ Update check skipped in development mode");
          return {
            updateAvailable: false,
            message: "Update checks are disabled in development mode",
          };
        }

        console.log("🔍 Manual update check requested...");
        const au = this.getAutoUpdater();
        if (!au) {
          return { updateAvailable: false, message: "Update checker not available" };
        }

        const result = await au.checkForUpdates();

        if (result && result.updateInfo) {
          console.log("📋 Update check result:", result.updateInfo);
          return {
            updateAvailable: true,
            version: result.updateInfo.version,
            releaseDate: result.updateInfo.releaseDate,
            files: result.updateInfo.files,
            releaseNotes: result.updateInfo.releaseNotes,
          };
        } else {
          console.log("✅ No updates available");
          return {
            updateAvailable: false,
            message: "You are running the latest version",
          };
        }
      } catch (error) {
        console.error("❌ Update check error:", error);
        throw error;
      }
    });

    // Download update
    ipc.handle("download-update", async () => {
      try {
        if (process.env.NODE_ENV === "development") {
          console.log("⚠️ Update download skipped in development mode");
          return {
            success: false,
            message: "Update downloads are disabled in development mode",
          };
        }

        console.log("📥 Manual update download requested...");
        const au = this.getAutoUpdater();
        if (!au) {
          return { success: false, message: "Update checker not available" };
        }

        await au.downloadUpdate();

        return { success: true, message: "Update download started" };
      } catch (error) {
        console.error("❌ Update download error:", error);
        throw error;
      }
    });

    // Install update
    ipc.handle("install-update", async () => {
      try {
        if (process.env.NODE_ENV === "development") {
          console.log("⚠️ Update installation skipped in development mode");
          return {
            success: false,
            message: "Update installation is disabled in development mode",
          };
        }

        if (!this.updateDownloaded) {
          console.error("❌ No update downloaded to install");
          return {
            success: false,
            message: "No update available to install",
          };
        }

        console.log("🔄 Installing update and restarting...");
        
        // Use setImmediate to ensure the response is sent before quitting
        const au = this.getAutoUpdater();
        if (!au) {
          return { success: false, message: "Update checker not available" };
        }

        setImmediate(() => {
          au.quitAndInstall();
        });

        return { success: true, message: "Update installation started" };
      } catch (error) {
        console.error("❌ Update installation error:", error);
        throw error;
      }
    });

    // Get app version
    ipc.handle("get-app-version", async () => {
      try {
        const { app } = require("electron");
        const version = app.getVersion();
        return { version };
      } catch (error) {
        console.error("❌ Error getting app version:", error);
        throw error;
      }
    });

    // Get update status
    ipc.handle("get-update-status", async () => {
      try {
        return {
          updateAvailable: this.updateAvailable,
          updateDownloaded: this.updateDownloaded,
          isDevelopment: process.env.NODE_ENV === "development",
        };
      } catch (error) {
        console.error("❌ Error getting update status:", error);
        throw error;
      }
    });
  }

  // Method to check for updates on startup
  checkForUpdatesOnStartup() {
    if (process.env.NODE_ENV !== "development") {
      // Wait a bit for the app to fully initialize
      setTimeout(() => {
        console.log("🔄 Checking for updates on startup...");
        const au = this.getAutoUpdater();
        if (!au) return;
        
        au.checkForUpdatesAndNotify();
      }, 5000);
    }
  }
}

module.exports = UpdateManager;
