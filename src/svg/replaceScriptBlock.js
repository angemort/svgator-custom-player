/**
 * Replace a script block region with another script string.
 */
"use strict";

function replaceScriptBlock(svgText, scriptBlock, replacementScript) {
  return svgText.slice(0, scriptBlock.start) + replacementScript + svgText.slice(scriptBlock.end);
}

module.exports = { replaceScriptBlock };
