// packages/media-pipeline/src/image/dither/ordered.js
import { findNearestColor } from './nearestColor.js';

const BAYER_4X4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

/**
 * Ordered (Bayer matrix) dithering — applies a repeating threshold
 * pattern before matching each pixel to the palette. Produces the
 * classic crosshatch-like retro dithering look, and unlike
 * Floyd-Steinberg, has no directional smearing artifacts.
 * @param {Uint8ClampedArray} pixels
 * @param {number} width
 * @param {number} height
 * @param {Array<[number, number, number]>} palette
 * @returns {Uint8ClampedArray}
 */
export function applyOrderedDither(pixels, width, height, palette) {
  const output = new Uint8ClampedArray(pixels.length);
  const spread = 32; // magnitude of the dithering threshold offset

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const a = pixels[i + 3];
      if (a === 0) {
        output[i + 3] = 0;
        continue;
      }

      const threshold = (BAYER_4X4[y % 4][x % 4] / 16 - 0.5) * spread;

      const r = pixels[i] + threshold;
      const g = pixels[i + 1] + threshold;
      const b = pixels[i + 2] + threshold;

      const [nr, ng, nb] = findNearestColor(r, g, b, palette);
      output[i] = nr;
      output[i + 1] = ng;
      output[i + 2] = nb;
      output[i + 3] = a;
    }
  }

  return output;
}