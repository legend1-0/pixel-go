// apps/web/src/components/image-import/ImageImportWizard.jsx
import { useState, useRef, useEffect } from "react";
import { runImagePipeline } from "@pixel-art-studio/media-pipeline";

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
      setSourceImage({ pixels: imageData.data, width: img.width, height: img.height });
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  useEffect(() => {
    if (!sourceImage) return;

    const result = runImagePipeline(sourceImage.pixels, sourceImage.width, sourceImage.height, {
      outputWidth: canvasWidth,
      outputHeight: canvasHeight,
      brightness,
      contrast,
      saturation,
    });

    const canvas = previewCanvasRef.current;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext("2d");
    const imageData = new ImageData(new Uint8ClampedArray(result), canvasWidth, canvasHeight);
    ctx.putImageData(imageData, 0, 0);
  }, [sourceImage, canvasWidth, canvasHeight, brightness, contrast, saturation]);

  const handleConvert = () => {
    const result = runImagePipeline(sourceImage.pixels, sourceImage.width, sourceImage.height, {
      outputWidth: canvasWidth,
      outputHeight: canvasHeight,
      brightness,
      contrast,
      saturation,
    });
    onConvert(new Uint8ClampedArray(result));
  };

  return (
    <div style={{ padding: "24px", maxWidth: "420px" }}>
      <h2>Import Image</h2>
      <p style={{ color: "#666", fontSize: "14px" }}>
        Output size is locked to your current canvas: {canvasWidth}×{canvasHeight}
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

          <button onClick={handleConvert}>Convert &amp; Add as Layer</button>
        </>
      )}

      <button onClick={onCancel} style={{ marginTop: "12px", display: "block" }}>
        Cancel
      </button>
    </div>
  );
}

export default ImageImportWizard;