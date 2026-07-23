import { NavLink } from "react-router";
import { useWindowSize } from "./hooks/useWindowSize";
import { PixelEngine } from "./engine/PixelEngine";
import { useState, useEffect, useRef } from "react"; // add useState to your existing import
import { isMobileDevice } from "../utils/isMobileDevice";
import DesktopOnlyNotice from "./DesktopOnlyNotice";
import "./Hero.css";

const TEXT_POSITION = { xRatio: 0.5, yRatio: 0.45 };
const FONT_SIZE_RATIO = 4;
const GAP_BELOW_TEXT = 20;

// Pure function — no state needed, just recompute on every render
function getButtonTop(width, height) {
  const fontSize = Math.min(width * FONT_SIZE_RATIO, 170);
  const lineHeight = fontSize * 1.1;
  const textCenterY = height * TEXT_POSITION.yRatio;
  const textBottomY = textCenterY + lineHeight / 2;
  return textBottomY + GAP_BELOW_TEXT;
}

export default function HeroContainer() {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const { width, height, dpr } = useWindowSize();
const [blocked] = useState(() => isMobileDevice()); // computed once on mount, never re-checked on resize
  // Derived directly during render — always in sync, no extra render pass
  const buttonTop = getButtonTop(width, height);

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

if (blocked) {
    return <DesktopOnlyNotice />;
  }

  return (
    <div className="heroWrapper">
      <canvas ref={canvasRef} className="mainCanvas" />

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
