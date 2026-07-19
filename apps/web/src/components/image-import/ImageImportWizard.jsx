// apps/web/src/components/image-import/ImageImportWizard.jsx
import { useState, useRef, useEffect, useMemo } from "react";
import { UploadCloud, Sparkles } from "lucide-react";
import {
  runImagePipeline,
  RETRO_PALETTES,
  getRetroPalette,
} from "@pixel-art-studio/media-pipeline";
import "./ImageImportWizard.css";

const SIZE_PRESETS = [16, 32, 64, 128];

function ImageImportWizard({ canvasWidth, canvasHeight, onConvert, onCancel }) {
  const [sourceImage, setSourceImage] = useState(null);
  const [destination, setDestination] = useState("layer");
  const [customWidth, setCustomWidth] = useState(canvasWidth);
  const [customHeight, setCustomHeight] = useState(canvasHeight);

  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [saturation, setSaturation] = useState(0);
  const [edgeEnhanceAmount, setEdgeEnhanceAmount] = useState(0);
  const [colorCount, setColorCount] = useState(0);
  const [paletteMode, setPaletteMode] = useState("auto");
  const [retroPaletteKey, setRetroPaletteKey] = useState("gameboy");
  const [dither, setDither] = useState("none");
  const [alphaThreshold, setAlphaThreshold] = useState(0);

  const previewCanvasRef = useRef(null);

  const outputWidth = destination === "new-project" ? customWidth : canvasWidth;
  const outputHeight =
    destination === "new-project" ? customHeight : canvasHeight;
  const showDitherControl =
    paletteMode === "fixed" || (paletteMode === "auto" && colorCount > 0);

  const handleFileSelect = (file) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = img.width;
      tempCanvas.height = img.height;
      const ctx = tempCanvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, img.width, img.height);
      setSourceImage({
        pixels: imageData.data,
        width: img.width,
        height: img.height,
      });
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const pipelineResult = useMemo(() => {
    if (!sourceImage) return null;
    return runImagePipeline(
      sourceImage.pixels,
      sourceImage.width,
      sourceImage.height,
      {
        outputWidth,
        outputHeight,
        brightness,
        contrast,
        saturation,
        edgeEnhanceAmount,
        colorCount,
        paletteMode,
        fixedPalette:
          paletteMode === "fixed" ? getRetroPalette(retroPaletteKey) : null,
        dither,
        alphaThreshold,
      },
    );
  }, [
    sourceImage,
    outputWidth,
    outputHeight,
    brightness,
    contrast,
    saturation,
    edgeEnhanceAmount,
    colorCount,
    paletteMode,
    retroPaletteKey,
    dither,
    alphaThreshold,
  ]);

  useEffect(() => {
    if (!pipelineResult) return;
    const canvas = previewCanvasRef.current;
    canvas.width = outputWidth;
    canvas.height = outputHeight;
    const ctx = canvas.getContext("2d");
    const imageData = new ImageData(
      new Uint8ClampedArray(pipelineResult.pixels),
      outputWidth,
      outputHeight,
    );
    ctx.putImageData(imageData, 0, 0);
  }, [pipelineResult, outputWidth, outputHeight]);

  const handleConvert = () => {
    if (!pipelineResult) return;
    onConvert(
      new Uint8ClampedArray(pipelineResult.pixels),
      outputWidth,
      outputHeight,
      destination,
    );
  };

  return (
    <div className="wizard-modal" onClick={onCancel}>
      <div className="wizard" onClick={(e) => e.stopPropagation()}>
        <div className="wizard__header">
          <p className="wizard__eyebrow">Import</p>
          <h2 className="wizard__title">Convert an Image</h2>
        </div>

        {!sourceImage ? (
          <label className="wizard__dropzone">
            <UploadCloud size={28} strokeWidth={2} />
            Click to choose an image
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files[0]) handleFileSelect(e.target.files[0]);
              }}
            />
          </label>
        ) : (
          <>
            <div className="wizard__section">
              <label className="wizard__label">Destination</label>
              <div className="wizard__select-wrap">
                <select
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                >
                  <option value="layer">Add as layer to current project</option>
                  <option value="new-project">Create a new project</option>
                </select>
              </div>
            </div>

            {destination === "layer" ? (
              <p className="wizard__hint">
                Output size locked to your current canvas: {canvasWidth}×
                {canvasHeight}
              </p>
            ) : (
              <div className="wizard__section">
                <label className="wizard__label">Canvas size</label>
                <div className="wizard__presets">
                  {SIZE_PRESETS.map((size) => (
                    <button
                      key={size}
                      className="wizard__preset"
                      onClick={() => {
                        setCustomWidth(size);
                        setCustomHeight(size);
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
                        max="512"
                        value={customWidth}
                        onChange={(e) =>
                          setCustomWidth(parseInt(e.target.value, 10) || 1)
                        }
                      />
                    </div>
                  </div>
                  <div className="wizard__field">
                    <div className="wizard__input-wrap">
                      <input
                        type="number"
                        min="1"
                        max="512"
                        value={customHeight}
                        onChange={(e) =>
                          setCustomHeight(parseInt(e.target.value, 10) || 1)
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="wizard__preview-frame">
              <canvas
                ref={previewCanvasRef}
                className="wizard__preview-canvas"
              />
            </div>
            <button
              onClick={() => {
                setContrast(25);
                setSaturation(20);
                setEdgeEnhanceAmount(1);
                if (paletteMode === "auto") setColorCount(16);
                setDither("floyd-steinberg");
              }}
              style={{ marginBottom: "12px" }}
            >
              ✨ Retro Punch (quick preset)
            </button>
            <div className="wizard__section">
              <div className="wizard__slider-row">
                <label className="wizard__label" style={{ marginBottom: 0 }}>
                  Brightness
                </label>
                <span className="wizard__slider-value">{brightness}</span>
              </div>
              <input
                type="range"
                className="wizard__slider"
                min="-100"
                max="100"
                value={brightness}
                onChange={(e) => setBrightness(parseInt(e.target.value, 10))}
              />

              <div className="wizard__slider-row">
                <label className="wizard__label" style={{ marginBottom: 0 }}>
                  Contrast
                </label>
                <span className="wizard__slider-value">{contrast}</span>
              </div>
              <input
                type="range"
                className="wizard__slider"
                min="-100"
                max="100"
                value={contrast}
                onChange={(e) => setContrast(parseInt(e.target.value, 10))}
              />

              <div className="wizard__slider-row">
                <label className="wizard__label" style={{ marginBottom: 0 }}>
                  Saturation
                </label>
                <span className="wizard__slider-value">{saturation}</span>
              </div>
              <input
                type="range"
                className="wizard__slider"
                min="-100"
                max="100"
                value={saturation}
                onChange={(e) => setSaturation(parseInt(e.target.value, 10))}
              />

              <div className="wizard__slider-row">
                <label className="wizard__label" style={{ marginBottom: 0 }}>
                  Edge Enhance
                </label>
                <span className="wizard__slider-value">
                  {edgeEnhanceAmount}
                </span>
              </div>
              <input
                type="range"
                className="wizard__slider"
                min="0"
                max="3"
                step="0.5"
                value={edgeEnhanceAmount}
                onChange={(e) =>
                  setEdgeEnhanceAmount(parseFloat(e.target.value))
                }
              />
            </div>

            <div className="wizard__section">
              <label className="wizard__label">Palette</label>
              <div className="wizard__select-wrap">
                <select
                  value={paletteMode}
                  onChange={(e) => setPaletteMode(e.target.value)}
                >
                  <option value="auto">Auto-extract from image</option>
                  <option value="fixed">Fixed retro palette</option>
                </select>
              </div>
            </div>

            {paletteMode === "fixed" && (
              <div className="wizard__section">
                <label className="wizard__label">Retro Palette</label>
                <div className="wizard__select-wrap">
                  <select
                    value={retroPaletteKey}
                    onChange={(e) => setRetroPaletteKey(e.target.value)}
                  >
                    {Object.entries(RETRO_PALETTES).map(([key, { name }]) => (
                      <option key={key} value={key}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {paletteMode === "auto" && (
              <div className="wizard__section">
                <div className="wizard__slider-row">
                  <label className="wizard__label" style={{ marginBottom: 0 }}>
                    Colors (0 = off)
                  </label>
                  <span className="wizard__slider-value">{colorCount}</span>
                </div>
                <div className="wizard__input-wrap">
                  <input
                    type="number"
                    min="0"
                    max="64"
                    value={colorCount}
                    onChange={(e) => {
                      const value = parseInt(e.target.value, 10) || 0;
                      setColorCount(Math.min(64, Math.max(0, value)));
                    }}
                  />
                </div>
              </div>
            )}

            {showDitherControl && (
              <div className="wizard__section">
                <label className="wizard__label">Dithering</label>
                <div className="wizard__select-wrap">
                  <select
                    value={dither}
                    onChange={(e) => setDither(e.target.value)}
                  >
                    <option value="none">None</option>
                    <option value="floyd-steinberg">Floyd-Steinberg</option>
                    <option value="ordered">Ordered (Bayer)</option>
                  </select>
                </div>
              </div>
            )}

            {pipelineResult?.palette && (
              <div className="wizard__palette-preview">
                {pipelineResult.palette.map((color, i) => (
                  <div
                    key={i}
                    className="wizard__palette-swatch"
                    style={{
                      backgroundColor: `rgb(${color[0]}, ${color[1]}, ${color[2]})`,
                    }}
                  />
                ))}
              </div>
            )}

            <div className="wizard__section">
              <label className="wizard__label">Alpha Threshold (0 = off)</label>
              <div className="wizard__input-wrap">
                <input
                  type="number"
                  min="0"
                  max="255"
                  value={alphaThreshold}
                  onChange={(e) => {
                    const value = parseInt(e.target.value, 10) || 0;
                    setAlphaThreshold(Math.min(255, Math.max(0, value)));
                  }}
                />
              </div>
            </div>

            <button className="wizard__submit" onClick={handleConvert}>
              <Sparkles size={16} strokeWidth={2.5} />
              {destination === "layer"
                ? "Convert & Add as Layer"
                : "Convert & Create Project"}
            </button>
          </>
        )}

        <button className="wizard__cancel" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}

export default ImageImportWizard;
