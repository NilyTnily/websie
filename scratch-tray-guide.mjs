// Scratch: draws the proposed 6-slot watch mapping over scene2-desktop.webp.
// Output: .tests/tray-guide.png
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const sharp = require("sharp");

const W = 864;
const H = 496;

// Measured against .tests/tray-grid.png
const PAD = { x0: 0.17, y0: 0.135, x1: 0.72, y1: 0.805 };
const VELVET = { x0: 0.3, y0: 0.215, x1: 0.675, y1: 0.705 };

// Proposed slots — xFrac/yFrac are the IMAGE CENTER (not top-left).
const COLS = [0.362, 0.488, 0.612];
const ROWS = [0.338, 0.583];
const W_FRAC = 0.08;
const NOMINAL_ASPECT = 0.75; // guide-only: w/h used just to draw a box

function guideSvg() {
  const p = [];
  const rect = (b, color, dash) =>
    p.push(
      `<rect x="${b.x0 * W}" y="${b.y0 * H}" width="${(b.x1 - b.x0) * W}" height="${(b.y1 - b.y0) * H}" fill="none" stroke="${color}" stroke-width="2" stroke-dasharray="${dash ?? ""}"/>`,
    );

  rect(PAD, "#ffd54a");
  rect(VELVET, "#00e5ff");

  // row/column center lines across the velvet box
  for (const cx of COLS)
    p.push(
      `<line x1="${cx * W}" y1="${VELVET.y0 * H}" x2="${cx * W}" y2="${VELVET.y1 * H}" stroke="#ffffff" stroke-width="1" opacity="0.55"/>`,
    );
  for (const cy of ROWS)
    p.push(
      `<line x1="${VELVET.x0 * W}" y1="${cy * H}" x2="${VELVET.x1 * W}" y2="${cy * H}" stroke="#ffffff" stroke-width="1" opacity="0.55"/>`,
    );

  ROWS.forEach((cy, r) => {
    COLS.forEach((cx, c) => {
      const w = W_FRAC * W;
      const h = w / NOMINAL_ASPECT;
      const x = cx * W - w / 2;
      const y = cy * H - h / 2;
      p.push(
        `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" fill="rgba(255,255,255,0.08)" stroke="#ff4d4d" stroke-width="2"/>`,
        `<circle cx="${(cx * W).toFixed(1)}" cy="${(cy * H).toFixed(1)}" r="4" fill="#ff2222"/>`,
        `<text x="${x.toFixed(1)}" y="${(y - 6).toFixed(1)}" font-size="15" font-weight="bold" fill="#ffe066" font-family="monospace">R${r + 1}C${c + 1}</text>`,
      );
    });
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${p.join("")}</svg>`;
}

await sharp("public/hero-flythrough/scene2-desktop.webp")
  .composite([{ input: Buffer.from(guideSvg()), top: 0, left: 0 }])
  .png()
  .toFile(".tests/tray-guide.png");

console.log("wrote .tests/tray-guide.png");
