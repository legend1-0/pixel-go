// apps/web/src/components/canvas/CanvasViewport.jsx
import { useRef, useEffect, useState, useCallback } from 'react';
import { createDocument } from '@pixel-art-studio/engine';

function CanvasViewport() {
  const canvasRef = useRef(null);
  const docRef = useRef(null); // holds the Document, doesn't need to trigger re-renders

  const [zoom, setZoom] = useState(10); // pixels-per-cell, starts at 10 like before
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });

  // create the document once, keep it in a ref (not state — it doesn't need re-renders)
  useEffect(() => {
    docRef.current = createDocument({ width: 32, height: 32 });
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const doc = docRef.current;
    if (!doc) return;

    const layer = doc.frames[0].layers[0];

    // clear the whole visible canvas before redrawing
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(pan.x, pan.y); // pan
    ctx.scale(zoom, zoom);        // zoom — now "1 unit" = 1 real pixel

    for (let y = 0; y < doc.meta.height; y++) {
      for (let x = 0; x < doc.meta.width; x++) {
        const isEven = (x + y) % 2 === 0;
        ctx.fillStyle = isEven ? '#e0e0e0' : '#f5f5f5';
        ctx.fillRect(x, y, 1, 1); // draw at real coordinates, scale handles the size

        const index = (y * doc.meta.width + x) * 4;
        const a = layer.pixels[index + 3];
        if (a > 0) {
          const r = layer.pixels[index];
          const g = layer.pixels[index + 1];
          const b = layer.pixels[index + 2];
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a / 255})`;
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }

    ctx.restore();
  }, [zoom, pan]);

  useEffect(() => {
    draw();
  }, [draw]);

  const handleWheel = (e) => {
    e.preventDefault();
    const zoomSpeed = 0.001;
    const newZoom = Math.min(40, Math.max(2, zoom * (1 - e.deltaY * zoomSpeed)));
    setZoom(newZoom);
  };

  const handleMouseDown = (e) => {
    isDragging.current = true;
    lastMouse.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current) return;
    const dx = e.clientX - lastMouse.current.x;
    const dy = e.clientY - lastMouse.current.y;
    lastMouse.current = { x: e.clientX, y: e.clientY };
    setPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  return (
    <canvas
      ref={canvasRef}
      width={500}
      height={500}
      style={{ border: '1px solid #333', imageRendering: 'pixelated', cursor: 'grab' }}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    />
  );
}

export default CanvasViewport;