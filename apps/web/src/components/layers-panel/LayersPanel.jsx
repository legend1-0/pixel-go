// apps/web/src/components/layers-panel/LayersPanel.jsx
import { Plus, Eye, EyeOff, Trash2 } from "lucide-react";
import InlineEditableName from "../shared/InlineEditableName";
import "./LayersPanel.css";

function LayersPanel({
  layers,
  activeLayerIndex,
  onSelectLayer,
  onAddLayer,
  onDeleteLayer,
  onToggleVisibility,
  onSetOpacity,
  onRenameLayer,
}) {
  return (
    <div className="layers-panel">
      <div className="layers-panel__header">
        <span className="layers-panel__title">Layers</span>
        <button className="layers-panel__add" onClick={onAddLayer} aria-label="Add layer" title="Add layer">
          <Plus size={16} strokeWidth={2.5} />
        </button>
      </div>

      <div className="layers-panel__list">
        {layers.map((layer, index) => (
          <div
            key={layer.id}
            onClick={() => onSelectLayer(index)}
            className={`layer-row${index === activeLayerIndex ? " layer-row--active" : ""}`}
          >
            <div className="layer-row__top">
              <button
                className={`layer-row__icon-btn${!layer.visible ? " layer-row__icon-btn--hidden" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleVisibility(index);
                }}
                aria-label={layer.visible ? "Hide layer" : "Show layer"}
                title={layer.visible ? "Hide layer" : "Show layer"}
              >
                {layer.visible ? <Eye size={15} strokeWidth={2.5} /> : <EyeOff size={15} strokeWidth={2.5} />}
              </button>

              <div className="layer-row__name">
                <InlineEditableName
                  value={layer.name}
                  placeholder={`Layer ${index + 1}`}
                  onChange={(newName) => onRenameLayer(index, newName)}
                />
              </div>

              <button
                className="layer-row__icon-btn layer-row__icon-btn--delete"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteLayer(index);
                }}
                aria-label="Delete layer"
                title="Delete layer"
              >
                <Trash2 size={15} strokeWidth={2.5} />
              </button>
            </div>

            <div className="layer-row__opacity">
              <span className="layer-row__opacity-label">Opacity</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={layer.opacity}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => onSetOpacity(index, parseFloat(e.target.value))}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default LayersPanel;