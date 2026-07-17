// apps/web/src/components/new-project/NewProjectDialog.jsx
import { useState } from "react";
import {
  Grid3x3,
  MoveHorizontal,
  MoveVertical,
  Sparkles,
  X,
} from "lucide-react";
import "./NewProjectDialog.css";

const PRESETS = [16, 32, 64, 128];
// Icon size scales with canvas size — a real signal, not decoration
const ICON_SIZE_BY_PRESET = { 16: 20, 32: 24, 64: 30, 128: 34 };

function NewProjectDialog({ onCreate, onClose  }) {
  const [width, setWidth] = useState(32);
  const [height, setHeight] = useState(32);

  const activePreset = width === height ? width : null;

  return (
    <div className="new-project-dialog">
      <div className="new-project-dialog__header">
        <div>
          <p className="new-project-dialog__eyebrow">New Canvas</p>
          <h2 className="new-project-dialog__title">
            Start a Pixel Art Project
          </h2>
        </div>
        <button
          onClick={() => onClose(false)}
        aria-label="Close dialog"
        className="new-project-dialog__close"
        >
          <X />
        </button>
      </div>

      <label className="new-project-dialog__label">Quick sizes</label>
      <div className="new-project-dialog__presets">
        {PRESETS.map((size) => (
          <button
            key={size}
            className={`new-project-dialog__preset${
              activePreset === size ? " new-project-dialog__preset--active" : ""
            }`}
            onClick={() => {
              setWidth(size);
              setHeight(size);
            }}
          >
            <Grid3x3 size={ICON_SIZE_BY_PRESET[size]} strokeWidth={2.5} />
            {size}×{size}
          </button>
        ))}
      </div>

      <div className="new-project-dialog__fields">
        <div className="new-project-dialog__field">
          <label className="new-project-dialog__label">Width</label>
          <div className="new-project-dialog__input-wrap">
            <MoveHorizontal size={16} strokeWidth={2.5} />
            <input
              type="number"
              min="1"
              max="512"
              value={width}
              onChange={(e) => setWidth(parseInt(e.target.value, 10) || 1)}
              className="new-project-dialog__input"
            />
          </div>
        </div>
        <div className="new-project-dialog__field">
          <label className="new-project-dialog__label">Height</label>
          <div className="new-project-dialog__input-wrap">
            <MoveVertical size={16} strokeWidth={2.5} />
            <input
              type="number"
              min="1"
              max="512"
              value={height}
              onChange={(e) => setHeight(parseInt(e.target.value, 10) || 1)}
              className="new-project-dialog__input"
            />
          </div>
        </div>
      </div>

      <button
        className="new-project-dialog__create"
        onClick={() => onCreate(width, height)}
      >
        <Sparkles size={16} strokeWidth={2.5} />
        Create Project
      </button>
    </div>
  );
}

export default NewProjectDialog;
