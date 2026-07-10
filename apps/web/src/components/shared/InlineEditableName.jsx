// apps/web/src/components/shared/InlineEditableName.jsx
import { useState } from "react";

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
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") {
            setDraft(value || "");
            setEditing(false);
          }
        }}
        style={{ width: "100%" }}
      />
    );
  }

  return (
    <span
      onClick={(e) => {
        e.stopPropagation();
        setDraft(value || "");
        setEditing(true);
      }}
      title="Click to rename"
      style={{ cursor: "text" }}
    >
      {value || placeholder}
    </span>
  );
}

export default InlineEditableName;