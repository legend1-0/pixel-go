// packages/media-pipeline/src/image/pipeline.js
import { resizeNearestNeighbor } from './resize.js';
import { adjustColor } from './colorAdjust.js';
import { extractPaletteMedianCut } from './quantize/medianCut.js';
import { applyNoDither } from './dither/none.js';
import { applyFloydSteinberg } from './dither/floydSteinberg.js';
import { applyOrderedDither } from './dither/ordered.js';

const DITHER_ALGORITHMS = {
  none: applyNoDither,
  'floyd-steinberg': applyFloydSteinberg,
  ordered: applyOrderedDither,
};

/**
 * Runs the configured image conversion pipeline on a source image buffer.
 * Stage 2: adds color quantization (Median Cut) and dithering.
 * @param {Uint8ClampedArray} sourcePixels
 * @param {number} sourceWidth
 * @param {number} sourceHeight
 * @param {object} settings
 * @param {number} settings.outputWidth
 * @param {number} settings.outputHeight
 * @param {number} [settings.brightness]
 * @param {number} [settings.contrast]
 * @param {number} [settings.saturation]
 * @param {number} [settings.colorCount] - number of palette colors; 0 = no quantization
 * @param {'none'|'floyd-steinberg'|'ordered'} [settings.dither]
 * @returns {{ pixels: Uint8ClampedArray, palette: Array<[number,number,number]> | null }}
 */
export function runImagePipeline(sourcePixels, sourceWidth, sourceHeight, settings) {
  const {
    outputWidth,
    outputHeight,
    brightness = 0,
    contrast = 0,
    saturation = 0,
    colorCount = 0,
    dither = 'none',
  } = settings;

  let pixels = resizeNearestNeighbor(sourcePixels, sourceWidth, sourceHeight, outputWidth, outputHeight);
  adjustColor(pixels, { brightness, contrast, saturation });

  let palette = null;
  if (colorCount > 0) {
    palette = extractPaletteMedianCut(pixels, colorCount);
    const ditherFn = DITHER_ALGORITHMS[dither] || applyNoDither;
    pixels = ditherFn(pixels, outputWidth, outputHeight, palette);
  }

  return { pixels, palette };
}