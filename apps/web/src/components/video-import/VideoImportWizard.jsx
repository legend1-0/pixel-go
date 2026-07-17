// apps/web/src/components/video-import/VideoImportWizard.jsx
import { useState } from "react";
import { UploadCloud, Sparkles } from "lucide-react";
import {
  loadVideo,
  grabVideoFrame,
  resizeNearestNeighbor,
  extractPaletteMedianCut,
  RETRO_PALETTES,
  getRetroPalette,
} from "@pixel-art-studio/media-pipeline";
import "../image-import/ImageImportWizard.css"; // shared wizard styles
import "./VideoImportWizard.css"; // shared wizard styles

const SIZE_PRESETS = [16, 32, 64, 128];

function VideoImportWizard({ onConvert, onCancel }) {
  const [file, setFile] = useState(null);
  const [fps, setFps] = useState(8);
  const [maxFrames, setMaxFrames] = useState(60);
  const [outputWidth, setOutputWidth] = useState(32);
  const [outputHeight, setOutputHeight] = useState(32);

  const [colorCount, setColorCount] = useState(16);
  const [paletteMode, setPaletteMode] = useState("auto");
  const [retroPaletteKey, setRetroPaletteKey] = useState("gameboy");
  const [dither, setDither] = useState("floyd-steinberg");

  const [isPreparing, setIsPreparing] = useState(false);

  const handleConvert = async () => {
    if (!file) return;
    setIsPreparing(true);

    const { video, duration } = await loadVideo(file);

    const frameInterval = 1 / fps;
    const totalFrames = Math.min(maxFrames, Math.max(1, Math.floor(duration / frameInterval)));
    const timestamps = Array.from({ length: totalFrames }, (_, i) => i * frameInterval);

    const firstRaw = await grabVideoFrame(video, timestamps[0]);

    let resolvedPalette = null;
    if (paletteMode === "fixed") {
      resolvedPalette = getRetroPalette(retroPaletteKey);
    } else if (paletteMode === "auto" && colorCount > 0) {
      const firstResized = resizeNearestNeighbor(
        firstRaw.pixels,
        firstRaw.width,
        firstRaw.height,
        outputWidth,
        outputHeight,
      );
      resolvedPalette = extractPaletteMedianCut(firstResized, colorCount);
    }

    setIsPreparing(false);

    onConvert({
      videoBlob: file,
      timestamps,
      pipelineSettings: {
        outputWidth,
        outputHeight,
        fixedPalette: resolvedPalette,
        dither,
      },
      frameDurationMs: Math.round(1000 / fps),
      outputWidth,
      outputHeight,
    });
  };

  return (
    <div className="wizard">
      <div className="wizard__header">
        <p className="wizard__eyebrow">Import</p>
        <h2 className="wizard__title">Convert a Video</h2>
        <p className="wizard__hint">
          Creates a new project. Frames are decoded on demand as you view them, so long videos don't overload memory upfront.
        </p>
      </div>

      {!file ? (
        <label className="wizard__dropzone">
          <UploadCloud size={28} strokeWidth={2} />
          Click to choose a video
          <input type="file" accept="video/*" onChange={(e) => setFile(e.target.files[0] || null)} />
        </label>
      ) : isPreparing ? (
        <p className="wizard__preparing">Preparing...</p>
      ) : (
        <>
          <div className="wizard__fields wizard__section">
            <div className="wizard__field">
              <label className="wizard__label">Target FPS</label>
              <div className="wizard__input-wrap">
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={fps}
                  onChange={(e) => setFps(parseInt(e.target.value, 10) || 1)}
                />
              </div>
            </div>
            <div className="wizard__field">
              <label className="wizard__label">Max Frames</label>
              <div className="wizard__input-wrap">
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={maxFrames}
                  onChange={(e) => setMaxFrames(parseInt(e.target.value, 10) || 1)}
                />
              </div>
            </div>
          </div>

          <div className="wizard__section">
            <label className="wizard__label">Canvas size</label>
            <div className="wizard__presets">
              {SIZE_PRESETS.map((size) => (
                <button
                  key={size}
                  className="wizard__preset"
                  onClick={() => {
                    setOutputWidth(size);
                    setOutputHeight(size);
                  }}
                >
                  {size}×{size}
                </button>
              ))}
            </div>
            <div className="wizard__fields">
              <div className="wizard__field">
                <div className="wizard__input-wrap">
                  <input
                    type="number"
                    min="1"
                    max="256"
                    value={outputWidth}
                    onChange={(e) => setOutputWidth(parseInt(e.target.value, 10) || 1)}
                  />
                </div>
              </div>
              <div className="wizard__field">
                <div className="wizard__input-wrap">
                  <input
                    type="number"
                    min="1"
                    max="256"
                    value={outputHeight}
                    onChange={(e) => setOutputHeight(parseInt(e.target.value, 10) || 1)}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="wizard__section">
            <label className="wizard__label">Palette</label>
            <div className="wizard__select-wrap">
              <select value={paletteMode} onChange={(e) => setPaletteMode(e.target.value)}>
                <option value="auto">Auto-extract (from first frame, shared)</option>
                <option value="fixed">Fixed retro palette</option>
              </select>
            </div>
          </div>

          {paletteMode === "fixed" ? (
            <div className="wizard__section">
              <label className="wizard__label">Retro Palette</label>
              <div className="wizard__select-wrap">
                <select value={retroPaletteKey} onChange={(e) => setRetroPaletteKey(e.target.value)}>
                  {Object.entries(RETRO_PALETTES).map(([key, { name }]) => (
                    <option key={key} value={key}>{name}</option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="wizard__section">
              <label className="wizard__label">Colors</label>
              <div className="wizard__input-wrap">
                <input
                  type="number"
                  min="2"
                  max="64"
                  value={colorCount}
                  onChange={(e) => setColorCount(parseInt(e.target.value, 10) || 2)}
                />
              </div>
            </div>
          )}

          <div className="wizard__section">
            <label className="wizard__label">Dithering</label>
            <div className="wizard__select-wrap">
              <select value={dither} onChange={(e) => setDither(e.target.value)}>
                <option value="none">None</option>
                <option value="floyd-steinberg">Floyd-Steinberg</option>
                <option value="ordered">Ordered (Bayer)</option>
              </select>
            </div>
          </div>

          <button className="wizard__submit" onClick={handleConvert}>
            <Sparkles size={16} strokeWidth={2.5} />
            Create Project
          </button>
        </>
      )}

      <button className="wizard__cancel" onClick={onCancel}>
        Cancel
      </button>
    </div>
  );
}

export default VideoImportWizard;