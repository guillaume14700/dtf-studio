"use client";

/* DTF Studio Pro — RIP DTF complet
   Imprimantes (24 profils) · canaux d'encre (5C/8C, densités) · séparations réelles
   · test de têtes · mise en page A4/A3/A3+/A2/rouleau avec copies, marges, espacement
   · impression directe (couleur / blanc / film) · coût de revient. */

import { useCallback, useEffect, useRef, useState } from "react";
import * as fabric from "fabric";
import {
  Printer, Download, Plus, Trash2, RotateCw, LayoutGrid, Droplets, Eye,
  SlidersHorizontal, Headphones, FileDown,
} from "lucide-react";
import { loadDesigns, getDesign, downloadDataUrl, mmToPx, pxToMm, Design } from "./store";
import { PRINTERS, SHEET_PRESETS, INK_SETS, CHANNEL_META } from "./printers";

type ChState = { on: boolean; density: number };
type SepResult = { channels: Record<string, HTMLCanvasElement>; white: HTMLCanvasElement };

const MAXSEP = 2400;
const PRINTCAP = 10000;

function erodeMask(cnv: HTMLCanvasElement, r: number) {
  if (r <= 0) return;
  const ctx = cnv.getContext("2d")!;
  for (let i = 0; i < r; i++) {
    ctx.globalCompositeOperation = "destination-in";
    ctx.drawImage(cnv, -1, 0); ctx.drawImage(cnv, 1, 0); ctx.drawImage(cnv, 0, -1); ctx.drawImage(cnv, 0, 1);
    ctx.globalCompositeOperation = "source-over";
  }
}

