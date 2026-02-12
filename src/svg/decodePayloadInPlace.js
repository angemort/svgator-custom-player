/**
 * Decode payload.options and animations[i].s in-place if they are strings.
 */
"use strict";

const { decodeSvgator } = require("./decodeSvgator");

function decodePayloadInPlace(payload, playerId) {
  if (!payload || typeof payload !== "object") return;

  if (typeof payload.options === "string") {
    payload.options = decodeSvgator(payload.options, payload.root, playerId);
  }

  if (Array.isArray(payload.animations)) {
    payload.animations = payload.animations.map((a) => {
      if (a && typeof a.s === "string") {
        a.s = decodeSvgator(a.s, payload.root, playerId);
      }
      return a;
    });
  }
}

module.exports = { decodePayloadInPlace };
