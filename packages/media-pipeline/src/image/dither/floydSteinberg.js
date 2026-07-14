// packages/media-pipeline/src/image/dither/floydSteinberg.js
import { findNearestColor } from './nearestColor.js';

/**
 * Floyd-Steinberg error-diffusion dithering — spreads the "rounding error"
 * from each pixel's palette match into its neighbors, which simulates
 * more colors/gradients than the palette actually contains.
 * @param {Uint8ClampedArray} pixels
 * @param {number} width
 * @param {number} height
 * @param {Array<[number, number, number]>} palette
 * @returns {Uint8ClampedArray}
 */
export function applyFloydSteinberg(pixels, width, height, palette) {
  // work on a float buffer so accumulated error doesn't clip prematurely
  const buffer = Float32Array.from(pixels);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      if (buffer[i + 3] === 0) continue;

      const oldR = buffer[i];
      const oldG = buffer[i + 1];
      const oldB = buffer[i + 2];
      const [newR, newG, newB] = findNearestColor(oldR, oldG, oldB, palette);

      buffer[i] = newR;
      buffer[i + 1] = newG;
      buffer[i + 2] = newB;

      const errR = oldR - newR;
      const errG = oldG - newG;
      const errB = oldB - newB;

      const distribute = (dx, dy, factor) => {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) return;
        const ni = (ny * width + nx) * 4;
        if (buffer[ni + 3] === 0) return;
        buffer[ni] += errR * factor;
        buffer[ni + 1] += errG * factor;
        buffer[ni + 2] += errB * factor;
      };

      distribute(1, 0, 7 / 16);
      distribute(-1, 1, 3 / 16);
      distribute(0, 1, 5 / 16);
      distribute(1, 1, 1 / 16);
    }
  }

  return Uint8ClampedArray.from(buffer);
}