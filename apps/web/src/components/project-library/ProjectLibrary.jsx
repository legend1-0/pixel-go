// apps/web/src/components/project-library/ProjectLibrary.jsx
import InlineEditableName from "../shared/InlineEditableName";
import "./ProjectLibrary.css";
import { Orbit } from "lucide-react";

function ProjectLibrary({ projects, onOpen, onDelete, onRename, onNewProject }) {
  return (
    <div className="ProjectLibrary">
      <div className="ProjectLibrary-header">
        <div className="ProjectLibrary-title">
          <h2>Working...</h2>
          <p>
            Continue from where you last stopped.
            <br />
            Everything stays on your browser.
          </p>
        </div>

        <button className="ProjectLibrary-new-btn" onClick={onNewProject}>
          New Project
        </button>
      </div>

      {projects.length === 0 ? (
        <p style={{ color: "#999", marginTop: "24px" }}>
          No projects yet — click "New Project" to create your first one.
        </p>
      ) : (
        <div className="Project-grid">
          {projects.map((project) => (
            <div key={project.id} className="Project-Thumbnail-div">
              <Orbit />

              <img
                className="Project-thumbnail-image"
                src={project.thumbnail}
                alt={project.name}
                onClick={() => onOpen(project.id)}
              />

              <InlineEditableName
                value={project.name}
                placeholder="Untitled"
                onChange={(newName) => onRename(project.id, newName)}
              />

              <button className="Project-delete-btn" onClick={() => onDelete(project.id)}>
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ProjectLibrary;