/* Bibliothèque de profils imprimantes DTF — convertibles Epson & DTF dédiés. */

export type PrinterProfile = {
  id: string;
  name: string;
  brand: string;
  widthMm: number;
  maxSheetMm: number; // hauteur max feuille
  type: "feuille" | "rouleau";
  dpi: number;
  mode: string;
  inks: string;
};

export const PRINTERS: PrinterProfile[] = [
  { id: "et8550", name: "EcoTank ET-8550 (convertie DTF)", brand: "Epson", widthMm: 329, maxSheetMm: 467, type: "feuille", dpi: 576, mode: "Photo 300/576 DPI", inks: "6 cartouches → CMYK + Blanc" },
  { id: "et8500", name: "EcoTank ET-8500 (convertie DTF)", brand: "Epson", widthMm: 329, maxSheetMm: 467, type: "feuille", dpi: 300, mode: "Photo 300 DPI", inks: "6 cartouches → CMYK + Blanc" },
  { id: "et15000", name: "EcoTank ET-15000 (convertie DTF)", brand: "Epson", widthMm: 329, maxSheetMm: 467, type: "feuille", dpi: 1440, mode: "Photo 1440 DPI", inks: "6 cartouches → CMYK + Blanc" },
  { id: "xp15000", name: "XP-15000 (convertie DTF)", brand: "Epson", widthMm: 329, maxSheetMm: 467, type: "feuille", dpi: 1440, mode: "Photo 1440 DPI", inks: "6 cartouches → CMYK + Blanc" },
  { id: "et5850", name: "EcoTank ET-5850 (convertie DTF)", brand: "Epson", widthMm: 329, maxSheetMm: 467, type: "feuille", dpi: 1440, mode: "Photo 1440 DPI", inks: "5 cartouches + bl. → CMYK + Blanc" },
  { id: "et4850", name: "EcoTank ET-4850 (convertie DTF)", brand: "Epson", widthMm: 216, maxSheetMm: 297, type: "feuille", dpi: 5760, mode: "Photo 5760 DPI", inks: "5 cartouches + bl. → CMYK + Blanc" },
  { id: "et2850", name: "EcoTank ET-2850 (convertie DTF)", brand: "Epson", widthMm: 216, maxSheetMm: 297, type: "feuille", dpi: 5760, mode: "Photo 5760 DPI", inks: "5 cartouches + bl. → CMYK + Blanc" },
  { id: "l1800", name: "L1800 / L1805 (convertie DTF)", brand: "Epson", widthMm: 329, maxSheetMm: 467, type: "feuille", dpi: 5760, mode: "Photo 5760 DPI", inks: "6 cartouches → CMYK + Blanc" },
  { id: "l14150", name: "L14150 (convertie DTF)", brand: "Epson", widthMm: 329, maxSheetMm: 467, type: "feuille", dpi: 5760, mode: "Photo 5760 DPI", inks: "6 cartouches → CMYK + Blanc" },
  { id: "l805", name: "L805 / L485 (convertie DTF)", brand: "Epson", widthMm: 216, maxSheetMm: 297, type: "feuille", dpi: 5760, mode: "Photo 5760 DPI", inks: "6 cartouches → CMYK + Blanc" },
  { id: "l380", name: "L380 (convertie DTF)", brand: "Epson", widthMm: 216, maxSheetMm: 297, type: "feuille", dpi: 5760, mode: "Photo 5760 DPI", inks: "4 cartouches + bl. → CMYK + Blanc" },
  { id: "xp600", name: "XP-600 (convertie DTF)", brand: "Epson", widthMm: 216, maxSheetMm: 297, type: "feuille", dpi: 5760, mode: "Photo 5760 DPI", inks: "5 cartouches + bl. → CMYK + Blanc" },
  { id: "xp4200", name: "XP-4200 / XP-5200 (convertie DTF)", brand: "Epson", widthMm: 329, maxSheetMm: 467, type: "feuille", dpi: 5760, mode: "Photo 5760 DPI", inks: "5 cartouches + bl. → CMYK + Blanc" },
  { id: "sc40500", name: "SC-P40500 (convertie DTF)", brand: "Epson", widthMm: 329, maxSheetMm: 467, type: "feuille", dpi: 2400, mode: "Photo 2400 DPI", inks: "5 cartouches + bl. → CMYK + Blanc" },
  { id: "dtf30", name: "DTF Roll 30 cm (L1800/ET-2850 + convertisseur)", brand: "Universel", widthMm: 300, maxSheetMm: 1500, type: "rouleau", dpi: 300, mode: "Photo 300 DPI", inks: "Roue d'entraînement + guide film PET" },
  { id: "dtf45", name: "DTF Roll 45 cm", brand: "Universel", widthMm: 450, maxSheetMm: 2000, type: "rouleau", dpi: 300, mode: "Photo 300 DPI", inks: "Convertisseur roll-to-roll" },
  { id: "dtf60", name: "DTF Roll 60 cm (production)", brand: "Universel", widthMm: 600, maxSheetMm: 2500, type: "rouleau", dpi: 300, mode: "Photo 300 DPI", inks: "Convertisseur roll-to-roll" },
  { id: "mimaki", name: "Mimaki JFX200-160 (DTF natif)", brand: "Mimaki", widthMm: 1600, maxSheetMm: 4000, type: "rouleau", dpi: 1200, mode: "DTF 1200 DPI", inks: "8 têtes : CMYK + WC + WY + W" },
  { id: "jtex", name: "JTEX JX3-600 (DTF natif)", brand: "JTEX", widthMm: 600, maxSheetMm: 2500, type: "rouleau", dpi: 720, mode: "DTF 720 DPI", inks: "6 canaux : CMYK + W + W" },
  { id: "konica", name: "Konica-Minolta AccuRix (DTF)", brand: "Konica", widthMm: 330, maxSheetMm: 2000, type: "rouleau", dpi: 1200, mode: "DTF 1200 DPI", inks: "CMYK + W" },
  { id: "roland", name: "Roland VersaEXPRESS (DTF via kit)", brand: "Roland", widthMm: 640, maxSheetMm: 2500, type: "rouleau", dpi: 720, mode: "DTF 720 DPI", inks: "CMYK + W" },
  { id: "brother", name: "Brother QL / DTF kit 10 cm", brand: "Brother", widthMm: 100, maxSheetMm: 1000, type: "rouleau", dpi: 600, mode: "Étiquettes 600 DPI", inks: "Petits volumes, stickers" },
  { id: "a4", name: "Feuilles DTF A4 (toute imprimante A4)", brand: "Universel", widthMm: 210, maxSheetMm: 297, type: "feuille", dpi: 300, mode: "Photo 300 DPI", inks: "PET A4" },
  { id: "a3", name: "Feuilles DTF A3 (A3+ 32,9 cm)", brand: "Universel", widthMm: 329, maxSheetMm: 467, type: "feuille", dpi: 300, mode: "Photo 300 DPI", inks: "PET A3" },
];

