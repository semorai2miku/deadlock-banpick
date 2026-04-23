const fs = require("node:fs");
const path = require("node:path");

const scriptDir = __dirname;
const isPackagedRunner = path.basename(path.dirname(scriptDir)) === "dist-standalone";
const rootDir = isPackagedRunner ? path.dirname(scriptDir) : path.resolve(scriptDir, "..");
const stateFile = path.join(rootDir, ".standalone-server.json");

function exists(targetPath) {
  try {
    fs.accessSync(targetPath, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

if (!exists(stateFile)) {
  console.log("No standalone instance is currently running.");
  process.exit(0);
}

try {
  const state = JSON.parse(fs.readFileSync(stateFile, "utf8"));

  if (state.pid) {
    try {
      process.kill(state.pid, "SIGTERM");
      console.log(`Stopped standalone process ${state.pid}`);
    } catch {
      console.log("Standalone process not found. Cleaned up the state file.");
    }
  }
} finally {
  try {
    fs.unlinkSync(stateFile);
  } catch {
    // Ignore.
  }
}
