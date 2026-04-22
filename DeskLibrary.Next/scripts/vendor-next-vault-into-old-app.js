const fs = require("node:fs");
const fsp = require("node:fs/promises");
const path = require("node:path");

const projectRoot = "E:\\project\\Click2Save\\Click2Save.Electron";
const nextRoot = path.join(projectRoot, "DeskLibrary.Next");
const sourceFiles = [
  ["packages", "vault-core", "src", "constants.js"],
  ["packages", "vault-core", "src", "ids.js"],
  ["packages", "vault-core", "src", "index.js"],
  ["packages", "vault-core", "src", "object-store.js"],
  ["packages", "vault-core", "src", "vault.js"],
  ["packages", "ingest", "src", "index.js"],
  ["packages", "ingest", "src", "legacy-bridge.js"]
];

async function main() {
  for (const parts of sourceFiles) {
    const sourcePath = path.join(nextRoot, ...parts);
    const relativeTarget = parts[1] === "vault-core"
      ? path.join("src", "main", "next-vault", "vault-core", parts[3])
      : path.join("src", "main", "next-vault", "ingest", parts[3]);
    const targetPath = path.join(projectRoot, relativeTarget);
    await fsp.mkdir(path.dirname(targetPath), { recursive: true });
    await fsp.copyFile(sourcePath, targetPath);
  }

  const vendoredLegacyBridgePath = path.join(projectRoot, "src", "main", "next-vault", "ingest", "legacy-bridge.js");
  const vendoredLegacyBridgeSource = fs.readFileSync(vendoredLegacyBridgePath, "utf8");
  fs.writeFileSync(
    vendoredLegacyBridgePath,
    vendoredLegacyBridgeSource.replace(
      'require("../../vault-core/src")',
      'require("../vault-core")'
    ),
    "utf8"
  );

  const indexPath = path.join(projectRoot, "src", "main", "index.js");
  const before = "const { createLegacyIngestBridge } = require('../../DeskLibrary.Next/packages/ingest/src/legacy-bridge');";
  const after = "const { createLegacyIngestBridge } = require('./next-vault/ingest/legacy-bridge');";
  const source = fs.readFileSync(indexPath, "utf8");
  if (!source.includes(before)) {
    if (!source.includes(after)) {
      throw new Error("Unable to update legacy bridge require path");
    }
  } else {
    fs.writeFileSync(indexPath, source.replace(before, after), "utf8");
  }

  console.log("vendored NextVault runtime into old desktop app");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
