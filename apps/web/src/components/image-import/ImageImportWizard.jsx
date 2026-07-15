// apps/web/src/components/image-import/ImageImportWizard.jsx
import { useState, useRef, useEffect, useMemo } from "react";
import {
  runImagePipeline,
  RETRO_PALETTES,
  getRetroPalette,
} from "@pixel-art-studio/media-pipeline";

/**
 * Stage 1 image conversion wizard: import a photo/image, adjust
 * brightness/contrast/saturation, preview the pixelated result live,
 * and convert it into a new layer at the project's canvas resolution.
 */
function ImageImportWizard({ canvasWidth, canvasHeight, onConvert, onCancel }) {
  const [sourceImage, setSourceImage] = useState(null); // { pixels, width, height }
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [saturation, setSaturation] = useState(0);
  const [colorCount, setColorCount] = useState(0); // 0 = no quantization
  const [dither, setDither] = useState("none");
  const [paletteMode, setPaletteMode] = useState("auto"); // 'auto' | 'fixed'
  const [retroPaletteKey, setRetroPaletteKey] = useState("gameboy");
  const [edgeEnhanceAmount, setEdgeEnhanceAmount] = useState(0);
  const [alphaThreshold, setAlphaThreshold] = useState(0);

  const previewCanvasRef = useRef(null);

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
    return runImagePipeline(sourceImage.pixels, sourceImage.width, sourceImage.height, {
      outputWidth: canvasWidth,
      outputHeight: canvasHeight,
      brightness,
      contrast,
      saturation,
      edgeEnhanceAmount,
      colorCount,
      paletteMode,
      fixedPalette: paletteMode === "fixed" ? getRetroPalette(retroPaletteKey) : null,
      dither,
      alphaThreshold,
    });
  }, [
    sourceImage,
    canvasWidth,
    canvasHeight,
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
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext("2d");
    const imageData = new ImageData(
      new Uint8ClampedArray(pipelineResult.pixels),
      canvasWidth,
      canvasHeight,
    );
    ctx.putImageData(imageData, 0, 0);
  }, [pipelineResult, canvasWidth, canvasHeight]);

  const handleConvert = () => {
    if (!pipelineResult) return;
    onConvert(new Uint8ClampedArray(pipelineResult.pixels));
  };

  return (
    <div style={{ padding: "24px", maxWidth: "420px" }}>
      <h2>Import Image</h2>
      <p style={{ color: "#666", fontSize: "14px" }}>
        Output size is locked to your current canvas: {canvasWidth}×
        {canvasHeight}
      </p>

      {!sourceImage ? (
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            if (e.target.files[0]) handleFileSelect(e.target.files[0]);
          }}
        />
      ) : (
        <>
          <canvas
            ref={previewCanvasRef}
            style={{
              width: "256px",
              height: "256px",
              imageRendering: "pixelated",
              border: "1px solid #ccc",
              background: "#f0f0f0",
              display: "block",
              marginBottom: "12px",
            }}
          />

          <label style={{ display: "block", marginBottom: "8px" }}>
            Brightness:{" "}
            <input
              type="range"
              min="-100"
              max="100"
              value={brightness}
              onChange={(e) => setBrightness(parseInt(e.target.value, 10))}
            />
          </label>
          <label style={{ display: "block", marginBottom: "8px" }}>
            Contrast:{" "}
            <input
              type="range"
              min="-100"
              max="100"
              value={contrast}
              onChange={(e) => setContrast(parseInt(e.target.value, 10))}
            />
          </label>
          <label style={{ display: "block", marginBottom: "12px" }}>
            Saturation:{" "}
            <input
              type="range"
              min="-100"
              max="100"
              value={saturation}
              onChange={(e) => setSaturation(parseInt(e.target.value, 10))}
            />
          </label>
          <label style={{ display: "block", marginBottom: "8px" }}>
            Edge Enhance:{" "}
            <input
              type="range"
              min="0"
              max="3"
              step="0.5"
              value={edgeEnhanceAmount}
              onChange={(e) => setEdgeEnhanceAmount(parseFloat(e.target.value))}
            />
          </label>

          <label style={{ display: "block", marginBottom: "8px" }}>
            Palette:{" "}
            <select
              value={paletteMode}
              onChange={(e) => setPaletteMode(e.target.value)}
            >
              <option value="auto">Auto-extract from image</option>
              <option value="fixed">Fixed retro palette</option>
            </select>
          </label>

          {paletteMode === "fixed" && (
            <label style={{ display: "block", marginBottom: "8px" }}>
              Retro Palette:{" "}
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
            </label>
          )}

          {paletteMode === "auto" && (
            <label style={{ display: "block", marginBottom: "8px" }}>
              Colors (0 = off):{" "}
              <input
                type="number"
                min="0"
                max="64"
                value={colorCount}
                onChange={(e) => {
                  const value = parseInt(e.target.value, 10) || 0;
                  setColorCount(Math.min(64, Math.max(0, value)));
                }}
                style={{ width: "70px" }}
              />
            </label>
          )}

          {colorCount > 0 && (
            <label style={{ display: "block", marginBottom: "12px" }}>
              Dithering:{" "}
              <select
                value={dither}
                onChange={(e) => setDither(e.target.value)}
              >
                <option value="none">None</option>
                <option value="floyd-steinberg">Floyd-Steinberg</option>
                <option value="ordered">Ordered (Bayer)</option>
              </select>
            </label>
          )}

          <label style={{ display: "block", marginBottom: "12px" }}>
            Alpha Threshold (0 = off):{" "}
            <input
              type="number"
              min="0"
              max="255"
              value={alphaThreshold}
              onChange={(e) => {
                const value = parseInt(e.target.value, 10) || 0;
                setAlphaThreshold(Math.min(255, Math.max(0, value)));
              }}
              style={{ width: "70px" }}
            />
          </label>

          {pipelineResult?.palette && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "4px",
                marginBottom: "12px",
              }}
            >
              {pipelineResult.palette.map((color, i) => (
                <div
                  key={i}
                  style={{
                    width: "20px",
                    height: "20px",
                    backgroundColor: `rgb(${color[0]}, ${color[1]}, ${color[2]})`,
                    border: "1px solid #999",
                  }}
                />
              ))}
            </div>
          )}
          <button onClick={handleConvert}>Convert &amp; Add as Layer</button>
        </>
      )}

      <button
        onClick={onCancel}
        style={{ marginTop: "12px", display: "block" }}
      >
        Cancel
      </button>
    </div>
  );
}

export default ImageImportWizard;
