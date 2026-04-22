const crypto = require("node:crypto");

function createId(prefix) {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "")}`;
}

module.exports = {
  createId
};
