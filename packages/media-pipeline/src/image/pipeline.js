// packages/media-pipeline/src/image/pipeline.js
import { resizeNearestNeighbor } from './resize.js';
import { adjustColor } from './colorAdjust.js';

/**
 * Runs the configured image conversion pipeline on a source image buffer.
 * Stage 1: resize + brightness/contrast/saturation only.
 * Future stages will add quantization, dithering, and palette handling here.
 * @param {Uint8ClampedArray} sourcePixels
 * @param {number} sourceWidth
 * @param {number} sourceHeight
 * @param {object} settings
 * @param {number} settings.outputWidth
 * @param {number} settings.outputHeight
 * @param {number} [settings.brightness]
 * @param {number} [settings.contrast]
 * @param {number} [settings.saturation]
 * @returns {Uint8ClampedArray} converted RGBA pixels, outputWidth*outputHeight*4
 */
export function runImagePipeline(sourcePixels, sourceWidth, sourceHeight, settings) {
  const { outputWidth, outputHeight, brightness = 0, contrast = 0, saturation = 0 } = settings;

  const resized = resizeNearestNeighbor(sourcePixels, sourceWidth, sourceHeight, outputWidth, outputHeight);
  adjustColor(resized, { brightness, contrast, saturation });

  return resized;
}