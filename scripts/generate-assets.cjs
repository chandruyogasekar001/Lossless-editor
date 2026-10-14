/**
 * Generates required Microsoft Store AppX / MSIX tile assets and icon.ico
 * using pure Node.js standard libraries (zlib, fs, path).
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// CRC32 table for PNG chunk checksums
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(12 + len);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const typeAndData = chunk.subarray(4, 8 + len);
  chunk.writeUInt32BE(crc32(typeAndData), 8 + len);
  return chunk;
}

function createPng(width, height, bgColor = [11, 14, 20], fgColor = [59, 130, 246]) {
  // 1 filter byte per row + width * 4 bytes RGBA
  const rawData = Buffer.alloc(height * (1 + width * 4));
  let offset = 0;

  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) * 0.35;

  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Draw rounded emblem with accent color
      if (dist <= radius) {
        // Inner play triangle / cut symbol
        const inTriangle = x > cx - radius * 0.3 && x < cx + radius * 0.4 && Math.abs(dy) < (x - (cx - radius * 0.3)) * 0.8;
        if (inTriangle) {
          rawData[offset++] = 255;
          rawData[offset++] = 255;
          rawData[offset++] = 255;
          rawData[offset++] = 255;
        } else {
          rawData[offset++] = fgColor[0];
          rawData[offset++] = fgColor[1];
          rawData[offset++] = fgColor[2];
          rawData[offset++] = 255;
        }
      } else {
        rawData[offset++] = bgColor[0];
        rawData[offset++] = bgColor[1];
        rawData[offset++] = bgColor[2];
        rawData[offset++] = 255;
      }
    }
  }

  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0; // Deflate
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // Interlace

  const idat = zlib.deflateSync(rawData);
  const iend = Buffer.alloc(0);

  return Buffer.concat([
    sig,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', idat),
    makeChunk('IEND', iend)
  ]);
}

function createIco(pngBuffer) {
  // Single-image 256x256 or embedded PNG ICO header
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // Type: ICO
  header.writeUInt16LE(1, 4); // Count: 1 image

  const entry = Buffer.alloc(16);
  entry[0] = 0; // Width: 256
  entry[1] = 0; // Height: 256
  entry[2] = 0; // Color count
  entry[3] = 0; // Reserved
  entry.writeUInt16LE(1, 4); // Planes
  entry.writeUInt16LE(32, 6); // Bit count
  entry.writeUInt32BE(pngBuffer.length, 8); // Bytes size
  entry.writeUInt32LE(22, 12); // Offset (6 + 16 = 22)

  return Buffer.concat([header, entry, pngBuffer]);
}

const assetsDir = path.join(__dirname, '..', 'build-assets');
const appxDir = path.join(assetsDir, 'appx');

if (!fs.existsSync(appxDir)) {
  fs.mkdirSync(appxDir, { recursive: true });
}

console.log('Generating Microsoft Store AppX / MSIX tile assets...');

// Required AppX Assets
const assets = [
  { file: 'StoreLogo.png', w: 50, h: 50 },
  { file: 'Square44x44Logo.png', w: 44, h: 44 },
  { file: 'Square150x150Logo.png', w: 150, h: 150 },
  { file: 'Wide310x150Logo.png', w: 310, h: 150 }
];

assets.forEach((a) => {
  const p = path.join(appxDir, a.file);
  fs.writeFileSync(p, createPng(a.w, a.h));
  console.log(` Created ${a.file} (${a.w}x${a.h})`);
});

// Windows icon.ico
const icon256 = createPng(256, 256);
fs.writeFileSync(path.join(assetsDir, 'icon.ico'), createIco(icon256));
console.log(' Created build-assets/icon.ico');

console.log(' All Microsoft Store assets ready.');
