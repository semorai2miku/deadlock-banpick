const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "frontend", "dist-standalone");
const runnerDir = path.join(distDir, "runner");

function copyFile(source, target) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}

if (!fs.existsSync(path.join(distDir, "index.html"))) {
  console.error("Missing frontend/dist-standalone/index.html. Build standalone first.");
  process.exit(1);
}

fs.mkdirSync(runnerDir, { recursive: true });

copyFile(path.join(rootDir, "scripts", "serve-standalone.cjs"), path.join(runnerDir, "serve-standalone.cjs"));
copyFile(path.join(rootDir, "scripts", "launch-standalone.cjs"), path.join(runnerDir, "launch-standalone.cjs"));
copyFile(path.join(rootDir, "scripts", "stop-standalone.cjs"), path.join(runnerDir, "stop-standalone.cjs"));
copyFile(path.join(rootDir, "start-standalone.bat"), path.join(distDir, "start-standalone.bat"));
copyFile(path.join(rootDir, "stop-standalone.bat"), path.join(distDir, "stop-standalone.bat"));

console.log("Standalone runner files copied into frontend/dist-standalone.");
