import { NavLink } from "react-router";
import { useWindowSize } from "./hooks/useWindowSize";
import { PixelEngine } from "./engine/PixelEngine";
import { useState, useEffect, useRef, useCallback } from "react";
import { isMobileDevice } from "../utils/isMobileDevice";
import "./Hero.css";

export default function HeroContainer() {
  const [isMobile] = useState(() => isMobileDevice());
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const headerRef = useRef(null);
  const { width, height, dpr } = useWindowSize();

  useEffect(() => {
    if (canvasRef.current) {
      engineRef.current = new PixelEngine(canvasRef.current, {
        width,
        height,
        dpr,
        enableBackgroundGrid: true,
        enableCursorBrush: true,
        enableParticleText: false,
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

  // Track mouse position for header background effect
  const handleMouseMove = useCallback((e) => {
    if (headerRef.current) {
      const rect = headerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      headerRef.current.style.setProperty("--mouse-x", `${x}%`);
      headerRef.current.style.setProperty("--mouse-y", `${y}%`);
    }
  }, []);

  // Track mouse leave to determine exit direction
  const handleMouseLeave = useCallback((e) => {
    if (headerRef.current) {
      const rect = headerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      headerRef.current.style.setProperty("--mouse-x", `${x}%`);
      headerRef.current.style.setProperty("--mouse-y", `${y}%`);
    }
  }, []);

  return (
    <div className="heroWrapper">
      <canvas ref={canvasRef} className="mainCanvas" />

      <div className="heroContent">
        <div
          ref={headerRef}
          className="Header-sub"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <div className="content">
            <span className="bitcount">
              <span className="bit-letter">P</span>
              <span className="bit-letter">i</span>
              <span className="bit-letter">x</span>
              <span className="bit-letter">e</span>
              <span className="bit-letter">l</span>
              <span> </span>
              <span className="bit-letter">G</span>
              <span className="bit-letter">o</span>
            </span>
          </div>
        </div>

        <span className="subtitle">
          Bring Retro Back to Life a Pixel at a Time
        </span>

        {isMobile && (
          <p className="mobile-message">
            Pixel Go is optimized for desktop creation studio.
          </p>
        )}

        <div className="button-div">
          <a
            href="https://github.com/legend1-0/pixel-go"
            target="_blank"
            rel="noreferrer"
          >
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
    </div>
  );
}