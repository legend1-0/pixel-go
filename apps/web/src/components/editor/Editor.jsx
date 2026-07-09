// apps/web/src/components/editor/Editor.jsx
import { useRef, useEffect, useState, useCallback } from "react";
import {
  createDocument,
  createLayer,
  createFrame,
  DrawPixelCommand,
  BucketFillCommand,
  LineCommand,
  CircleCommand,
  RectangleCommand,
  HistoryManager,
} from "@pixel-art-studio/engine";
import CanvasViewport from "../canvas/CanvasViewport";
import LayersPanel from "../layers-panel/LayersPanel";
import PalettePanel from "../palette-panel/PalettePanel";
import TimelinePanel from "../timeline/TimelinePanel";
import { saveAutosave, loadAutosave } from "../../storage/projectStorage";
import NewProjectDialog from "../new-project/NewProjectDialog";

function Editor() {
  const canvasRef = useRef(null);
  const docRef = useRef(null);
  const historyRef = useRef(null);
  const lastPaintedCell = useRef(null);

  const [zoom, setZoom] = useState(20);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [layersState, setLayersState] = useState([]);
  const [activeFrameIndex, setActiveFrameIndex] = useState(0);
  const [framesState, setFramesState] = useState([]);
  const [activeTool, setActiveTool] = useState("pencil");
  const [activeColor, setActiveColor] = useState([30, 30, 30, 255]);
  const [paletteState, setPaletteState] = useState([]);
  const [activeLayerIndex, setActiveLayerIndex] = useState(0);
  const [onionSkinEnabled, setOnionSkinEnabled] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [checkingAutosave, setCheckingAutosave] = useState(true);
  const [autosaveAvailable, setAutosaveAvailable] = useState(false);
  const [documentReady, setDocumentReady] = useState(false);

  const pendingAutosaveRef = useRef(null);
  const isDragging = useRef(false);
  const isDrawing = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  const lineStart = useRef(null);
  const circleCenter = useRef(null);
  const rectStart = useRef(null);
  const playbackTimeoutRef = useRef(null);

  const getActiveFrame = () => docRef.current.frames[activeFrameIndex];
  const getActiveLayer = () => getActiveFrame().layers[activeLayerIndex];
  const getActiveColor = () =>
    activeTool === "eraser" ? [0, 0, 0, 0] : activeColor;

  const resumeAutosave = () => {
    const saved = pendingAutosaveRef.current;
    docRef.current = saved;
    historyRef.current = new HistoryManager();
    setLayersState([...saved.frames[0].layers]);
    setPaletteState([...saved.palette]);
    setFramesState([...saved.frames]);
    setActiveFrameIndex(0);
    setActiveLayerIndex(0);
    setZoom(10);
    setPan({ x: 0, y: 0 });
    setOnionSkinEnabled(false);
    setIsPlaying(false);
    setDocumentReady(true);
  };

  const startNewProject = (width, height) => {
    docRef.current = createDocument({ width, height });
    historyRef.current = new HistoryManager();
    setLayersState([...docRef.current.frames[0].layers]);
    setPaletteState([...docRef.current.palette]);
    setFramesState([...docRef.current.frames]);
    setActiveFrameIndex(0);
    setActiveLayerIndex(0);
    setZoom(10);
    setPan({ x: 0, y: 0 });
    setOnionSkinEnabled(false);
    setIsPlaying(false);
    setDocumentReady(true);
  };
  useEffect(() => {
    loadAutosave().then((saved) => {
      if (saved) {
        pendingAutosaveRef.current = saved;
        setAutosaveAvailable(true);
      }
      setCheckingAutosave(false);
    });
  }, []);
  useEffect(() => {
    if (!documentReady) return;
    const interval = setInterval(() => {
      if (docRef.current) saveAutosave(docRef.current);
    }, 8000); // every 8 seconds
    return () => clearInterval(interval);
  }, [documentReady]);
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (docRef.current) saveAutosave(docRef.current);
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);
  const drawOnionSkinFrame = (frameIndex, tint, opacityMultiplier) => {
    const doc = docRef.current;
    const frame = doc.frames[frameIndex];
    if (!frame) return;

    const ctx = canvasRef.current.getContext("2d");

    for (const layer of frame.layers) {
      if (!layer.visible) continue;

      for (let y = 0; y < doc.meta.height; y++) {
        for (let x = 0; x < doc.meta.width; x++) {
          const index = (y * doc.meta.width + x) * 4;
          const a = layer.pixels[index + 3];
          if (a > 0) {
            const effectiveAlpha = (a / 255) * layer.opacity * opacityMultiplier;
            ctx.fillStyle = `rgba(${tint[0]}, ${tint[1]}, ${tint[2]}, ${effectiveAlpha})`;
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }
    }
  };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const doc = docRef.current;
    if (!doc) return;

    const layers = getActiveFrame().layers;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    for (let y = 0; y < doc.meta.height; y++) {
      for (let x = 0; x < doc.meta.width; x++) {
        const isEven = (x + y) % 2 === 0;
        ctx.fillStyle = isEven ? "#e0e0e0" : "#f5f5f5";
        ctx.fillRect(x, y, 1, 1);
      }
    }

    if (onionSkinEnabled) {
      drawOnionSkinFrame(activeFrameIndex - 1, [50, 100, 255], 0.35);
      drawOnionSkinFrame(activeFrameIndex + 1, [255, 120, 50], 0.35);
    }

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
  }, [zoom, pan, activeFrameIndex, onionSkinEnabled]);

  const drawCell = (x, y) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const doc = docRef.current;
    if (!doc) return;
    const layers = getActiveFrame().layers;

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

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!docRef.current || !historyRef.current) return;
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
      } else if (isCtrlOrCmd && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
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

  // playback loop
  useEffect(() => {
    if (!isPlaying || !docRef.current) {
      clearTimeout(playbackTimeoutRef.current);
      return;
    }

    const doc = docRef.current;
    const currentFrame = doc.frames[activeFrameIndex];

    playbackTimeoutRef.current = setTimeout(() => {
      const nextIndex = (activeFrameIndex + 1) % doc.frames.length;
      setActiveFrameIndex(nextIndex);
      setLayersState([...doc.frames[nextIndex].layers]);
    }, currentFrame.duration);

    return () => clearTimeout(playbackTimeoutRef.current);
  }, [isPlaying, activeFrameIndex]);

  // ---- frame management ----
  const switchToFrame = (index) => {
    const doc = docRef.current;
    setActiveFrameIndex(index);
    setLayersState([...doc.frames[index].layers]);
    setActiveLayerIndex(0);
  };

  const addFrame = () => {
    const doc = docRef.current;
    const newFrame = createFrame(doc.meta.width, doc.meta.height);
    doc.frames.push(newFrame);
    setFramesState([...doc.frames]);
    setActiveFrameIndex(doc.frames.length - 1);
    setLayersState([...newFrame.layers]);
    setActiveLayerIndex(0);
  };

  const duplicateFrame = (index) => {
    const doc = docRef.current;
    const sourceFrame = doc.frames[index];

    const duplicatedLayers = sourceFrame.layers.map((layer) => ({
      ...layer,
      id: crypto.randomUUID(),
      pixels: new Uint8ClampedArray(layer.pixels),
    }));

    const newFrame = {
      id: crypto.randomUUID(),
      duration: sourceFrame.duration,
      layers: duplicatedLayers,
    };

    doc.frames.splice(index + 1, 0, newFrame);
    setFramesState([...doc.frames]);
    setActiveFrameIndex(index + 1);
    setLayersState([...newFrame.layers]);
    setActiveLayerIndex(0);
  };

  const deleteFrame = (index) => {
    const doc = docRef.current;

    if (doc.frames.length <= 1) {
      alert("You can't delete the last remaining frame.");
      return;
    }

    doc.frames.splice(index, 1);

    let nextActiveIndex = activeFrameIndex;
    if (index === activeFrameIndex) nextActiveIndex = Math.max(0, activeFrameIndex - 1);
    else if (index < activeFrameIndex) nextActiveIndex = activeFrameIndex - 1;

    setActiveFrameIndex(nextActiveIndex);
    setFramesState([...doc.frames]);
    setLayersState([...doc.frames[nextActiveIndex].layers]);
    setActiveLayerIndex(0);
    draw();
  };

  // ---- layer management ----
  const addLayer = () => {
    const doc = docRef.current;
    const frame = getActiveFrame();
    const newLayer = createLayer(
      `Layer ${frame.layers.length + 1}`,
      doc.meta.width,
      doc.meta.height,
    );
    frame.layers.push(newLayer);
    setActiveLayerIndex(frame.layers.length - 1);
    setLayersState([...frame.layers]);
    draw();
  };

  const deleteLayer = (index) => {
    const frame = getActiveFrame();

    if (frame.layers.length <= 1) {
      alert("You can't delete the last remaining layer.");
      return;
    }

    frame.layers.splice(index, 1);

    setActiveLayerIndex((prev) => {
      if (index === prev) return Math.max(0, prev - 1);
      if (index < prev) return prev - 1;
      return prev;
    });

    setLayersState([...frame.layers]);
    draw();
  };

  const toggleLayerVisibility = (index) => {
    const frame = getActiveFrame();
    frame.layers[index].visible = !frame.layers[index].visible;
    setLayersState([...frame.layers]);
    draw();
  };

  const setLayerOpacity = (index, opacity) => {
    const frame = getActiveFrame();
    frame.layers[index].opacity = opacity;
    setLayersState([...frame.layers]);
    draw();
  };

  // ---- palette management ----
  const saveColorToPalette = () => {
    const doc = docRef.current;
    const alreadyExists = doc.palette.some(
      (c) =>
        c[0] === activeColor[0] &&
        c[1] === activeColor[1] &&
        c[2] === activeColor[2] &&
        c[3] === activeColor[3],
    );
    if (alreadyExists) return;

    doc.palette.push(activeColor);
    setPaletteState([...doc.palette]);
  };

  const removeColorFromPalette = (index) => {
    const doc = docRef.current;
    doc.palette.splice(index, 1);
    setPaletteState([...doc.palette]);
  };

  // ---- export ----
  const renderFrameToCanvas = (frame, width, height) => {
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = width;
    exportCanvas.height = height;
    const ctx = exportCanvas.getContext("2d");

    for (const layer of frame.layers) {
      if (!layer.visible) continue;

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const index = (y * width + x) * 4;
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

    return exportCanvas;
  };

  const exportPNG = () => {
    const doc = docRef.current;
    const frame = getActiveFrame();
    const exportCanvas = renderFrameToCanvas(frame, doc.meta.width, doc.meta.height);

    exportCanvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${doc.meta.name || "pixel-art"}.png`;
      link.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  };

  // ---- drawing / tools ----
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

    if (activeTool === "eyedropper") {
      const layer = getActiveLayer();
      const index = (gridY * doc.meta.width + gridX) * 4;
      const sampled = [
        layer.pixels[index],
        layer.pixels[index + 1],
        layer.pixels[index + 2],
        layer.pixels[index + 3],
      ];
      if (sampled[3] > 0) setActiveColor(sampled);
      return;
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
      draw();
      lastPaintedCell.current = { gridX, gridY };
      return;
    }
    if (lastPaintedCell.current) {
      paintLine(lastPaintedCell.current.gridX, lastPaintedCell.current.gridY, gridX, gridY);
    } else {
      const layer = getActiveLayer();
      const command = new DrawPixelCommand(layer, gridX, gridY, doc.meta.width, getActiveColor());
      historyRef.current.execute(command, doc);
      draw();
    }

    lastPaintedCell.current = { gridX, gridY };
  };

  const drawCirclePreview = (centerX, centerY, currentX, currentY) => {
    draw();
    const radius = Math.round(Math.sqrt((currentX - centerX) ** 2 + (currentY - centerY) ** 2));
    const ctx = canvasRef.current.getContext("2d");
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    const [r, g, b, a] = getActiveColor();
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a / 255})`;

    let x = radius, y = 0, err = 0;
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
    draw();
    const ctx = canvasRef.current.getContext("2d");
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
    draw();
    const ctx = canvasRef.current.getContext("2d");
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    const [r, g, b, a] = getActiveColor();
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a / 255})`;

    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x1 >= x0 ? 1 : -1;
    const sy = y1 >= y0 ? 1 : -1;
    let x = x0, y = y0, err = dx - dy;

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

  const handleWheel = (e) => {
    e.preventDefault();
    const zoomSpeed = 0.001;
    const newZoom = Math.min(40, Math.max(2, zoom * (1 - e.deltaY * zoomSpeed)));
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
      drawCirclePreview(circleCenter.current.gridX, circleCenter.current.gridY, gridX, gridY);
      return;
    }
    if (activeTool === "rectangle" && rectStart.current) {
      const { gridX, gridY } = screenToGrid(e.clientX, e.clientY);
      drawRectanglePreview(rectStart.current.gridX, rectStart.current.gridY, gridX, gridY);
      return;
    }
    if (activeTool === "line" && lineStart.current) {
      const { gridX, gridY } = screenToGrid(e.clientX, e.clientY);
      drawLinePreview(lineStart.current.gridX, lineStart.current.gridY, gridX, gridY);
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

    if (activeTool === "circle" && circleCenter.current) {
      const doc = docRef.current;
      const { gridX, gridY } = screenToGrid(e.clientX, e.clientY);
      const radius = Math.round(
        Math.sqrt((gridX - circleCenter.current.gridX) ** 2 + (gridY - circleCenter.current.gridY) ** 2),
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

if (checkingAutosave) {
    return <div style={{ padding: "24px" }}>Loading...</div>;
  }

  if (!documentReady) {
    return (
      <div>
        {autosaveAvailable && (
          <div style={{ padding: "16px", border: "1px solid #999", marginBottom: "16px", maxWidth: "320px" }}>
            <p>We found a previous session.</p>
            <button onClick={resumeAutosave}>Resume Previous Project</button>
          </div>
        )}
        <NewProjectDialog onCreate={startNewProject} />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
      <div>
        <button onClick={exportPNG} style={{ marginBottom: "8px", display: "block" }}>
          Export PNG
        </button>
        <input
          type="color"
          value={rgbaToHex(activeColor)}
          onChange={(e) => setActiveColor(hexToRgba(e.target.value))}
          style={{ marginBottom: "8px", display: "block" }}
        />
        <CanvasViewport
          canvasRef={canvasRef}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        />
      </div>

      <LayersPanel
        layers={layersState}
        activeLayerIndex={activeLayerIndex}
        onSelectLayer={setActiveLayerIndex}
        onAddLayer={addLayer}
        onDeleteLayer={deleteLayer}
        onToggleVisibility={toggleLayerVisibility}
        onSetOpacity={setLayerOpacity}
      />

      <PalettePanel
        palette={paletteState}
        onSaveColor={saveColorToPalette}
        onSelectColor={setActiveColor}
        onRemoveColor={removeColorFromPalette}
      />

      <TimelinePanel
        frames={framesState}
        activeFrameIndex={activeFrameIndex}
        onSwitchFrame={switchToFrame}
        onAddFrame={addFrame}
        onDuplicateFrame={duplicateFrame}
        onDeleteFrame={deleteFrame}
        onionSkinEnabled={onionSkinEnabled}
        onToggleOnionSkin={setOnionSkinEnabled}
        isPlaying={isPlaying}
        onTogglePlay={() => setIsPlaying((prev) => !prev)}
      />
    </div>
  );
}

export default Editor;