// packages/media-pipeline/src/image/colorAdjust.js

/**
 * Applies brightness, contrast, and saturation adjustments to an RGBA
 * buffer, in place.
 * @param {Uint8ClampedArray} pixels
 * @param {object} options
 * @param {number} [options.brightness] -100..100 (0 = no change)
 * @param {number} [options.contrast] -100..100 (0 = no change)
 * @param {number} [options.saturation] -100..100 (0 = no change, -100 = grayscale)
 */
export function adjustColor(pixels, { brightness = 0, contrast = 0, saturation = 0 } = {}) {
  const brightnessFactor = brightness * 2.55; // map -100..100 to roughly -255..255
  const contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));
  const saturationFactor = 1 + saturation / 100;

  for (let i = 0; i < pixels.length; i += 4) {
    let r = pixels[i];
    let g = pixels[i + 1];
    let b = pixels[i + 2];

    // brightness
    r += brightnessFactor;
    g += brightnessFactor;
    b += brightnessFactor;

    // contrast
    r = contrastFactor * (r - 128) + 128;
    g = contrastFactor * (g - 128) + 128;
    b = contrastFactor * (b - 128) + 128;

    // saturation — blend each channel toward the pixel's own grayscale luminance
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
    r = gray + (r - gray) * saturationFactor;
    g = gray + (g - gray) * saturationFactor;
    b = gray + (b - gray) * saturationFactor;

    pixels[i] = r;
    pixels[i + 1] = g;
    pixels[i + 2] = b;
  }
}