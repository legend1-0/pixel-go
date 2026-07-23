// apps/web/src/components/how-to-use/HowToUsePage.jsx
import { NavLink } from "react-router";
import './HowToUsePage.css'
const SHORTCUTS = [
  ["P", "Pencil"],
  ["E", "Eraser"],
  ["I", "Eyedropper"],
  ["B", "Bucket Fill"],
  ["L", "Line"],
  ["C", "Circle"],
  ["R", "Rectangle"],
  ["Ctrl/Cmd + Z", "Undo"],
  ["Ctrl/Cmd + Y", "Redo"],
  ["Scroll wheel", "Zoom"],
  ["Shift + drag", "Pan"],
];

export default function HowToUsePage() {
  return (
  <div className="container">
      <NavLink to="/" className='back-btn'>← Back home</NavLink>
    <div className="instruction">
      <h1 style={{ marginTop: "16px" }}>How to Use Pixel Art Studio</h1>

      <h2 style={{ marginTop: "32px", fontSize: "18px" }}>Keyboard Shortcuts</h2>
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "12px" }}>
        <tbody>
          {SHORTCUTS.map(([key, action]) => (
            <tr key={action} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: "8px 0", fontWeight: "bold", width: "160px" }}>{key}</td>
              <td style={{ padding: "8px 0" }}>{action}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 style={{ marginTop: "32px", fontSize: "18px" }}>Quick Start</h2>
      <ol style={{ lineHeight: 1.8 }}>
        <li>Click "Launch Studio" to open your Project Library</li>
        <li>Click "New Project" and pick a canvas size</li>
        <li>Use the toolbar on the left to draw, the panels on the right for layers/palette</li>
        <li>Use the timeline at the bottom to add frames and animate</li>
        <li>Export your work as PNG, Sprite Sheet, GIF, APNG, or a full Project File</li>
      </ol>
    </div>
  </div>
  );
}