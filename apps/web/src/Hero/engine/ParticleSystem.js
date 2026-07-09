import { Particle, ParticleState } from './Particle';

export class ParticleSystem {
  constructor(engine) {
    this.engine = engine;
    this.particles = [];
    this.poolSize = 800; // Cap system size to keep a locked frame budget
    this.initPool();
  }

  initPool() {
    // Instantiate a fixed, continuous block of memory allocation up front
    for (let i = 0; i < this.poolSize; i++) {
      const x = Math.random() * this.engine.width;
      const y = Math.random() * this.engine.height;
      this.particles.push(new Particle(x, y));
    }
  }

  // Generate targets structurally from typography or vector paths
  generateFormFromCoordinates(coords) {
    const activeCount = Math.min(coords.length, this.poolSize);
    
    for (let i = 0; i < this.poolSize; i++) {
      const p = this.particles[i];
      if (i < activeCount) {
        p.setTarget(coords[i].x, coords[i].y, ParticleState.MORPHING);
        p.wakeUp();
      } else {
        p.state = ParticleState.DISSOLVING;
      }
    }
  }

  update(dt) {
    const { mouse } = this.engine;
    for (let i = 0; i < this.poolSize; i++) {
      this.particles[i].update(dt, mouse);
    }
  }

  render(ctx) {
    for (let i = 0; i < this.poolSize; i++) {
      this.particles[i].render(ctx);
    }
    ctx.globalAlpha = 1.0; // Reset canvas context state integrity safely
  }
}