/**
 * Extract the payload object passed to Svgator's global push.
 *
 * Pattern:
 *   })('<id>',{...},'__SVGATOR_PLAYER__',window,document)
 */
"use strict";

function extractPayloadFromJs(jsText) {
  const marker = "})('";
  const idx = jsText.indexOf(marker);
  if (idx === -1) throw new Error("Svgator push marker not found: })('");

  const idStart = idx + marker.length;
  const idEnd = jsText.indexOf("',", idStart);
  if (idEnd === -1) throw new Error("Could not parse player id");

  const playerId = jsText.slice(idStart, idEnd);

  const jsonStart = jsText.indexOf("{", idEnd);
  if (jsonStart === -1) throw new Error("Payload JSON start not found");

  // Brace counting with string awareness.
  let i = jsonStart;
  let depth = 0;
  let inStr = null;
  let esc = false;

  for (; i < jsText.length; i++) {
    const ch = jsText[i];

    if (inStr) {
      if (esc) esc = false;
      else if (ch === "\\") esc = true
      else if (ch === inStr) inStr = null;
      continue;
    }

    if (ch === "'" || ch === '"' || ch === "`") {
      inStr = ch;
      continue;
    }

    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) {
        const jsonText = jsText.slice(jsonStart, i + 1);
        return { playerId, jsonText };
      }
    }
  }

  throw new Error("Payload JSON end not found");
}

module.exports = { extractPayloadFromJs };
