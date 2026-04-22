const path = require("node:path");
const { spawn } = require("node:child_process");

const electronCli = path.resolve(__dirname, "..", "..", "node_modules", "electron", "cli.js");
const appPath = path.resolve(__dirname, "..", "apps", "desktop");

const child = spawn(process.execPath, [electronCli, appPath], {
  stdio: "inherit",
  cwd: path.resolve(__dirname, ".."),
  env: {
    ...process.env
  }
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
