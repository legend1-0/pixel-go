// apps/web/src/components/canvas/CanvasViewport.jsx
import { useRef, useEffect, useState, useCallback } from 'react';
import { createDocument, DrawPixelCommand, HistoryManager } from '@pixel-art-studio/engine';

function CanvasViewport() {
  const canvasRef = useRef(null);
  const docRef = useRef(null);
  const historyRef = useRef(null); // holds HistoryManager, no re-renders needed

  const [zoom, setZoom] = useState(10);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const isDrawing = useRef(false); // separate from panning-drag
  const lastMouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    docRef.current = createDocument({ width: 32, height: 32 });
    historyRef.current = new HistoryManager();
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const doc = docRef.current;
    if (!doc) return;

    const layer = doc.frames[0].layers[0];
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    for (let y = 0; y < doc.meta.height; y++) {
      for (let x = 0; x < doc.meta.width; x++) {
        const isEven = (x + y) % 2 === 0;
        ctx.fillStyle = isEven ? '#e0e0e0' : '#f5f5f5';
        ctx.fillRect(x, y, 1, 1);

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

  // convert a screen mouse position to grid cell coordinates
  const screenToGrid = (clientX, clientY) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const screenX = clientX - rect.left;
    const screenY = clientY - rect.top;
    const gridX = Math.floor((screenX - pan.x) / zoom);
    const gridY = Math.floor((screenY - pan.y) / zoom);
    return { gridX, gridY };
  };

  const paintAt = (clientX, clientY) => {
    const doc = docRef.current;
    const { gridX, gridY } = screenToGrid(clientX, clientY);

    // ignore clicks outside the canvas bounds
    if (gridX < 0 || gridY < 0 || gridX >= doc.meta.width || gridY >= doc.meta.height) return;

    const layer = doc.frames[0].layers[0];
    const command = new DrawPixelCommand(layer, gridX, gridY, doc.meta.width, [30, 30, 30, 255]);
    historyRef.current.execute(command, doc);
    draw();
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const zoomSpeed = 0.001;
    const newZoom = Math.min(40, Math.max(2, zoom * (1 - e.deltaY * zoomSpeed)));
    setZoom(newZoom);
  };

  const handleMouseDown = (e) => {
    if (e.shiftKey) {
      // hold Shift to pan, otherwise draw — simple way to separate the two for now
      isDragging.current = true;
      lastMouse.current = { x: e.clientX, y: e.clientY };
    } else {
      isDrawing.current = true;
      paintAt(e.clientX, e.clientY);
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging.current) {
      const dx = e.clientX - lastMouse.current.x;
      const dy = e.clientY - lastMouse.current.y;
      lastMouse.current = { x: e.clientX, y: e.clientY };
      setPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
    } else if (isDrawing.current) {
      paintAt(e.clientX, e.clientY);
    }
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    isDrawing.current = false;
  };

  return (
    <canvas
      ref={canvasRef}
      width={500}
      height={500}
      style={{ border: '1px solid #333', imageRendering: 'pixelated', cursor: 'crosshair' }}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    />
  );
}

export default CanvasViewport;