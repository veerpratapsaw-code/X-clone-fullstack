import fs from "fs";
import path from "path";
import zlib from "zlib";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, "../public");

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. Generate pristine SVG favicon
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
  <defs>
    <style>
      .top { fill: #1d9bf0; stroke: #1d9bf0; stroke-width: 3.2; stroke-linejoin: round; }
      .left { fill: #0c7abf; stroke: #0c7abf; stroke-width: 3.2; stroke-linejoin: round; }
      .right { fill: #06588f; stroke: #06588f; stroke-width: 3.2; stroke-linejoin: round; }
      .led { fill: #ffffff; }
      .led-pill { stroke: #ffffff; stroke-width: 3.6; stroke-linecap: round; }
    </style>
  </defs>
  <!-- Layer 3 (Bottom Slab) -->
  <g>
    <polygon class="top" points="50,56 86,70 50,84 14,70"/>
    <polygon class="left" points="14,70 50,84 50,95 14,81"/>
    <polygon class="right" points="50,84 86,70 86,81 50,95"/>
    <line class="led-pill" x1="22" y1="76" x2="33" y2="80.3"/>
    <circle class="led" cx="40" cy="83.3" r="2.2"/>
  </g>
  <!-- Layer 2 (Middle Slab) -->
  <g>
    <polygon class="top" points="50,31 86,45 50,59 14,45"/>
    <polygon class="left" points="14,45 50,59 50,70 14,56"/>
    <polygon class="right" points="50,59 86,45 86,56 50,70"/>
    <line class="led-pill" x1="22" y1="51" x2="33" y2="55.3"/>
    <circle class="led" cx="40" cy="58.3" r="2.2"/>
  </g>
  <!-- Layer 1 (Top Slab) -->
  <g>
    <polygon class="top" points="50,6 86,20 50,34 14,20"/>
    <polygon class="left" points="14,20 50,34 50,45 14,31"/>
    <polygon class="right" points="50,34 86,20 86,31 50,45"/>
    <line class="led-pill" x1="22" y1="26" x2="33" y2="30.3"/>
    <circle class="led" cx="40" cy="33.3" r="2.2"/>
  </g>
</svg>`;

fs.writeFileSync(path.join(publicDir, "favicon.svg"), svgContent, "utf8");
fs.writeFileSync(path.join(publicDir, "logo.svg"), svgContent, "utf8");
console.log("✅ Created favicon.svg and logo.svg");

// 2. Pure Node.js PNG encoder helper
function createPNGBuffer(width, height, getPixelRGBA) {
  // Build raw uncompressed scanlines (filter byte 0 + RGBA)
  const rowBytes = width * 4 + 1;
  const rawData = Buffer.alloc(rowBytes * height);
  
  for (let y = 0; y < height; y++) {
    let offset = y * rowBytes;
    rawData[offset++] = 0; // Filter byte 0 (None)
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = getPixelRGBA(x, y, width, height);
      rawData[offset++] = r;
      rawData[offset++] = g;
      rawData[offset++] = b;
      rawData[offset++] = a;
    }
  }

  const compressedData = zlib.deflateSync(rawData);

  // CRC32 implementation for PNG chunks
  function crc32(buf) {
    let crc = -1;
    for (let i = 0; i < buf.length; i++) {
      crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
    }
    return (crc ^ -1) >>> 0;
  }

  const crcTable = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    crcTable[i] = c;
  }

  function makeChunk(type, data) {
    const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
    const crc = crc32(typeAndData);
    const lenBuf = Buffer.alloc(4);
    lenBuf.writeUInt32BE(data.length, 0);
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc, 0);
    return Buffer.concat([lenBuf, typeAndData, crcBuf]);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth
  ihdr[9] = 6; // Color type 6 (RGBA)
  ihdr[10] = 0; // Compression
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // Interlace

  const pngHeader = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    pngHeader,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', compressedData),
    makeChunk('IEND', Buffer.alloc(0))
  ]);
}

// Helper: check if point (px, py) is inside triangle or polygon
function pointInPolygon(px, py, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], yi = poly[i][1];
    const xj = poly[j][0], yj = poly[j][1];
    const intersect = ((yi > py) !== (yj > py)) &&
      (px < (xj - xi) * (py - yi) / (yj - yi + 0.00001) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

// Distance from point to line segment
function distToSegment(px, py, x1, y1, x2, y2) {
  const l2 = (x1 - x2) ** 2 + (y1 - y2) ** 2;
  if (l2 === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
}

// Draw the isometric server icon with supersampling (3x3 grid per pixel) for crystal clear anti-aliasing
function getPixelRGBA(x, y, w, h) {
  let rSum = 0, gSum = 0, bSum = 0, aSum = 0;
  const samples = 3;
  const scale = 100 / w;

  const layers = [
    // Layer 3 (Bottom)
    {
      top: [[50,56], [86,70], [50,84], [14,70]],
      left: [[14,70], [50,84], [50,95], [14,81]],
      right: [[50,84], [86,70], [86,81], [50,95]],
      pill: [22, 76, 33, 80.3],
      dot: [40, 83.3]
    },
    // Layer 2 (Middle)
    {
      top: [[50,31], [86,45], [50,59], [14,45]],
      left: [[14,45], [50,59], [50,70], [14,56]],
      right: [[50,59], [86,45], [86,56], [50,70]],
      pill: [22, 51, 33, 55.3],
      dot: [40, 58.3]
    },
    // Layer 1 (Top)
    {
      top: [[50,6], [86,20], [50,34], [14,20]],
      left: [[14,20], [50,34], [50,45], [14,31]],
      right: [[50,34], [86,20], [86,31], [50,45]],
      pill: [22, 26, 33, 30.3],
      dot: [40, 33.3]
    }
  ];

  for (let sx = 0; sx < samples; sx++) {
    for (let sy = 0; sy < samples; sy++) {
      const vx = (x + (sx + 0.5) / samples) * scale;
      const vy = (y + (sy + 0.5) / samples) * scale;

      let pr = 0, pg = 0, pb = 0, pa = 0;

      // Check from top layer to bottom layer
      for (const L of [layers[2], layers[1], layers[0]]) {
        if (pa > 0) break; // Already hit upper layer

        // Check LED dot
        if (Math.hypot(vx - L.dot[0], vy - L.dot[1]) <= 2.2) {
          pr = 255; pg = 255; pb = 255; pa = 255;
          break;
        }
        // Check LED pill
        if (distToSegment(vx, vy, L.pill[0], L.pill[1], L.pill[2], L.pill[3]) <= 1.8) {
          pr = 255; pg = 255; pb = 255; pa = 255;
          break;
        }
        // Check Top Face (#1d9bf0 = 29, 155, 240)
        if (pointInPolygon(vx, vy, L.top)) {
          pr = 29; pg = 155; pb = 240; pa = 255;
          break;
        }
        // Check Left Face (#0c7abf = 12, 122, 191)
        if (pointInPolygon(vx, vy, L.left)) {
          pr = 12; pg = 122; pb = 191; pa = 255;
          break;
        }
        // Check Right Face (#06588f = 6, 88, 143)
        if (pointInPolygon(vx, vy, L.right)) {
          pr = 6; pg = 88; pb = 143; pa = 255;
          break;
        }
      }

      rSum += pr;
      gSum += pg;
      bSum += pb;
      aSum += pa;
    }
  }

  const n = samples * samples;
  const a = Math.round(aSum / n);
  if (a === 0) return [0, 0, 0, 0];
  return [
    Math.round(rSum / n),
    Math.round(gSum / n),
    Math.round(bSum / n),
    a
  ];
}

const png32Buffer = createPNGBuffer(32, 32, getPixelRGBA);
const png64Buffer = createPNGBuffer(64, 64, getPixelRGBA);

fs.writeFileSync(path.join(publicDir, "favicon-32x32.png"), png32Buffer);
fs.writeFileSync(path.join(publicDir, "favicon.png"), png64Buffer);
console.log("✅ Created favicon-32x32.png and favicon.png");

// 3. Create valid multi-size ICO file embedding our transparent PNG
function createICO(pngBuffers) {
  const numImages = pngBuffers.length;
  const header = Buffer.alloc(6);
  header.writeUInt16BE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // Type: 1 = ICO
  header.writeUInt16LE(numImages, 4);

  const entries = [];
  let currentOffset = 6 + numImages * 16;

  for (const png of pngBuffers) {
    const entry = Buffer.alloc(16);
    const w = png.readUInt32BE(16); // Width from IHDR
    const h = png.readUInt32BE(20); // Height from IHDR
    entry[0] = w >= 256 ? 0 : w;
    entry[1] = h >= 256 ? 0 : h;
    entry[2] = 0; // Palette color count
    entry[3] = 0; // Reserved
    entry.writeUInt16LE(1, 4); // Color planes
    entry.writeUInt16LE(32, 6); // Bits per pixel
    entry.writeUInt32LE(png.length, 8); // Size of PNG payload
    entry.writeUInt32LE(currentOffset, 12); // Offset to payload
    entries.push(entry);
    currentOffset += png.length;
  }

  return Buffer.concat([header, ...entries, ...pngBuffers]);
}

const icoBuffer = createICO([png32Buffer, png64Buffer]);
fs.writeFileSync(path.join(publicDir, "favicon.ico"), icoBuffer);
console.log("✅ Created multi-resolution favicon.ico (32x32 & 64x64 transparent)");
