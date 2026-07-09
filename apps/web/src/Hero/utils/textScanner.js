/**
 * Scans a string and returns an array of coordinate vectors based on pixel density.
 */
export function scanTypography(text, fontStyle, containerWidth, containerHeight, spacing = 8) {
  // Create an isolated offscreen canvas environment
  const offscreen = document.createElement('canvas');
  const ctx = offscreen.getContext('2d', { willReadFrequently: true });
  
  // Set dimensions matching target device frame boundaries
  offscreen.width = containerWidth;
  offscreen.height = containerHeight;
  
  // Render setup using high-contrast black fill for precision scanning
  ctx.fillStyle = '#000000';
  ctx.font = fontStyle;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  
  // Draw typography centered in viewport canvas space
  ctx.fillText(text, containerWidth / 2, containerHeight / 2);
  
  const imgData = ctx.getImageData(0, 0, containerWidth, containerHeight);
  const buffer = imgData.data;
  const coordinates = [];
  
  // Sample the pixel grid at specific spacing intervals
  for (let y = 0; y < containerHeight; y += spacing) {
    for (let x = 0; x < containerWidth; x += spacing) {
      // Index mapping within the Uint8ClampedArray: [R, G, B, Alpha]
      const alphaIndex = ((y * containerWidth) + x) * 4 + 3;
      
      // If alpha threshold is met, extract the coordinate vector
      if (buffer[alphaIndex] > 128) {
        coordinates.push({ x, y });
      }
    }
  }
  
  return coordinates;
}