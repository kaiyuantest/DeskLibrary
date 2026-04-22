const fs = require("node:fs/promises");
const path = require("node:path");

async function exists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function countJsonFiles(directory) {
  if (!(await exists(directory))) {
    return 0;
  }

  const entries = await fs.readdir(directory, { withFileTypes: true });
  let count = 0;

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      count += await countJsonFiles(fullPath);
      continue;
    }
    if (entry.isFile() && entry.name.endsWith(".json")) {
      count += 1;
    }
  }

  return count;
}

async function main() {
  const inputPath = process.argv[2];
  if (!inputPath) {
    throw new Error("Usage: node scripts/inspect-vault.js <vault-root-path>");
  }

  const vaultRoot = path.resolve(inputPath);
  const manifestPath = path.join(vaultRoot, "vault.json");

  if (!(await exists(manifestPath))) {
    throw new Error(`vault.json not found under ${vaultRoot}`);
  }

  const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
  const summary = {
    rootPath: vaultRoot,
    displayName: manifest.displayName || "",
    formatVersion: manifest.formatVersion || "",
    counts: {
      rawRecords: await countJsonFiles(path.join(vaultRoot, "raw", "records")),
      rawImages: await countJsonFiles(path.join(vaultRoot, "raw", "images", "meta")),
      rawFiles: await countJsonFiles(path.join(vaultRoot, "raw", "files")),
      rawBrowserCards: await countJsonFiles(path.join(vaultRoot, "raw", "browser-cards")),
      stagingDocuments: await countJsonFiles(path.join(vaultRoot, "staging", "documents")),
      finalDocuments: await countJsonFiles(path.join(vaultRoot, "final", "documents")),
      operationsQueue: await countJsonFiles(path.join(vaultRoot, "operations", "queue")),
      operationsHistory: await countJsonFiles(path.join(vaultRoot, "operations", "history")),
      snapshotManifests: await countJsonFiles(path.join(vaultRoot, "operations", "snapshots")) -
        await countJsonFiles(path.join(vaultRoot, "operations", "snapshots", "data")),
      snapshotDataFiles: await countJsonFiles(path.join(vaultRoot, "operations", "snapshots", "data"))
    }
  };

  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
