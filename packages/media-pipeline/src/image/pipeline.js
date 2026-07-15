// packages/media-pipeline/src/image/pipeline.js
import { resizeNearestNeighbor } from './resize.js';
import { adjustColor } from './colorAdjust.js';
import { applyEdgeEnhance } from './edgeEnhance.js';
import { applyAlphaThreshold } from './alphaThreshold.js';
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
 * Stage 4: adds edge enhancement (sharpening) and alpha threshold.
 * @param {Uint8ClampedArray} sourcePixels
 * @param {number} sourceWidth
 * @param {number} sourceHeight
 * @param {object} settings
 * @param {number} settings.outputWidth
 * @param {number} settings.outputHeight
 * @param {number} [settings.brightness]
 * @param {number} [settings.contrast]
 * @param {number} [settings.saturation]
 * @param {number} [settings.edgeEnhanceAmount] - 0 = off
 * @param {number} [settings.colorCount] - used only when paletteMode is 'auto'; 0 = no quantization
 * @param {'auto'|'fixed'} [settings.paletteMode]
 * @param {Array<[number,number,number]>} [settings.fixedPalette] - required when paletteMode is 'fixed'
 * @param {'none'|'floyd-steinberg'|'ordered'} [settings.dither]
 * @param {number} [settings.alphaThreshold] - 0 = off, otherwise 1-255
 * @returns {{ pixels: Uint8ClampedArray, palette: Array<[number,number,number]> | null }}
 */
export function runImagePipeline(sourcePixels, sourceWidth, sourceHeight, settings) {
  const {
    outputWidth,
    outputHeight,
    brightness = 0,
    contrast = 0,
    saturation = 0,
    edgeEnhanceAmount = 0,
    colorCount = 0,
    paletteMode = 'auto',
    fixedPalette = null,
    dither = 'none',
    alphaThreshold = 0,
  } = settings;

  let pixels = resizeNearestNeighbor(sourcePixels, sourceWidth, sourceHeight, outputWidth, outputHeight);
  adjustColor(pixels, { brightness, contrast, saturation });

  if (edgeEnhanceAmount > 0) {
    pixels = applyEdgeEnhance(pixels, outputWidth, outputHeight, edgeEnhanceAmount);
  }

  let palette = null;

  if (paletteMode === 'fixed' && fixedPalette) {
    palette = fixedPalette;
    const ditherFn = DITHER_ALGORITHMS[dither] || applyNoDither;
    pixels = ditherFn(pixels, outputWidth, outputHeight, palette);
  } else if (colorCount > 0) {
    palette = extractPaletteMedianCut(pixels, colorCount);
    const ditherFn = DITHER_ALGORITHMS[dither] || applyNoDither;
    pixels = ditherFn(pixels, outputWidth, outputHeight, palette);
  }

  if (alphaThreshold > 0) {
    applyAlphaThreshold(pixels, alphaThreshold);
  }

  return { pixels, palette };
}