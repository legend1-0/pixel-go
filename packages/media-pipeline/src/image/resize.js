// packages/media-pipeline/src/image/resize.js

/**
 * Nearest-neighbor resize of an RGBA pixel buffer. Cheap regardless of
 * source image size, since it samples exactly one source pixel per
 * destination pixel rather than iterating every source pixel.
 * @param {Uint8ClampedArray} pixels - source RGBA pixels
 * @param {number} srcWidth
 * @param {number} srcHeight
 * @param {number} destWidth
 * @param {number} destHeight
 * @returns {Uint8ClampedArray} resized RGBA pixels, destWidth*destHeight*4
 */
export function resizeNearestNeighbor(pixels, srcWidth, srcHeight, destWidth, destHeight) {
  const dest = new Uint8ClampedArray(destWidth * destHeight * 4);

  for (let y = 0; y < destHeight; y++) {
    const srcY = Math.floor((y / destHeight) * srcHeight);
    for (let x = 0; x < destWidth; x++) {
      const srcX = Math.floor((x / destWidth) * srcWidth);
      const srcIndex = (srcY * srcWidth + srcX) * 4;
      const destIndex = (y * destWidth + x) * 4;

      dest[destIndex] = pixels[srcIndex];
      dest[destIndex + 1] = pixels[srcIndex + 1];
      dest[destIndex + 2] = pixels[srcIndex + 2];
      dest[destIndex + 3] = pixels[srcIndex + 3];
    }
  }

  return dest;
}