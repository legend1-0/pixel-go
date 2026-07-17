// apps/web/src/components/editor/ExportOptions.jsx
import { useEffect, useRef } from "react";
import {
  Download,
  ImageDownIcon,
  LayoutGrid,
  Film,
  Images,
  FileArchive,
} from "lucide-react";
import "./ExportOptions.css";

const ExportOptions = ({
  exportButton,
  setExportButton,
  exportPNG,
  exportSpriteSheet,
  exportGIF,
  exportAPNG,
  exportProjectFile,
}) => {
  const containerRef = useRef(null);

  // Close the menu when clicking anywhere outside it
  useEffect(() => {
    if (!exportButton) return;

    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setExportButton(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [exportButton, setExportButton]);

  return (
    <div className="export-options" ref={containerRef}>
      <button className="editor-icon-btn" onClick={() => setExportButton(!exportButton)}>
        <Download size={14} strokeWidth={2.5} /> Export
      </button>

      {exportButton && (
        <div className="export-options__menu">
          <button className="editor-icon-btn" onClick={exportPNG}>
            <ImageDownIcon size={14} strokeWidth={2.5} /> PNG
          </button>
          <button className="editor-icon-btn" onClick={exportSpriteSheet}>
            <LayoutGrid size={14} strokeWidth={2.5} /> Sprite Sheet
          </button>
          <button className="editor-icon-btn" onClick={exportGIF}>
            <Film size={14} strokeWidth={2.5} /> GIF
          </button>
          <button className="editor-icon-btn" onClick={exportAPNG}>
            <Images size={14} strokeWidth={2.5} /> APNG
          </button>
          <button className="editor-icon-btn" onClick={exportProjectFile}>
            <FileArchive size={14} strokeWidth={2.5} /> Project File
          </button>
        </div>
      )}
    </div>
  );
};

export default ExportOptions;