// apps/web/src/components/video-import/VideoImportWizard.jsx
import { useState } from "react";
import {
  extractFramesFromVideo,
  runImagePipeline,
  resizeNearestNeighbor,
  extractPaletteMedianCut,
  RETRO_PALETTES,
  getRetroPalette,
} from "@pixel-art-studio/media-pipeline";

const SIZE_PRESETS = [16, 32, 64, 128];

/**
 * Video conversion wizard. Extracts a capped number of frames from a
 * video file, converts each through the same image pipeline used for
 * single-image import, and hands back a full set of ready-to-use frames
 * plus the target canvas size and per-frame duration.
 *
 * NOTE (Stage 1): every extracted frame is fully materialized in memory —
 * there is no lazy-loading/eviction cache yet. maxFrames guards against
 * exhausting browser memory on long clips.
 */
function VideoImportWizard({ onConvert, onCancel }) {
  const [file, setFile] = useState(null);
  const [fps, setFps] = useState(8);
  const [maxFrames, setMaxFrames] = useState(30);
  const [outputWidth, setOutputWidth] = useState(32);
  const [outputHeight, setOutputHeight] = useState(32);

  const [colorCount, setColorCount] = useState(16);
  const [paletteMode, setPaletteMode] = useState("auto");
  const [retroPaletteKey, setRetroPaletteKey] = useState("gameboy");
  const [dither, setDither] = useState("floyd-steinberg");

  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const handleConvert = async () => {
    if (!file) return;
    setIsConverting(true);
    setProgress({ current: 0, total: 0 });

    const { frames: rawFrames } = await extractFramesFromVideo(file, {
      fps,
      maxFrames,
      onProgress: (current, total) => setProgress({ current, total }),
    });

    // Compute ONE shared palette (from the first frame) so color stays
    // consistent across the whole animation instead of flickering per-frame.
    let sharedPalette = null;
    if (paletteMode === "fixed") {
      sharedPalette = getRetroPalette(retroPaletteKey);
    } else if (paletteMode === "auto" && colorCount > 0 && rawFrames.length > 0) {
      const firstResized = resizeNearestNeighbor(
        rawFrames[0].pixels,
        rawFrames[0].width,
        rawFrames[0].height,
        outputWidth,
        outputHeight,
      );
      sharedPalette = extractPaletteMedianCut(firstResized, colorCount);
    }

    const convertedFrames = rawFrames.map((rawFrame) => {
      const result = runImagePipeline(rawFrame.pixels, rawFrame.width, rawFrame.height, {
        outputWidth,
        outputHeight,
        paletteMode: sharedPalette ? "fixed" : "auto",
        fixedPalette: sharedPalette,
        dither,
      });
      return result.pixels;
    });

    setIsConverting(false);
    onConvert(convertedFrames, outputWidth, outputHeight, Math.round(1000 / fps));
  };

  return (
    <div style={{ padding: "24px", maxWidth: "420px" }}>
      <h2>Import Video</h2>
      <p style={{ color: "#666", fontSize: "14px" }}>
        Creates a new project — one frame per extracted video frame.
      </p>

      {!file ? (
        <input type="file" accept="video/*" onChange={(e) => setFile(e.target.files[0] || null)} />
      ) : isConverting ? (
        <p>
          Extracting frame {progress.current} of {progress.total}...
        </p>
      ) : (
        <>
          <label style={{ display: "block", marginBottom: "8px" }}>
            Target FPS:{" "}
            <input
              type="number"
              min="1"
              max="30"
              value={fps}
              onChange={(e) => setFps(parseInt(e.target.value, 10) || 1)}
              style={{ width: "60px" }}
            />
          </label>
          <label style={{ display: "block", marginBottom: "8px" }}>
            Max Frames:{" "}
            <input
              type="number"
              min="1"
              max="300"
              value={maxFrames}
              onChange={(e) => setMaxFrames(parseInt(e.target.value, 10) || 1)}
              style={{ width: "60px" }}
            />
            <span style={{ color: "#999", fontSize: "12px" }}> (higher = more memory used)</span>
          </label>

          <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
            {SIZE_PRESETS.map((size) => (
              <button
                key={size}
                onClick={() => {
                  setOutputWidth(size);
                  setOutputHeight(size);
                }}
              >
                {size}×{size}
              </button>
            ))}
          </div>
          <label>
            Width:{" "}
            <input
              type="number"
              min="1"
              max="256"
              value={outputWidth}
              onChange={(e) => setOutputWidth(parseInt(e.target.value, 10) || 1)}
              style={{ width: "60px" }}
            />
          </label>{" "}
          <label>
            Height:{" "}
            <input
              type="number"
              min="1"
              max="256"
              value={outputHeight}
              onChange={(e) => setOutputHeight(parseInt(e.target.value, 10) || 1)}
              style={{ width: "60px" }}
            />
          </label>

          <label style={{ display: "block", marginTop: "8px", marginBottom: "8px" }}>
            Palette:{" "}
            <select value={paletteMode} onChange={(e) => setPaletteMode(e.target.value)}>
              <option value="auto">Auto-extract (shared across all frames)</option>
              <option value="fixed">Fixed retro palette</option>
            </select>
          </label>

          {paletteMode === "fixed" ? (
            <label style={{ display: "block", marginBottom: "8px" }}>
              Retro Palette:{" "}
              <select value={retroPaletteKey} onChange={(e) => setRetroPaletteKey(e.target.value)}>
                {Object.entries(RETRO_PALETTES).map(([key, { name }]) => (
                  <option key={key} value={key}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <label style={{ display: "block", marginBottom: "8px" }}>
              Colors:{" "}
              <input
                type="number"
                min="2"
                max="64"
                value={colorCount}
                onChange={(e) => setColorCount(parseInt(e.target.value, 10) || 2)}
                style={{ width: "60px" }}
              />
            </label>
          )}

          <label style={{ display: "block", marginBottom: "12px" }}>
            Dithering:{" "}
            <select value={dither} onChange={(e) => setDither(e.target.value)}>
              <option value="none">None</option>
              <option value="floyd-steinberg">Floyd-Steinberg</option>
              <option value="ordered">Ordered (Bayer)</option>
            </select>
          </label>

          <button onClick={handleConvert}>Extract &amp; Convert</button>
        </>
      )}

      <button onClick={onCancel} style={{ marginTop: "12px", display: "block" }}>
        Cancel
      </button>
    </div>
  );
}

export default VideoImportWizard;