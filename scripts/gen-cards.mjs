import { writeFile, mkdir } from "node:fs/promises";

const USER = "yonisb77";
const REPOS = [
  { name: "Hireflow", icon: "💼", accent: ["#2F81F7", "#6f42c1"], featured: true, fallbackDesc: "Rekryteringssystem (ATS) — kanban över kandidater, AI-bedömning mot jobb." },
  { name: "ApplicationTracker", icon: "📋", accent: ["#1f9d55", "#2F81F7"], fallbackDesc: "JobApptracker — spårning av jobbansökningar." },
  { name: "Smart-Home", icon: "🏠", accent: ["#f97316", "#e34c26"], fallbackDesc: "Smart Home Hub — styrsystem för smarta hem-enheter." },
  { name: "Mini-EShop", icon: "🛒", accent: ["#f5a623", "#10b981"], fallbackDesc: "E-handelsprototyp — produktkatalog och kundvagn." },
  { name: "StudentHub", icon: "🎓", accent: ["#a855f7", "#6f42c1"], fallbackDesc: "Studenthanteringssystem." },
  { name: "StudentAPI", icon: "🔌", accent: ["#22c55e", "#178600"], fallbackDesc: "REST API för studentdata." },
];

const LANG_COLORS = {
  "C#": "#178600",
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  HTML: "#e34c26",
  CSS: "#563d7c",
  TSQL: "#e38c00",
  Dockerfile: "#384d54",
  PLpgSQL: "#336790",
};
const FALLBACK_COLOR = "#8b949e";

const token = process.env.GH_TOKEN;
const headers = {
  Accept: "application/vnd.github+json",
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
};

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function wrap(text, max) {
  const words = text.split(" ");
  const lines = [];
  let line = "";
  for (const w of words) {
    if ((line + " " + w).trim().length > max) {
      lines.push(line.trim());
      line = w;
    } else {
      line = (line + " " + w).trim();
    }
    if (lines.length === 2) break;
  }
  if (line && lines.length < 2) lines.push(line);
  if (lines.length === 2 && lines[1].length >= max) {
    lines[1] = lines[1].slice(0, max - 1).trim() + "…";
  }
  return lines;
}

