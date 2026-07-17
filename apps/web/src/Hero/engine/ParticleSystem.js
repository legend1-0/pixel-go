import { Particle, ParticleState } from './Particle';

export class ParticleSystem {
  constructor(engine) {
    this.engine = engine;
    this.particles = [];
    this.poolSize = 3800;
    this.baseColor = '#e8533a';
    this.hoverColor = '#2fd672';
    this.hoveredLetterIndex = -1;
    this.initPool();
  }

  initPool() {
    for (let i = 0; i < this.poolSize; i++) {
      const x = Math.random() * this.engine.width;
      const y = Math.random() * this.engine.height;
      this.particles.push(new Particle(x, y));
    }
  }

  // coords now come from scanTypography as { x, y, letterIndex }[]
generateFormFromCoordinates(coords, { baseColor = '#e8533a', hoverColors = {} } = {}) {
  this.baseColor = baseColor;
  // hoverColors: { [letterIndex]: '#hexColor' } — falls back to a default if a letter isn't listed
  this.hoverColors = hoverColors;
  this.defaultHoverColor = hoverColors.default || '#2fd672';

  const activeCount = Math.min(coords.length, this.poolSize);

  for (let i = 0; i < this.poolSize; i++) {
    const p = this.particles[i];
    if (i < activeCount) {
      p.setTarget(coords[i].x, coords[i].y, ParticleState.MORPHING);
      p.letterIndex = coords[i].letterIndex;
      p.color = baseColor;
      p.wakeUp();
    } else {
      p.state = ParticleState.DISSOLVING;
      p.letterIndex = -1;
    }
  }
}

setHoveredLetter(letterIndex) {
  if (this.hoveredLetterIndex === letterIndex) return;
  this.hoveredLetterIndex = letterIndex;

  for (let i = 0; i < this.poolSize; i++) {
    const p = this.particles[i];
    if (p.letterIndex === -1) continue;

    if (p.letterIndex === letterIndex) {
      // Use this letter's specific color if defined, else the default hover color
      p.color = this.hoverColors[letterIndex] || this.defaultHoverColor;
    } else {
      p.color = this.baseColor;
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
    ctx.globalAlpha = 1.0;
  }
}