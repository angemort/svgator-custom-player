/**
 * Strip Svgator UI artifacts often injected into exported SVGs.
 *
 * We remove ONLY the <g> UI block (even if nested <g> exists).
 * We DO NOT remove the preceding ellipse/circle marker anymore.
 *
 * IMPORTANT:
 * - IDs are NOT reliable; we match structural patterns instead.
 * - Removal can be disabled with CLI flag --keep-ui.
 */
"use strict";

/**
 * @param {string} svgText
 * @returns {{ svgText: string, removedIds: Set<string> }}
 */
function stripSvgatorUiArtifacts(svgText) {
  const removedIds = new Set();
  const ranges = [];

  // Find balanced <g>...</g> ranges (supports nested groups).
  const groupRanges = findBalancedTagRanges(svgText, "g");

  for (const [gStart, gEnd] of groupRanges) {
    const gBlock = svgText.slice(gStart, gEnd);
    if (!looksLikeSvgatorUiGroup(gBlock)) continue;

    // Collect ids inside the group block (so we can prune payload as well).
    collectIds(gBlock, removedIds);

    // IMPORTANT: Do NOT include/remove the preceding ellipse/circle.
    ranges.push([gStart, gEnd]);
  }

  if (!ranges.length) return { svgText, removedIds };

  // Merge overlapping ranges.
  ranges.sort((a, b) => a[0] - b[0]);
  const merged = [];
  for (const r of ranges) {
    if (!merged.length) merged.push(r);
    else {
      const last = merged[merged.length - 1];
      if (r[0] <= last[1]) last[1] = Math.max(last[1], r[1]);
      else merged.push(r);
    }
  }

  // Remove in one pass.
  let out = "";
  let cursor = 0;
  for (const [s, e] of merged) {
    out += svgText.slice(cursor, s);
    cursor = e;
  }
  out += svgText.slice(cursor);

  return { svgText: out, removedIds };
}

/**
 * Remove elements from the decoded payload (keeps output smaller and detection accurate).
 *
 * @param {object} payload
 * @param {Set<string>} removedIds
 */
function prunePayloadElements(payload, removedIds) {
  if (
    !payload ||
    typeof payload !== "object" ||
    !removedIds ||
    removedIds.size === 0
  )
    return;

  const anims = Array.isArray(payload.animations) ? payload.animations : [];
  for (const anim of anims) {
    const elements = anim && anim.elements;
    if (!elements || typeof elements !== "object") continue;

    for (const id of removedIds) {
      if (Object.prototype.hasOwnProperty.call(elements, id)) {
        delete elements[id];
      }
    }
  }
}

/**
 * Detect Svgator UI group by multiple signals.
 * We do not rely on attribute order.
 *
 * @param {string} gBlock
 * @returns {boolean}
 */
function looksLikeSvgatorUiGroup(gBlock) {
  // 1) A rounded "button" rect with opacity ~0.2 and fill #112346
  const hasRect = findTagMatch(gBlock, "rect", (tag) => {
    const fill = getAttr(tag, "fill");
    const opacity = parseFloat(getAttr(tag, "opacity") || "");
    if (!fill) return false;
    if (fill.toLowerCase() !== "#112346") return false;
    if (!Number.isFinite(opacity)) return false;
    return Math.abs(opacity - 0.2) <= 0.0001;
  });

  // 2) A white icon path
  const hasWhitePath = findTagMatch(gBlock, "path", (tag) => {
    const fill = (getAttr(tag, "fill") || "").toLowerCase();
    return fill === "#fff" || fill === "#ffffff" || fill === "white";
  });

  // 3) A mask with typical oversized bounds
  const hasMaskBounds = findTagMatch(gBlock, "mask", (tag) => {
    const x = getAttr(tag, "x");
    const y = getAttr(tag, "y");
    const w = getAttr(tag, "width");
    const h = getAttr(tag, "height");
    return x === "-150%" && y === "-150%" && w === "400%" && h === "400%";
  });

  // 4) A mask path with opacity ~0.8 and a 0.3 scale matrix
  const hasMaskPath = findTagMatch(gBlock, "path", (tag) => {
    const op = parseFloat(getAttr(tag, "opacity") || "");
    if (!Number.isFinite(op) || Math.abs(op - 0.8) > 0.0001) return false;

    const tr = getAttr(tag, "transform");
    if (!tr) return false;

    const m = parseMatrix(tr);
    if (!m) return false;

    // Expect roughly matrix(0.3 0 0 0.3 ...)
    return (
      isApproxZero(m[1]) &&
      isApproxZero(m[2]) &&
      isApproxScale03(m[0]) &&
      isApproxScale03(m[3])
    );
  });

  return hasRect && hasWhitePath && hasMaskBounds && hasMaskPath;
}

