const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");

const { createVault, openVault } = require("../packages/vault-core/src");
const { createIngestService } = require("../packages/ingest/src");
const { createLegacyIngestBridge } = require("../packages/ingest/src/legacy-bridge");

async function main() {
  const rootPath = await fs.mkdtemp(path.join(os.tmpdir(), "desklibrary-next-"));
  const vaultPath = path.join(rootPath, "demo-vault");

  const created = await createVault({
    rootPath: vaultPath,
    displayName: "Demo Vault"
  });
  const ingest = createIngestService(created);
  const bridge = await createLegacyIngestBridge({
    vaultRootPath: vaultPath,
    displayName: "Demo Vault"
  });

  const record = await ingest.captureClipboardPayload({
    contentType: "text",
    textContent: "考公面试流程整理",
    signature: "ignored-in-mvp"
  }, {
    sourceType: "clipboard",
    sourceApp: "Chrome",
    windowTitle: "面试资料",
    captureMethod: "auto",
    category: "daily"
  });

  const imageAsset = await ingest.captureClipboardPayload({
    contentType: "image",
    buffer: Buffer.from("fake-image-binary"),
    imageBuffer: Buffer.from("fake-image-binary"),
    signature: "ignored-image-signature"
  }, {
    extension: ".png",
    mimeType: "image/png",
    sourceType: "clipboard",
    sourceApp: "SnippingTool",
    caption: "考公题库截图",
    labels: ["考公", "截图"]
  });

  const importSourcePath = path.join(rootPath, "source-material.txt");
  await fs.writeFile(importSourcePath, "file asset example", "utf8");

  const importedAssets = await ingest.importFiles([{ sourcePath: importSourcePath }], "backup", {
    note: "smoke test asset"
  });
  const fileAsset = importedAssets[0];

  const stagingDocument = await created.objects.putDocument({
    layer: "staging",
    documentType: "image_note",
    title: "考公面试资料",
    summary: "由原始文本和图片整理出的候选文档",
    content: "考公面试流程整理。题库截图中包含结构化问题示例。",
    searchText: "考公 面试 流程 题库 截图",
    tags: ["考公", "面试"],
    sourceRefs: [record.id, imageAsset.id],
    rawRefs: [record.id, imageAsset.id],
    derivedFrom: [record.id, imageAsset.id],
    quality: {
      confidence: 0.92,
      reviewStatus: "pending"
    }
  });

  const task = await created.objects.putTask({
    taskType: "generate_document",
    prompt: "根据文本和截图整理候选文档",
    scope: {
      inputRefs: [record.id, imageAsset.id]
    },
    resultRefs: [stagingDocument.id]
  });

  const pendingOperation = await created.workflows.createOperation({
    action: "apply_labels_to_final",
    riskLevel: "high",
    actor: {
      type: "system",
      name: "smoke-test"
    },
    targets: [stagingDocument.id],
    payload: {
      labels: ["考公", "面试"]
    },
    reason: "验证 pending_confirmation -> approved -> cancelled"
  });

  const approvedPendingOperation = await created.workflows.approveOperation(pendingOperation.id, {
    actorType: "system",
    actorName: "smoke-test"
  });

  const cancelledPendingOperation = await created.workflows.cancelOperation(pendingOperation.id, {
    actorType: "system",
    actorName: "smoke-test",
    reason: "smoke test cleanup"
  });

  const publication = await created.workflows.publishDocumentToFinal(stagingDocument.id, {
    actorType: "system",
    actorName: "smoke-test",
    reason: "验证 staging 到 final 发布流程",
    autoApprove: true
  });

  await created.objects.putDocument({
    ...publication.finalDocument,
    layer: "final",
    summary: "被错误覆盖的正式摘要",
    updatedBy: "smoke-test"
  });

  const restored = await created.workflows.restoreSnapshot(publication.snapshot.id, {
    actorType: "system",
    actorName: "smoke-test",
    reason: "验证 snapshot 恢复流程",
    autoApprove: true
  });

  const bridgeTextRecord = await bridge.ingestClipboardPayload(
    {
      contentType: "text",
      textContent: "桥接层写入文本",
      signature: "bridge-text"
    },
    {
      captureMethod: "manual",
      category: "common",
      sourceContext: {
        sourceApp: "DeskLibrary",
        windowTitle: "Bridge Test"
      }
    }
  );

  const bridgeImportSourcePath = path.join(rootPath, "bridge-asset.txt");
  await fs.writeFile(bridgeImportSourcePath, "bridge asset", "utf8");
  const bridgeImportedAssets = await bridge.importAssets({
    mode: "link",
    paths: [bridgeImportSourcePath]
  });
  const bridgeImportedCards = await bridge.importBrowserCards({
    cards: [
      {
        domain: ".example.com",
        openUrl: "https://example.com",
        name: "example",
        username: "demo",
        cookies: [{ name: "sid", value: "123" }],
        browserSource: {
          type: "chrome_profile",
          profileName: "Default"
        }
      }
    ]
  });
  const duplicateBridgeTextRecord = await bridge.ingestClipboardPayload(
    {
      contentType: "text",
      textContent: "桥接层写入文本",
      signature: "bridge-text-duplicate"
    },
    {
      captureMethod: "manual",
      category: "common",
      sourceContext: {
        sourceApp: "DeskLibrary",
        windowTitle: "Bridge Test"
      }
    }
  );
  const duplicateBridgeImportedAssets = await bridge.importAssets({
    mode: "link",
    paths: [bridgeImportSourcePath]
  });
  const duplicateBridgeImportedCards = await bridge.importBrowserCards({
    cards: [
      {
        domain: ".example.com",
        openUrl: "https://example.com",
        name: "example",
        username: "demo",
        cookies: [{ name: "sid", value: "123" }],
        browserSource: {
          type: "chrome_profile",
          profileName: "Default"
        }
      }
    ]
  });
  const duplicateImageAsset = await bridge.ingestClipboardPayload(
    {
      contentType: "image",
      imageBuffer: Buffer.from("fake-image-binary"),
      signature: "duplicate-image"
    },
    {
      extension: ".png",
      mimeType: "image/png",
      sourceType: "clipboard",
      sourceApp: "SnippingTool",
      caption: "考公题库截图",
      labels: ["考公", "截图"]
    }
  );

  const reopened = await openVault(vaultPath);
  const records = await reopened.objects.listRecords();
  const images = await reopened.objects.listImageAssets();
  const files = await reopened.objects.listFileAssets();
  const stagingDocuments = await reopened.objects.listDocuments("staging");
  const finalDocuments = await reopened.objects.listDocuments("final");
  const queuedOperations = await reopened.objects.listOperations("queue");
  const operations = await reopened.objects.listOperations("history");
  const snapshots = await reopened.objects.listSnapshots();
  const restoredFinalDocument = await reopened.objects.getDocument(publication.finalDocument.id, "final");
  const rolledBackPublishOperation = await reopened.objects.getOperation(publication.operation.id, "history");
  const imageFileStat = await fs.stat(path.join(vaultPath, imageAsset.file.path));
  const backupFileStat = await fs.stat(path.join(vaultPath, fileAsset.paths.storedPath));
  const browserCards = await reopened.objects.listBrowserCards();

  console.log(
    JSON.stringify(
      {
        vault: reopened.manifest.displayName,
        vaultPath,
        recordId: record.id,
        imageId: imageAsset.id,
        duplicateImageId: duplicateImageAsset.id,
        fileId: fileAsset.id,
        taskId: task.id,
        stagingDocumentId: stagingDocument.id,
        pendingOperationId: pendingOperation.id,
        approvedPendingOperationStatus: approvedPendingOperation.status,
        cancelledPendingOperationStatus: cancelledPendingOperation.status,
        finalDocumentId: publication.finalDocument.id,
        operationId: publication.operation.id,
        snapshotId: publication.snapshot.id,
        restoreOperationId: restored.operation.id,
        restoreStatus: restored.operation.status,
        rolledBackPublishStatus: rolledBackPublishOperation.status,
        restoredFinalSummary: restoredFinalDocument.summary,
        bridgeRecordId: bridgeTextRecord.id,
        duplicateBridgeRecordId: duplicateBridgeTextRecord.id,
        bridgeImportedFileId: bridgeImportedAssets[0].id,
        duplicateBridgeImportedFileId: duplicateBridgeImportedAssets[0].id,
        bridgeImportedCardId: bridgeImportedCards[0].id,
        duplicateBridgeImportedCardId: duplicateBridgeImportedCards[0].id,
        imageFileSize: imageFileStat.size,
        backupFileSize: backupFileStat.size,
        counts: {
          records: records.length,
          images: images.length,
          files: files.length,
          browserCards: browserCards.length,
          stagingDocuments: stagingDocuments.length,
          finalDocuments: finalDocuments.length,
          queuedOperations: queuedOperations.length,
          operations: operations.length,
          snapshots: snapshots.length
        }
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
