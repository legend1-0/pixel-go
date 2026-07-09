// apps/web/src/components/new-project/NewProjectDialog.jsx
import { useState } from "react";

const PRESETS = [16, 32, 64, 128];

function NewProjectDialog({ onCreate }) {
  const [width, setWidth] = useState(32);
  const [height, setHeight] = useState(32);

  return (
    <div style={{ padding: "24px", maxWidth: "320px" }}>
      <h2>New Pixel Art Project</h2>

      <p>Quick sizes:</p>
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
        {PRESETS.map((size) => (
          <button
            key={size}
            onClick={() => {
              setWidth(size);
              setHeight(size);
            }}
          >
            {size}×{size}
          </button>
        ))}
      </div>

      <div style={{ marginBottom: "8px" }}>
        <label>
          Width:{" "}
          <input
            type="number"
            min="1"
            max="512"
            value={width}
            onChange={(e) => setWidth(parseInt(e.target.value, 10) || 1)}
            style={{ width: "70px" }}
          />
        </label>
      </div>
      <div style={{ marginBottom: "16px" }}>
        <label>
          Height:{" "}
          <input
            type="number"
            min="1"
            max="512"
            value={height}
            onChange={(e) => setHeight(parseInt(e.target.value, 10) || 1)}
            style={{ width: "70px" }}
          />
        </label>
      </div>

      <button onClick={() => onCreate(width, height)}>Create Project</button>
    </div>
  );
}

export default NewProjectDialog;