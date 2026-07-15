// packages/media-pipeline/src/video/decode/videoElementFallback.js

/**
 * Loads a video file into a hidden <video> element and resolves once
 * its metadata (duration, native dimensions) is available.
 * @param {File} file
 * @returns {Promise<{ video: HTMLVideoElement, duration: number, width: number, height: number, revoke: () => void }>}
 */
export function loadVideo(file) {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const url = URL.createObjectURL(file);
    video.src = url;
    video.muted = true;
    video.playsInline = true;

    video.onloadedmetadata = () => {
      resolve({
        video,
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
        revoke: () => URL.revokeObjectURL(url),
      });
    };
    video.onerror = () => reject(new Error('Failed to load video'));
  });
}

/**
 * Seeks a loaded <video> element to a specific timestamp and grabs that
 * frame as raw RGBA pixel data via canvas drawImage.
 * @param {HTMLVideoElement} video
 * @param {number} timestamp - seconds
 * @returns {Promise<{ pixels: Uint8ClampedArray, width: number, height: number }>}
 */
export function grabVideoFrame(video, timestamp) {
  return new Promise((resolve, reject) => {
    const handleSeeked = () => {
      video.removeEventListener('seeked', handleSeeked);
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        resolve({ pixels: imageData.data, width: canvas.width, height: canvas.height });
      } catch (err) {
        reject(err);
      }
    };
    video.addEventListener('seeked', handleSeeked);
    video.currentTime = timestamp;
  });
}