import { createDocument } from './Document.js';

const doc = createDocument({ name: 'My First Sprite', width: 16, height: 16 });
console.log(doc);
console.log('Pixel array length:', doc.frames[0].layers[0].pixels.length);