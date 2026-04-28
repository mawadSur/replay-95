// Generates Replay '95 app icon, adaptive icon, splash, and favicon.
// Pure Node — no external image deps. Outputs solid PNGs (no alpha) so
// Apple's icon validator is happy. Designed pixel-art style: vertical
// gradient + bold "95" in cream + coral accent bar.

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const OUT_DIR = path.join(__dirname, "..", "assets");

const PLUM = [26, 14, 38];
const MID = [92, 39, 80];
const CORAL = [255, 107, 138];
const CREAM = [252, 233, 213];
const GOLD = [255, 200, 87];

function lerp(a, b, t) {
  return Math.round(a + (b - a) * t);
}

function lerpColor(c1, c2, t) {
  return [lerp(c1[0], c2[0], t), lerp(c1[1], c2[1], t), lerp(c1[2], c2[2], t)];
}

// 5x7 pixel digits — chunky 90s feel
const GLYPHS = {
  "9": [
    ".###.",
    "#...#",
    "#...#",
    "#...#",
    ".####",
    "....#",
    ".###.",
  ],
  "5": [
    "#####",
    "#....",
    "#....",
    "####.",
    "....#",
    "....#",
    "####.",
  ],
};

function makeCanvas(w, h) {
  return { w, h, px: Buffer.alloc(w * h * 3) };
}

function setPx(c, x, y, r, g, b) {
  if (x < 0 || x >= c.w || y < 0 || y >= c.h) return;
  const i = (y * c.w + x) * 3;
  c.px[i] = r;
  c.px[i + 1] = g;
  c.px[i + 2] = b;
}

function blendPx(c, x, y, r, g, b, a) {
  if (x < 0 || x >= c.w || y < 0 || y >= c.h) return;
  const i = (y * c.w + x) * 3;
  c.px[i] = Math.round(c.px[i] * (1 - a) + r * a);
  c.px[i + 1] = Math.round(c.px[i + 1] * (1 - a) + g * a);
  c.px[i + 2] = Math.round(c.px[i + 2] * (1 - a) + b * a);
}

function fillRect(c, x, y, w, h, color) {
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      setPx(c, x + dx, y + dy, color[0], color[1], color[2]);
    }
  }
}

function blendRect(c, x, y, w, h, color, alpha) {
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      blendPx(c, x + dx, y + dy, color[0], color[1], color[2], alpha);
    }
  }
}

function drawGradient(c) {
  // Three-stop vertical gradient: plum → mid-magenta → coral
  for (let y = 0; y < c.h; y++) {
    const t = y / (c.h - 1);
    const color = t < 0.5
      ? lerpColor(PLUM, MID, t * 2)
      : lerpColor(MID, CORAL, (t - 0.5) * 2);
    // Subtle scanlines every 6 rows for CRT feel
    const scan = y % 6 === 0 ? 0.93 : 1.0;
    for (let x = 0; x < c.w; x++) {
      setPx(
        c,
        x,
        y,
        Math.round(color[0] * scan),
        Math.round(color[1] * scan),
        Math.round(color[2] * scan),
      );
    }
  }
}

function drawText(c, text, centerX, centerY, cellSize, gap, color, shadow) {
  // Compute total width
  let totalW = 0;
  for (let i = 0; i < text.length; i++) {
    totalW += GLYPHS[text[i]][0].length * cellSize;
  }
  totalW += gap * (text.length - 1);
  const totalH = 7 * cellSize;

  const startX = Math.floor(centerX - totalW / 2);
  const startY = Math.floor(centerY - totalH / 2);

  // Drop shadow
  if (shadow) {
    const offset = Math.max(4, Math.round(cellSize * 0.18));
    let cx = startX + offset;
    for (let i = 0; i < text.length; i++) {
      const glyph = GLYPHS[text[i]];
      const gw = glyph[0].length;
      for (let row = 0; row < glyph.length; row++) {
        for (let col = 0; col < gw; col++) {
          if (glyph[row][col] === "#") {
            blendRect(
              c,
              cx + col * cellSize,
              startY + offset + row * cellSize,
              cellSize,
              cellSize,
              [0, 0, 0],
              0.4,
            );
          }
        }
      }
      cx += gw * cellSize + gap;
    }
  }

  // Foreground
  let cx = startX;
  for (let i = 0; i < text.length; i++) {
    const glyph = GLYPHS[text[i]];
    const gw = glyph[0].length;
    for (let row = 0; row < glyph.length; row++) {
      for (let col = 0; col < gw; col++) {
        if (glyph[row][col] === "#") {
          fillRect(
            c,
            cx + col * cellSize,
            startY + row * cellSize,
            cellSize,
            cellSize,
            color,
          );
        }
      }
    }
    cx += gw * cellSize + gap;
  }

  return { totalW, totalH, startX, startY };
}

function drawAccentBar(c, centerX, y, width, height, color) {
  fillRect(c, Math.round(centerX - width / 2), y, width, height, color);
}

