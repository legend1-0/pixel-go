// apps/web/src/Hero/ArcText.jsx
import { useState } from "react";
import "./ArcText.css";

const DEFAULT_COLORS = ["#e8533a", "#2fd672", "#29adff", "#ffec27", "#c026d3", "#ff77a8"];

/**
 * Renders a list of words along an upward-bowing arc (like a rainbow),
 * each word individually hoverable with its own color.
 * @param {string[]} words
 * @param {number} [radius] - arc radius in px — bigger = flatter curve
 * @param {number} [arcDegrees] - total angular spread of the arc
 * @param {string[]} [colors] - cycles through this list, one color per word index
 */
export default function ArcText({ words, radius = 280, arcDegrees = 140, colors = DEFAULT_COLORS }) {
  const [hoveredIndex, setHoveredIndex] = useState(-1);

  const startAngle = -90 - arcDegrees / 2; // -90deg = straight up from the pivot
  const step = words.length > 1 ? arcDegrees / (words.length - 1) : 0;

  return (
    <div className="arc-text" style={{ height: `${radius}px` }}>
      {words.map((word, i) => {
        const angleDeg = startAngle + step * i;
        const angleRad = (angleDeg * Math.PI) / 180;
        const x = radius * Math.cos(angleRad);
        const y = radius * Math.sin(angleRad); // negative near the top of the arc → moves upward
        const rotation = angleDeg + 90; // keeps each word tangent to the curve

        const isHovered = hoveredIndex === i;
        const scale = isHovered ? 1.15 : 1;

        return (
          <span
            key={i}
            className="arc-text__word"
            style={{
              transform: `translate(${x}px, ${y}px) rotate(${rotation}deg) scale(${scale})`,
              color: isHovered ? colors[i % colors.length] : "#141414",
            }}
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(-1)}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
}