function collectIds(xmlSnippet, outSet) {
  const idRe = /\bid=(["'])([^"']+)\1/g;
  let m;
  while ((m = idRe.exec(xmlSnippet))) outSet.add(m[2]);
}

/**
 * Balanced tag extraction for nested <g> blocks.
 * Not a full XML parser, but works well for SVG tag nesting.
 *
 * @param {string} text
 * @param {string} tagName
 * @returns {Array<[number, number]>}
 */
function findBalancedTagRanges(text, tagName) {
  const ranges = [];
  const openRe = new RegExp(`<${tagName}\\b`, "ig");
  const closeRe = new RegExp(`</${tagName}\\b`, "ig");

  const stack = [];
  let i = 0;

  while (i < text.length) {
    openRe.lastIndex = i;
    closeRe.lastIndex = i;

    const o = openRe.exec(text);
    const c = closeRe.exec(text);

    const nextOpen = o ? o.index : -1;
    const nextClose = c ? c.index : -1;

    if (nextOpen === -1 && nextClose === -1) break;

    if (nextOpen !== -1 && (nextClose === -1 || nextOpen < nextClose)) {
      // opening tag
      const gt = text.indexOf(">", nextOpen);
      if (gt === -1) break;

      // ignore self-closing <g .../>
      const openTag = text.slice(nextOpen, gt + 1);
      const selfClosing = /\/>\s*$/.test(openTag);
      if (!selfClosing) stack.push(nextOpen);

      i = gt + 1;
    } else {
      // closing tag
      const gt = text.indexOf(">", nextClose);
      if (gt === -1) break;

      if (stack.length) {
        const start = stack.pop();
        if (stack.length === 0) {
          ranges.push([start, gt + 1]);
        }
      }

      i = gt + 1;
    }
  }

  return ranges;
}

/**
 * Find any tag <name ...> (opening tag only) and apply a predicate on the tag string.
 *
 * @param {string} block
 * @param {string} tagName
 * @param {(tag: string)=>boolean} predicate
 * @returns {boolean}
 */
function findTagMatch(block, tagName, predicate) {
  const re = new RegExp(`<${tagName}\\b[^>]*>`, "ig");
  let m;
  while ((m = re.exec(block))) {
    if (predicate(m[0])) return true;
  }
  return false;
}

/**
 * Get attribute value from a single tag string.
 *
 * @param {string} tag
 * @param {string} name
 * @returns {string|null}
 */
function getAttr(tag, name) {
  const re = new RegExp(
    `\\b${escapeRegExp(name)}\\s*=\\s*(["'])([\\s\\S]*?)\\1`,
    "i",
  );
  const m = tag.match(re);
  return m ? m[2] : null;
}

/**
 * Parse transform="matrix(a b c d e f)" (commas or spaces).
 *
 * @param {string} transformValue
 * @returns {number[] | null}
 */
function parseMatrix(transformValue) {
  const m = String(transformValue).match(/matrix\(\s*([^)]+)\s*\)/i);
  if (!m) return null;

  const parts = m[1]
    .trim()
    .split(/[\s,]+/)
    .filter(Boolean)
    .map((x) => Number(x));

  if (parts.length < 6) return null;
  if (parts.some((x) => !Number.isFinite(x))) return null;
  return parts.slice(0, 6);
}

function isApproxZero(x) {
  return Math.abs(x) <= 1e-9;
}

function isApproxScale03(x) {
  // Accept typical 0.3 / 0.300000 etc.
  return Math.abs(x - 0.3) <= 0.01;
}

function escapeRegExp(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

module.exports = { stripSvgatorUiArtifacts, prunePayloadElements };