/** Séparations réelles : RGB → CMJN (+ clairs), blanc par seuil alpha, densités par canal. */
function computeSeparations(
  img: HTMLImageElement, thr: number, whiteOp: number, choke: number,
  inkSetId: string, chStates: Record<string, ChState>, maxPx: number
): SepResult {
  const cap = Math.max(img.naturalWidth, img.naturalHeight);
  const s = Math.min(1, maxPx / cap);
  const w = Math.max(1, Math.round(img.naturalWidth * s));
  const h = Math.max(1, Math.round(img.naturalHeight * s));
  const src = document.createElement("canvas");
  src.width = w; src.height = h;
  const sctx = src.getContext("2d")!;
  sctx.drawImage(img, 0, 0, w, h);
  const data = sctx.getImageData(0, 0, w, h).data;

  const set = INK_SETS.find((x) => x.id === inkSetId)!;
  const chans = set.channels.filter((c) => chStates[c]?.on);
  const out: SepResult = { channels: {}, white: null as unknown as HTMLCanvasElement };
  const buffers: Record<string, Uint8ClampedArray> = {};
  for (const c of chans) { const b = new Uint8ClampedArray(w * h); buffers[c] = b; out.channels[c] = null as unknown as HTMLCanvasElement; }
  const wb = new Uint8ClampedArray(w * h);

  for (let i = 0; i < w * h; i++) {
    const a = data[i * 4 + 3]!;
    const r = data[i * 4]! / 255, g = data[i * 4 + 1]! / 255, b = data[i * 4 + 2]! / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const k = 1 - max;
    let c = 0, m = 0, y = 0;
    if (k < 1) { c = (1 - r - k) / (1 - k); m = (1 - g - k) / (1 - k); y = (1 - b - k) / (1 - k); }
    let lc = 0, lm = 0;
    if (inkSetId === "8c") {
      const sat = max > 0 ? (max - min) / max : 0;
      lc = c * (1 - sat) * 0.6; lm = m * (1 - sat) * 0.6;
      c = Math.max(0, c - lc * 0.85); m = Math.max(0, m - lm * 0.85);
    }
    const vals: Record<string, number> = { C: c, M: m, Y: y, K: k, Lc: lc, Lm: lm };
    for (const ch of chans) {
      const d = (chStates[ch]?.density ?? 100) / 100;
      buffers[ch]![i] = Math.min(255, Math.round((vals[ch] ?? 0) * d * 255));
    }
    wb[i] = a >= thr ? Math.round(255 * whiteOp / 100) : 0;
  }
  for (const ch of chans) {
    const cnv = document.createElement("canvas");
    cnv.width = w; cnv.height = h;
    const ctx = cnv.getContext("2d")!;
    const id = ctx.createImageData(w, h);
    for (let i = 0; i < w * h; i++) {
      const v = 255 - buffers[ch]![i]!; // gris : noir = pleine encre
      id.data[i * 4] = v; id.data[i * 4 + 1] = v; id.data[i * 4 + 2] = v; id.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(id, 0, 0);
    out.channels[ch] = cnv;
  }
  const wcnv = document.createElement("canvas");
  wcnv.width = w; wcnv.height = h;
  const wctx = wcnv.getContext("2d")!;
  const wid = wctx.createImageData(w, h);
  for (let i = 0; i < w * h; i++) {
    wid.data[i * 4] = 255; wid.data[i * 4 + 1] = 255; wid.data[i * 4 + 2] = 255; wid.data[i * 4 + 3] = wb[i]!;
  }
  wctx.putImageData(wid, 0, 0);
  erodeMask(wcnv, choke);
  out.white = wcnv;
  return out;
}

export default function RipStudio({ initialId }: { initialId?: string | null }) {
  const [designs, setDesigns] = useState<Design[]>([]);
  const [srcUrl, setSrcUrl] = useState<string | null>(null);
  const [srcName, setSrcName] = useState("");
  const imgRef = useRef<HTMLImageElement | null>(null);

  /* Blanc */
  const [thr, setThr] = useState(128);
  const [whiteOp, setWhiteOp] = useState(100);
  const [choke, setChoke] = useState(1);
  const [mirror, setMirror] = useState(true);
  const [view, setView] = useState<"fusion" | "color" | "white">("fusion");

  /* Imprimante & feuille */
  const [printerIdx, setPrinterIdx] = useState(0);
  const [sheetId, setSheetId] = useState("a3p");
  const [rollLen, setRollLen] = useState(40);
  const [landscape, setLandscape] = useState(false);
  const [marginMm, setMarginMm] = useState(10);
  const [gapMm, setGapMm] = useState(8);
  const [copies, setCopies] = useState(4);
  const [itemHMm, setItemHMm] = useState(250);
  const [dpi, setDpi] = useState(300);

  /* Encres */
  const [inkSetId, setInkSetId] = useState("5c");
  const [chStates, setChStates] = useState<Record<string, ChState>>({
    C: { on: true, density: 100 }, M: { on: true, density: 100 }, Y: { on: true, density: 100 }, K: { on: true, density: 100 }, W: { on: true, density: 100 }, Lc: { on: true, density: 100 }, Lm: { on: true, density: 100 },
  });

  /* Coûts */
  const [mlColorM2, setMlColorM2] = useState(10);
  const [mlWhiteM2, setMlWhiteM2] = useState(14);
  const [eurColor, setEurColor] = useState(0.09);
  const [eurWhite, setEurWhite] = useState(0.11);
  const [filmEur, setFilmEur] = useState(1.5);

  const [stats, setStats] = useState<{ colorRatio: number; whiteRatio: number; wPx: number; hPx: number } | null>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const previewRef = useRef<HTMLCanvasElement>(null);
  const gangElRef = useRef<HTMLCanvasElement>(null);
  const gangRef = useRef<fabric.Canvas | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const printer = PRINTERS[printerIdx]!;
  const sheet = SHEET_PRESETS.find((x) => x.id === sheetId)!;
  const sheetWmm = sheetId === "roll" ? printer.widthMm : (landscape ? sheet.h : sheet.w);
  const sheetHmm = sheetId === "roll" ? rollLen * 10 : (landscape ? sheet.w : sheet.h);
  const sheetWpx = mmToPx(sheetWmm);
  const sheetHpx = mmToPx(sheetHmm);
  const gz = Math.min(880 / sheetWpx, 1);

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(""), 4500); };

  useEffect(() => { setDesigns(loadDesigns()); }, []);

  const loadFromDataUrl = useCallback((url: string, name: string) => {
    const img = new Image();
    img.onload = () => { imgRef.current = img; setSrcUrl(url); setSrcName(name); };
    img.src = url;
  }, []);

  const renderDesign = useCallback(async (d: Design): Promise<string> => {
    const fabricNS = await import("fabric");
    const sc = new fabricNS.StaticCanvas(undefined, { width: 1200, height: Math.round(1200 * (d.heightMm / d.widthMm)) });
    await sc.loadFromJSON(d.json);
    const url = sc.toDataURL({ format: "png", multiplier: Math.max(mmToPx(Math.min(d.widthMm, 120)) / 1200, 0.1) });
    sc.dispose();
    return url;
  }, []);

  useEffect(() => {
    (async () => {
      const d = getDesign(initialId ?? null) ?? loadDesigns()[0];
      if (d) loadFromDataUrl(await renderDesign(d), d.name);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialId]);

  /* Stats + prévisualisation */
  useEffect(() => {
    if (!srcUrl) return;
    const img = imgRef.current;
    const cv = previewRef.current;
    if (!img || !cv) return;
    const cap = 1600;
    const s0 = Math.min(1, cap / Math.max(img.naturalWidth, img.naturalHeight));
    const tw = Math.max(1, Math.round(img.naturalWidth * s0));
    const th = Math.max(1, Math.round(img.naturalHeight * s0));
    const src = document.createElement("canvas");
    src.width = tw; src.height = th;
    const sctx = src.getContext("2d")!;
    sctx.drawImage(img, 0, 0, tw, th);
    const d = sctx.getImageData(0, 0, tw, th);
    let cPx = 0, wPx = 0;
    for (let i = 0; i < d.data.length; i += 4) {
      if (d.data[i + 3]! >= thr) { cPx++; wPx++; }
    }
    setStats({ colorRatio: cPx / (tw * th), whiteRatio: wPx / (tw * th), wPx: img.naturalWidth, hPx: img.naturalHeight });

    /* masque blanc */
    const mask = document.createElement("canvas");
    mask.width = tw; mask.height = th;
    const mctx = mask.getContext("2d")!;
    const md = mctx.createImageData(tw, th);
    for (let i = 0; i < tw * th; i++) md.data[i * 4 + 3] = d.data[i * 4 + 3]! >= thr ? Math.round(255 * whiteOp / 100) : 0;
    mctx.putImageData(md, 0, 0);
    erodeMask(mask, choke);

    const maxW = 780;
    const ps = Math.min(maxW / tw, 1);
    cv.width = Math.round(tw * ps); cv.height = Math.round(th * ps);
    const ctx = cv.getContext("2d")!;
    ctx.clearRect(0, 0, cv.width, cv.height);
    const draw = (source: CanvasImageSource) => {
      ctx.save();
      if (mirror) { ctx.translate(cv.width, 0); ctx.scale(-1, 1); }
      ctx.drawImage(source, 0, 0, cv.width, cv.height);
      ctx.restore();
    };
    if (view === "color") { ctx.fillStyle = "#0f172a"; ctx.fillRect(0, 0, cv.width, cv.height); draw(img); }
    else if (view === "white") { ctx.fillStyle = "#000"; ctx.fillRect(0, 0, cv.width, cv.height); draw(mask); }
    else { ctx.fillStyle = "#3f3f46"; ctx.fillRect(0, 0, cv.width, cv.height); draw(mask); draw(img); }
  }, [srcUrl, view, mirror, thr, whiteOp, choke]);

  /* Gang sheet (fabric) */
  useEffect(() => {
    if (!gangElRef.current) return;
    const c = new fabric.Canvas(gangElRef.current, { backgroundColor: "#eef1f5", preserveObjectStacking: true });
    gangRef.current = c;
    const recompute = () => {
      const objs = c.getObjects();
      let inkC = 0, inkW = 0, occ = 0;
      for (const o of objs) {
        const st = (o as unknown as { stats?: { colorRatio: number; whiteRatio: number } }).stats;
        const wMm = pxToMm((o.width ?? 0) * (o.scaleX ?? 1));
        const hMm = pxToMm((o.height ?? 0) * (o.scaleY ?? 1));
        const area = (wMm * hMm) / 1_000_000;
        occ += area;
        if (st) { inkC += area * st.colorRatio * mlColorM2; inkW += area * st.whiteRatio * mlWhiteM2; }
      }
      const sheetM2 = (sheetWmm * sheetHmm) / 1_000_000;
      const costInk = inkC * eurColor + inkW * eurWhite;
      const costFilm = sheetM2 * filmEur;
      setGangTotals({ items: objs.length, occ: sheetM2 > 0 ? Math.min(100, (occ / sheetM2) * 100) : 0, inkColor: inkC, inkWhite: inkW, cost: costInk + costFilm, film: costFilm });
    };
    c.on("object:added", recompute);
    c.on("object:modified", recompute);
    c.on("object:removed", recompute);
    return () => { c.dispose(); gangRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [gangTotals, setGangTotals] = useState({ items: 0, occ: 0, inkColor: 0, inkWhite: 0, cost: 0, film: 0 });
  useEffect(() => { gangRef.current?.fire("object:modified"); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [mlColorM2, mlWhiteM2, eurColor, eurWhite, filmEur]);

  useEffect(() => {
    const c = gangRef.current;
    if (!c) return;
    c.setDimensions({ width: Math.round(sheetWpx * gz), height: Math.round(sheetHpx * gz) });
    c.setZoom(gz);
    c.requestRenderAll();
  }, [gz, sheetWpx, sheetHpx, printerIdx, sheetId, rollLen, landscape]);

  function makeSourceImage(): Promise<fabric.FabricImage> {
    return fabric.FabricImage.fromURL(srcUrl!);
  }

  /** Mise en page : grille de `copies` exemplaires, centrée, marges & espacement. */
  async function addTiles() {
    const c = gangRef.current;
    if (!c || !srcUrl || !stats) { flash("Chargez d'abord un design source"); return; }
    const img = await makeSourceImage();
    const aspect = (img.width ?? 1) / (img.height ?? 1);
    const margin = mmToPx(marginMm);
    const gap = mmToPx(gapMm);
    let itemH = mmToPx(itemHMm);
    let itemW = itemH * aspect;
    if (itemW + 2 * margin > sheetWpx) { itemW = sheetWpx - 2 * margin; itemH = itemW / aspect; }
    const cols = Math.max(1, Math.floor((sheetWpx - 2 * margin + gap) / (itemW + gap)));
    const rows = Math.max(1, Math.floor((sheetHpx - 2 * margin + gap) / (itemH + gap)));
    const n = Math.min(copies, cols * rows);
    const cellW = (sheetWpx - 2 * margin) / cols;
    const cellH = (sheetHpx - 2 * margin) / rows;
    for (let i = 0; i < n; i++) {
      const cl = await img.clone();
      const targetW = Math.min(cellW - gap, itemW * 1.05);
      const s = targetW / (img.width ?? 1);
      cl.set({
        left: margin + (i % cols + 0.5) * cellW, top: margin + (Math.floor(i / cols) + 0.5) * cellH,
        originX: "center", originY: "center", scaleX: s, scaleY: s,
        stats: { colorRatio: stats.colorRatio, whiteRatio: stats.whiteRatio },
        name: "Motif",
      } as never);
      c.add(cl);
    }
    c.requestRenderAll();
    flash(`📐 ${n} exemplaire(s) mis en page (${cols} × ${rows})`);
  }

  async function addSavedToGang(id: string) {
    const d = designs.find((x) => x.id === id);
    if (!d || !gangRef.current) return;
    const url = await renderDesign(d);
    const imgEl = new Image();
    await new Promise((res) => { imgEl.onload = res; imgEl.src = url; });
    const tmp = document.createElement("canvas");
    const cap = 1200;
    const s0 = Math.min(1, cap / Math.max(imgEl.naturalWidth, imgEl.naturalHeight));
    tmp.width = Math.round(imgEl.naturalWidth * s0); tmp.height = Math.round(imgEl.naturalHeight * s0);
    const tctx = tmp.getContext("2d")!;
    tctx.drawImage(imgEl, 0, 0, tmp.width, tmp.height);
    const data = tctx.getImageData(0, 0, tmp.width, tmp.height);
    let cPx = 0;
    for (let i = 0; i < data.data.length; i += 4) if (data.data[i + 3]! >= thr) cPx++;
    const img = await fabric.FabricImage.fromURL(url);
    const s = mmToPx(itemHMm) / (img.height ?? 1);
    const count = gangRef.current.getObjects().length;
    img.set({
      left: sheetWpx * 0.5 + (count % 3) * sheetWpx * 0.04,
      top: mmToPx(itemHMm) * 0.7 + Math.floor(count / 3) * mmToPx(itemHMm) * 1.15,
      originX: "center", originY: "center", scaleX: s, scaleY: s,
      stats: { colorRatio: cPx / (tmp.width * tmp.height), whiteRatio: cPx / (tmp.width * tmp.height) },
    } as never);
    gangRef.current.add(img);
    gangRef.current.requestRenderAll();
  }

  /* ---------- Exports & impression ---------- */
  function printJob(dataUrl: string, wMm: number, hMm: number, title: string) {
    const w = window.open("", "_blank");
    if (!w) { flash("Autorisez les fenêtres automatiques pour l'impression directe, puis réessayez."); return; }
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>
<style>@page{size:${wMm}mm ${hMm}mm;margin:0}html,body{margin:0;padding:0;background:#fff}img{width:${wMm}mm;height:auto;display:block}</style>
</head><body onload="setTimeout(function(){window.print()},500)"><img src="${dataUrl}" alt=""></body></html>`);
    w.document.close();
  }

  function sheetDataUrl(mulTarget: number): string | null {
    const c = gangRef.current;
    if (!c) return null;
    const finalW = sheetWpx * mulTarget;
    const mul = Math.min(mulTarget / gz, PRINTCAP / sheetWpx);
    if (mulTarget / gz > PRINTCAP / sheetWpx) {
      flash("Fiche trop grande pour cette résolution — réduisez la longueur du rouleau ou le DPI.");
    }
    void finalW;
    return c.toDataURL({ format: "png", multiplier: Math.max(mul, 0.02) });
  }

  function printFilm() {
    const url = sheetDataUrl(dpi / 300);
    if (!url) return;
    printJob(url, sheetWmm, sheetHmm, "Film DTF");
  }

  async function sourceLayer(layer: "color" | "white" | "fusion") {
    const img = imgRef.current;
    if (!img) { flash("Chargez un design source d'abord"); return; }
    const seps = computeSeparations(img, thr, whiteOp, choke, inkSetId, chStates, MAXSEP);
    const src = document.createElement("canvas");
    src.width = img.naturalWidth > PRINTCAP ? PRINTCAP : img.naturalWidth;
    src.height = Math.round(src.width * (img.naturalHeight / img.naturalWidth));
    const sctx = src.getContext("2d")!;
    const draw = (source: CanvasImageSource) => {
      sctx.save();
      if (mirror) { sctx.translate(src.width, 0); sctx.scale(-1, 1); }
      sctx.drawImage(source, 0, 0, src.width, src.height);
      sctx.restore();
    };
    if (layer === "color") draw(img);
    else if (layer === "white") draw(seps.white);
    else { draw(seps.white); draw(img); }
    const wMm = pxToMm(src.width), hMm = pxToMm(src.height);
    if (wMm > sheetWmm || hMm > sheetHmm) {
      flash(`Le motif (${wMm} × ${hMm} mm) dépasse la fiche (${sheetWmm} × ${sheetHmm} mm) — réduisez le visuel ou agrandissez la fiche.`);
    }
    printJob(src.toDataURL("image/png"), Math.min(wMm, sheetWmm), Math.min(hMm, sheetHmm), `Impression DTF — ${layer}`);
    flash(`🖨️ Impression « ${layer === "color" ? "couleur" : layer === "white" ? "blanc" : "fusion"} » envoyée — choisissez votre imprimante dans la fenêtre système`);
  }

  function exportChannel(ch: string) {
    const img = imgRef.current;
    if (!img) return;
    const seps = computeSeparations(img, thr, whiteOp, choke, inkSetId, chStates, MAXSEP);
    const cnv = ch === "W" ? seps.white : seps.channels[ch];
    if (!cnv) return;
    downloadDataUrl(cnv.toDataURL("image/png"), `${srcName || "design"}_canal-${ch}${mirror ? "_miroir" : ""}_${cnv.width}x${cnv.height}px.png`);
    flash(`📤 Canal ${ch} exporté`);
  }

  function exportAllChannels() {
    const img = imgRef.current;
    if (!img) return;
    const seps = computeSeparations(img, thr, whiteOp, choke, inkSetId, chStates, MAXSEP);
    const set = INK_SETS.find((x) => x.id === inkSetId)!;
    const queue = [...set.channels.filter((c) => chStates[c]?.on), "W"];
    queue.forEach((ch, i) => {
      setTimeout(() => {
        const cnv = ch === "W" ? seps.white : seps.channels[ch];
        if (cnv) downloadDataUrl(cnv.toDataURL("image/png"), `${srcName || "design"}_canal-${ch}_${cnv.width}x${cnv.height}px.png`);
      }, i * 450);
    });
    flash(`📤 ${queue.length} canaux exportés (séparations)`);
  }

  function headTestPage() {
    const set = INK_SETS.find((x) => x.id === inkSetId)!;
    const active = [...set.channels.filter((c) => chStates[c]?.on), "W"];
    const rowH = 110;
    const cnv = document.createElement("canvas");
    cnv.width = 2340; cnv.height = active.length * rowH + 80;
    const ctx = cnv.getContext("2d")!;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, cnv.width, cnv.height);
    ctx.fillStyle = "#111";
    ctx.font = "bold 34px Arial";
    ctx.fillText("Test de têtes — DTF Studio Pro", 40, 55);
    active.forEach((ch, i) => {
      const y = 80 + i * rowH;
      const meta = CHANNEL_META[ch]!;
      ctx.fillStyle = ch === "W" ? "#ffffff" : meta.color;
      ctx.fillRect(40, y, 300, rowH - 30);
      ctx.strokeStyle = "#999"; ctx.strokeRect(40, y, 300, rowH - 30);
      const grad = ctx.createLinearGradient(380, 0, 1100, 0);
      grad.addColorStop(0, "#fff"); grad.addColorStop(1, ch === "W" ? "#fff" : meta.color);
      ctx.fillStyle = grad;
      ctx.fillRect(380, y, 720, rowH - 30);
      ctx.strokeStyle = "#999"; ctx.strokeRect(380, y, 720, rowH - 30);
      ctx.fillStyle = ch === "W" ? "#ddd" : meta.color;
      for (let d = 0; d < 16; d++) ctx.fillRect(1180 + d * 36, y, 18, rowH - 30);
      ctx.fillStyle = "#111";
      ctx.font = "bold 28px Arial";
      ctx.fillText(`${ch} — ${meta.label}`, 1900, y + (rowH - 30) / 2 + 10);
    });
    printJob(cnv.toDataURL("image/png"), 297, 210, "Test de têtes DTF");
    flash("🖨️ Test de têtes envoyé à l'impression (A4 paysage)") ;
  }

  function exportGang() {
    const url = sheetDataUrl(dpi / 300);
    if (!url) return;
    downloadDataUrl(url, `gang-sheet_${sheetWmm}x${sheetHmm}mm_${dpi}dpi${mirror ? "_miroir" : ""}.png`);
    flash("📤 Gang sheet exportée");
  }

  const srcMM = stats ? { w: pxToMm(stats.wPx), h: pxToMm(stats.hPx) } : null;
  const costPerPiece = gangTotals.items > 0 ? gangTotals.cost / gangTotals.items : 0;
  const sheetLabel = sheetId === "roll" ? `Rouleau ${sheetWmm} × ${rollLen} cm` : `${sheet.label}${landscape ? " (paysage)" : ""}`;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-indigo-500 mb-1.5 flex items-center gap-2"><Printer size={14} /> Station d'impression</p>
          <h1 className="font-display text-4xl md:text-5xl font-extrabold text-slate-900 leading-none tracking-tight">Impression DTF</h1>
          <p className="text-sm text-slate-500 mt-2 max-w-3xl">
            Canal blanc, séparations d&apos;encre, test de têtes, mise en page {sheetLabel.toLowerCase()} —
            puis impression directe sur votre imprimante DTF.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 bg-white border border-slate-200 rounded-full px-4 py-2 text-xs font-bold text-slate-600 shadow-sm">
          <Droplets size={14} className="text-indigo-500" /> {printer.brand} · {printer.widthMm} mm · {printer.dpi} DPI
        </span>
      </div>

      {msg && <div className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-2">{msg}</div>}

      <div className="grid xl:grid-cols-[minmax(0,1fr)_390px] gap-4">
        {/* Colonne principale */}
        <div className="space-y-4">
          {/* Source */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <p className={`${""} text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-2`}>Design source</p>
              <select value="" onChange={(e) => e.target.value && (async () => {
                const d = designs.find((x) => x.id === e.target.value);
                if (d) loadFromDataUrl(await renderDesign(d), d.name);
              })()} className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-600 outline-none max-w-52">
                <option value="">— Mes designs ({designs.length}) —</option>
                {designs.map((d) => <option key={d.id} value={d.id}>{d.name} · {d.widthMm}×{d.heightMm}mm</option>)}
              </select>
              <button onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-600 cursor-pointer">
                <Plus size={13} /> Importer un PNG
              </button>
              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                const r = new FileReader();
                r.onload = () => loadFromDataUrl(String(r.result), f.name);
                r.readAsDataURL(f);
                e.target.value = "";
              }} />
              {srcMM && <span className="text-[11px] text-slate-400 font-mono ml-auto">{srcName} — {stats?.wPx}×{stats?.hPx}px · {srcMM.w}×{srcMM.h}mm</span>}
            </div>
            <div className="flex gap-1.5 mb-3 flex-wrap items-center">
              {([["fusion", "Film (blanc + couleur)"], ["color", "Couleur"], ["white", "Blanc"]] as const).map(([k, l]) => (
                <button key={k} onClick={() => setView(k)} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${view === k ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                  <Eye size={12} className="inline mr-1" />{l}
                </button>
              ))}
              <label className="ml-auto inline-flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200">
                <input type="checkbox" checked={mirror} onChange={(e) => setMirror(e.target.checked)} className="accent-indigo-600" />
                Miroir (standard DTF)
              </label>
            </div>
            <div className="rounded-xl overflow-hidden bg-slate-900 flex items-center justify-center min-h-60 p-3">
              {srcUrl ? <canvas ref={previewRef} className="max-w-full h-auto" /> : <p className="text-sm text-slate-500 py-16">Sélectionnez un design ou importez un PNG exporté depuis l&apos;Éditeur.</p>}
            </div>
            {srcMM && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3 text-center">
                {[
                  { l: "Surface encrée", v: `${(stats!.colorRatio * srcMM.w * srcMM.h / 1000).toFixed(1)} dm²` },
                  { l: "Surface blanc", v: `${(stats!.whiteRatio * srcMM.w * srcMM.h / 1000).toFixed(1)} dm²` },
                  { l: "Encre couleur", v: `${(stats!.colorRatio * (srcMM.w * srcMM.h / 1e6) * mlColorM2).toFixed(1)} ml` },
                  { l: "Encre blanche", v: `${(stats!.whiteRatio * (srcMM.w * srcMM.h / 1e6) * mlWhiteM2).toFixed(1)} ml` },
                ].map((x) => (
                  <div key={x.l} className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-2">
                    <p className="font-display text-lg font-extrabold text-slate-900">{x.v}</p>
                    <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">{x.l}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Mise en page */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-2 flex items-center gap-1.5"><LayoutGrid size={13} /> Mise en page — {sheetLabel}</p>
              <select value={sheetId} onChange={(e) => setSheetId(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-600 outline-none">
                {SHEET_PRESETS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
              {sheetId === "roll" && (
                <label className="flex items-center gap-1.5 text-xs text-slate-500">Longueur
                  <input type="number" min={10} max={250} value={rollLen} onChange={(e) => setRollLen(Math.max(10, Math.min(250, Number(e.target.value) || 40)))} className="w-16 bg-slate-50 border border-slate-200 rounded-lg px-1.5 py-1 text-slate-700 outline-none" /> cm
                </label>
              )}
              {sheetId !== "roll" && (
                <button onClick={() => setLandscape(!landscape)} className="inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-600 cursor-pointer">
                  <RotateCw size={12} /> {landscape ? "Paysage" : "Portrait"}
                </button>
              )}
              <label className="flex items-center gap-1.5 text-xs text-slate-500">Copies
                <input type="number" min={1} max={48} value={copies} onChange={(e) => setCopies(Math.max(1, Math.min(48, Number(e.target.value) || 1)))} className="w-14 bg-slate-50 border border-slate-200 rounded-lg px-1.5 py-1 text-slate-700 outline-none" />
              </label>
              <label className="flex items-center gap-1.5 text-xs text-slate-500">Motif haut
                <input type="number" min={20} max={1000} value={itemHMm} onChange={(e) => setItemHMm(Number(e.target.value) || 100)} className="w-16 bg-slate-50 border border-slate-200 rounded-lg px-1.5 py-1 text-slate-700 outline-none" /> mm
              </label>
              <label className="flex items-center gap-1.5 text-xs text-slate-500">Marges
                <input type="number" min={0} max={50} value={marginMm} onChange={(e) => setMarginMm(Number(e.target.value) || 0)} className="w-14 bg-slate-50 border border-slate-200 rounded-lg px-1.5 py-1 text-slate-700 outline-none" /> mm
              </label>
              <select value={dpi} onChange={(e) => setDpi(Number(e.target.value))} className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-600 outline-none" aria-label="DPI">
                {[144, 300, 576, 720].map((d) => <option key={d} value={d}>{d} DPI</option>)}
              </select>
              <div className="flex-1" />
              <button onClick={addTiles} className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-3.5 py-2 text-xs font-extrabold cursor-pointer transition-colors shadow-lg shadow-indigo-600/20">
                <LayoutGrid size={13} /> Mettre en page ({copies} copies)
              </button>
            </div>
            <div className="rounded-xl overflow-auto bg-slate-100 border border-slate-200 flex justify-center p-2">
              <canvas ref={gangElRef} />
            </div>
            <div className="flex gap-2 mt-3 flex-wrap">
              <button onClick={() => { const c = gangRef.current; const o = c?.getActiveObject(); if (o) { o.rotate(((o.angle ?? 0) + 90) % 360); o.setCoords(); c?.requestRenderAll(); c?.fire("object:modified"); } }} className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-600 cursor-pointer"><RotateCw size={13} /> Pivoter 90°</button>
              <button onClick={() => { const c = gangRef.current; const o = c?.getActiveObject(); if (o) { c?.remove(o); c?.requestRenderAll(); } }} className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-red-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-600 cursor-pointer"><Trash2 size={13} /> Retirer la sélection</button>
              <button onClick={() => { gangRef.current?.getObjects().slice().forEach((o) => gangRef.current?.remove(o)); gangRef.current?.requestRenderAll(); }} className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-red-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-600 cursor-pointer"><Trash2 size={13} /> Vider la fiche</button>
              <select value="" onChange={(e) => e.target.value && addSavedToGang(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-600 outline-none max-w-44">
                <option value="">+ autre design…</option>
                {designs.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Colonne droite */}
        <div className="space-y-4">
          {/* Imprimante */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Imprimante</p>
            <select value={printerIdx} onChange={(e) => setPrinterIdx(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2.5 text-sm text-slate-800 font-semibold outline-none">
              {PRINTERS.map((p, i) => <option key={p.id} value={i}>{p.name}</option>)}
            </select>
            <div className="grid grid-cols-3 gap-1.5 mt-2.5 text-center">
              {[
                { l: "Largeur", v: `${printer.widthMm} mm` },
                { l: "Mode", v: printer.mode },
                { l: "Type", v: printer.type === "rouleau" ? "Rouleau" : "Feuilles" },
              ].map((x) => (
                <div key={x.l} className="bg-slate-50 border border-slate-200 rounded-lg px-1 py-1.5">
                  <p className="text-[11px] font-extrabold text-slate-800">{x.v}</p>
                  <p className="text-[9px] uppercase text-slate-400 font-bold">{x.l}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Canaux d'encre */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5"><SlidersHorizontal size={13} /> Canaux d&apos;encre</p>
            <select value={inkSetId} onChange={(e) => setInkSetId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-700 outline-none mb-3">
              {INK_SETS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
            <div className="space-y-2">
              {INK_SETS.find((x) => x.id === inkSetId)!.channels.map((ch) => {
                const st = chStates[ch] ?? { on: true, density: 100 };
                const meta = CHANNEL_META[ch]!;
                return (
                  <div key={ch} className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 ${st.on ? "border-slate-200 bg-white" : "border-slate-100 bg-slate-50 opacity-60"}`}>
                    <span className="w-5 h-5 rounded-full border border-black/15 shrink-0" style={{ background: ch === "W" ? "#fff" : meta.color }} />
                    <span className="w-20 text-xs font-bold text-slate-700">{meta.label}</span>
                    <input type="range" min={30} max={200} value={st.density} disabled={!st.on}
                      onChange={(e) => setChStates({ ...chStates, [ch]: { ...st, density: Number(e.target.value) } })}
                      className="flex-1 accent-indigo-600 h-1" />
                    <span className="w-9 text-right text-[10px] font-mono text-slate-400">{st.density}%</span>
                    <button onClick={() => setChStates({ ...chStates, [ch]: { ...st, on: !st.on } })}
                      className={`text-[10px] font-extrabold uppercase px-2 py-1 rounded-md cursor-pointer ${st.on ? "bg-emerald-50 text-emerald-600" : "bg-slate-200 text-slate-500"}`}>
                      {st.on ? "ON" : "OFF"}
                    </button>
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-slate-400 mt-2">Ordre d&apos;impression conseillé : {INK_SETS.find((x) => x.id === inkSetId)!.order}</p>
            <div className="grid grid-cols-2 gap-1.5 mt-3">
              <button onClick={exportAllChannels} className="inline-flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg px-2 py-2 text-[11px] font-extrabold cursor-pointer transition-colors">
                <FileDown size={13} /> Toutes les séparations
              </button>
              <button onClick={headTestPage} className="inline-flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-lg px-2 py-2 text-[11px] font-extrabold cursor-pointer transition-colors">
                <Headphones size={13} /> Test de têtes
              </button>
            </div>
          </div>

          {/* Coût */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5"><Droplets size={13} /> Coût de revient — {sheetLabel}</p>
            <div className="grid grid-cols-3 gap-2 text-center mb-2">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-2">
                <p className="font-display text-xl font-extrabold text-slate-900">{gangTotals.items}</p>
                <p className="text-[9px] uppercase text-slate-400 font-bold">motifs</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-2">
                <p className="font-display text-xl font-extrabold text-slate-900">{Math.round(gangTotals.occ)}%</p>
                <p className="text-[9px] uppercase text-slate-400 font-bold">film utilisé</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-2">
                <p className="font-display text-lg font-extrabold text-indigo-600">{gangTotals.inkColor.toFixed(0)} ml</p>
                <p className="text-[9px] uppercase text-slate-400 font-bold">couleur</p>
              </div>
            </div>
            <div className="bg-gradient-to-r from-indigo-50 to-fuchsia-50 border border-indigo-200 rounded-xl py-2.5 mb-3 text-center">
              <span className="font-display text-3xl font-extrabold text-indigo-700">{gangTotals.cost.toFixed(2)} €</span>
              <span className="block text-[10px] uppercase text-slate-400 font-bold">la fiche · soit {costPerPiece.toFixed(2)} € / pièce</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500">
              <label>ml/m² couleur<input type="number" step="0.5" value={mlColorM2} onChange={(e) => setMlColorM2(Number(e.target.value) || 0)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-1.5 py-1 text-slate-700 outline-none mt-0.5" /></label>
              <label>ml/m² blanc<input type="number" step="0.5" value={mlWhiteM2} onChange={(e) => setMlWhiteM2(Number(e.target.value) || 0)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-1.5 py-1 text-slate-700 outline-none mt-0.5" /></label>
              <label>€/ml couleur<input type="number" step="0.01" value={eurColor} onChange={(e) => setEurColor(Number(e.target.value) || 0)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-1.5 py-1 text-slate-700 outline-none mt-0.5" /></label>
              <label>€/ml blanc<input type="number" step="0.01" value={eurWhite} onChange={(e) => setEurWhite(Number(e.target.value) || 0)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-1.5 py-1 text-slate-700 outline-none mt-0.5" /></label>
              <label className="col-span-2">€/m² de film PET (adhésif)<input type="number" step="0.1" value={filmEur} onChange={(e) => setFilmEur(Number(e.target.value) || 0)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-1.5 py-1 text-slate-700 outline-none mt-0.5" /></label>
            </div>
          </div>

          {/* Impression directe */}
          <div className="bg-slate-900 rounded-2xl p-4 shadow-lg">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">Impression directe</p>
            <div className="space-y-2">
              <button onClick={printFilm} className="w-full inline-flex items-center justify-center gap-2 bg-white text-slate-900 hover:bg-slate-100 rounded-xl px-4 py-3 font-display font-extrabold uppercase tracking-wide text-sm cursor-pointer transition-colors">
                <Printer size={16} /> Imprimer le film ({gangTotals.items} motif{gangTotals.items > 1 ? "s" : ""})
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => sourceLayer("white")} className="inline-flex items-center justify-center gap-1.5 bg-white/10 hover:bg-white/20 text-white border border-white/15 rounded-lg px-2 py-2.5 text-[11px] font-extrabold cursor-pointer transition-colors">
                  Blanc seul
                </button>
                <button onClick={() => sourceLayer("color")} className="inline-flex items-center justify-center gap-1.5 bg-white/10 hover:bg-white/20 text-white border border-white/15 rounded-lg px-2 py-2.5 text-[11px] font-extrabold cursor-pointer transition-colors">
                  Couleur seule
                </button>
              </div>
              <button onClick={exportGang} className="w-full inline-flex items-center justify-center gap-2 bg-transparent border border-white/20 hover:bg-white/10 text-white rounded-lg px-4 py-2.5 text-xs font-extrabold cursor-pointer transition-colors">
                <Download size={14} /> Exporter la fiche (PNG {dpi} DPI)
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-3 leading-relaxed">
              La fenêtre d&apos;impression système s&apos;ouvre : sélectionnez votre imprimante DTF et le mode
              « Photo / haute qualité ». Les séparations par canal servent aux configurations multi-passe ou aux
              RIP d&apos;atelier pilotant les canaux d&apos;encre.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
