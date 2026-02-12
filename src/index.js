/**
 * svgator-custom-player v3
 *
 * CLI entry point.
 */
"use strict";

const { parseArgs } = require("./cli/args");
const { readTextFile, writeTextFile } = require("./utils/fs");

const { findSvgatorScriptBlock } = require("./svg/findScriptBlock");
const { extractScriptContent } = require("./svg/extractScriptContent");
const { extractPayloadFromJs } = require("./svg/extractPayloadFromJs");
const { decodePayloadInPlace } = require("./svg/decodePayloadInPlace");
const { replaceScriptBlock } = require("./svg/replaceScriptBlock");
const { stripSvgatorUiArtifacts, prunePayloadElements } = require("./svg/stripArtifacts");

const { detectFeatures } = require("./features/detectFeatures");
const { buildPlayerScript } = require("./player/buildPlayerScript");
const { minifyIfPossible } = require("./minify/minify");

async function main() {
  const args = parseArgs(process.argv.slice(2));

  let svgText = readTextFile(args.input);

  // Remove Svgator UI artifacts (safe, structural match). Can be disabled with --keep-ui.
  let removedIds = new Set();
  if (!args.keepUi) {
    const stripped = stripSvgatorUiArtifacts(svgText);
    svgText = stripped.svgText;
    removedIds = stripped.removedIds;
  }

  // IMPORTANT: find script block after potential stripping, otherwise indices will be wrong.
  const scriptBlock = findSvgatorScriptBlock(svgText);
  if (!scriptBlock) {
    throw new Error("Could not find a Svgator <script> block in the input SVG.");
  }

  const jsText = extractScriptContent(scriptBlock.block);
  const { playerId, jsonText } = extractPayloadFromJs(jsText);
  const payload = JSON.parse(jsonText);

  // Decode options / animation settings if they are obfuscated strings.
  decodePayloadInPlace(payload, playerId);

  // Prune removed element ids from payload (keeps output smaller and detection accurate).
  prunePayloadElements(payload, removedIds);

  // Detect which runtime modules are needed.
  const features = detectFeatures(payload);

  // Generate runtime player JS code.
  const playerJs = buildPlayerScript(payload, features, {
    morphSamples: args.morphSamples,
    scrollThreshold: args.scrollThreshold,
  });

  // Optional minification (terser is optional dependency).
  const minified = await minifyIfPossible(playerJs, args.minify);

  const finalScript = `<script><![CDATA[${minified.code}]]></script>`;
  const outSvg = replaceScriptBlock(svgText, scriptBlock, finalScript);

  writeTextFile(args.output, outSvg);

  /* eslint-disable no-console */
  console.log("Wrote:", args.output);
  console.log("Minify:", args.minify ? minified.used : "disabled");
  console.log("Keep UI:", args.keepUi ? "enabled" : "disabled");
  console.log("UI artifacts removed:", args.keepUi ? 0 : removedIds.size);
  console.log("Detected:", {
    bezier: features.bezier,
    transform: features.transform,
    gradients: features.gradients,
    filters: features.filters,
    mask: features.mask,
    clipPath: features.clipPath,
    points: features.points,
    pathD: features.pathD,
    triggers: {
      scroll: features.triggersScroll,
      hover: features.triggersHover,
      click: features.triggersClick,
    },
    integrityW: features.integrityW,
  });
  /* eslint-enable no-console */
}

main().catch((err) => {
  /* eslint-disable no-console */
  console.error(String(err && err.stack ? err.stack : err));
  /* eslint-enable no-console */
  process.exit(1);
});