async function fetchJson(url) {
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return res.json();
}

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return "idag";
  if (days === 1) return "igår";
  if (days < 30) return `${days}d sedan`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mån sedan`;
  return `${Math.floor(months / 12)}år sedan`;
}

async function buildCard(repo) {
  const info = await fetchJson(`https://api.github.com/repos/${USER}/${repo.name}`);
  let languages = {};
  try {
    languages = await fetchJson(info.languages_url);
  } catch {
    languages = info.language ? { [info.language]: 1 } : {};
  }
  const total = Object.values(languages).reduce((a, b) => a + b, 0) || 1;
  const langs = Object.entries(languages).sort((a, b) => b[1] - a[1]);
  const [accentA, accentB] = repo.accent;
  const gradId = `glow-${repo.name.replace(/[^a-zA-Z0-9]/g, "")}`;

  let x = 24;
  const barWidth = 362;
  const bars = langs
    .map(([lang, bytes]) => {
      const w = (bytes / total) * barWidth;
      const color = LANG_COLORS[lang] || FALLBACK_COLOR;
      const rect = `<rect x="${x.toFixed(1)}" y="140" width="${w.toFixed(1)}" height="7" fill="${color}"/>`;
      x += w;
      return rect;
    })
    .join("");

  // Legend: fit as many language chips as space allows, collapse the rest into "+N".
  const maxLegendWidth = 358;
  let lx = 24;
  const legendChips = [];
  let hiddenCount = 0;
  for (const [lang, bytes] of langs) {
    const pct = Math.round((bytes / total) * 100);
    if (pct === 0) continue;
    const color = LANG_COLORS[lang] || FALLBACK_COLOR;
    const label = `${lang} ${pct}%`;
    const chipWidth = 20 + label.length * 6.4;
    if (lx + chipWidth > maxLegendWidth) {
      hiddenCount++;
      continue;
    }
    legendChips.push(`<circle cx="${lx + 4}" cy="160" r="4" fill="${color}"/><text x="${lx + 12}" y="164" font-size="11" fill="#8b949e">${esc(label)}</text>`);
    lx += chipWidth;
  }
  if (hiddenCount > 0) {
    legendChips.push(`<text x="${lx + 4}" y="164" font-size="11" fill="#565f6b">+${hiddenCount}</text>`);
  }
  const legendSvg = legendChips.join("");

  const description = (info.description && info.description.trim()) || repo.fallbackDesc;
  const descLines = wrap(description, 52);
  const descSvg = descLines
    .map((line, i) => `<text x="24" y="${78 + i * 18}" font-size="13" fill="#c9d1d9">${esc(line)}</text>`)
    .join("");

  const sinceYear = new Date(info.created_at).getFullYear();
  const forkBadge = info.fork
    ? `<text x="24" y="163" font-size="10" fill="#8b949e">fork</text>`
    : "";

  const watermark = `<text x="332" y="150" font-size="120" opacity="0.06" text-anchor="middle" dominant-baseline="middle">${repo.icon}</text>`;

  const ribbon = repo.featured
    ? `<g transform="rotate(-45 0 40)">
        <rect x="-40" y="30" width="140" height="18" fill="url(#${gradId})"/>
        <text x="30" y="43" font-size="10.5" font-weight="700" fill="#ffffff" text-anchor="middle">★ FEATURED</text>
      </g>`
    : "";

  const svg = `<svg width="410" height="188" viewBox="0 0 410 188" xmlns="http://www.w3.org/2000/svg" font-family="'Segoe UI', Arial, sans-serif">
  <defs>
    <linearGradient id="bg-${gradId}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0d1117"/>
      <stop offset="100%" stop-color="#161b2e"/>
    </linearGradient>
    <linearGradient id="${gradId}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${accentA}"/>
      <stop offset="100%" stop-color="${accentB}"/>
    </linearGradient>
    <pattern id="grid-${gradId}" width="18" height="18" patternUnits="userSpaceOnUse">
      <path d="M 18 0 L 0 0 0 18" fill="none" stroke="#ffffff" stroke-width="0.4" opacity="0.05"/>
    </pattern>
    <clipPath id="clip-${gradId}">
      <rect x="3" y="3" width="404" height="182" rx="10"/>
    </clipPath>
  </defs>

  <rect x="1" y="1" width="408" height="186" rx="12" fill="none" stroke="url(#${gradId})" stroke-width="1.5" opacity="0.9"/>
  <g clip-path="url(#clip-${gradId})">
    <rect x="3" y="3" width="404" height="182" fill="url(#bg-${gradId})"/>
    <rect x="3" y="3" width="404" height="182" fill="url(#grid-${gradId})"/>
    ${watermark}
    <rect x="3" y="3" width="404" height="4" fill="url(#${gradId})"/>
    ${ribbon}
  </g>

  <text x="24" y="40" font-size="18" font-weight="700" fill="#ffffff">${repo.icon} ${esc(repo.name)}</text>
  <text x="386" y="40" font-size="12" fill="#e3b341" text-anchor="end">★ ${info.stargazers_count}</text>
  <text x="24" y="56" font-size="10" fill="#565f6b">sedan ${sinceYear}</text>

  ${descSvg}
  ${forkBadge}

  <rect x="24" y="140" width="${barWidth}" height="7" rx="3.5" fill="#21262d"/>
  ${bars}
  ${legendSvg}

  <line x1="24" y1="174" x2="386" y2="174" stroke="#21262d" stroke-width="1"/>
  <text x="24" y="182" font-size="10" fill="#8b949e">Uppdaterad ${esc(timeAgo(info.pushed_at))}</text>
  <text x="386" y="182" font-size="11" fill="#2F81F7" text-anchor="end" font-weight="600">Visa repo ↗</text>
</svg>`;

  return svg;
}

await mkdir("assets/cards", { recursive: true });
for (const repo of REPOS) {
  try {
    const svg = await buildCard(repo);
    await writeFile(`assets/cards/${repo.name}.svg`, svg);
    console.log(`ok: ${repo.name}`);
  } catch (err) {
    console.error(`fail: ${repo.name}`, err.message);
  }
}
