import { writeFile, mkdir } from "node:fs/promises";

const CATEGORIES = [
  { label: "Backend", accent: "#2F81F7", skills: ["C#", ".NET", "ASP.NET Core"] },
  { label: "Frontend", accent: "#a855f7", skills: ["React", "TypeScript", "JavaScript", "HTML/CSS"] },
  { label: "Data", accent: "#22c55e", skills: ["SQL Server", "Supabase", "PostgreSQL"] },
  { label: "Tools", accent: "#f97316", skills: ["Git", "GitHub"] },
];

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function charWidth(ch) {
  return /[A-Z#.]/.test(ch) ? 8.2 : 7.1;
}

function textWidth(s, size = 12.5) {
  const base = [...s].reduce((sum, ch) => sum + charWidth(ch), 0);
  return base * (size / 12.5);
}

const WIDTH = 820;
const ROW_GAP = 14;
const CHIP_H = 30;
const CHIP_GAP = 10;
const PAD_X = 28;
const LABEL_W = 130;
const contentWidth = WIDTH - PAD_X * 2 - LABEL_W;

let y = 60;
const rows = CATEGORIES.map((cat) => {
  let cx = PAD_X + LABEL_W;
  let cy = y;
  const lineHeight = CHIP_H + CHIP_GAP;
  const chips = cat.skills
    .map((skill) => {
      const w = textWidth(skill) + 28;
      if (cx + w > PAD_X + LABEL_W + contentWidth) {
        cx = PAD_X + LABEL_W;
        cy += lineHeight;
      }
      const chip = `
      <rect x="${cx}" y="${cy}" width="${w.toFixed(1)}" height="${CHIP_H}" rx="8" fill="${cat.accent}18" stroke="${cat.accent}55" stroke-width="1"/>
      <text x="${(cx + w / 2).toFixed(1)}" y="${cy + 20}" font-size="12.5" font-weight="600" fill="#e6edf3" text-anchor="middle">${esc(skill)}</text>`;
      cx += w + CHIP_GAP;
      return chip;
    })
    .join("");

  const labelY = y + CHIP_H / 2 + 5;
  const rowSvg = `
    <circle cx="${PAD_X + 5}" cy="${labelY - 5}" r="5" fill="${cat.accent}"/>
    <text x="${PAD_X + 18}" y="${labelY}" font-size="14" font-weight="700" fill="#ffffff">${esc(cat.label)}</text>
    ${chips}`;

  const rowHeight = cy - y + lineHeight;
  y += rowHeight + ROW_GAP;
  return rowSvg;
}).join("\n");

const HEIGHT = y + 16;

const svg = `<svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg" font-family="'Segoe UI', Arial, sans-serif">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0d1117"/>
      <stop offset="100%" stop-color="#161b2e"/>
    </linearGradient>
    <linearGradient id="glow" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#2F81F7"/>
      <stop offset="50%" stop-color="#6f42c1"/>
      <stop offset="100%" stop-color="#2F81F7"/>
    </linearGradient>
    <pattern id="grid" width="18" height="18" patternUnits="userSpaceOnUse">
      <path d="M 18 0 L 0 0 0 18" fill="none" stroke="#ffffff" stroke-width="0.4" opacity="0.04"/>
    </pattern>
    <clipPath id="clip">
      <rect x="3" y="3" width="${WIDTH - 6}" height="${HEIGHT - 6}" rx="12"/>
    </clipPath>
  </defs>

  <rect x="1" y="1" width="${WIDTH - 2}" height="${HEIGHT - 2}" rx="14" fill="none" stroke="url(#glow)" stroke-width="1.5" opacity="0.9"/>
  <g clip-path="url(#clip)">
    <rect x="3" y="3" width="${WIDTH - 6}" height="${HEIGHT - 6}" fill="url(#bg)"/>
    <rect x="3" y="3" width="${WIDTH - 6}" height="${HEIGHT - 6}" fill="url(#grid)"/>
    <rect x="3" y="3" width="${WIDTH - 6}" height="4" fill="url(#glow)"/>
  </g>

  <text x="${PAD_X}" y="34" font-size="16" font-weight="700" fill="#ffffff">🧠 Tech Stack</text>

  ${rows}
</svg>`;

await mkdir("assets", { recursive: true });
await writeFile("assets/stack.svg", svg);
console.log("Wrote assets/stack.svg");
