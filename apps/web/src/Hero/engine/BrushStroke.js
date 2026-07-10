export class TrailParticle {
  constructor(x, y, vx, vy, color = 'rgba(20,20,20,0.35)') {
    this.x = x;
    this.y = y;
    
    // Inherit fractional momentum vectors from mouse velocity
    this.vx = vx * 0.25 + (Math.random() - 0.5) * 1.5;
    this.vy = vy * 0.25 + (Math.random() - 0.5) * 1.5;
    
    this.size = 2 + Math.random() * 3;
    this.alpha = 1.0;
    // Elegant, premium rapid decay envelope
    this.decay = 0.03 + Math.random() * 0.04; 
    this.color = color;
  }

  update(dt) {
    // Standard physics updates
    this.x += this.vx;
    this.y += this.vy;
    
    // Add micro-drag friction friction
    this.vx *= 0.95;
    this.vy *= 0.95;
    
    // Linear alpha decay over runtime lifespan
    this.alpha -= this.decay * (dt * 60);
  }

  render(ctx) {
    if (this.alpha <= 0) return;
    
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;
    
    // Crisp pixel geometry definition
    ctx.fillRect(
      Math.floor(this.x - this.size / 2),
      Math.floor(this.y - this.size / 2),
      Math.floor(this.size),
      Math.floor(this.size)
    );
    
    ctx.restore();
  }
}