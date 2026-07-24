// apps/web/src/Hero/TaglineReveal.jsx
import "./TaglineReveal.css";

const DEFAULT_COLORS = ["#e8533a", "#2fd672", "#29adff", "#ffec27", "#c026d3", "#ff77a8"];

/**
 * A tagline made of individual words that cascade into view on load
 * (staggered fade + rise, like dominoes settling), each word lifting
 * and tinting to its own accent color on hover.
 * @param {string[]} words
 * @param {string[]} [colors] - cycles through this list, one color per word index
 */
export default function TaglineReveal({ words, colors = DEFAULT_COLORS }) {
  return (
    <div className="tagline-reveal">
      {words.map((word, i) => (
        <span
          key={i}
          className="tagline-reveal__word"
          style={{
            animationDelay: `${0.4 + i * 0.06}s`,
            "--hover-color": colors[i % colors.length],
          }}
        >
          {word}
        </span>
      ))}
    </div>
  );
}