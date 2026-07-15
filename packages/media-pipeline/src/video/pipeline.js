// packages/media-pipeline/src/video/pipeline.js
import { loadVideo, grabVideoFrame } from './decode/videoElementFallback.js';
import { isWebCodecsSupported, extractFramesWebCodecs } from './decode/webcodecs.js';

/**
 * Extracts raw RGBA frames from a video file at a target frame rate.
 * Tries the faster WebCodecs path first (MP4 only); falls back
 * automatically to the universal <video> element path for other formats
 * or if WebCodecs extraction fails for any reason.
 * NOTE: this fully materializes every extracted frame in memory — there
 * is no lazy-loading/eviction cache yet. `maxFrames` exists specifically
 * to guard against exhausting browser memory on long videos.
 * @param {File} file
 * @param {object} options
 * @param {number} options.fps
 * @param {number} [options.maxFrames]
 * @param {(current: number, total: number) => void} [options.onProgress]
 * @returns {Promise<{ frames: Array<{ pixels: Uint8ClampedArray, width: number, height: number }>, sourceWidth: number, sourceHeight: number, duration: number }>}
 */
export async function extractFramesFromVideo(file, { fps, maxFrames = 60, onProgress } = {}) {
  if (isWebCodecsSupported(file)) {
    try {
      return await extractFramesWebCodecs(file, { fps, maxFrames, onProgress });
    } catch (err) {
      console.warn('WebCodecs extraction failed, falling back to <video> element:', err);
      // fall through to the fallback path below
    }
  }

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