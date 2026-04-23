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

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};

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

function writeStateFile() {
  fs.writeFileSync(
    stateFile,
    JSON.stringify(
      {
        pid: process.pid,
        port,
        url,
      },
      null,
      2,
    ),
    "utf8",
  );
}

function cleanupStateFile() {
  if (!exists(stateFile)) {
    return;
  }

  try {
    const raw = fs.readFileSync(stateFile, "utf8");
    const state = JSON.parse(raw);

    if (state.pid === process.pid) {
      fs.unlinkSync(stateFile);
    }
  } catch {
    try {
      fs.unlinkSync(stateFile);
    } catch {
      // Ignore cleanup failure.
    }
  }
}

if (!exists(path.join(standaloneDir, "index.html"))) {
  console.error("Missing standalone index.html. Run npm run build:standalone, or keep the complete dist-standalone folder.");
  process.exit(1);
}

const server = http.createServer((request, response) => {
  const rawUrl = request.url || "/";
  const pathname = decodeURIComponent(rawUrl.split("?")[0]);
  const safePath = pathname === "/" ? "/index.html" : pathname;
  const requestedFile = path.join(standaloneDir, safePath);
  const normalizedFile = path.normalize(requestedFile);

  if (!normalizedFile.startsWith(standaloneDir)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  let fileToServe = normalizedFile;

  if (!exists(fileToServe) || fs.statSync(fileToServe).isDirectory()) {
    fileToServe = path.join(standaloneDir, "index.html");
  }

  const extension = path.extname(fileToServe).toLowerCase();
  const contentType = mimeTypes[extension] || "application/octet-stream";

  fs.readFile(fileToServe, (error, buffer) => {
    if (error) {
      response.writeHead(404);
      response.end("Not Found");
      return;
    }

    response.writeHead(200, {
      "Cache-Control": "no-cache",
      "Content-Type": contentType,
    });
    response.end(buffer);
  });
});

server.on("error", (error) => {
  if (error && error.code === "EADDRINUSE") {
    console.error(`Port ${port} is already in use. Stop the old standalone instance first.`);
  } else {
    console.error(error);
  }

  cleanupStateFile();
  process.exit(1);
});

function shutdown() {
  server.close(() => {
    cleanupStateFile();
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
process.on("SIGHUP", shutdown);
process.on("exit", cleanupStateFile);

server.listen(port, host, () => {
  writeStateFile();
  console.log(`Standalone draft is running at ${url}`);

  if (process.env.STANDALONE_NO_OPEN !== "1") {
    openBrowser(url);
  }
});
