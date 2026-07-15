// packages/media-pipeline/src/image/edgeEnhance.js

/**
 * Applies a simple sharpening kernel to an RGBA buffer. Runs on the
 * already-resized (small, pixel-art-resolution) buffer rather than the
 * original source image — this keeps it fast enough for live preview,
 * and sharpening at the final pixel-art resolution is what actually
 * affects how the artwork looks.
 * @param {Uint8ClampedArray} pixels
 * @param {number} width
 * @param {number} height
 * @param {number} amount - 0 = no effect, 1 = standard sharpen strength, can go higher
 * @returns {Uint8ClampedArray} a new sharpened buffer
 */
export function applyEdgeEnhance(pixels, width, height, amount) {
  if (amount <= 0) return pixels;

  const output = new Uint8ClampedArray(pixels.length);
  const center = 1 + 4 * amount;
  const edge = -amount;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;

      for (let channel = 0; channel < 3; channel++) {
        const get = (dx, dy) => {
          const nx = Math.min(width - 1, Math.max(0, x + dx));
          const ny = Math.min(height - 1, Math.max(0, y + dy));
          return pixels[(ny * width + nx) * 4 + channel];
        };

        const value =
          get(0, 0) * center +
          get(-1, 0) * edge +
          get(1, 0) * edge +
          get(0, -1) * edge +
          get(0, 1) * edge;

        output[i + channel] = value;
      }

      output[i + 3] = pixels[i + 3]; // alpha untouched here — see alphaThreshold.js
    }
  }

  return output;
}