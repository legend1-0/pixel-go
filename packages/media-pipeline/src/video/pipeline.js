// packages/media-pipeline/src/video/pipeline.js
import { loadVideo, grabVideoFrame } from './decode/videoElementFallback.js';

/**
 * Extracts raw RGBA frames from a video file at a target frame rate.
 * NOTE: this fully materializes every extracted frame in memory — there
 * is no lazy-loading/eviction cache yet. `maxFrames` exists specifically
 * to guard against exhausting browser memory on long videos; increase it
 * with that tradeoff in mind.
 * @param {File} file
 * @param {object} options
 * @param {number} options.fps - target extraction frame rate
 * @param {number} [options.maxFrames] - safety cap on total frames extracted
 * @param {(current: number, total: number) => void} [options.onProgress]
 * @returns {Promise<{ frames: Array<{ pixels: Uint8ClampedArray, width: number, height: number }>, sourceWidth: number, sourceHeight: number, duration: number }>}
 */
export async function extractFramesFromVideo(file, { fps, maxFrames = 60, onProgress } = {}) {
  const { video, duration, width, height, revoke } = await loadVideo(file);

  const frameInterval = 1 / fps;
  const totalFrames = Math.min(maxFrames, Math.max(1, Math.floor(duration / frameInterval)));

  const frames = [];
  for (let i = 0; i < totalFrames; i++) {
    const timestamp = i * frameInterval;
    const frame = await grabVideoFrame(video, timestamp);
    frames.push(frame);
    if (onProgress) onProgress(i + 1, totalFrames);
  }

  revoke();
  return { frames, sourceWidth: width, sourceHeight: height, duration };
}