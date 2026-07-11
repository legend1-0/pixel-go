// apps/web/src/components/timeline/TimelinePanel.jsx
import InlineEditableName from "../shared/InlineEditableName";

function TimelinePanel({
  frames,
  activeFrameIndex,
  onSwitchFrame,
  onAddFrame,
  onDuplicateFrame,
  onDeleteFrame,
  onRenameFrame,
  onionSkinEnabled,
  onToggleOnionSkin,
  isPlaying,
  onTogglePlay,
}) {
  return (
    <div style={{ width: "250px" }}>
      <button onClick={onAddFrame}>+ Add Frame</button>
      <button onClick={onTogglePlay} style={{ marginLeft: "6px" }}>
        {isPlaying ? "⏸ Pause" : "▶ Play"}
       </button>
      <label style={{ display: "block", marginTop: "6px" }}>
        <input
          type="checkbox"
          checked={onionSkinEnabled}
          onChange={(e) => onToggleOnionSkin(e.target.checked)}
        />
        Onion Skin
      </label>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "8px" }}>
        {frames.map((frame, index) => (
          <div
            key={frame.id}
            onClick={() => onSwitchFrame(index)}
            style={{
              padding: "4px",
              border: index === activeFrameIndex ? "2px solid blue" : "1px solid #ccc",
              cursor: "pointer",
              textAlign: "center",
            }}
          >
            <div>
              <InlineEditableName
                value={frame.name}
                placeholder={`Frame ${index + 1}`}
                onChange={(newName) => onRenameFrame(index, newName)}
              />
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDuplicateFrame(index);
              }}
            >
              Duplicate
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteFrame(index);
              }}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TimelinePanel;