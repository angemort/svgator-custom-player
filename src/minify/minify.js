/**
 * Optional minification using terser (optional dependency).
 */
"use strict";

async function minifyIfPossible(code, wantMinify) {
  if (!wantMinify) return { code, used: "none" };

  try {
    // Optional dependency: npm i -D terser
    const terser = require("terser");
    const res = await terser.minify(code, {
      compress: { passes: 2 },
      mangle: true,
      ecma: 2017,
      format: { ascii_only: true },
    });
    if (!res || !res.code) throw new Error("Terser returned empty result");
    return { code: res.code, used: "terser" };
  } catch (err) {
    return { code, used: "none (terser not installed)" };
  }
}

module.exports = { minifyIfPossible };
