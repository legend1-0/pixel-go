import { NavLink } from "react-router";
import { useWindowSize } from "./hooks/useWindowSize";
import { PixelEngine } from "./engine/PixelEngine";
import { useState, useEffect, useRef } from "react"; // add useState to your existing import
import { isMobileDevice } from "../utils/isMobileDevice";
import ArcText from "./ArcText";
import "./Hero.css";

const TEXT_POSITION = { xRatio: 0.5, yRatio: 0.45 };
const FONT_SIZE_RATIO = 4;
const GAP_BELOW_TEXT = 20;

// Pure function — no state needed, just recompute on every render
const SUBTITLE_GAP = 50;
const SUBTITLE_HEIGHT_ESTIMATE = 24;

function getButtonTop(width, height, showSubtitle) {
  const fontSize = Math.min(width * FONT_SIZE_RATIO, 170);
  const lineHeight = fontSize * 1.1;
  const textCenterY = height * TEXT_POSITION.yRatio;
  const textBottomY = textCenterY + lineHeight / 2;
  const subtitleExtra = showSubtitle ? SUBTITLE_HEIGHT_ESTIMATE + SUBTITLE_GAP : 0;
  return textBottomY + GAP_BELOW_TEXT + subtitleExtra;
}

export default function HeroContainer() {
  const [isMobile] = useState(() => isMobileDevice());
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const { width, height, dpr } = useWindowSize();
  // Derived directly during render — always in sync, no extra render pass
const buttonTop = getButtonTop(width, height, isMobile);
  const subtitleTop = buttonTop - (isMobile ? SUBTITLE_HEIGHT_ESTIMATE + SUBTITLE_GAP : 0);
  useEffect(() => {
    if (canvasRef.current) {
      engineRef.current = new PixelEngine(canvasRef.current, {
        width,
        height,
        dpr,
        text: "Pixel Go",
        textPosition: TEXT_POSITION,
        enableBackgroundGrid: true,
        enableCursorBrush: true,
        enableParticleText: true,
        baseColor: "#e8533a",
        hoverColor: "#c026d3",
      });
    }
    return () => {
      if (engineRef.current) engineRef.current.destroy();
    };
  }, []);

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.resize(width, height, dpr);
    }
  }, [width, height, dpr]);


  return (
    <div className="heroWrapper">
<ArcText words={["Bringing", "Retro", "Back", "To", "Life", "A", "Pixel", "At", "A", "Time"]} />

      <canvas ref={canvasRef} className="mainCanvas" />
{isMobile && (
        <p
          style={{
            position: "absolute",
            top: `${subtitleTop}px`,
            left: "50%",
            transform: "translateX(-50%)",
            textAlign: "center",
            fontSize: "20px",
            fontWeight: 600,
            color: "#45261c",
            margin: 0,
            zIndex: 2,
          }}
        >
          Pixel Go is only available on desktop right now.
        </p>
      )}

      <div className="button-div" style={{ top: `${buttonTop}px` }}>
        <a href="https://github.com/legend1-0/pixel-go">
          <button className="ctaButton btn-github">
            <span className="btnText">GitHub</span>
          </button>
        </a>
        <NavLink to="/projects" end>
          <button className="ctaButton btn-docs">
            <span className="btnText">Launch Studio</span>
          </button>
        </NavLink>
        <NavLink to="/howtouse" end>
          <button className="ctaButton btn-howto">
            <span className="btnText">How to Use</span>
          </button>
        </NavLink>

      </div>
    </div>
  );
}
