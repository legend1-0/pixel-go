// packages/media-pipeline/src/image/dither/nearestColor.js

/**
 * Finds the closest color in a palette to the given RGB value,
 * using squared Euclidean distance (cheaper than sqrt, same ordering).
 * @param {number} r
 * @param {number} g
 * @param {number} b
 * @param {Array<[number, number, number]>} palette
 * @returns {[number, number, number]}
 */
export function findNearestColor(r, g, b, palette) {
  let closestIndex = 0;
  let closestDist = Infinity;

  for (let i = 0; i < palette.length; i++) {
    const [pr, pg, pb] = palette[i];
    const dist = (r - pr) ** 2 + (g - pg) ** 2 + (b - pb) ** 2;
    if (dist < closestDist) {
      closestDist = dist;
      closestIndex = i;
    }
  }

  return palette[closestIndex];
}