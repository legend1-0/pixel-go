import { useEffect, useRef } from "react";
import { NavLink } from "react-router";
import { useWindowSize } from "./hooks/useWindowSize";
import { PixelEngine } from "./engine/PixelEngine";

import styles from "./Hero.module.css";

export default function HeroContainer() {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const { width, height, dpr } = useWindowSize();

  useEffect(() => {
    if (canvasRef.current) {
      engineRef.current = new PixelEngine(canvasRef.current, {
        width,
        height,
        dpr,
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
    <div className={styles.heroWrapper}>
      <canvas ref={canvasRef} className={styles.mainCanvas} />

      <div className={styles.interfaceLayer}>
        <header className={styles.navHeader}>
          <span className={styles.logo}>PX STDO</span>
          <span className={styles.status}>[ SYSTEM ONLINE ]</span>
        </header>

        <main className={styles.heroContent}>
          {/* H1 retained strictly for pristine screen-reader accessibility */}
          <h1 className={styles.srOnly}>PIXEL STUDIO</h1>

          <p className={styles.subtitle}>
            A premium, high-performance canvas environment for precision grid
            designers. Built for the modern web.
          </p>
          <button className={styles.ctaButton}>
            <span className={styles.btnText}>
              <NavLink to="/editor" end>
                Launch Studio
              </NavLink>
            </span>
            <span className={styles.btnBorder} />
          </button>
        </main>
      </div>
    </div>
  );
}
