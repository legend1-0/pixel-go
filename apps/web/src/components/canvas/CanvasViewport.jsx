// apps/web/src/components/canvas/CanvasViewport.jsx
import { useRef, useEffect, useState, useCallback } from "react";
import {
  createDocument,
  DrawPixelCommand,
  HistoryManager,
} from "@pixel-art-studio/engine";

function CanvasViewport() {
  const canvasRef = useRef(null);
  const docRef = useRef(null);
  const historyRef = useRef(null); // holds HistoryManager, no re-renders needed
  const lastPaintedCell = useRef(null); // { gridX, gridY } or null
  const [zoom, setZoom] = useState(10);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const isDrawing = useRef(false); // separate from panning-drag
  const lastMouse = useRef({ x: 0, y: 0 });
const [activeTool, setActiveTool] = useState('pencil'); // 'pencil' | 'eraser'
  useEffect(() => {
    docRef.current = createDocument({ width: 32, height: 32 });
    historyRef.current = new HistoryManager();
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
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
        ctx.fillStyle = isEven ? "#e0e0e0" : "#f5f5f5";
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
  const drawCell = (x, y) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const doc = docRef.current;
    const layer = doc.frames[0].layers[0];

    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    const isEven = (x + y) % 2 === 0;
    ctx.fillStyle = isEven ? "#e0e0e0" : "#f5f5f5";
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

    ctx.restore();
  };
  useEffect(() => {
    draw();
  }, [draw]);
  // ctrl + Z to undo
useEffect(() => {
    const handleKeyDown = (e) => {
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;

      if (isCtrlOrCmd && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        const command = historyRef.current.undoStack[historyRef.current.undoStack.length - 1];
        historyRef.current.undo(docRef.current);
        if (command) drawCell(command.x, command.y);
      } else if (isCtrlOrCmd && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        historyRef.current.redo(docRef.current);
        const command = historyRef.current.undoStack[historyRef.current.undoStack.length - 1];
        if (command) drawCell(command.x, command.y);
      } else if (e.key === 'p') {
        setActiveTool('pencil');
      } else if (e.key === 'e') {
        setActiveTool('eraser');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [draw, activeTool]);

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
  const getActiveColor = () => (activeTool === 'eraser' ? [0, 0, 0, 0] : [30, 30, 30, 255]);
const paintLine = (x0, y0, x1, y1) => {
    // Bresenham's line algorithm — walks every grid cell between two points
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x1 >= x0 ? 1 : -1;
    const sy = y1 >= y0 ? 1 : -1;
    let x = x0;
    let y = y0;
    let err = dx - dy;

    const doc = docRef.current;

    while (true) {
      if (x >= 0 && y >= 0 && x < doc.meta.width && y < doc.meta.height) {
        const layer = doc.frames[0].layers[0];
        const command = new DrawPixelCommand(layer, x, y, doc.meta.width, getActiveColor());
        historyRef.current.execute(command, doc);
      }

      if (x === x1 && y === y1) break;

      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x += sx;
      }
      if (e2 < dx) {
        err += dx;
        y += sy;
      }
    }

    draw();
  };
const paintAt = (clientX, clientY) => {
    const doc = docRef.current;
    const { gridX, gridY } = screenToGrid(clientX, clientY);

    if (gridX < 0 || gridY < 0 || gridX >= doc.meta.width || gridY >= doc.meta.height) return;

    if (lastPaintedCell.current) {
      paintLine(lastPaintedCell.current.gridX, lastPaintedCell.current.gridY, gridX, gridY);
    } else {
      const layer = doc.frames[0].layers[0];
      const command = new DrawPixelCommand(layer, gridX, gridY, doc.meta.width, getActiveColor());
      historyRef.current.execute(command, doc);
      draw();
    }

    lastPaintedCell.current = { gridX, gridY };
  };
  const handleWheel = (e) => {
    e.preventDefault();
    const zoomSpeed = 0.001;
    const newZoom = Math.min(
      40,
      Math.max(2, zoom * (1 - e.deltaY * zoomSpeed)),
    );
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
    lastPaintedCell.current = null;
  };

  return (
    <canvas
      ref={canvasRef}
      width={500}
      height={500}
      style={{
        border: "1px solid #333",
        imageRendering: "pixelated",
        cursor: "crosshair",
      }}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    />
  );
}

export default CanvasViewport;
