/**
 * Svgator string decoding (used for payload.options and animation settings .s).
 *
 * This is based on the decoding routine commonly found in Svgator players.
 */
"use strict";

function vt(t, mod) {
  const hex = String(t).replace(/[^0-9a-fA-F]+/g, "") || "27";
  const val = parseInt(hex, 16);
  return mod ? (val % mod) + mod : val;
}

function bt(t, e = 27) {
  const n = Number(t);
  if (!n || n % e) return n % e;
  if (e === 0 || e === 1) return e;
  return bt(n / e, e);
}

function removeChars(str, firstCut, nextCut) {
  let out = "";
  let t = str;
  let e = firstCut;
  const n = nextCut;

  while (t && n && e <= t.length) {
    out += t.substring(0, e);
    t = t.substring(e + 1);
    e = n;
  }

  return out + t;
}

function decodeSvgator(encoded, root, key) {
  if (!encoded || typeof encoded !== "string" || !encoded.length) return null;

  const r = vt(key);
  const i = bt(r) + 5;

  let s = removeChars(encoded, bt(r, 5), i);
  if (/\|$/.test(s)) s = s.replace(/\|$/, "==");
  if (/\/$/.test(s)) s = s.replace(/\/$/, "=");

  const b64 = Buffer.from(s, "base64").toString("utf8");
  const stripped = b64.replace(/[A-Z]/g, "");

  const r2 = parseInt(stripped.substring(0, 4), 16);
  const body = stripped.substring(4);

  const i2 = (vt(root, r2) % r2) + (r % 27);

  const chars = [];
  for (let idx = 0; idx < body.length; ) {
    if (body[idx] === "|") {
      chars.push(parseInt(body.substring(idx + 1, idx + 5), 16) - i2);
      idx += 5;
    } else {
      chars.push(parseInt(body.substring(idx, idx + 2), 16) - i2);
      idx += 2;
    }
  }

  return JSON.parse(String.fromCharCode(...chars));
}

module.exports = { decodeSvgator };
