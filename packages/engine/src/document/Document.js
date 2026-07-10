/**
 * Creates a brand-new, empty pixel art layer.
 * @param {string} name - Display name for the layer (e.g. "Layer 1")
 * @param {number} width - Canvas width in pixels
 * @param {number} height - Canvas height in pixels
 * @returns {object} A new layer object
 */
export function createLayer(name, width, height) {
  return {
    id: crypto.randomUUID(),
    name,
    opacity: 1,
    visible: true,
    locked: false,
    // pixel data: one Uint8ClampedArray slot per pixel, 4 values (R,G,B,A) each
    pixels: new Uint8ClampedArray(width * height * 4),
  };
}

/**
 * Creates a brand-new, empty animation frame containing one blank layer.
 * @param {number} width
 * @param {number} height
 * @returns {object} A new frame object
 */
export function createFrame(width, height) {
  return {
    id: crypto.randomUUID(),
    name: null,               // ADDED: null means "no custom name, show positional default"
    duration: 100,
    layers: [createLayer(null, width, height)],   // CHANGED: null instead of 'Layer 1'
  };
}

/**
 * Creates a brand-new, empty project (Document).
 * @param {object} options
 * @param {string} [options.name] - Project name
 * @param {number} [options.width] - Canvas width in pixels
 * @param {number} [options.height] - Canvas height in pixels
 * @returns {object} A new Document
 */
export function createDocument({ name = 'Untitled Project', width = 32, height = 32 } = {}) {
  return {
    meta: {
      id: crypto.randomUUID(),   // ADDED
      name,
      width,
      height,
      createdAt: new Date().toISOString(),
    },
    palette: [],
    frames: [createFrame(width, height)],
  };
}