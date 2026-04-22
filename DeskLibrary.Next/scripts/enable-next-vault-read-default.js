const fs = require("node:fs");

const targetPath = "E:\\project\\Click2Save\\Click2Save.Electron\\src\\main\\index.js";
const before = `function isNextVaultReadEnabled() {
  const raw = String(process.env.DESKLIBRARY_NEXT_VAULT_READ || '').trim().toLowerCase();
  return ['1', 'true', 'yes', 'on'].includes(raw);
}`;
const after = `function isNextVaultReadEnabled() {
  const raw = String(process.env.DESKLIBRARY_NEXT_VAULT_READ || '').trim().toLowerCase();
  if (!raw) {
    return true;
  }
  return !['0', 'false', 'no', 'off'].includes(raw);
}`;

const source = fs.readFileSync(targetPath, "utf8").replace(/\r\n/g, "\n");
if (!source.includes(before)) {
  throw new Error("Unable to locate isNextVaultReadEnabled block");
}

fs.writeFileSync(targetPath, source.replace(before, after).replace(/\n/g, "\r\n"), "utf8");
console.log(`patched ${targetPath}`);