export const SHEET_PRESETS = [
  { id: "a4", label: "A4 — 210 × 297", w: 210, h: 297 },
  { id: "a3", label: "A3 — 297 × 420", w: 297, h: 420 },
  { id: "a3p", label: "A3+ — 329 × 467", w: 329, h: 467 },
  { id: "a2", label: "A2 — 420 × 594", w: 420, h: 594 },
  { id: "roll", label: "Rouleau — sur mesure", w: 300, h: 400 },
];

export const INK_SETS = [
  { id: "5c", label: "5 canaux — CMJN + Blanc", channels: ["C", "M", "Y", "K", "W"], order: "Blanc → Noir → Cyan → Magenta → Jaune" },
  { id: "8c", label: "8 canaux — CMJN + Blanc + clairs", channels: ["C", "M", "Y", "K", "W", "Lc", "Lm"], order: "Blanc → Noir → CMJ → clairs → Jaune" },
];

export const CHANNEL_META: Record<string, { label: string; color: string }> = {
  C: { label: "Cyan", color: "#00b7eb" },
  M: { label: "Magenta", color: "#ec008c" },
  Y: { label: "Jaune", color: "#ffd500" },
  K: { label: "Noir", color: "#1e293b" },
  W: { label: "Blanc", color: "#ffffff" },
  Lc: { label: "Cyan clair", color: "#66d4f5" },
  Lm: { label: "Magenta clair", color: "#f48fc4" },
};
