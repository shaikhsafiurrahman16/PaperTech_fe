const { app, BrowserWindow, ipcMain, nativeImage, shell, session } = require("electron");
const path = require("path");

const isDev = Boolean(process.env.VITE_DEV_SERVER_URL);
const allowedDevOrigin = "http://127.0.0.1:3000";
let mainWindow = null;

function createAppIcon() {
  const svg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#7c6cff"/>
          <stop offset="100%" stop-color="#22c55e"/>
        </linearGradient>
      </defs>
      <rect width="256" height="256" rx="56" fill="#08111f"/>
      <rect x="34" y="34" width="188" height="188" rx="44" fill="url(#g)" opacity="0.18"/>
      <path d="M70 84h116v20H70zm0 34h116v20H70zm0 34h72v20H70z" fill="#f8fafc"/>
      <path d="M168 150h20v20h-20z" fill="#22c55e"/>
    </svg>`,
  ).toString("base64");

  return nativeImage.createFromDataURL(`data:image/svg+xml;base64,${svg}`);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 1180,
    minHeight: 720,
    title: "PaperTech",
    backgroundColor: "#0f172a",
    show: false,
    autoHideMenuBar: true,
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    icon: createAppIcon(),
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      devTools: isDev,
      spellcheck: false,
      enableRemoteModule: false,
    },
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https://") || url.startsWith("mailto:")) {
      shell.openExternal(url);
    }
    return { action: "deny" };
  });

  mainWindow.webContents.on("will-navigate", (event, targetUrl) => {
    const parsedUrl = new URL(targetUrl);
    const isLocalFile = parsedUrl.protocol === "file:";
    const isAllowedDevUrl = isDev && parsedUrl.origin === allowedDevOrigin;

    if (!isLocalFile && !isAllowedDevUrl) {
      event.preventDefault();
    }
  });

  if (isDev) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => {
    callback(false);
  });

  app.disableHardwareAcceleration();

  ipcMain.handle("app:get-version", () => app.getVersion());
  ipcMain.handle("app:platform", () => process.platform);
  ipcMain.handle("updates:check", () => ({
    available: false,
    message: "Auto-update service is not configured yet.",
  }));

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
