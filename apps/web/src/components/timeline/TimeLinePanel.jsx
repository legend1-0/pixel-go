// apps/web/src/components/timeline/TimelinePanel.jsx
import { Plus, Play, Pause, Layers, Copy, Trash2 } from "lucide-react";
import InlineEditableName from "../shared/InlineEditableName";
import "./TimelinePanel.css";

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
    <div className="timeline-panel">
      <div className="timeline-panel__controls">
        <button className="timeline-panel__btn" onClick={onAddFrame}>
          <Plus size={15} strokeWidth={2.5} />
          Frame
        </button>

        <button className="timeline-panel__btn timeline-panel__btn--play" onClick={onTogglePlay}>
          {isPlaying ? <Pause size={15} strokeWidth={2.5} /> : <Play size={15} strokeWidth={2.5} />}
          {isPlaying ? "Pause" : "Play"}
        </button>

        <button
          className={`timeline-panel__btn timeline-panel__btn--onion${
            onionSkinEnabled ? " timeline-panel__btn--active" : ""
          }`}
          onClick={() => onToggleOnionSkin(!onionSkinEnabled)}
        >
          <Layers size={15} strokeWidth={2.5} />
          Onion Skin
        </button>
      </div>

      <div className="timeline-panel__strip">
        {frames.map((frame, index) => (
          <div
            key={frame.id}
            onClick={() => onSwitchFrame(index)}
            className={`frame-chip${index === activeFrameIndex ? " frame-chip--active" : ""}`}
          >
            <div className="frame-chip__name">
              <InlineEditableName
                value={frame.name}
                placeholder={`Frame ${index + 1}`}
                onChange={(newName) => onRenameFrame(index, newName)}
              />
            </div>
            <div className="frame-chip__actions">
              <button
                className="frame-chip__icon-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicateFrame(index);
                }}
                aria-label="Duplicate frame"
                title="Duplicate frame"
              >
                <Copy size={13} strokeWidth={2.5} />
              </button>
              <button
                className="frame-chip__icon-btn frame-chip__icon-btn--delete"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteFrame(index);
                }}
                aria-label="Delete frame"
                title="Delete frame"
              >
                <Trash2 size={13} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TimelinePanel;