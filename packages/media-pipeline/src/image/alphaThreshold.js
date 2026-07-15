// packages/media-pipeline/src/image/alphaThreshold.js

/**
 * Snaps every pixel's alpha to either fully opaque or fully transparent,
 * based on a threshold. Useful for pixel art, where soft/partial
 * transparency along edges doesn't fit the hard-edged aesthetic.
 * @param {Uint8ClampedArray} pixels
 * @param {number} threshold - 0-255; alpha below this becomes 0, at/above becomes 255
 */
export function applyAlphaThreshold(pixels, threshold) {
  for (let i = 3; i < pixels.length; i += 4) {
    pixels[i] = pixels[i] < threshold ? 0 : 255;
  }
}