/*
 * tools/make-icons.mjs — draw the app icons, no image library.
 *
 * Two flat PNGs (192 and 512) of a cassette hub on a dark chassis. Writing the
 * encoder by hand is about thirty lines and saves the project a dependency
 * that would exist purely to draw two circles.
 *
 *   node tools/make-icons.mjs
 */
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons');

const CHASSIS = [18, 18, 21];
const PANEL = [36, 36, 42];
const AMBER = [224, 164, 88];
const INK = [228, 228, 231];

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = buf => {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

function chunk (type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function encodePng (size, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;   // bit depth
  ihdr[9] = 6;   // truecolour with alpha
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0; // filter: none
    rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

/* Everything is drawn in 0..1 space and supersampled 3x3 per pixel, which is
   enough to keep the circles from looking like staircases. */
function draw (size) {
  const buf = Buffer.alloc(size * size * 4);
  const S = 3;
  const dist = (x, y, cx, cy) => Math.hypot(x - cx, y - cy);
  /* Signed distance to a rounded rectangle; negative means inside. */
  const roundRect = (x, y, cx, cy, hw, hh, r) => {
    const dx = Math.abs(x - cx) - (hw - r);
    const dy = Math.abs(y - cy) - (hh - r);
    return Math.hypot(Math.max(dx, 0), Math.max(dy, 0)) + Math.min(Math.max(dx, dy), 0) - r;
  };

  const sample = (x, y) => {
    // Maskable icons get cropped to a circle on some launchers, so the art
    // stays inside the middle 80%.
    let col = CHASSIS, a = 1;

    // Faint panel plate behind the hubs, with rounded corners so it reads as
    // a part rather than a crop.
    const plate = roundRect(x, y, 0.5, 0.5, 0.38, 0.215, 0.055);
    if (plate < 0) col = PANEL;

    // Tape window: a darker slot the reels sit in.
    const reelY = 0.5;
    const rOuter = 0.145, rInner = 0.052;
    for (const cx of [0.325, 0.675]) {
      const d = dist(x, y, cx, reelY);
      if (d < rOuter) col = AMBER;
      if (d < rOuter - 0.028) col = CHASSIS;
      if (d < rInner) col = AMBER;
    }

    // The span of tape between the reels.
    if (Math.abs(y - reelY) < 0.012 && x > 0.325 && x < 0.675) col = AMBER;

    // A single indicator dot, top centre.
    if (dist(x, y, 0.5, 0.235) < 0.026) col = INK;

    return [col, a];
  };

  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let r = 0, g = 0, b = 0;
      for (let sy = 0; sy < S; sy++) {
        for (let sx = 0; sx < S; sx++) {
          const [c] = sample((px + (sx + 0.5) / S) / size, (py + (sy + 0.5) / S) / size);
          r += c[0]; g += c[1]; b += c[2];
        }
      }
      const i = (py * size + px) * 4;
      const n = S * S;
      buf[i] = Math.round(r / n);
      buf[i + 1] = Math.round(g / n);
      buf[i + 2] = Math.round(b / n);
      buf[i + 3] = 255;
    }
  }
  return buf;
}

mkdirSync(OUT, { recursive: true });
for (const size of [192, 512]) {
  writeFileSync(join(OUT, `icon-${size}.png`), encodePng(size, draw(size)));
  console.log(`icons/icon-${size}.png`);
}
