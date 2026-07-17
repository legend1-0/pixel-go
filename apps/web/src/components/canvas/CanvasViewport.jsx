// apps/web/src/components/canvas/CanvasViewport.jsx
import "./CanvasViewport.css";

/**
 * Purely presentational — renders the <canvas> element and forwards
 * event handlers. All drawing logic and state lives in Editor.jsx.
 */
function CanvasViewport({ canvasRef, onWheel, onMouseDown, onMouseMove, onMouseUp }) {
  return (
    <canvas
      ref={canvasRef}
      width={500}
      height={500}
      className="canvas-viewport"
      onWheel={onWheel}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    />
  );
}

export default CanvasViewport;