// packages/shared-utils/src/generateId.js

/**
 * Generates a unique id for documents, layers, and frames.
 * Kept in its own module so components never call Date.now()/crypto
 * directly during render.
 * @param {string} prefix - e.g. 'layer', 'frame'
 * @returns {string}
 */
function generateId(prefix) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

export { generateId };