// apps/web/src/components/project-library/ProjectLibrary.jsx
import InlineEditableName from "../shared/InlineEditableName";
import "./ProjectLibrary.css";
import { CircleDotDashed, Dot, Image as ImageIcon, Plus, Trash2 } from "lucide-react";

function ProjectLibrary({ projects, onOpen, onDelete, onRename, onNewProject }) {
  return (
    <div className="ProjectLibrary">
      <div className="ProjectLibrary-header">
        <div className="ProjectLibrary-title">
          <p className="ProjectLibrary-eyebrow">Your Projects</p>
          <h2>Continue where you left off</h2>
          <p>Everything stays on your browser, nothing is uploaded.</p>
        </div>

        <button className="ProjectLibrary-new-btn" onClick={onNewProject}>
          {/* <Plus size={16} strokeWidth={2.5} /> */}
          New Project
        </button>
      </div>

      {projects.length === 0 ? (
        <p className="Project-empty">
          No projects yet — click "New Project" to create your first one.
        </p>
      ) : (
        <div className="Project-grid">
          {projects.map((project) => (
            <div key={project.id} className="Project-Thumbnail-div">
              <CircleDotDashed className="card-icon" strokeWidth={3.5} />

              <img
                className="Project-thumbnail-image"
                src={project.thumbnail}
                alt={project.name}
                onClick={() => onOpen(project.id)}
              />

              <div className="Project-Thumbnail-footer">
                <InlineEditableName
                  value={project.name}
                  placeholder="Untitled"
                  onChange={(newName) => onRename(project.id, newName)}
                />

                <button
                  className="Project-delete-btn"
                  onClick={() => onDelete(project.id)}
                  aria-label={`Delete ${project.name || "project"}`}
                  title="Delete project"
                >
                  <Trash2 size={25} strokeWidth={2.5} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ProjectLibrary;