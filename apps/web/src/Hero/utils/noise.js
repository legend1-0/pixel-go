// Lightweight, deterministic 2D procedural noise generator
const PERMUTATION = new Uint8Array(512);
const p = Array.from({ length: 256 }, (_, i) => i).sort(() => Math.random() - 0.5);
for (let i = 0; i < 512; i++) {
  PERMUTATION[i] = p[i & 255];
}

function fade(t) {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function lerp(t, a, b) {
  return a + t * (b - a);
}

function grad2d(hash, x, y) {
  const h = hash & 7;
  const u = h < 4 ? x : y;
  const v = h < 4 ? y : x;
  return ((h & 1) ? -u : u) + ((h & 2) ? -2.0 * v : 2.0 * v);
}

export function noise2D(x, y) {
  const X = Math.floor(x) & 255;
  const Y = Math.floor(y) & 255;

  x -= Math.floor(x);
  y -= Math.floor(y);

  const u = fade(x);
  const v = fade(y);

  const aa = PERMUTATION[PERMUTATION[X] + Y];
  const ab = PERMUTATION[PERMUTATION[X] + Y + 1];
  const ba = PERMUTATION[PERMUTATION[X] + 1 + Y];
  const bb = PERMUTATION[PERMUTATION[X] + 1 + Y + 1];

  return lerp(v, lerp(u, grad2d(aa, x, y), grad2d(ba, x - 1, y)),
                 lerp(u, grad2d(ab, x, y - 1), grad2d(bb, x - 1, y - 1)));
}