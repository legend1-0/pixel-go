// apps/web/src/components/palette-panel/PalettePanel.jsx
import { Plus } from "lucide-react";
import "./PalettePanel.css";

function PalettePanel({ palette, onSaveColor, onSelectColor, onRemoveColor }) {
  return (
    <div className="palette-panel">
      <div className="palette-panel__header">
        <span className="palette-panel__title">Palette</span>
        <button
          className="palette-panel__add"
          onClick={onSaveColor}
          aria-label="Save current color"
          title="Save current color"
        >
          <Plus size={16} strokeWidth={2.5} />
        </button>
      </div>

      {palette.length === 0 ? (
        <p className="palette-panel__empty">No saved colors yet.</p>
      ) : (
        <div className="palette-panel__grid">
          {palette.map((color, index) => (
            <div
              key={index}
              className="palette-swatch"
              onClick={() => onSelectColor(color)}
              onDoubleClick={() => onRemoveColor(index)}
              title="Click to use, double-click to remove"
              style={{
                backgroundColor: `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${color[3] / 255})`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default PalettePanel;