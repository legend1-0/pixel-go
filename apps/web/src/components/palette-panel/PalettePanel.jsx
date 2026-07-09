// apps/web/src/components/palette-panel/PalettePanel.jsx

function PalettePanel({ palette, onSaveColor, onSelectColor, onRemoveColor }) {
  return (
    <div style={{ width: "200px" }}>
      <button onClick={onSaveColor}>+ Save Current Color</button>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "8px" }}>
        {palette.map((color, index) => (
          <div
            key={index}
            onClick={() => onSelectColor(color)}
            onDoubleClick={() => onRemoveColor(index)}
            title="Click to use, double-click to remove"
            style={{
              width: "24px",
              height: "24px",
              backgroundColor: `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${color[3] / 255})`,
              border: "1px solid #999",
              cursor: "pointer",
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default PalettePanel;