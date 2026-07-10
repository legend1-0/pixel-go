export const ParticleState = {
  SLEEPING: 0,
  GROWING: 1,
  ALIVE: 2,
  MORPHING: 3,
  DISSOLVING: 4
};

export class Particle {
  constructor(x, y, color = '#e8533a') {
    // Spatial vectors
    this.x = x;
    this.y = y;
    this.originX = x;
    this.originY = y;
    this.targetX = x;
    this.targetY = y;
    this.vx = 0;
    this.vy = 0;

    // Visual attributes
    this.baseSize = 3;
    this.size = 0;
    this.targetSize = 3;
    this.opacity = 0;
    this.targetOpacity = 0;
    this.color = color;

    // Life-cycle tracking
    this.state = ParticleState.SLEEPING;
    this.life = 0;
    this.maxLife = 1.0;
    this.speedModifier = 0.8 + Math.random() * 0.4;
    this.easeDampening = 0.08 + Math.random() * 0.06;
  }

  setTarget(tx, ty, newState = ParticleState.MORPHING) {
    this.targetX = tx;
    this.targetY = ty;
    this.state = newState;
    this.life = 0;
  }

  wakeUp() {
    if (this.state === ParticleState.SLEEPING) {
      this.state = ParticleState.GROWING;
      this.life = 0;
      this.targetOpacity = 1;
    }
  }

  update(dt, mouse) {
    // --- State-Based Life & Size Orchestration ---
    switch (this.state) {
      case ParticleState.GROWING:
        this.life += dt * this.speedModifier * 2.0;
        this.size += (this.targetSize - this.size) * 0.15;
        this.opacity += (this.targetOpacity - this.opacity) * 0.15;
        if (this.life >= 1.0 || Math.abs(this.size - this.targetSize) < 0.1) {
          this.state = ParticleState.ALIVE;
        }
        break;

      case ParticleState.ALIVE:
        this.size = this.targetSize;
        this.opacity = 1.0;
        break;

      case ParticleState.MORPHING:
        this.life += dt * this.speedModifier;
        this.size = this.targetSize * Math.sin(this.life * Math.PI); // Organic pulse compression
        if (this.life >= 1.0) this.state = ParticleState.ALIVE;
        break;

      case ParticleState.DISSOLVING:
        this.life += dt * this.speedModifier * 2.5;
        this.size += (0 - this.size) * 0.2;
        this.opacity += (0 - this.opacity) * 0.2;
        if (this.size < 0.1) this.state = ParticleState.SLEEPING;
        break;
    }

    // --- Physics Vector Mechanics ---
    // Smooth magnetic spring simulation pulling toward target vectors
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    
    this.vx += dx * this.easeDampening;
    this.vy += dy * this.easeDampening;
    
    // Air resistance/friction deceleration loop
    this.vx *= 0.78;
    this.vy *= 0.78;

    this.x += this.vx;
    this.y += this.vy;

    // --- Interactive Mouse Distortions ---
    const mdx = mouse.x - this.x;
    const mdy = mouse.y - this.y;
    const distance = Math.sqrt(mdx * mdx + mdy * mdy);
    const repulsionRadius = 100;

    if (distance < repulsionRadius) {
      const force = (repulsionRadius - distance) / repulsionRadius;
      const angle = Math.atan2(mdy, mdx);
      
      // Push particles away with an elastic snap
      this.x -= Math.cos(angle) * force * 4;
      this.y -= Math.sin(angle) * force * 4;
    }
  }

  render(ctx) {
    if (this.state === ParticleState.SLEEPING || this.opacity <= 0) return;

    ctx.fillStyle = this.color;
    ctx.globalAlpha = this.opacity;
    
    // Draw rigid, pixel-accurate geometry blocks
    ctx.fillRect(
      Math.floor(this.x - this.size / 2),
      Math.floor(this.y - this.size / 2),
      Math.floor(this.size),
      Math.floor(this.size)
    );
  }
}