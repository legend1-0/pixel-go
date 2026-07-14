// packages/media-pipeline/src/image/dither/none.js
import { findNearestColor } from './nearestColor.js';

/**
 * Maps every pixel to its nearest palette color, with no error diffusion
 * or threshold dithering. This is the "flat" baseline mapping.
 * @param {Uint8ClampedArray} pixels
 * @param {number} width
 * @param {number} height
 * @param {Array<[number, number, number]>} palette
 * @returns {Uint8ClampedArray}
 */
export function applyNoDither(pixels, width, height, palette) {
  const output = new Uint8ClampedArray(pixels.length);

  for (let i = 0; i < pixels.length; i += 4) {
    const a = pixels[i + 3];
    if (a === 0) {
      output[i + 3] = 0;
      continue;
    }
    const [r, g, b] = findNearestColor(pixels[i], pixels[i + 1], pixels[i + 2], palette);
    output[i] = r;
    output[i + 1] = g;
    output[i + 2] = b;
    output[i + 3] = a;
  }

  return output;
}