/**
 * Find the Svgator <script> block inside an SVG string.
 */
"use strict";

function findSvgatorScriptBlock(svgText) {
  const re = /<script\b[^>]*>[\s\S]*?<\/script>/gi;
  let match;

  while ((match = re.exec(svgText))) {
    const block = match[0];
    if (block.includes("__SVGATOR_PLAYER__") || block.includes("__SVGATOR_DEFINE__")) {
      return { start: match.index, end: match.index + block.length, block };
    }
  }

  return null;
}

module.exports = { findSvgatorScriptBlock };
