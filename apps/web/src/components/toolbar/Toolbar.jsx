// apps/web/src/components/toolbar/Toolbar.jsx
import { Pencil, Eraser, Pipette, PaintBucket, Slash, Circle, Square } from "lucide-react";
import "./Toolbar.css";

const TOOLS = [
  { id: "pencil", label: "Pencil", shortcut: "P", Icon: Pencil },
  { id: "eraser", label: "Eraser", shortcut: "E", Icon: Eraser },
  { id: "eyedropper", label: "Eyedropper", shortcut: "I", Icon: Pipette },
  { id: "bucket", label: "Bucket Fill", shortcut: "B", Icon: PaintBucket },
  { id: "line", label: "Line", shortcut: "L", Icon: Slash },
  { id: "circle", label: "Circle", shortcut: "C", Icon: Circle },
  { id: "rectangle", label: "Rectangle", shortcut: "R", Icon: Square },
];

function Toolbar({ activeTool, onSelectTool }) {
  return (
    <div className="toolbar">
      {TOOLS.map(({ id, label, shortcut, Icon }) => (
        <button
          key={id}
          onClick={() => onSelectTool(id)}
          title={`${label} (${shortcut})`}
          className={`toolbar-btn${activeTool === id ? " toolbar-btn--active" : ""}`}
        >
          <Icon size={16} strokeWidth={2.5} />
          {label}
          <span className="toolbar-btn__shortcut">{shortcut}</span>
        </button>
      ))}
    </div>
  );
}

export default Toolbar;