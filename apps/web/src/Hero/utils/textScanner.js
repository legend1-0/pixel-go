/**
 * Scans a string and returns an array of coordinate vectors based on pixel density.
 */export function scanTypography(
  text,
  fontStyle,
  containerWidth,
  containerHeight,
  spacing = 8,
  position = { xRatio: 0.5, yRatio: 0.5 } // NEW: where the text sits, 0-1 of canvas
) {
  const offscreen = document.createElement('canvas');
  const ctx = offscreen.getContext('2d', { willReadFrequently: true });

  offscreen.width = containerWidth;
  offscreen.height = containerHeight;

  ctx.fillStyle = '#000000';
  ctx.font = fontStyle;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';

  const lines = text.split('\n');
  const lineHeight = parseInt(fontStyle.match(/\d+/)[0]) * 1.1;

  const centerX = containerWidth * position.xRatio;
  const centerY = containerHeight * position.yRatio;

  const letterBoxes = [];
  let globalLetterIndex = 0;

  lines.forEach((line, lineIdx) => {
    const lineY = centerY + (lineIdx - (lines.length - 1) / 2) * lineHeight;
    ctx.fillText(line, centerX, lineY);

    // Walk the line manually so we know each character's x-range
    const totalWidth = ctx.measureText(line).width;
    let cursorX = centerX - totalWidth / 2;
    const halfLH = lineHeight / 2;

    for (const char of line) {
      const charWidth = ctx.measureText(char).width;
      if (char !== ' ') {
        letterBoxes.push({
          index: globalLetterIndex,
          char,
          x0: cursorX,
          x1: cursorX + charWidth,
          y0: lineY - halfLH,
          y1: lineY + halfLH,
        });
      }
      cursorX += charWidth;
      globalLetterIndex++;
    }
  });

  const imgData = ctx.getImageData(0, 0, containerWidth, containerHeight);
  const buffer = imgData.data;
  const coordinates = [];

  const findLetterIndex = (x, y) => {
    for (const box of letterBoxes) {
      if (x >= box.x0 && x <= box.x1 && y >= box.y0 && y <= box.y1) return box.index;
    }
    return -1;
  };

  for (let y = 0; y < containerHeight; y += spacing) {
    for (let x = 0; x < containerWidth; x += spacing) {
      const alphaIndex = ((y * containerWidth) + x) * 4 + 3;
      if (buffer[alphaIndex] > 128) {
        coordinates.push({ x, y, letterIndex: findLetterIndex(x, y) });
      }
    }
  }

  // NOTE: return shape changed from a plain array to { coordinates, letterBoxes }
  return { coordinates, letterBoxes };
}