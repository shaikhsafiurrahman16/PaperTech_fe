const { spawn } = require("child_process");
const http = require("http");
const path = require("path");

const projectRoot = path.join(__dirname, "..");
const devUrl = "http://127.0.0.1:3000";
const nodeBinary = process.execPath;
const electronBinary = require("electron");
const viteBinary = path.join(projectRoot, "node_modules", "vite", "bin", "vite.js");

let viteProcess;
let electronProcess;
let shuttingDown = false;

function waitForServer(url, timeoutMs = 30000) {
  const startedAt = Date.now();

  return new Promise((resolve, reject) => {
    const check = () => {
      const request = http.get(url, (response) => {
        response.resume();
        if (response.statusCode && response.statusCode < 500) {
          resolve();
          return;
        }
        if (Date.now() - startedAt > timeoutMs) {
          reject(new Error(`Timed out waiting for ${url}`));
          return;
        }
        setTimeout(check, 500);
      });

      request.on("error", () => {
        if (Date.now() - startedAt > timeoutMs) {
          reject(new Error(`Timed out waiting for ${url}`));
          return;
        }
        setTimeout(check, 500);
      });
    };

    check();
  });
}

function stopProcess(childProcess) {
  if (!childProcess || childProcess.killed) {
    return;
  }

  if (process.platform === "win32") {
    spawn("taskkill", ["/pid", String(childProcess.pid), "/f", "/t"], {
      stdio: "ignore",
      windowsHide: true,
    });
    return;
  }

  childProcess.kill("SIGTERM");
}

function shutdown(exitCode = 0) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  stopProcess(electronProcess);
  stopProcess(viteProcess);
  process.exit(exitCode);
}

process.on("exit", () => stopProcess(viteProcess));
process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

viteProcess = spawn(
  nodeBinary,
  [viteBinary],
  {
    cwd: projectRoot,
    stdio: "inherit",
    shell: false,
    windowsHide: true,
  },
);

viteProcess.on("exit", (code) => {
  if (!shuttingDown) {
    shutdown(code ?? 0);
  }
});

waitForServer(devUrl)
  .then(() => {
    electronProcess = spawn(electronBinary, ["."], {
      cwd: projectRoot,
      stdio: "inherit",
      shell: false,
      windowsHide: true,
      env: {
        ...process.env,
        VITE_DEV_SERVER_URL: devUrl,
      },
    });

    electronProcess.on("exit", (code) => shutdown(code ?? 0));
  })
  .catch((error) => {
    console.error(error.message);
    shutdown(1);
  });
