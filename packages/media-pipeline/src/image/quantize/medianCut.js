// packages/media-pipeline/src/image/quantize/medianCut.js

/**
 * Median cut color quantization — produces a palette of `numColors`
 * representative colors from the given RGBA pixel buffer.
 * @param {Uint8ClampedArray} pixels
 * @param {number} numColors
 * @returns {Array<[number, number, number]>} palette of RGB colors
 */
export function extractPaletteMedianCut(pixels, numColors) {
  const points = [];
  for (let i = 0; i < pixels.length; i += 4) {
    if (pixels[i + 3] > 0) {
      points.push([pixels[i], pixels[i + 1], pixels[i + 2]]);
    }
  }
  if (points.length === 0) return [[0, 0, 0]];

  let buckets = [points];

  while (buckets.length < numColors) {
    let largestIndex = 0;
    let largestRange = -1;
    let largestChannel = 0;

    buckets.forEach((bucket, i) => {
      for (let channel = 0; channel < 3; channel++) {
        const values = bucket.map((p) => p[channel]);
        const range = Math.max(...values) - Math.min(...values);
        if (range > largestRange) {
          largestRange = range;
          largestIndex = i;
          largestChannel = channel;
        }
      }
    });

    const bucketToSplit = buckets[largestIndex];
    if (bucketToSplit.length <= 1) break; // nothing left worth splitting

    bucketToSplit.sort((a, b) => a[largestChannel] - b[largestChannel]);
    const mid = Math.floor(bucketToSplit.length / 2);
    const bucketA = bucketToSplit.slice(0, mid);
    const bucketB = bucketToSplit.slice(mid);

    buckets.splice(largestIndex, 1, bucketA, bucketB);
  }

  return buckets.map((bucket) => {
    const total = bucket.reduce(
      (acc, p) => [acc[0] + p[0], acc[1] + p[1], acc[2] + p[2]],
      [0, 0, 0],
    );
    return [
      Math.round(total[0] / bucket.length),
      Math.round(total[1] / bucket.length),
      Math.round(total[2] / bucket.length),
    ];
  });
}