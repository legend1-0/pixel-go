// apps/web/src/components/layers-panel/LayersPanel.jsx
import InlineEditableName from "../shared/InlineEditableName";

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
    <div style={{ width: "200px" }}>
      <button onClick={onAddLayer}>+ Add Layer</button>
      {layers.map((layer, index) => (
        <div
          key={layer.id}
          onClick={() => onSelectLayer(index)}
          style={{
            padding: "6px",
            marginTop: "6px",
            border: index === activeLayerIndex ? "2px solid blue" : "1px solid #ccc",
            cursor: "pointer",
          }}
        >
          <div>
            <InlineEditableName
              value={layer.name}
              placeholder={`Layer ${index + 1}`}
              onChange={(newName) => onRenameLayer(index, newName)}
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteLayer(index);
              }}
              style={{ marginLeft: "8px" }}
            >
              ✕
            </button>
          </div>
          <label>
            <input
              type="checkbox"
              checked={layer.visible}
              onChange={() => onToggleVisibility(index)}
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
              onChange={(e) => onSetOpacity(index, parseFloat(e.target.value))}
            />
          </label>
        </div>
      ))}
    </div>
  );
}

export default LayersPanel;