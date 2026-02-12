/**
 * CLI argument parser
 *
 * Usage:
 *   svgator-custom input.svg output.svg
 *     [--minify]
 *     [--morph-samples N]
 *     [--scroll-threshold P]
 *     [--keep-ui]
 *     [--minify]
 *     [--morph-samples N]
 *     [--scroll-threshold P]
 *     [--keep-ui]   (do NOT remove Svgator UI artifacts)
 */
"use strict";

function parseArgs(argv) {
  const positional = [];
  const flags = new Map();

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith("--")) {
        flags.set(key, next);
        i++;
      } else {
        flags.set(key, "true");
      }
    } else {
      positional.push(a);
    }
  }

  const input = positional[0];
  const output = positional[1] || "output.custom.svg";

  if (!input) {
    throw new Error(
      "Usage: svgator-custom <input.svg> [output.svg] [--minify] [--morph-samples N] [--scroll-threshold P] [--keep-ui]"
    );
  }

  const minify = flags.get("minify") === "true";
  const keepUi = flags.get("keep-ui") === "true";

  const morphSamples = clampInt(flags.get("morph-samples"), 80, 16, 500);
  const scrollThreshold = clampInt(flags.get("scroll-threshold"), 25, 1, 100);

  return { input, output, minify, keepUi, morphSamples, scrollThreshold };
}

function clampInt(value, def, min, max) {
  if (value == null) return def;
  const n = Number(value);
  if (!Number.isFinite(n)) return def;
  const i = Math.floor(n);
  if (i < min) return min;
  if (i > max) return max;
  return i;
}

module.exports = { parseArgs };
