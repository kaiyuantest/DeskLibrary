const VAULT_FORMAT_VERSION = "1.0.0";

const VAULT_DIRECTORIES = [
  "raw/records",
  "raw/images/files",
  "raw/images/meta",
  "raw/links",
  "raw/files/backups",
  "raw/browser-cards",
  "staging/tasks",
  "staging/documents",
  "staging/labels",
  "staging/summaries",
  "staging/plans",
  "final/documents",
  "final/topics",
  "final/collections",
  "final/exports",
  "operations/queue",
  "operations/history",
  "operations/snapshots",
  "index/sqlite",
  "index/fts",
  "index/vectors",
  "index/cache",
  "manifests/schemas",
  "manifests/types",
  "manifests/stats",
  "system/prompts",
  "system/policies",
  "system/settings"
];

const OBJECT_KINDS = {
  RECORD: "record",
  IMAGE_ASSET: "image_asset",
  LINK_RECORD: "link_record",
  FILE_ASSET: "file_asset",
  BROWSER_CARD: "browser_card",
  DOCUMENT: "document",
  TASK: "task",
  OPERATION: "operation",
  SNAPSHOT: "snapshot"
};

const OPERATION_STATUSES = {
  DRAFT: "draft",
  QUEUED: "queued",
  PENDING_CONFIRMATION: "pending_confirmation",
  APPROVED: "approved",
  RUNNING: "running",
  COMPLETED: "completed",
  FAILED: "failed",
  CANCELLED: "cancelled",
  ROLLED_BACK: "rolled_back"
};

module.exports = {
  OBJECT_KINDS,
  OPERATION_STATUSES,
  VAULT_DIRECTORIES,
  VAULT_FORMAT_VERSION
};
