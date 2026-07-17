// apps/web/src/components/shared/InlineEditableName.jsx
import { useState } from "react";
import "./InlineEditableName.css";

/**
 * Click-to-edit text. Shows plain text; clicking turns it into an input.
 * Enter or blur commits the change, Escape cancels.
 */
function InlineEditableName({ value, onChange, placeholder = "Untitled" }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || "");

  const commit = () => {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed && trimmed !== value) {
      onChange(trimmed);
    } else {
      setDraft(value || "");
    }
  };

  if (editing) {
    return (
      <div className="inline-editable-name">
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onFocus={(e) => e.target.select()}
          onBlur={commit}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") {
              setDraft(value || "");
              setEditing(false);
            }
          }}
          className="inline-editable-name__input"
        />
      </div>
    );
  }

  const isPlaceholder = !value;

  return (
    <div className="inline-editable-name">
      <span
        onClick={(e) => {
          e.stopPropagation();
          setDraft(value || "");
          setEditing(true);
        }}
        title="Click to rename"
        className={`inline-editable-name__display${
          isPlaceholder ? " inline-editable-name__display--placeholder" : ""
        }`}
      >
        {value || placeholder}
      </span>
    </div>
  );
}

export default InlineEditableName;