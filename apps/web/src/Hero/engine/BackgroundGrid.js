import { noise2D } from '../utils/noise';

export class BackgroundGrid {
  constructor(engine) {
    this.engine = engine;
    this.cellSize = 24; // Pixel scale grid dimension
    this.time = 0;
    
    // Performance metrics
    this.maxOpacity = 0.07;
    this.minOpacity = 0.01;
  }

  update(dt) {
    // Clean framerate independent time accumulation
    this.time += dt * 0.25; 
  }

  render(ctx) {
    const { width, height, mouse } = this.engine;
    
    ctx.save();
    
    // Draw crisp pixel cells down the matrix lanes
    for (let x = 0; x < width; x += this.cellSize) {
      for (let y = 0; y < height; y += this.cellSize) {
        
        // Compute structural baseline noise mapping
        const noiseVal = noise2D(x * 0.003 + this.time, y * 0.003 + this.time);
        const normalizedNoise = (noiseVal + 1) * 0.5; // Map to 0-1 range
        
        // Interactive proximity calculations (Mouse Magnetic Distortion)
        const dx = mouse.x - (x + this.cellSize / 2);
        const dy = mouse.y - (y + this.cellSize / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);
        const activeRadius = 220;
        
        let localOpacity = this.minOpacity + normalizedNoise * (this.maxOpacity - this.minOpacity);
        let sizeModifier = 0;

        if (distance < activeRadius) {
          const proximityFactor = 1 - (distance / activeRadius);
          // High elegant ease curve for modern responsive feel
          const smoothProximity = proximityFactor * proximityFactor;
          
          localOpacity += smoothProximity * 0.12;
          sizeModifier = smoothProximity * 2.5;
        }

        // Apply visual properties
        ctx.fillStyle = `rgba(245, 245, 247, ${localOpacity})`;
        
        // Render block centered relative to its structural cell frame
        const currentSize = 2 + sizeModifier;
        const renderX = x + (this.cellSize / 2) - (currentSize / 2);
        const renderY = y + (this.cellSize / 2) - (currentSize / 2);
        
        ctx.fillRect(
          Math.floor(renderX), 
          Math.floor(renderY), 
          Math.floor(currentSize), 
          Math.floor(currentSize)
        );
      }
    }
    
    ctx.restore();
  }
}