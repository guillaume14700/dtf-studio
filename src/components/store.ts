/* Stockage local des designs DTF Studio (navigateur) — aucun serveur requis. */

export type Design = {
  id: string;
  name: string;
  updatedAt: number;
  widthMm: number;
  heightMm: number;
  thumb: string; // petit PNG dataURL
  json: string; // scène Fabric sérialisée
};

const KEY = "dtf-studio-designs";

export function loadDesigns(): Design[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    const list = raw ? (JSON.parse(raw) as Design[]) : [];
    return list.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch {
    return [];
  }
}

export function saveDesign(d: Design): { ok: boolean; error?: string } {
  try {
    const all = loadDesigns().filter((x) => x.id !== d.id);
    all.unshift(d);
    localStorage.setItem(KEY, JSON.stringify(all.slice(0, 40)));
    return { ok: true };
  } catch {
    return { ok: false, error: "Stockage local plein : supprimez d'anciens designs ou réduisez les images importées." };
  }
}

export function deleteDesign(id: string) {
  try {
    localStorage.setItem(KEY, JSON.stringify(loadDesigns().filter((x) => x.id !== id)));
  } catch { /* ignore */ }
}

export function getDesign(id: string | null): Design | undefined {
  if (!id) return undefined;
  return loadDesigns().find((d) => d.id === id);
}

export function newId(): string {
  return `d-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

/* ---------- Conversions ---------- */
export const DPI = 300;
export function mmToPx(mm: number): number { return Math.round((mm / 25.4) * DPI); }
export function pxToMm(px: number): number { return Math.round((px / DPI) * 25.4 * 10) / 10; }

export const DOC_PRESETS = [
  { label: "T-shirt avant — 300 × 400 mm", w: 300, h: 400 },
  { label: "Logo poitrine — 100 × 100 mm", w: 100, h: 100 },
  { label: "Hoodie — 300 × 400 mm", w: 300, h: 400 },
  { label: "Casquette — 120 × 50 mm", w: 120, h: 50 },
  { label: "A4 — 210 × 297 mm", w: 210, h: 297 },
  { label: "A3 — 297 × 420 mm", w: 297, h: 420 },
  { label: "Manche — 80 × 250 mm", w: 80, h: 250 },
];

export const DESIGN_FONTS = [
  { label: "Archivo Black", value: "'Archivo Black', sans-serif" },
  { label: "Bebas Neue", value: "'Bebas Neue', sans-serif" },
  { label: "Oswald", value: "'Oswald', sans-serif" },
  { label: "Permanent Marker", value: "'Permanent Marker', cursive" },
  { label: "Pacifico", value: "'Pacifico', cursive" },
  { label: "Playfair Display", value: "'Playfair Display', serif" },
  { label: "Barlow Condensed", value: "'Barlow Condensed', sans-serif" },
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Impact", value: "Impact, sans-serif" },
  { label: "Courier", value: "'Courier New', monospace" },
];

export const SWATCHES = [
  "#ffffff", "#000000", "#ef4444", "#f97316", "#f59e0b", "#eab308",
  "#84cc16", "#22c55e", "#10b981", "#14b8a6", "#06b6d4", "#0ea5e9",
  "#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#d946ef", "#ec4899",
  "#f43f5e", "#78716c", "#94a3b8", "#fbbf24",
];

export function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.click();
}

export function downloadText(content: string, filename: string, mime = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
