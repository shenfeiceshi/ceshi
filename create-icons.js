const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// ===== PNG helpers =====
function crc32(buf) {
  let table = crc32.table;
  if (!table) {
    table = crc32.table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let k = 0; k < 8; k++) {
        c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      }
      table[i] = c >>> 0;
    }
  }
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc = table[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function writeChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  const crc = crc32(Buffer.concat([typeBuf, data]));
  crcBuf.writeUInt32BE(crc, 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function createPNGFromRGBA(width, height, rgbaBuffer) {
  const signature = Buffer.from([0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8);
  ihdr.writeUInt8(6, 9);
  ihdr.writeUInt8(0, 10);
  ihdr.writeUInt8(0, 11);
  ihdr.writeUInt8(0, 12);
  const ihdrChunk = writeChunk('IHDR', ihdr);

  const rowSize = 1 + width * 4;
  const raw = Buffer.alloc(rowSize * height);
  for (let y = 0; y < height; y++) {
    const rowStart = y * rowSize;
    raw[rowStart] = 0; // filter type 0
    const srcStart = y * width * 4;
    rgbaBuffer.copy(raw, rowStart + 1, srcStart, srcStart + width * 4);
  }
  const compressed = zlib.deflateSync(raw);
  const idatChunk = writeChunk('IDAT', compressed);
  const iendChunk = writeChunk('IEND', Buffer.alloc(0));
  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// ===== tiny raster canvas =====
function makeCanvas(w, h, bg = [0, 0, 0, 0]) {
  const buf = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    buf[i * 4] = bg[0];
    buf[i * 4 + 1] = bg[1];
    buf[i * 4 + 2] = bg[2];
    buf[i * 4 + 3] = bg[3];
  }
  return { w, h, buf };
}

function putPixel(c, x, y, color) {
  if (x < 0 || y < 0 || x >= c.w || y >= c.h) return;
  const i = (y * c.w + x) * 4;
  const a = color[3] / 255;
  const ia = 1 - a;
  // alpha blend over existing
  const r = Math.round(color[0] * a + c.buf[i] * ia);
  const g = Math.round(color[1] * a + c.buf[i + 1] * ia);
  const b = Math.round(color[2] * a + c.buf[i + 2] * ia);
  const newA = Math.round(Math.min(255, c.buf[i + 3] + color[3]));
  c.buf[i] = r; c.buf[i + 1] = g; c.buf[i + 2] = b; c.buf[i + 3] = newA;
}

function drawLine(c, x0, y0, x1, y1, color, width = 2) {
  // Bresenham with simple stroke width
  const dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1;
  const dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  while (true) {
    for (let ox = -Math.floor(width/2); ox <= Math.floor(width/2); ox++) {
      for (let oy = -Math.floor(width/2); oy <= Math.floor(width/2); oy++) {
        putPixel(c, x0 + ox, y0 + oy, color);
      }
    }
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
}

function drawRect(c, x, y, w, h, color, radius = 0, width = 2) {
  // outline rectangle with optional corner radius
  function clampedLine(xa, ya, xb, yb) { drawLine(c, xa, ya, xb, yb, color, width); }
  if (radius <= 0) {
    clampedLine(x, y, x + w, y);
    clampedLine(x + w, y, x + w, y + h);
    clampedLine(x + w, y + h, x, y + h);
    clampedLine(x, y + h, x, y);
  } else {
    // draw straight segments
    clampedLine(x + radius, y, x + w - radius, y);
    clampedLine(x + w, y + radius, x + w, y + h - radius);
    clampedLine(x + w - radius, y + h, x + radius, y + h);
    clampedLine(x, y + h - radius, x, y + radius);
    // draw corner arcs (approximate with small segments)
    const steps = Math.max(8, Math.round(radius * 0.8));
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const a1 = Math.PI * (1 + t/2); // top-left
      const a2 = Math.PI * (1.5 + t/2); // top-right
      const a3 = Math.PI * (2 + t/2); // bottom-right
      const a4 = Math.PI * (2.5 + t/2); // bottom-left
      putPixel(c, Math.round(x + radius + Math.cos(a1) * radius), Math.round(y + radius + Math.sin(a1) * radius), color);
      putPixel(c, Math.round(x + w - radius + Math.cos(a2) * radius), Math.round(y + radius + Math.sin(a2) * radius), color);
      putPixel(c, Math.round(x + w - radius + Math.cos(a3) * radius), Math.round(y + h - radius + Math.sin(a3) * radius), color);
      putPixel(c, Math.round(x + radius + Math.cos(a4) * radius), Math.round(y + h - radius + Math.sin(a4) * radius), color);
    }
  }
}

function drawCircle(c, cx, cy, r, color, width = 2) {
  // midpoint circle algorithm
  let x = r, y = 0, err = 0;
  while (x >= y) {
    const pts = [
      [cx + x, cy + y],[cx + y, cy + x],[cx - y, cy + x],[cx - x, cy + y],
      [cx - x, cy - y],[cx - y, cy - x],[cx + y, cy - x],[cx + x, cy - y]
    ];
    for (const [px, py] of pts) drawLine(c, px, py, px, py, color, width);
    y += 1;
    if (err <= 0) { err += 2*y + 1; }
    if (err > 0) { x -= 1; err -= 2*x + 1; }
  }
}

// ===== icon painters (24x24 logical, raster at 96x96 for crispness) =====
const SIZE = 96; // 24 * 4
const SCALE = 4;
// stroke presets for more consistent visual weight
const STROKE_OUTLINE = 5;
const STROKE_DETAIL = 4;
const COLOR_INACTIVE = [0x9C, 0x85, 0x4A, 255];
const COLOR_ACTIVE   = [0x1C, 0x17, 0x0D, 255];

function paintHome(color) {
  const c = makeCanvas(SIZE, SIZE);
  // roof
  drawLine(c, 20*SCALE, 44*SCALE, 48*SCALE, 24*SCALE, color, STROKE_OUTLINE);
  drawLine(c, 48*SCALE, 24*SCALE, 76*SCALE, 44*SCALE, color, STROKE_OUTLINE);
  // walls
  drawRect(c, 28*SCALE, 44*SCALE, 40*SCALE, 28*SCALE, color, 4, STROKE_OUTLINE);
  // door
  drawRect(c, 44*SCALE, 54*SCALE, 8*SCALE, 18*SCALE, color, 2, STROKE_DETAIL);
  return c.buf;
}

function paintTasks(color) {
  const c = makeCanvas(SIZE, SIZE);
  // three rounded bars
  drawRect(c, 20*SCALE, 28*SCALE, 56*SCALE, 8*SCALE, color, 4, STROKE_OUTLINE);
  drawRect(c, 20*SCALE, 46*SCALE, 56*SCALE, 8*SCALE, color, 4, STROKE_OUTLINE);
  drawRect(c, 20*SCALE, 64*SCALE, 56*SCALE, 8*SCALE, color, 4, STROKE_OUTLINE);
  return c.buf;
}

function paintDiary(color) {
  const c = makeCanvas(SIZE, SIZE);
  // notebook with folded corner
  drawRect(c, 26*SCALE, 26*SCALE, 44*SCALE, 44*SCALE, color, 6, STROKE_OUTLINE);
  drawLine(c, 26*SCALE, 38*SCALE, 70*SCALE, 38*SCALE, color, STROKE_DETAIL);
  drawLine(c, 26*SCALE, 52*SCALE, 62*SCALE, 52*SCALE, color, STROKE_DETAIL);
  // fold
  drawLine(c, 64*SCALE, 26*SCALE, 70*SCALE, 32*SCALE, color, STROKE_DETAIL);
  drawLine(c, 70*SCALE, 32*SCALE, 70*SCALE, 26*SCALE, color, STROKE_DETAIL);
  return c.buf;
}

function paintLottery(color) {
  const c = makeCanvas(SIZE, SIZE);
  // gift box
  drawRect(c, 26*SCALE, 42*SCALE, 44*SCALE, 26*SCALE, color, 4, STROKE_OUTLINE);
  // ribbon vertical & horizontal
  drawLine(c, 48*SCALE, 42*SCALE, 48*SCALE, 68*SCALE, color, STROKE_OUTLINE);
  drawLine(c, 26*SCALE, 54*SCALE, 70*SCALE, 54*SCALE, color, STROKE_OUTLINE);
  // bow
  drawCircle(c, 40*SCALE, 34*SCALE, 8*SCALE, color, STROKE_DETAIL);
  drawCircle(c, 56*SCALE, 34*SCALE, 8*SCALE, color, STROKE_DETAIL);
  return c.buf;
}

function paintProfile(color) {
  const c = makeCanvas(SIZE, SIZE);
  // head
  drawCircle(c, 48*SCALE, 34*SCALE, 10*SCALE, color, STROKE_DETAIL);
  // shoulders (arc approximation with rectangle + rounds)
  drawRect(c, 28*SCALE, 56*SCALE, 40*SCALE, 16*SCALE, color, 10, STROKE_DETAIL);
  return c.buf;
}

const painters = {
  'home.png': () => paintHome(COLOR_INACTIVE),
  'home-active.png': () => paintHome(COLOR_ACTIVE),
  'tasks.png': () => paintTasks(COLOR_INACTIVE),
  'tasks-active.png': () => paintTasks(COLOR_ACTIVE),
  'diary.png': () => paintDiary(COLOR_INACTIVE),
  'diary-active.png': () => paintDiary(COLOR_ACTIVE),
  'lottery.png': () => paintLottery(COLOR_INACTIVE),
  'lottery-active.png': () => paintLottery(COLOR_ACTIVE),
  'profile.png': () => paintProfile(COLOR_INACTIVE),
  'profile-active.png': () => paintProfile(COLOR_ACTIVE),
};

const outDir = path.join(__dirname, 'images', 'tabbar');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

for (const [filename, make] of Object.entries(painters)) {
  const rgba = make();
  const png = createPNGFromRGBA(SIZE, SIZE, rgba);
  fs.writeFileSync(path.join(outDir, filename), png);
  console.log('Generated:', filename);
}

console.log('Tabbar vector-style icons generated to images/tabbar/.');