function drawCornerSpark(c, x, y, size, color) {
  // Tiny 4-point sparkle for retro detail
  // Horizontal bar
  fillRect(c, x - Math.round(size * 0.6), y - 1, Math.round(size * 1.2), 3, color);
  // Vertical bar
  fillRect(c, x - 1, y - Math.round(size * 0.6), 3, Math.round(size * 1.2), color);
}

function drawIcon(size) {
  const c = makeCanvas(size, size);
  drawGradient(c);

  // "95" centered, slightly above middle
  const cellSize = Math.round(size * 0.075);
  const gap = Math.round(size * 0.075);
  drawText(c, "95", size / 2, size * 0.5, cellSize, gap, CREAM, true);

  // Coral accent bar below text
  drawAccentBar(
    c,
    size / 2,
    Math.round(size * 0.78),
    Math.round(size * 0.42),
    Math.round(size * 0.025),
    GOLD,
  );

  // Sparkles in opposite corners
  drawCornerSpark(c, Math.round(size * 0.18), Math.round(size * 0.22), Math.round(size * 0.04), GOLD);
  drawCornerSpark(c, Math.round(size * 0.82), Math.round(size * 0.78), Math.round(size * 0.03), CREAM);

  return c;
}

function drawAdaptiveIcon(size) {
  // Android adaptive icon foreground — design must fit in inner 66% safe zone
  const c = makeCanvas(size, size);
  drawGradient(c);
  // Slightly smaller mark to fit safe zone
  const cellSize = Math.round(size * 0.06);
  const gap = Math.round(size * 0.06);
  drawText(c, "95", size / 2, size * 0.5, cellSize, gap, CREAM, true);
  drawAccentBar(
    c,
    size / 2,
    Math.round(size * 0.7),
    Math.round(size * 0.32),
    Math.round(size * 0.02),
    GOLD,
  );
  return c;
}

function drawSplash(w, h) {
  const c = makeCanvas(w, h);
  drawGradient(c);
  const cellSize = Math.round(Math.min(w, h) * 0.05);
  const gap = Math.round(Math.min(w, h) * 0.05);
  drawText(c, "95", w / 2, h * 0.46, cellSize, gap, CREAM, true);
  drawAccentBar(
    c,
    w / 2,
    Math.round(h * 0.62),
    Math.round(w * 0.36),
    Math.round(Math.min(w, h) * 0.014),
    GOLD,
  );
  return c;
}

function drawFavicon(size) {
  const c = makeCanvas(size, size);
  drawGradient(c);
  // Tiny "95" — use cellSize=3 for 5x7 glyphs => 15x21 each
  const cellSize = Math.max(2, Math.floor(size * 0.06));
  const gap = Math.max(2, Math.floor(size * 0.06));
  drawText(c, "95", size / 2, size / 2, cellSize, gap, CREAM, false);
  return c;
}

// PNG encoder — RGB, no alpha (Apple icon requirement)
function encodePng(c) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(c.w, 0);
  ihdr.writeUInt32BE(c.h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const raw = Buffer.alloc(c.h * (1 + c.w * 3));
  for (let y = 0; y < c.h; y++) {
    const off = y * (1 + c.w * 3);
    raw[off] = 0; // filter: none
    c.px.copy(raw, off + 1, y * c.w * 3, (y + 1) * c.w * 3);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });

  // CRC table
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let v = n;
    for (let k = 0; k < 8; k++) v = v & 1 ? 0xedb88320 ^ (v >>> 1) : v >>> 1;
    table[n] = v >>> 0;
  }
  function crc32(buf) {
    let crc = 0xffffffff;
    for (const b of buf) crc = (table[(crc ^ b) & 0xff] ^ (crc >>> 8)) >>> 0;
    return (crc ^ 0xffffffff) >>> 0;
  }
  function chunk(type, data) {
    const buf = Buffer.alloc(8 + data.length + 4);
    buf.writeUInt32BE(data.length, 0);
    buf.write(type, 4, "ascii");
    data.copy(buf, 8);
    const crcInput = Buffer.concat([Buffer.from(type, "ascii"), data]);
    buf.writeUInt32BE(crc32(crcInput), 8 + data.length);
    return buf;
  }

  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

fs.writeFileSync(path.join(OUT_DIR, "icon.png"), encodePng(drawIcon(1024)));
fs.writeFileSync(
  path.join(OUT_DIR, "adaptive-icon.png"),
  encodePng(drawAdaptiveIcon(1024)),
);
fs.writeFileSync(
  path.join(OUT_DIR, "splash.png"),
  encodePng(drawSplash(1284, 2778)),
);
fs.writeFileSync(path.join(OUT_DIR, "favicon.png"), encodePng(drawFavicon(48)));

console.log("Generated icon.png, adaptive-icon.png, splash.png, favicon.png");
