// apps/web/src/components/canvas/CanvasViewport.jsx
import { useRef, useEffect, useState, useCallback } from "react";
import {
  createDocument,
  createLayer,
  DrawPixelCommand,
  BucketFillCommand,
  LineCommand,
  CircleCommand,
  RectangleCommand,
  HistoryManager,
} from "@pixel-art-studio/engine";

function CanvasViewport() {
  const canvasRef = useRef(null);
  const docRef = useRef(null);
  const historyRef = useRef(null); // holds HistoryManager, no re-renders needed
  const lastPaintedCell = useRef(null); // { gridX, gridY } or null

  const [zoom, setZoom] = useState(10);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [layersState, setLayersState] = useState([]);
  const isDragging = useRef(false);
  const isDrawing = useRef(false); // separate from panning-drag

  const lastMouse = useRef({ x: 0, y: 0 });
  const lineStart = useRef(null); // { gridX, gridY } while dragging a line, else null
  const circleCenter = useRef(null);
  const rectStart = useRef(null);
  const [activeTool, setActiveTool] = useState("pencil"); // 'pencil' | 'eraser'
  const [activeColor, setActiveColor] = useState([30, 30, 30, 255]); // [r, g, b, a]
  const [paletteState, setPaletteState] = useState([]);
  const [activeLayerIndex, setActiveLayerIndex] = useState(0);
  const getActiveLayer = () =>
    docRef.current.frames[0].layers[activeLayerIndex];
  const getActiveColor = () =>
    activeTool === "eraser" ? [0, 0, 0, 0] : activeColor;

useEffect(() => {
    docRef.current = createDocument({ width: 32, height: 32 });
    historyRef.current = new HistoryManager();
    setLayersState([...docRef.current.frames[0].layers]);
    setPaletteState([...docRef.current.palette]);
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const doc = docRef.current;
    if (!doc) return;

    const layers = doc.frames[0].layers;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // checkerboard background, drawn once
    for (let y = 0; y < doc.meta.height; y++) {
      for (let x = 0; x < doc.meta.width; x++) {
        const isEven = (x + y) % 2 === 0;
        ctx.fillStyle = isEven ? "#e0e0e0" : "#f5f5f5";
        ctx.fillRect(x, y, 1, 1);
      }
    }

    // composite every visible layer, bottom to top
    for (const layer of layers) {
      if (!layer.visible) continue;

      for (let y = 0; y < doc.meta.height; y++) {
        for (let x = 0; x < doc.meta.width; x++) {
          const index = (y * doc.meta.width + x) * 4;
          const a = layer.pixels[index + 3];
          if (a > 0) {
            const r = layer.pixels[index];
            const g = layer.pixels[index + 1];
            const b = layer.pixels[index + 2];
            const effectiveAlpha = (a / 255) * layer.opacity;
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${effectiveAlpha})`;
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }
    }

    ctx.restore();
  }, [zoom, pan]);

  const drawCell = (x, y) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const doc = docRef.current;
    const layers = doc.frames[0].layers;

    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    const isEven = (x + y) % 2 === 0;
    ctx.fillStyle = isEven ? "#e0e0e0" : "#f5f5f5";
    ctx.fillRect(x, y, 1, 1);

    for (const layer of layers) {
      if (!layer.visible) continue;
      const index = (y * doc.meta.width + x) * 4;
      const a = layer.pixels[index + 3];
      if (a > 0) {
        const r = layer.pixels[index];
        const g = layer.pixels[index + 1];
        const b = layer.pixels[index + 2];
        const effectiveAlpha = (a / 255) * layer.opacity;
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${effectiveAlpha})`;
        ctx.fillRect(x, y, 1, 1);
      }
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

      if (isCtrlOrCmd && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        const command =
          historyRef.current.undoStack[historyRef.current.undoStack.length - 1];
        historyRef.current.undo(docRef.current);
        if (command && command.x !== undefined) {
          drawCell(command.x, command.y);
        } else {
          draw();
        }
      } else if (
        isCtrlOrCmd &&
        (e.key === "y" || (e.key === "z" && e.shiftKey))
      ) {
        e.preventDefault();
        historyRef.current.redo(docRef.current);
        const command =
          historyRef.current.undoStack[historyRef.current.undoStack.length - 1];
        if (command && command.x !== undefined) {
          drawCell(command.x, command.y);
        } else {
          draw();
        }
      } else if (e.key === "p") {
        setActiveTool("pencil");
      } else if (e.key === "e") {
        setActiveTool("eraser");
      } else if (e.key === "i") {
        setActiveTool("eyedropper");
      } else if (e.key === "b") {
        setActiveTool("bucket");
      } else if (e.key === "l") {
        setActiveTool("line");
      } else if (e.key === "c") {
        setActiveTool("circle");
      } else if (e.key === "r") {
        setActiveTool("rectangle");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [draw, activeTool]);
  // shape drawing
  const drawCirclePreview = (centerX, centerY, currentX, currentY) => {
    draw(); // clear old preview by redrawing committed state

    const radius = Math.round(
      Math.sqrt((currentX - centerX) ** 2 + (currentY - centerY) ** 2),
    );

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    const [r, g, b, a] = getActiveColor();
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a / 255})`;

    // reuse the same midpoint circle walk, just for preview, no Command involved
    let x = radius,
      y = 0,
      err = 0;
    const plot = (px, py) => ctx.fillRect(px, py, 1, 1);

    while (x >= y) {
      plot(centerX + x, centerY + y);
      plot(centerX + y, centerY + x);
      plot(centerX - y, centerY + x);
      plot(centerX - x, centerY + y);
      plot(centerX - x, centerY - y);
      plot(centerX - y, centerY - x);
      plot(centerX + y, centerY - x);
      plot(centerX + x, centerY - y);

      y += 1;
      if (err <= 0) err += 2 * y + 1;
      if (err > 0) {
        x -= 1;
        err -= 2 * x + 1;
      }
    }

    ctx.restore();
  };
  const drawRectanglePreview = (x0, y0, x1, y1) => {
    draw(); // clear old preview

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    const [r, g, b, a] = getActiveColor();
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a / 255})`;

    const minX = Math.min(x0, x1);
    const maxX = Math.max(x0, x1);
    const minY = Math.min(y0, y1);
    const maxY = Math.max(y0, y1);

    for (let x = minX; x <= maxX; x++) {
      ctx.fillRect(x, minY, 1, 1);
      ctx.fillRect(x, maxY, 1, 1);
    }
    for (let y = minY; y <= maxY; y++) {
      ctx.fillRect(minX, y, 1, 1);
      ctx.fillRect(maxX, y, 1, 1);
    }

    ctx.restore();
  };
  const drawLinePreview = (x0, y0, x1, y1) => {
    draw(); // redraw the real committed state first, clearing any old preview

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    const [r, g, b, a] = getActiveColor();
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a / 255})`;

    // reuse the same Bresenham walk, just for visual preview, no Command involved
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x1 >= x0 ? 1 : -1;
    const sy = y1 >= y0 ? 1 : -1;
    let x = x0,
      y = y0,
      err = dx - dy;

    while (true) {
      ctx.fillRect(x, y, 1, 1);
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

    ctx.restore();
  };

  const addLayer = () => {
    const doc = docRef.current;
    const newLayer = createLayer(
      `layer-${Date.now()}`,
      doc.meta.width,
      doc.meta.height,
      `Layer ${doc.frames[0].layers.length + 1}`,
    );
    doc.frames[0].layers.push(newLayer);
    setActiveLayerIndex(doc.frames[0].layers.length - 1);
    setLayersState([...doc.frames[0].layers]); // new array reference triggers re-render
    draw();
  };
  const deleteLayer = (index) => {
    const doc = docRef.current;

    if (doc.frames[0].layers.length <= 1) {
      alert("You can't delete the last remaining layer.");
      return;
    }

    doc.frames[0].layers.splice(index, 1);

    // if the deleted layer was active, or came before the active one,
    // adjust activeLayerIndex so it still points at a valid layer
    setActiveLayerIndex((prev) => {
      if (index === prev) return Math.max(0, prev - 1);
      if (index < prev) return prev - 1;
      return prev;
    });

    setLayersState([...doc.frames[0].layers]);
    draw();
  };
  const toggleLayerVisibility = (index) => {
    const doc = docRef.current;
    doc.frames[0].layers[index].visible = !doc.frames[0].layers[index].visible;
    setLayersState([...doc.frames[0].layers]);
    draw();
  };

  const setLayerOpacity = (index, opacity) => {
    const doc = docRef.current;
    doc.frames[0].layers[index].opacity = opacity;
    setLayersState([...doc.frames[0].layers]);
    draw();
  };
const saveColorToPalette = () => {
    const doc = docRef.current;
    const alreadyExists = doc.palette.some(
      (c) => c[0] === activeColor[0] && c[1] === activeColor[1] && c[2] === activeColor[2] && c[3] === activeColor[3],
    );
    if (alreadyExists) return; // avoid duplicate swatches

    doc.palette.push(activeColor);
    setPaletteState([...doc.palette]);
  };

  const removeColorFromPalette = (index) => {
    const doc = docRef.current;
    doc.palette.splice(index, 1);
    setPaletteState([...doc.palette]);
  };
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
        const layer = getActiveLayer();
        const command = new DrawPixelCommand(
          layer,
          x,
          y,
          doc.meta.width,
          getActiveColor(),
        );
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

    if (
      gridX < 0 ||
      gridY < 0 ||
      gridX >= doc.meta.width ||
      gridY >= doc.meta.height
    )
      return;

    if (activeTool === "eyedropper") {
      const layer = getActiveLayer();
      const index = (gridY * doc.meta.width + gridX) * 4;
      const sampled = [
        layer.pixels[index],
        layer.pixels[index + 1],
        layer.pixels[index + 2],
        layer.pixels[index + 3],
      ];
      if (sampled[3] > 0) setActiveColor(sampled); // only if not fully transparent
      return; // don't fall through to drawing logic
    }
    if (activeTool === "bucket") {
      const layer = getActiveLayer();
      const command = new BucketFillCommand(
        layer,
        gridX,
        gridY,
        doc.meta.width,
        doc.meta.height,
        getActiveColor(),
      );
      historyRef.current.execute(command, doc);
      draw(); // full redraw — bucket fill can touch many cells, not just one
      lastPaintedCell.current = { gridX, gridY };
      return;
    }
    if (lastPaintedCell.current) {
      paintLine(
        lastPaintedCell.current.gridX,
        lastPaintedCell.current.gridY,
        gridX,
        gridY,
      );
    } else {
      const layer = getActiveLayer();
      const command = new DrawPixelCommand(
        layer,
        gridX,
        gridY,
        doc.meta.width,
        getActiveColor(),
      );
      historyRef.current.execute(command, doc);
      draw();
    }

    lastPaintedCell.current = { gridX, gridY };
  };
  const rgbaToHex = ([r, g, b]) => {
    const toHex = (n) => n.toString(16).padStart(2, "0");
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };
  const hexToRgba = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return [r, g, b, 255];
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
      isDragging.current = true;
      lastMouse.current = { x: e.clientX, y: e.clientY };
      return;
    }
    if (activeTool === "circle") {
      const { gridX, gridY } = screenToGrid(e.clientX, e.clientY);
      circleCenter.current = { gridX, gridY };
      return;
    }
    if (activeTool === "line") {
      const { gridX, gridY } = screenToGrid(e.clientX, e.clientY);
      lineStart.current = { gridX, gridY };
      return;
    }
    if (activeTool === "rectangle") {
      const { gridX, gridY } = screenToGrid(e.clientX, e.clientY);
      rectStart.current = { gridX, gridY };
      return;
    }

    isDrawing.current = true;
    paintAt(e.clientX, e.clientY);
  };

  const handleMouseMove = (e) => {
    if (isDragging.current) {
      const dx = e.clientX - lastMouse.current.x;
      const dy = e.clientY - lastMouse.current.y;
      lastMouse.current = { x: e.clientX, y: e.clientY };
      setPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
      return;
    }
    if (activeTool === "circle" && circleCenter.current) {
      const { gridX, gridY } = screenToGrid(e.clientX, e.clientY);
      drawCirclePreview(
        circleCenter.current.gridX,
        circleCenter.current.gridY,
        gridX,
        gridY,
      );
      return;
    }
    if (activeTool === "rectangle" && rectStart.current) {
      const { gridX, gridY } = screenToGrid(e.clientX, e.clientY);
      drawRectanglePreview(
        rectStart.current.gridX,
        rectStart.current.gridY,
        gridX,
        gridY,
      );
      return;
    }

    if (activeTool === "line" && lineStart.current) {
      const { gridX, gridY } = screenToGrid(e.clientX, e.clientY);
      drawLinePreview(
        lineStart.current.gridX,
        lineStart.current.gridY,
        gridX,
        gridY,
      );
      return;
    }

    if (isDrawing.current) {
      paintAt(e.clientX, e.clientY);
    }
  };

  const handleMouseUp = (e) => {
    if (activeTool === "line" && lineStart.current) {
      const doc = docRef.current;
      const { gridX, gridY } = screenToGrid(e.clientX, e.clientY);
      const layer = getActiveLayer();
      const command = new LineCommand(
        layer,
        lineStart.current.gridX,
        lineStart.current.gridY,
        gridX,
        gridY,
        doc.meta.width,
        doc.meta.height,
        getActiveColor(),
      );
      historyRef.current.execute(command, doc);
      draw();
      lineStart.current = null;
    }

    isDragging.current = false;
    isDrawing.current = false;
    lastPaintedCell.current = null;

    //circle
    if (activeTool === "circle" && circleCenter.current) {
      const doc = docRef.current;
      const { gridX, gridY } = screenToGrid(e.clientX, e.clientY);
      const radius = Math.round(
        Math.sqrt(
          (gridX - circleCenter.current.gridX) ** 2 +
            (gridY - circleCenter.current.gridY) ** 2,
        ),
      );
      const layer = getActiveLayer();
      const command = new CircleCommand(
        layer,
        circleCenter.current.gridX,
        circleCenter.current.gridY,
        radius,
        doc.meta.width,
        doc.meta.height,
        getActiveColor(),
      );
      historyRef.current.execute(command, doc);
      draw();
      circleCenter.current = null;
    }
    //rectangle
    if (activeTool === "rectangle" && rectStart.current) {
      const doc = docRef.current;
      const { gridX, gridY } = screenToGrid(e.clientX, e.clientY);
      const layer = getActiveLayer();
      const command = new RectangleCommand(
        layer,
        rectStart.current.gridX,
        rectStart.current.gridY,
        gridX,
        gridY,
        doc.meta.width,
        doc.meta.height,
        getActiveColor(),
      );
      historyRef.current.execute(command, doc);
      draw();
      rectStart.current = null;
    }
  };

  return (
    <div style={{ display: "flex", gap: "16px" }}>
      <div>
        <input
          type="color"
          value={rgbaToHex(activeColor)}
          onChange={(e) => setActiveColor(hexToRgba(e.target.value))}
          style={{ marginBottom: "8px", display: "block" }}
        />
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
      </div>

      <div style={{ width: "200px" }}>
        <button onClick={addLayer}>+ Add Layer</button>
        {layersState.map((layer, index) => (
          <div
            key={layer.id}
            onClick={() => setActiveLayerIndex(index)}
            style={{
              padding: "6px",
              marginTop: "6px",
              border:
                index === activeLayerIndex
                  ? "2px solid blue"
                  : "1px solid #ccc",
              cursor: "pointer",
            }}
          >
            <div>
              {layer.name}
              <button
                onClick={(e) => {
                  e.stopPropagation(); // prevent the row's onClick (setActiveLayerIndex) from also firing
                  deleteLayer(index);
                }}
                style={{ marginLeft: "8px" }}
              >
                ✕
              </button>
            </div>
            <div>{layer.name}</div>
            <label>
              <input
                type="checkbox"
                checked={layer.visible}
                onChange={() => toggleLayerVisibility(index)}
              />
              Visible
            </label>
            <br />
            <label>
              Opacity:
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={layer.opacity}
                onChange={(e) =>
                  setLayerOpacity(index, parseFloat(e.target.value))
                }
              />
            </label>
          </div>
        ))}
      </div>
    <div style={{ width: '200px' }}>
        <button onClick={saveColorToPalette}>+ Save Current Color</button>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px' }}>
          {paletteState.map((color, index) => (
            <div
              key={index}
              onClick={() => setActiveColor(color)}
              onDoubleClick={() => removeColorFromPalette(index)}
              title="Click to use, double-click to remove"
              style={{
                width: '24px',
                height: '24px',
                backgroundColor: `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${color[3] / 255})`,
                border: '1px solid #999',
                cursor: 'pointer',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default CanvasViewport;
