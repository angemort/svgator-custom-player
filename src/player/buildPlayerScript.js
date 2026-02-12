/**
 * Build runtime player JS string from payload and detected features.
 *
 * The output is a self-executing script intended to be embedded in the SVG.
 */
"use strict";

const { coreModule } = require("./modules/core");
const { bezierModule } = require("./modules/bezier");
const { transformModule } = require("./modules/transform");
const { paintsModule } = require("./modules/paints");
const { gradientsModule } = require("./modules/gradients");
const { filtersModule } = require("./modules/filters");
const { pointsModule } = require("./modules/points");
const { pathMorphModule } = require("./modules/pathMorph");
const { triggersModule } = require("./modules/triggers");

function buildPlayerScript(payload, features, options) {
  const opts = {
    morphSamples: options && Number.isFinite(options.morphSamples) ? options.morphSamples : 80,
    scrollThreshold: options && Number.isFinite(options.scrollThreshold) ? options.scrollThreshold : 25,
  };

  // Embed payload directly (already decoded by CLI).
  const payloadJson = JSON.stringify(payload);

  // Assemble modules. Keep ordering deterministic.
  const parts = [];
  parts.push(`(()=>{"use strict";\nconst payload=${payloadJson};\n`);

  parts.push(coreModule(opts));
  if (features.bezier) parts.push(bezierModule());
  if (features.transform) parts.push(transformModule());

  // Paints are tiny and used by multiple modules.
  parts.push(paintsModule());

  if (features.gradients) parts.push(gradientsModule());
  if (features.filters) parts.push(filtersModule());
  if (features.points) parts.push(pointsModule());
  if (features.pathD) parts.push(pathMorphModule(opts));

  // Triggers module includes the main player, timeline, and public API.
  parts.push(triggersModule(opts, features));

  parts.push("\n})();");
  return parts.join("\n");
}

module.exports = { buildPlayerScript };
