/**
 * Extract JS content from a <script> block (handles CDATA).
 */
"use strict";

function extractScriptContent(scriptBlock) {
  const cdata = scriptBlock.match(/<!\[CDATA\[([\s\S]*?)\]\]>/i);
  if (cdata) return cdata[1];

  const inner = scriptBlock.match(/<script\b[^>]*>([\s\S]*?)<\/script>/i);
  return inner ? inner[1] : "";
}

module.exports = { extractScriptContent };
