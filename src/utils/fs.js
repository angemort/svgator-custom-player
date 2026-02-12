/**
 * Minimal file helpers (sync I/O is fine for SVGs).
 */
"use strict";

const fs = require("fs");

function readTextFile(path) {
  return fs.readFileSync(path, "utf8");
}

function writeTextFile(path, content) {
  fs.writeFileSync(path, content, "utf8");
}

module.exports = { readTextFile, writeTextFile };
