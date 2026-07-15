// packages/media-pipeline/src/image/palette/retroPalettes.js

/**
 * A small library of classic fixed palettes, for "convert into exactly
 * these colors" instead of auto-extracting a palette from the source image.
 * Each entry is an array of [r, g, b] triples.
 */
export const RETRO_PALETTES = {
  gameboy: {
    name: 'Game Boy (DMG)',
    colors: [
      [15, 56, 15],
      [48, 98, 48],
      [139, 172, 15],
      [155, 188, 15],
    ],
  },
  pico8: {
    name: 'PICO-8',
    colors: [
      [0, 0, 0],
      [29, 43, 83],
      [126, 37, 83],
      [0, 135, 81],
      [171, 82, 54],
      [95, 87, 79],
      [194, 195, 199],
      [255, 241, 232],
      [255, 0, 77],
      [255, 163, 0],
      [255, 236, 39],
      [0, 228, 54],
      [41, 173, 255],
      [131, 118, 156],
      [255, 119, 168],
      [255, 204, 170],
    ],
  },
  cga: {
    name: 'CGA (Cyan/Magenta/White)',
    colors: [
      [0, 0, 0],
      [85, 255, 255],
      [255, 85, 255],
      [255, 255, 255],
    ],
  },
  monochrome: {
    name: 'Monochrome',
    colors: [
      [0, 0, 0],
      [255, 255, 255],
    ],
  },
};

/**
 * @param {string} key - one of the RETRO_PALETTES keys
 * @returns {Array<[number, number, number]> | null}
 */
export function getRetroPalette(key) {
  return RETRO_PALETTES[key]?.colors ?? null;
}