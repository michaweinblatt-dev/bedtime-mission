/**
 * Generates placeholder PWA icons as solid-color PNGs using only Node.js built-ins.
 * Run with: node scripts/generate-icons.mjs
 * Replace the output files with real artwork later.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

// CRC32 for PNG chunk integrity
function crc32(buf) {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  let crc = 0xffffffff;
  for (const b of buf) crc = table[(crc ^ b) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

/**
 * Creates a solid-color PNG at the given size.
 * r, g, b are 0-255 integers.
 */
function makeSolidPNG(size, r, g, b) {
  // IHDR: width, height, 8-bit, RGB color type (2)
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type: RGB truecolor

  // Raw scanlines: filter byte (0 = None) + R G B per pixel
  const rowBytes = 1 + size * 3;
  const raw = Buffer.alloc(size * rowBytes);
  for (let y = 0; y < size; y++) {
    const base = y * rowBytes;
    raw[base] = 0; // filter: None
    for (let x = 0; x < size; x++) {
      raw[base + 1 + x * 3]     = r;
      raw[base + 1 + x * 3 + 1] = g;
      raw[base + 1 + x * 3 + 2] = b;
    }
  }

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), // PNG signature
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),                 // zlib-compressed scanlines
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// #1e1b4b → R=0x1e=30, G=0x1b=27, B=0x4b=75
const BG = [30, 27, 75];

mkdirSync('public', { recursive: true });

for (const size of [192, 512]) {
  const path = `public/pwa-${size}x${size}.png`;
  writeFileSync(path, makeSolidPNG(size, ...BG));
  console.log(`✓ ${path}`);
}
