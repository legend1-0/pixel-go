// apps/web/src/components/toolbar/Toolbar.jsx

const TOOLS = [
  { id: "pencil", label: "✏️ Pencil", shortcut: "P" },
  { id: "eraser", label: "🧽 Eraser", shortcut: "E" },
  { id: "eyedropper", label: "💧 Eyedropper", shortcut: "I" },
  { id: "bucket", label: "🪣 Bucket Fill", shortcut: "B" },
  { id: "line", label: "📏 Line", shortcut: "L" },
  { id: "circle", label: "⭕ Circle", shortcut: "C" },
  { id: "rectangle", label: "⬛ Rectangle", shortcut: "R" },
];

function Toolbar({ activeTool, onSelectTool }) {
  return (
    <div style={{ display: "flex", gap: "6px", marginBottom: "8px", flexWrap: "wrap" }}>
      {TOOLS.map((tool) => (
        <button
          key={tool.id}
          onClick={() => onSelectTool(tool.id)}
          title={`${tool.label} (${tool.shortcut})`}
          style={{
            padding: "6px 10px",
            border: activeTool === tool.id ? "2px solid blue" : "1px solid #ccc",
            fontWeight: activeTool === tool.id ? "bold" : "normal",
            cursor: "pointer",
          }}
        >
          {tool.label}
        </button>
      ))}
    </div>
  );
}

export default Toolbar;