// packages/media-pipeline/src/video/decode/webcodecs.js
import * as MP4Box from 'mp4box';
/**
 * Checks whether the WebCodecs fast-decode path can be used for this file.
 * Currently scoped to MP4 containers only, since mp4box.js (our demuxer)
 * is MP4-specific — other containers automatically fall back to the
 * universal <video> element path.
 * @param {File} file
 * @returns {boolean}
 */
export function isWebCodecsSupported(file) {
  const hasVideoDecoder = typeof VideoDecoder !== 'undefined';
  const isMp4 = file.type === 'video/mp4' || file.name.toLowerCase().endsWith('.mp4');
  return hasVideoDecoder && isMp4;
}

function getDescription(mp4boxfile, track) {
  const trak = mp4boxfile.getTrackById(track.id);
  for (const entry of trak.mdia.minf.stbl.stsd.entries) {
    const box = entry.avcC || entry.hvcC || entry.vpcC || entry.av1C;
    if (box) {
      const stream = new MP4Box.DataStream(undefined, 0, MP4Box.DataStream.BIG_ENDIAN);
      box.write(stream);
      return new Uint8Array(stream.buffer, 8); // strip the box header
    }
  }
  return undefined;
}

/**
 * Extracts frames from an MP4 file using WebCodecs (VideoDecoder) plus
 * mp4box.js for container demuxing. Faster and more frame-accurate than
 * the <video> element fallback. Stops decoding as soon as enough target
 * frames have been captured, rather than decoding the whole file.
 * @param {File} file
 * @param {object} options
 * @param {number} options.fps
 * @param {number} [options.maxFrames]
 * @param {(current: number, total: number) => void} [options.onProgress]
 * @returns {Promise<{ frames: Array<{pixels: Uint8ClampedArray, width: number, height: number}>, sourceWidth: number, sourceHeight: number, duration: number }>}
 */
export function extractFramesWebCodecs(file, { fps, maxFrames = 60, onProgress } = {}) {
  return new Promise((resolve, reject) => {
    const mp4boxfile = MP4Box.createFile();
    const frames = [];
    let decoder = null;
    let targetTimestamps = [];
    let nextTargetIndex = 0;
    let sourceWidth = 0;
    let sourceHeight = 0;
    let duration = 0;
    let stopped = false;

    const canvas = document.createElement('canvas');
    let ctx = null;

    const finish = () => {
      if (stopped) return;
      stopped = true;
      try {
        decoder?.close();
      } catch {
        /* already closed — fine */
      }
      resolve({ frames, sourceWidth, sourceHeight, duration });
    };

    mp4boxfile.onError = (e) => reject(new Error(`mp4box error: ${e}`));

    mp4boxfile.onReady = (info) => {
      const videoTrack = info.videoTracks[0];
      if (!videoTrack) {
        reject(new Error('No video track found in file'));
        return;
      }

      sourceWidth = videoTrack.video.width;
      sourceHeight = videoTrack.video.height;
      duration = info.duration / info.timescale;
      canvas.width = sourceWidth;
      canvas.height = sourceHeight;
      ctx = canvas.getContext('2d');

      const frameInterval = 1 / fps;
      const totalTargetFrames = Math.min(maxFrames, Math.max(1, Math.floor(duration / frameInterval)));
      targetTimestamps = Array.from({ length: totalTargetFrames }, (_, i) => i * frameInterval);

      const description = getDescription(mp4boxfile, videoTrack);

      decoder = new VideoDecoder({
        output: (videoFrame) => {
          if (stopped) {
            videoFrame.close();
            return;
          }

          const frameTimeSec = videoFrame.timestamp / 1e6;

          if (
            nextTargetIndex < targetTimestamps.length &&
            frameTimeSec >= targetTimestamps[nextTargetIndex]
          ) {
            ctx.drawImage(videoFrame, 0, 0, sourceWidth, sourceHeight);
            const imageData = ctx.getImageData(0, 0, sourceWidth, sourceHeight);
            frames.push({ pixels: imageData.data, width: sourceWidth, height: sourceHeight });
            nextTargetIndex++;
            if (onProgress) onProgress(frames.length, targetTimestamps.length);
          }

          videoFrame.close();

          if (nextTargetIndex >= targetTimestamps.length) {
            finish();
          }
        },
        error: (e) => reject(e),
      });

      decoder.configure({
        codec: videoTrack.codec,
        codedWidth: sourceWidth,
        codedHeight: sourceHeight,
        description,
      });

      mp4boxfile.setExtractionOptions(videoTrack.id, null, { nbSamples: Infinity });
      mp4boxfile.start();
    };

    mp4boxfile.onSamples = (trackId, ref, samples) => {
      if (stopped) return;
      for (const sample of samples) {
        if (stopped) break;
        decoder.decode(
          new EncodedVideoChunk({
            type: sample.is_sync ? 'key' : 'delta',
            timestamp: (sample.cts * 1e6) / sample.timescale,
            duration: (sample.duration * 1e6) / sample.timescale,
            data: sample.data,
          }),
        );
      }
    };

    file.arrayBuffer().then((buffer) => {
      buffer.fileStart = 0;
      mp4boxfile.appendBuffer(buffer);
      mp4boxfile.flush();

      // safety net: if the source video is shorter than expected and we
      // never hit enough target frames via the output callback, resolve
      // with whatever we captured once decoding drains, instead of hanging.
      if (decoder) {
        decoder
          .flush()
          .then(finish)
          .catch(finish);
      }
    });
  });
}