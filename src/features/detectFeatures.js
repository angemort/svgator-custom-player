/**
 * Detect which runtime modules are needed by inspecting the decoded payload.
 *
 * Notes:
 * - This is intentionally conservative: if we are unsure, we enable the module.
 */
"use strict";

function detectFeatures(payload) {
  const f = {
    bezier: false,
    transform: false,

    gradients: false,
    filters: false,

    mask: false,
    clipPath: false,

    points: false,
    pathD: false,

    triggersScroll: false,
    triggersHover: false,
    triggersClick: false,

    integrityW: false,
  };

  const opts = payload && payload.options ? payload.options : {};
  if (opts && opts.start === "scroll") f.triggersScroll = true;
  if (opts && opts.start === "hover") f.triggersHover = true;
  if (opts && opts.start === "click") f.triggersClick = true;

  const anims = Array.isArray(payload && payload.animations) ? payload.animations : [];
  for (const anim of anims) {
    const s = anim && anim.s ? anim.s : {};
    if (s && Array.isArray(s.w) && s.w.length) f.integrityW = true;

    const elements = anim && anim.elements ? anim.elements : {};
    for (const id of Object.keys(elements)) {
      const el = elements[id];
      if (!el) continue;

      if (el.transform) f.transform = true;

      if (el.mask) f.mask = true;
      if (el["clip-path"]) f.clipPath = true;

      if (el.points) f.points = true;
      if (el.d) f.pathD = true;

      if (el["#filter"] || el.filter) f.filters = true;

      // Easing: scan typical tracks
      scanBezier(el.opacity, f);
      scanBezier(el.fill, f);
      scanBezier(el.stroke, f);
      scanBezier(el["fill-opacity"], f);
      scanBezier(el["stroke-opacity"], f);
      scanBezier(el["stroke-width"], f);
      scanBezier(el["stroke-dashoffset"], f);
      scanBezier(el["stroke-dasharray"], f);
      scanBezier(el["#size"], f);
      scanBezier(el.points, f);
      scanBezier(el.d, f);

      // Paint: detect gradients
      scanGradients(el.fill, f);
      scanGradients(el.stroke, f);
    }
  }

  return f;
}

function scanBezier(track, f) {
  if (!Array.isArray(track)) return;
  for (const kf of track) {
    if (kf && Array.isArray(kf.e) && kf.e.length === 4) {
      f.bezier = true;
      return;
    }
  }
}

function scanGradients(track, f) {
  if (!Array.isArray(track)) return;
  for (const kf of track) {
    const v = kf && kf.v;
    if (v && typeof v === "object" && v.t === "g") {
      f.gradients = true;
      return;
    }
  }
}

module.exports = { detectFeatures };
