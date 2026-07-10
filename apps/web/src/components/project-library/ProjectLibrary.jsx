// apps/web/src/components/project-library/ProjectLibrary.jsx
import InlineEditableName from "../shared/InlineEditableName";

function ProjectLibrary({ projects, onOpen, onDelete, onRename }) {
  if (projects.length === 0) return null;

  return (
    <div>
      <h2>Your Projects</h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", marginBottom: "24px" }}>
        {projects.map((project) => (
          <div key={project.id} style={{ border: "1px solid #ccc", padding: "8px", width: "140px" }}>
            <img
              src={project.thumbnail}
              alt={project.name}
              onClick={() => onOpen(project.id)}
              style={{
                width: "100%",
                height: "100px",
                objectFit: "contain",
                imageRendering: "pixelated",
                background: "#f0f0f0",
                cursor: "pointer",
              }}
            />
            <InlineEditableName
              value={project.name}
              placeholder="Untitled"
              onChange={(newName) => onRename(project.id, newName)}
            />
            <button onClick={() => onDelete(project.id)} style={{ display: "block", marginTop: "4px" }}>
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProjectLibrary;