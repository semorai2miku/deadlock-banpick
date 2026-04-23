const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");

const scriptDir = __dirname;
const isPackagedRunner = path.basename(path.dirname(scriptDir)) === "dist-standalone";
const rootDir = isPackagedRunner ? path.dirname(scriptDir) : path.resolve(scriptDir, "..");
const standaloneDir = isPackagedRunner ? rootDir : path.join(rootDir, "frontend", "dist-standalone");
const stateFile = path.join(rootDir, ".standalone-server.json");
const port = Number(process.env.STANDALONE_PORT || 4175);
const host = "127.0.0.1";
const url = `http://${host}:${port}`;

function exists(targetPath) {
  try {
    fs.accessSync(targetPath, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function openBrowser(targetUrl) {
  const command =
    process.platform === "win32"
      ? ["cmd", ["/c", "start", "", targetUrl]]
      : process.platform === "darwin"
        ? ["open", [targetUrl]]
        : ["xdg-open", [targetUrl]];

  spawn(command[0], command[1], {
    cwd: rootDir,
    detached: true,
    stdio: "ignore",
  }).unref();
}

function isProcessRunning(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function readStateFile() {
  if (!exists(stateFile)) {
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(stateFile, "utf8"));
  } catch {
    return null;
  }
}

function removeStateFile() {
  try {
    fs.unlinkSync(stateFile);
  } catch {
    // Ignore.
  }
}

function pingServer() {
  return new Promise((resolve) => {
    const request = http.get(url, (response) => {
      response.resume();
      resolve(response.statusCode && response.statusCode < 500);
    });

    request.on("error", () => resolve(false));
    request.setTimeout(1000, () => {
      request.destroy();
      resolve(false);
    });
  });
}

async function waitForServer(maxAttempts = 20) {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const ok = await pingServer();

    if (ok) {
      return true;
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  return false;
}

async function main() {
  if (!exists(path.join(standaloneDir, "index.html"))) {
    console.error("Missing standalone index.html. Run npm run build:standalone, or keep the complete dist-standalone folder.");
    process.exit(1);
  }

  const existing = readStateFile();

  if (existing?.pid && isProcessRunning(existing.pid) && (await pingServer())) {
    console.log(`Standalone draft is already running. Opening ${url}`);
    openBrowser(url);
    return;
  }

  if (existing?.pid && !isProcessRunning(existing.pid)) {
    removeStateFile();
  }

  const child = spawn(process.execPath, [path.join(__dirname, "serve-standalone.cjs")], {
    cwd: rootDir,
    detached: true,
    env: {
      ...process.env,
      STANDALONE_NO_OPEN: "1",
      STANDALONE_PORT: String(port),
    },
    stdio: "ignore",
    windowsHide: true,
  });

  child.unref();

  const ready = await waitForServer();

  if (!ready) {
    console.error("Failed to start standalone draft. Check whether the port is occupied.");
    process.exit(1);
  }

  console.log(`Standalone draft is running in background: ${url}`);
  openBrowser(url);
}

main();
