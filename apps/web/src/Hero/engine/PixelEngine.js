import gsap from 'gsap';
import { BackgroundGrid } from './BackgroundGrid';
import { ParticleSystem } from './ParticleSystem';
import { CursorBrush } from './CursorBrush';
import { scanTypography } from '../utils/textScanner';

export class PixelEngine {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.width = options.width || window.innerWidth;
    this.height = options.height || window.innerHeight;
    this.dpr = options.dpr || 1;
    
    // Core tracking vectors
    this.mouse = { x: -1000, y: -1000, targetX: -1000, targetY: -1000 };
    this.lastTime = performance.now();
    this.animationFrameId = null;

    // --- Cinematic Camera State Properties ---
    this.camera = {
      scale: 1.08, // Cinematic intro overscan
      parallaxX: 0,
      parallaxY: 0,
      targetParallaxX: 0,
      targetParallaxY: 0
    };

    // Sub-System Attachments
    this.backgroundGrid = new BackgroundGrid(this);
    this.particleSystem = new ParticleSystem(this);
    this.cursorBrush = new CursorBrush(this);

    this.initCanvas();
    this.setupEventListeners();
    this.startLoop();
    this.assembleTypographyForm();
    
    // Fire Cinematic Entrance Timeline
    this.playIntroSequence();
  }

  initCanvas() {
    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.ctx.scale(this.dpr, this.dpr);
  }

  resize(width, height, dpr) {
    this.width = width;
    this.height = height;
    this.dpr = dpr;
    this.initCanvas();
    this.assembleTypographyForm();
  }

  assembleTypographyForm() {
    const fontSize = Math.min(this.width * 0.09, 110);
    const fontStyle = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto`;
    const spacing = this.width < 768 ? 6 : 8; 
    const Hero_Text = "PIXEL Studio"
    const targets = scanTypography(Hero_Text, fontStyle, this.width, this.height, spacing);
    this.particleSystem.generateFormFromCoordinates(targets);
  }
 
  // --- Premium Cinematic Camera Automation ---
  playIntroSequence() {
    // Elegant, deliberate lens scale-down matching high-end hardware styling
    gsap.to(this.camera, {
      scale: 1.0,
      duration: 3.8,
      ease: 'power3.out',
      force3D: true
    });
  }

  setupEventListeners() {
    const handleMouseMove = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.targetX = e.clientX - rect.left;
      this.mouse.targetY = e.clientY - rect.top;

      // --- Calculate Parallax Target Planes ---
      // Map mouse path to a symmetrical normalized deviation range (-0.5 to +0.5)
      const normX = (e.clientX / window.innerWidth) - 0.5;
      const normY = (e.clientY / window.innerHeight) - 0.5;

      // Restrained max bounding shift for sub-pixel accuracy
      this.camera.targetParallaxX = normX * 18; 
      this.camera.targetParallaxY = normY * 18;
    };
    
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    this._cleanupMouse = () => window.removeEventListener('mousemove', handleMouseMove);
  }

  startLoop() {
    const loop = (timestamp) => {
      const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
      this.lastTime = timestamp;

      this.update(dt);
      this.render();

      this.animationFrameId = requestAnimationFrame(loop);
    };
    this.animationFrameId = requestAnimationFrame(loop);
  }

  update(dt) {
    // Dampen standard mouse movement tracking
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.12;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.12;

    // Smoothly interpolate lens displacement planes
    this.camera.parallaxX += (this.camera.targetParallaxX - this.camera.parallaxX) * 0.08;
    this.camera.parallaxY += (this.camera.targetParallaxY - this.camera.parallaxY) * 0.08;

    this.backgroundGrid.update(dt);
    this.particleSystem.update(dt);
    this.cursorBrush.update(dt);
  }

  render() {
    // Clear solid frame color pass
    this.ctx.fillStyle = '#F0F0F0';
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    // --- Render Global Camera Scale Transformations ---
    this.ctx.save();
    
    // Set transformation anchor point precisely at the center of the viewport window
    this.ctx.translate(this.width / 2, this.height / 2);
    this.ctx.scale(this.camera.scale, this.camera.scale);
    this.ctx.translate(-this.width / 2, -this.height / 2);

    // --- Pass 1: Background Depth Layer (Deepest Negative Parallax) ---
    this.ctx.save();
    this.ctx.translate(-this.camera.parallaxX * 0.4, -this.camera.parallaxY * 0.4);
    this.backgroundGrid.render(this.ctx);
    this.ctx.restore();

    // --- Pass 2: Foreground Particle Layer (Positive Parallax Drift) ---
    this.ctx.save();
    this.ctx.translate(this.camera.parallaxX * 0.6, this.camera.parallaxY * 0.6);
    this.particleSystem.render(this.ctx);
    this.ctx.restore();

    // --- Pass 3: Brush Cursor Overlay (Unbound by Camera Space Coordinates) ---
    this.cursorBrush.render(this.ctx);

    // Restore matrix transform state cleanly
    this.ctx.restore();
  }

  destroy() {
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    if (this._cleanupMouse) this._cleanupMouse();
  }
}