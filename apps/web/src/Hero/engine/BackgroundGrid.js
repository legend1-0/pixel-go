import { noise2D } from '../utils/noise';

export class BackgroundGrid {
  constructor(engine) {
    this.engine = engine;
    this.cellSize = 36; // was 24 — fewer cells to iterate/render per frame
    this.time = 0;

    this.maxOpacity = 0.07;
    this.minOpacity = 0.01;

    // Noise is recomputed only every N frames and cached per cell in between,
    // since it barely changes frame-to-frame at this animation speed anyway.
    this.frameSkip = 2;
    this.frameCount = 0;
    this.noiseCache = new Map();
  }

  update(dt) {
    this.time += dt * 0.25;
    this.frameCount++;
  }

  render(ctx) {
    const { width, height, mouse } = this.engine;
    const shouldRecomputeNoise = this.frameCount % this.frameSkip === 0;

    ctx.save();

    for (let x = 0; x < width; x += this.cellSize) {
      for (let y = 0; y < height; y += this.cellSize) {
        const cacheKey = `${x}_${y}`;

        let normalizedNoise;
        if (shouldRecomputeNoise || !this.noiseCache.has(cacheKey)) {
          const noiseVal = noise2D(x * 0.003 + this.time, y * 0.003 + this.time);
          normalizedNoise = (noiseVal + 1) * 0.5;
          this.noiseCache.set(cacheKey, normalizedNoise);
        } else {
          normalizedNoise = this.noiseCache.get(cacheKey);
        }

        const dx = mouse.x - (x + this.cellSize / 2);
        const dy = mouse.y - (y + this.cellSize / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);
        const activeRadius = 220;

        let localOpacity = this.minOpacity + normalizedNoise * (this.maxOpacity - this.minOpacity);
        let sizeModifier = 0;

        if (distance < activeRadius) {
          const proximityFactor = 1 - (distance / activeRadius);
          const smoothProximity = proximityFactor * proximityFactor;

          localOpacity += smoothProximity * 0.12;
          sizeModifier = smoothProximity * 2.5;
        }

        ctx.fillStyle = `rgba(20,20,20,${localOpacity})`;

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