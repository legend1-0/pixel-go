import { TrailParticle } from './BrushStroke';

export class CursorBrush {
  constructor(engine) {
    this.engine = engine;
    this.trail = [];
    this.lastMouseX = null;
    this.lastMouseY = null;
  }

  update(dt) {
    const { mouse } = this.engine;

    // Initialize position trackers on first sweep
    if (this.lastMouseX === null || this.lastMouseY === null) {
      this.lastMouseX = mouse.x;
      this.lastMouseY = mouse.y;
      return;
    }

    // Calculate mouse velocity vectors across frame boundaries
    const deltaX = mouse.x - this.lastMouseX;
    const deltaY = mouse.y - this.lastMouseY;
    const velocity = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Spawn trail particles based on mouse movement speed
    if (velocity > 1.5) {
      const spawnCount = Math.min(Math.floor(velocity * 0.4), 6);
      for (let i = 0; i < spawnCount; i++) {
        // Interpolate along the movement vector to prevent gaps during fast tracking
        const ratio = i / spawnCount;
        const interpX = this.lastMouseX + deltaX * ratio;
        const interpY = this.lastMouseY + deltaY * ratio;
        
        this.trail.push(new TrailParticle(interpX, interpY, deltaX, deltaY));
      }
    }

    // Update active particles and cull dead instances to keep memory lean
    for (let i = this.trail.length - 1; i >= 0; i--) {
      const p = this.trail[i];
      p.update(dt);
      if (p.alpha <= 0) {
        this.trail.splice(i, 1);
      }
    }

    // Cache historical metrics for the next tick pass
    this.lastMouseX = mouse.x;
    this.lastMouseY = mouse.y;
  }

  render(ctx) {
    // 1st Pass: Subtle underlying bloom glow
    ctx.save();
    ctx.shadowBlur = 12;
    ctx.shadowColor = 'rgba(255, 255, 255, 0.25)';
    
    for (let i = 0; i < this.trail.length; i++) {
      this.trail[i].render(ctx);
    }
    ctx.restore();
    
    // 2nd Pass: Crisp, sharp overlay blocks
    for (let i = 0; i < this.trail.length; i++) {
      this.trail[i].render(ctx);
    }
  }
}