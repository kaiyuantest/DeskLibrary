const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");

const { createLegacyIngestBridge } = require("../packages/ingest/src/legacy-bridge");

async function main() {
  const vaultPath =
    process.argv[2] ||
    "C:\\Users\\Asus\\AppData\\Roaming\\desklibrary-electron\\DeskLibrary.NextVault";

  const bridge = await createLegacyIngestBridge({
    vaultRootPath: vaultPath,
    displayName: "DeskLibrary Next Vault"
  });

  const textRecord = await bridge.ingestTextRecord("这是 NextVault 的示例文本记录，用于验证新数据读取。", {
    captureMethod: "manual",
    category: "daily",
    sourceType: "manual",
    sourceApp: "DeskLibrary",
    windowTitle: "示例数据"
  });

  const imageRecord = await bridge.ingestClipboardPayload(
    {
      contentType: "image",
      imageBuffer: Buffer.from("next-vault-demo-image"),
      signature: "next-vault-demo-image"
    },
    {
      extension: ".png",
      mimeType: "image/png",
      sourceType: "clipboard",
      sourceApp: "SnippingTool",
      caption: "示例图片记录",
      labels: ["示例", "截图"]
    }
  );

  const tempSourcePath = path.join(os.tmpdir(), "next-vault-demo-file.txt");
  await fs.writeFile(tempSourcePath, "NextVault demo file content", "utf8");
  const importedAssets = await bridge.importAssets({
    mode: "backup",
    paths: [tempSourcePath]
  });

  const importedCards = await bridge.importBrowserCards({
    cards: [
      {
        domain: ".example.com",
        openUrl: "https://example.com",
        name: "example.com",
        username: "demo-user",
        cookies: [{ name: "sid", value: "demo-session" }],
        browserSource: {
          type: "chrome_profile",
          profileName: "Default",
          userDataDir: "C:/Users/Asus/AppData/Local/Google/Chrome/User Data"
        }
      }
    ]
  });

  const stagingDocument = await bridge.vault.objects.putDocument({
    layer: "staging",
    documentType: "generic",
    title: "NextVault 示例文档",
    summary: "这是为了验证新软件读取新数据而生成的 staging 文档。",
    content: "该文档关联了一条文本记录和一条图片记录。",
    searchText: "NextVault 示例 文档 staging",
    tags: ["示例", "NextVault"],
    sourceRefs: [textRecord.id, imageRecord.id],
    rawRefs: [textRecord.id, imageRecord.id],
    derivedFrom: [textRecord.id, imageRecord.id]
  });

  const publication = await bridge.vault.workflows.publishDocumentToFinal(stagingDocument.id, {
    actorType: "system",
    actorName: "seed-script",
    reason: "Seed example final document",
    autoApprove: true
  });

  console.log(
    JSON.stringify(
      {
        vaultPath,
        textRecordId: textRecord.id,
        imageRecordId: imageRecord.id,
        fileAssetId: importedAssets[0]?.id || "",
        browserCardId: importedCards[0]?.id || "",
        stagingDocumentId: stagingDocument.id,
        finalDocumentId: publication.finalDocument?.id || ""
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
