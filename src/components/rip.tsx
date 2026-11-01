"use client";

/* DTF Studio Pro — RIP : canal blanc (seuil/opacité/choke), miroir, profils imprimantes,
   gang sheet multi-designs, estimation encre & coût, exports PNG 300 DPI. */

import { useCallback, useEffect, useRef, useState } from "react";
import * as fabric from "fabric";
import { Printer, Download, Plus, Trash2, RotateCw, Info, Layers, Droplets, Eye } from "lucide-react";
import { loadDesigns, getDesign, downloadDataUrl, mmToPx, pxToMm, Design } from "./store";

const PROFILES = [
  { id: "et8550", name: "Epson EcoTank ET-8550 (convertie DTF)", widthMm: 329, note: "A3+ 329 mm · convertible, feuilles ou rouleau 30 cm" },
  { id: "xp15000", name: "Epson XP-15000 (convertie DTF)", widthMm: 329, note: "A3+ 329 mm · conversion DTF très courante" },
  { id: "dtf30", name: "Imprimante DTF 30 cm (rouleau)", widthMm: 300, note: "Roll-to-roll PET 30 cm · L1800/L805 converties" },
  { id: "dtf60", name: "Imprimante DTF 60 cm (rouleau)", widthMm: 600, note: "Roll-to-roll PET 60 cm · production" },
  { id: "a4", name: "Feuilles DTF A4", widthMm: 210, note: "PET feuilles 210 × 297 mm" },
];

const MAXPX = 4200;

type Stats = { colorRatio: number; whiteRatio: number; wPx: number; hPx: number };

function erodeMask(cnv: HTMLCanvasElement, r: number) {
  if (r <= 0) return;
  const ctx = cnv.getContext("2d")!;
  for (let i = 0; i < r; i++) {
    ctx.globalCompositeOperation = "destination-in";
    ctx.drawImage(cnv, -1, 0);
    ctx.drawImage(cnv, 1, 0);
    ctx.drawImage(cnv, 0, -1);
    ctx.drawImage(cnv, 0, 1);
    ctx.globalCompositeOperation = "source-over";
  }
}

export default function RipStudio({ initialId }: { initialId?: string | null }) {
  const [designs, setDesigns] = useState<Design[]>([]);
  const [srcUrl, setSrcUrl] = useState<string | null>(null);
  const [srcName, setSrcName] = useState("");
  const imgRef = useRef<HTMLImageElement | null>(null);

  const [thr, setThr] = useState(128);
  const [whiteOp, setWhiteOp] = useState(100);
  const [choke, setChoke] = useState(2);
  const [mirror, setMirror] = useState(true);
  const [view, setView] = useState<"color" | "white" | "fusion">("fusion");

  const [profileIdx, setProfileIdx] = useState(2);
  const [lengthCm, setLengthCm] = useState(40);
  const [itemHMm, setItemHMm] = useState(250);

  const [mlColorM2, setMlColorM2] = useState(10);
  const [mlWhiteM2, setMlWhiteM2] = useState(14);
  const [eurColor, setEurColor] = useState(0.09);
  const [eurWhite, setEurWhite] = useState(0.11);
  const [filmEur, setFilmEur] = useState(1.5);

  const [stats, setStats] = useState<Stats | null>(null);
  const [gangTotals, setGangTotals] = useState<{ items: number; occ: number; inkColor: number; inkWhite: number; cost: number; film: number }>({ items: 0, occ: 0, inkColor: 0, inkWhite: 0, cost: 0, film: 0 });
  const [msg, setMsg] = useState("");

  const previewRef = useRef<HTMLCanvasElement>(null);
  const gangElRef = useRef<HTMLCanvasElement>(null);
  const gangRef = useRef<fabric.Canvas | null>(null);
  const maskRef = useRef<HTMLCanvasElement | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const profile = PROFILES[profileIdx]!;
  const sheetWpx = mmToPx(profile.widthMm);
  const sheetHpx = mmToPx(lengthCm * 10);
  const gz = Math.min(880 / sheetWpx, 1);

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(""), 4000); };

  useEffect(() => { setDesigns(loadDesigns()); }, []);

  /* ---------- Charger une source ---------- */
  const loadFromDataUrl = useCallback((url: string, name: string) => {
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      setSrcUrl(url);
      setSrcName(name);
    };
    img.src = url;
  }, []);

  const renderDesign = useCallback(async (d: Design): Promise<string> => {
    const fabricNS = await import("fabric");
    const w = Math.min(mmToPx(d.widthMm), MAXPX);
    const sc = new fabricNS.StaticCanvas(undefined, { width: 1200, height: Math.round(1200 * (d.heightMm / d.widthMm)) });
    await sc.loadFromJSON(d.json);
    const url = sc.toDataURL({ format: "png", multiplier: Math.max(w / 1200, 0.1) });
    sc.dispose();
    return url;
  }, []);

  useEffect(() => {
    (async () => {
      const d = getDesign(initialId ?? null) ?? loadDesigns()[0];
      if (d) {
        const url = await renderDesign(d);
        loadFromDataUrl(url, d.name);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialId]);

  async function pickDesign(id: string) {
    const d = designs.find((x) => x.id === id);
    if (!d) return;
    loadFromDataUrl(await renderDesign(d), d.name);
  }

  /* ---------- Pipeline blanc + preview ---------- */
  const buildMask = useCallback((): HTMLCanvasElement | null => {
    const img = imgRef.current;
    if (!img) return null;
    let w = img.naturalWidth, h = img.naturalHeight;
    const cap = Math.max(w, h);
    if (cap > MAXPX) { const s = MAXPX / cap; w = Math.round(w * s); h = Math.round(h * s); }
    const src = document.createElement("canvas");
    src.width = w; src.height = h;
    const sctx = src.getContext("2d")!;
    sctx.drawImage(img, 0, 0, w, h);
    const data = sctx.getImageData(0, 0, w, h);

    const mask = document.createElement("canvas");
    mask.width = w; mask.height = h;
    const mctx = mask.getContext("2d")!;
    const md = mctx.createImageData(w, h);
    let colorPx = 0, whitePx = 0;
    for (let i = 0; i < data.data.length; i += 4) {
      const a = data.data[i + 3]!;
      if (a >= thr) {
        colorPx++;
        md.data[i] = 255; md.data[i + 1] = 255; md.data[i + 2] = 255;
        md.data[i + 3] = Math.round((whiteOp / 100) * 255);
      }
    }
    mctx.putImageData(md, 0, 0);
    erodeMask(mask, choke);
    if (whiteOp < 100 || choke > 0) {
      const after = mctx.getImageData(0, 0, w, h);
      whitePx = 0;
      for (let i = 3; i < after.data.length; i += 4) if (after.data[i]! > 8) whitePx++;
    } else whitePx = colorPx;

    maskRef.current = mask;
    setStats({ colorRatio: colorPx / (w * h), whiteRatio: whitePx / (w * h), wPx: w, hPx: h });
    return mask;
  }, [thr, whiteOp, choke]);

  useEffect(() => {
    if (!srcUrl) return;
    const mask = buildMask();
    const img = imgRef.current;
    const cv = previewRef.current;
    if (!img || !cv || !mask) return;
    const maxW = 820;
    const s = Math.min(maxW / mask.width, 1);
    cv.width = Math.round(mask.width * s);
    cv.height = Math.round(mask.height * s);
    const ctx = cv.getContext("2d")!;
    ctx.clearRect(0, 0, cv.width, cv.height);
    const draw = (source: CanvasImageSource) => {
      ctx.save();
      if (mirror) { ctx.translate(cv.width, 0); ctx.scale(-1, 1); }
      ctx.drawImage(source, 0, 0, cv.width, cv.height);
      ctx.restore();
    };
    if (view === "color") {
      ctx.fillStyle = "#111";
      ctx.fillRect(0, 0, cv.width, cv.height);
      draw(img);
    } else if (view === "white") {
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, cv.width, cv.height);
      draw(mask);
    } else {
      ctx.fillStyle = "#2a2a2e";
      ctx.fillRect(0, 0, cv.width, cv.height);
      draw(mask);
      draw(img);
    }
  }, [srcUrl, view, mirror, buildMask]);

  /* ---------- Exports source ---------- */
  function exportLayer(layer: "color" | "white" | "fusion") {
    const img = imgRef.current;
    if (!img) return;
    const mask = maskRef.current ?? buildMask();
    if (!mask) return;
    const out = document.createElement("canvas");
    out.width = mask.width; out.height = mask.height;
    const ctx = out.getContext("2d")!;
    const draw = (source: CanvasImageSource) => {
      ctx.save();
      if (mirror) { ctx.translate(out.width, 0); ctx.scale(-1, 1); }
      ctx.drawImage(source, 0, 0, out.width, out.height);
      ctx.restore();
    };
    if (layer === "color") draw(img);
    else if (layer === "white") draw(mask);
    else { draw(mask); draw(img); }
    downloadDataUrl(out.toDataURL("image/png"), `${srcName || "design"}_${layer}${mirror ? "_miroir" : ""}_${out.width}x${out.height}px_300dpi.png`);
    flash(`📤 ${layer === "color" ? "Couleur" : layer === "white" ? "Canal blanc" : "Fusion"} exporté en 300 DPI${mirror ? " (miroir)" : ""}`);
  }

  /* ---------- Gang sheet ---------- */
  useEffect(() => {
    if (!gangElRef.current) return;
    const c = new fabric.Canvas(gangElRef.current, { backgroundColor: "#101014", preserveObjectStacking: true });
    gangRef.current = c;
    const recompute = () => {
      const objs = c.getObjects();
      let inkC = 0, inkW = 0, occ = 0;
      for (const o of objs) {
        const st = (o as unknown as { stats?: Stats }).stats;
        const wMm = pxToMm((o.width ?? 0) * (o.scaleX ?? 1));
        const hMm = pxToMm((o.height ?? 0) * (o.scaleY ?? 1));
        const area = (wMm * hMm) / 1_000_000;
        occ += area;
        if (st) { inkC += area * st.colorRatio * mlColorM2; inkW += area * st.whiteRatio * mlWhiteM2; }
      }
      const sheetM2 = (profile.widthMm * lengthCm * 10) / 1_000_000;
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

  useEffect(() => {
    const c = gangRef.current;
    if (!c) return;
    c.setDimensions({ width: Math.round(sheetWpx * gz), height: Math.round(sheetHpx * gz) });
    c.setZoom(gz);
    c.requestRenderAll();
  }, [profileIdx, lengthCm, gz, sheetWpx, sheetHpx]);

  /* Re-calcul des coûts quand les tarifs changent */
  useEffect(() => {
    const c = gangRef.current;
    if (c) c.fire("object:modified");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mlColorM2, mlWhiteM2, eurColor, eurWhite, filmEur]);

  async function addSourceToGang() {
    const c = gangRef.current;
    const st = stats;
    if (!c || !srcUrl || !st) { flash("Chargez d'abord un design source"); return; }
    const img = await fabric.FabricImage.fromURL(srcUrl);
    const hPx = mmToPx(itemHMm);
    const s = hPx / (img.height ?? 1);
    const count = c.getObjects().length;
    img.set({ left: sheetWpx * 0.5 + (count % 3) * sheetWpx * 0.05, top: hPx * 0.6 + Math.floor(count / 3) * hPx * 1.15, originX: "center", originY: "center", scaleX: s, scaleY: s, stats: st } as never);
    c.add(img);
    c.setActiveObject(img);
    c.requestRenderAll();
  }

  async function addSavedToGang(id: string) {
    const d = designs.find((x) => x.id === id);
    if (!d || !gangRef.current) return;
    const url = await renderDesign(d);
    const imgEl = new Image();
    await new Promise((res) => { imgEl.onload = res; imgEl.src = url; });
    const tmp = document.createElement("canvas");
    tmp.width = imgEl.naturalWidth; tmp.height = imgEl.naturalHeight;
    const tctx = tmp.getContext("2d")!;
    tctx.drawImage(imgEl, 0, 0);
    const data = tctx.getImageData(0, 0, tmp.width, tmp.height);
    let cPx = 0, wPx = 0;
    for (let i = 0; i < data.data.length; i += 4) {
      if (data.data[i + 3]! >= thr) { cPx++; wPx++; }
    }
    const st: Stats = { colorRatio: cPx / (tmp.width * tmp.height), whiteRatio: wPx / (tmp.width * tmp.height), wPx: tmp.width, hPx: tmp.height };
    const img = await fabric.FabricImage.fromURL(url);
    const s = mmToPx(itemHMm) / (img.height ?? 1);
    const count = gangRef.current.getObjects().length;
    img.set({ left: sheetWpx * 0.5, top: mmToPx(itemHMm) * 0.6 + Math.floor(count / 3) * mmToPx(itemHMm) * 1.15, originX: "center", originY: "center", scaleX: s, scaleY: s, stats: st } as never);
    gangRef.current.add(img);
    gangRef.current.requestRenderAll();
  }

  function exportGang() {
    const c = gangRef.current;
    if (!c || c.getObjects().length === 0) { flash("Ajoutez au moins un design sur le film"); return; }
    const full = 1 / gz;
    const maxMul = 12000 / sheetHpx;
    const mul = Math.min(full, maxMul);
    const dpi = Math.round(mul * gz * 300);
    downloadDataUrl(c.toDataURL({ format: "png", multiplier: mul }), `gang-sheet_${profile.widthMm}mm_x_${lengthCm}cm_${dpi}dpi${mirror ? "_miroir" : ""}.png`);
    flash(`📤 Gang sheet exportée (${dpi} DPI${mul < full ? " — réduit pour rester sous la limite navigateur, divisez la longueur si besoin" : ""})`);
  }

  const srcMM = stats ? { w: pxToMm(stats.wPx), h: pxToMm(stats.hPx) } : null;

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-amber-400 mb-1.5 flex items-center gap-2"><Printer size={14} /> Préparation d'impression</p>
        <h1 className="font-display text-4xl md:text-5xl font-extrabold uppercase text-white leading-none">RIP DTF</h1>
        <p className="text-sm text-gray-400 mt-2 max-w-3xl">
          Canal blanc automatique, miroir, gang sheet et exports 300 DPI — prêts pour Epson ET-8550, XP-15000
          et toutes les imprimantes converties / DTF natif.
        </p>
      </div>

      {msg && <div className="text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-md px-3 py-2">{msg}</div>}

      <div className="grid xl:grid-cols-[minmax(0,1fr)_400px] gap-4">
        {/* Colonne principale */}
        <div className="space-y-4">
          {/* Source + vues */}
          <div className="rounded-xl border border-[#2e3038] bg-[#202128] p-4">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mr-2">1 · Design source</p>
              <select value="" onChange={(e) => e.target.value && pickDesign(e.target.value)} className="bg-[#17181d] border border-[#2e3038] rounded px-2 py-1.5 text-xs text-gray-300 outline-none max-w-52">
                <option value="">— Designs enregistrés ({designs.length}) —</option>
                {designs.map((d) => <option key={d.id} value={d.id}>{d.name} · {d.widthMm}×{d.heightMm}mm</option>)}
              </select>
              <button onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-1.5 bg-white/6 hover:bg-white/12 border border-[#2e3038] rounded px-3 py-1.5 text-xs font-bold text-gray-300 cursor-pointer">
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
              {srcMM && <span className="text-[11px] text-gray-500 font-mono ml-auto">{srcName} — {stats?.wPx}×{stats?.hPx}px · {srcMM.w}×{srcMM.h}mm @300dpi</span>}
            </div>

            <div className="flex gap-1.5 mb-3 flex-wrap">
              {([["fusion", "Fusion (tissu foncé)"], ["color", "Couleur"], ["white", "Canal blanc"]] as const).map(([k, l]) => (
                <button key={k} onClick={() => setView(k)} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${view === k ? "bg-amber-400 text-[#17181d]" : "bg-white/6 text-gray-400 hover:bg-white/12"}`}>
                  <Eye size={12} className="inline mr-1" />{l}
                </button>
              ))}
              <label className="ml-auto inline-flex items-center gap-2 text-xs font-bold text-gray-300 cursor-pointer px-3 py-1.5 rounded-md bg-white/6 border border-[#2e3038]">
                <input type="checkbox" checked={mirror} onChange={(e) => setMirror(e.target.checked)} className="accent-amber-400" />
                Miroir (standard DTF)
              </label>
            </div>

            <div className="rounded-lg overflow-hidden bg-[#111] border border-[#2e3038] flex items-center justify-center min-h-64 p-2">
              {srcUrl ? <canvas ref={previewRef} className="max-w-full h-auto" /> : <p className="text-sm text-gray-500 py-16">Sélectionnez un design enregistré ou importez un PNG (idéalement exporté depuis l'Éditeur en 300 DPI, fond transparent).</p>}
            </div>

            {stats && srcMM && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3 text-center">
                {[
                  { l: "Surface encrée couleur", v: `${(stats.colorRatio * srcMM.w * srcMM.h / 1000).toFixed(1)} dm²` },
                  { l: "Surface blanc", v: `${(stats.whiteRatio * srcMM.w * srcMM.h / 1000).toFixed(1)} dm²` },
                  { l: "Encre couleur estimée", v: `${(stats.colorRatio * (srcMM.w * srcMM.h / 1e6) * mlColorM2).toFixed(1)} ml` },
                  { l: "Encre blanche estimée", v: `${(stats.whiteRatio * (srcMM.w * srcMM.h / 1e6) * mlWhiteM2).toFixed(1)} ml` },
                ].map((x) => (
                  <div key={x.l} className="bg-[#17181d] border border-[#2e3038] rounded-md px-2 py-2">
                    <p className="font-display text-xl font-extrabold text-white">{x.v}</p>
                    <p className="text-[9px] uppercase tracking-wider text-gray-500 font-bold">{x.l}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Gang sheet */}
          <div className="rounded-xl border border-[#2e3038] bg-[#202128] p-4">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mr-2">3 · Gang sheet (film)</p>
              <select value={profileIdx} onChange={(e) => setProfileIdx(Number(e.target.value))} className="bg-[#17181d] border border-[#2e3038] rounded px-2 py-1.5 text-xs text-gray-300 outline-none" aria-label="Profil imprimante">
                {PROFILES.map((p, i) => <option key={p.id} value={i}>{p.name} — {p.widthMm} mm</option>)}
              </select>
              <select value={lengthCm} onChange={(e) => setLengthCm(Number(e.target.value))} className="bg-[#17181d] border border-[#2e3038] rounded px-2 py-1.5 text-xs text-gray-300 outline-none" aria-label="Longueur de film">
                {[30, 40, 50, 60, 80, 100, 120].map((l) => <option key={l} value={l}>{l} cm</option>)}
              </select>
              <span className="text-xs text-gray-400 flex items-center gap-1">Hauteur motif <input type="number" min={20} max={1000} value={itemHMm} onChange={(e) => setItemHMm(Number(e.target.value) || 100)} className="w-16 bg-[#17181d] border border-[#2e3038] rounded px-1.5 py-1 text-gray-200 outline-none" /> mm</span>
              <div className="flex-1" />
              <button onClick={addSourceToGang} className="inline-flex items-center gap-1.5 bg-amber-400 hover:brightness-110 text-[#17181d] rounded px-3 py-1.5 text-xs font-extrabold cursor-pointer transition-all"><Plus size={13} /> Ajouter le design source</button>
              <select value="" onChange={(e) => e.target.value && addSavedToGang(e.target.value)} className="bg-[#17181d] border border-[#2e3038] rounded px-2 py-1.5 text-xs text-gray-300 outline-none max-w-40">
                <option value="">+ autre design…</option>
                {designs.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <p className="text-[11px] text-gray-500 mb-2">{profile.note} — faites glisser / pivotez les motifs sur le film, optimisez le remplissage.</p>
            <div className="rounded-lg overflow-auto bg-[#101014] border border-[#2e3038] flex justify-center p-2">
              <canvas ref={gangElRef} />
            </div>
            <div className="flex gap-2 mt-3 flex-wrap">
              <button onClick={() => { const c = gangRef.current; const o = c?.getActiveObject(); if (o) { o.rotate(((o.angle ?? 0) + 90) % 360); o.setCoords(); c?.requestRenderAll(); c?.fire("object:modified"); } }} className="inline-flex items-center gap-1.5 bg-white/6 hover:bg-white/12 border border-[#2e3038] rounded px-3 py-1.5 text-xs font-bold text-gray-300 cursor-pointer"><RotateCw size={13} /> Pivoter 90°</button>
              <button onClick={() => { const c = gangRef.current; const o = c?.getActiveObject(); if (o) { c?.remove(o); c?.requestRenderAll(); } }} className="inline-flex items-center gap-1.5 bg-white/6 hover:bg-red-500/20 border border-[#2e3038] rounded px-3 py-1.5 text-xs font-bold text-gray-300 cursor-pointer"><Trash2 size={13} /> Supprimer la sélection</button>
              <button onClick={() => { gangRef.current?.getObjects().slice().forEach((o) => gangRef.current?.remove(o)); gangRef.current?.requestRenderAll(); }} className="inline-flex items-center gap-1.5 bg-white/6 hover:bg-red-500/20 border border-[#2e3038] rounded px-3 py-1.5 text-xs font-bold text-gray-300 cursor-pointer"><Trash2 size={13} /> Vider le film</button>
            </div>
          </div>
        </div>

        {/* Colonne droite */}
        <div className="space-y-4">
          {/* Blanc */}
          <div className="rounded-xl border border-[#2e3038] bg-[#202128] p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-3 flex items-center gap-1.5"><Layers size={13} /> 2 · Canal blanc</p>
            {[
              { l: `Seuil de détection (alpha ≥ ${thr})`, v: thr, set: setThr, min: 1, max: 255 },
              { l: `Opacité du blanc — ${whiteOp}%`, v: whiteOp, set: setWhiteOp, min: 20, max: 100 },
              { l: `Choke / retrait — ${choke}px`, v: choke, set: setChoke, min: 0, max: 24 },
            ].map((s) => (
              <label key={s.l} className="block text-[10px] font-bold text-gray-400 mb-2.5">
                {s.l}
                <input type="range" min={s.min} max={s.max} value={s.v} onChange={(e) => s.set(Number(e.target.value))} className="w-full accent-amber-400" />
              </label>
            ))}
            <p className="text-[10px] text-gray-500 leading-relaxed">Le blanc est généré sous les pixels non transparents (sous-couche). Le « choke » retire 1 px à la fois sur le contour pour éviter les débords visibles sur tissu clair.</p>
            <div className="grid grid-cols-3 gap-1.5 mt-3">
              <button onClick={() => exportLayer("color")} className="bg-white/6 hover:bg-white/12 border border-[#2e3038] rounded px-2 py-2 text-[10px] font-bold text-gray-200 cursor-pointer transition-colors">PNG Couleur<br />300 DPI</button>
              <button onClick={() => exportLayer("white")} className="bg-white/6 hover:bg-white/12 border border-[#2e3038] rounded px-2 py-2 text-[10px] font-bold text-gray-200 cursor-pointer transition-colors">PNG Blanc<br />300 DPI</button>
              <button onClick={() => exportLayer("fusion")} className="bg-white/6 hover:bg-white/12 border border-[#2e3038] rounded px-2 py-2 text-[10px] font-bold text-gray-200 cursor-pointer transition-colors">PNG Fusion<br />contrôle</button>
            </div>
          </div>

          {/* Coûts */}
          <div className="rounded-xl border border-[#2e3038] bg-[#202128] p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-3 flex items-center gap-1.5"><Droplets size={13} /> Gang sheet — coût de revient</p>
            <div className="grid grid-cols-2 gap-2 text-center mb-3">
              <div className="bg-[#17181d] border border-[#2e3038] rounded-md p-2">
                <p className="font-display text-2xl font-extrabold text-amber-400">{gangTotals.items}</p>
                <p className="text-[9px] uppercase text-gray-500 font-bold">motifs sur le film</p>
              </div>
              <div className="bg-[#17181d] border border-[#2e3038] rounded-md p-2">
                <p className="font-display text-2xl font-extrabold text-white">{Math.round(gangTotals.occ)}%</p>
                <p className="text-[9px] uppercase text-gray-500 font-bold">film utilisé</p>
              </div>
              <div className="bg-[#17181d] border border-[#2e3038] rounded-md p-2">
                <p className="font-display text-lg font-extrabold text-cyan-400">{gangTotals.inkColor.toFixed(1)} ml</p>
                <p className="text-[9px] uppercase text-gray-500 font-bold">encre couleur</p>
              </div>
              <div className="bg-[#17181d] border border-[#2e3038] rounded-md p-2">
                <p className="font-display text-lg font-extrabold text-gray-300">{gangTotals.inkWhite.toFixed(1)} ml</p>
                <p className="text-[9px] uppercase text-gray-500 font-bold">encre blanche</p>
              </div>
            </div>
            <p className="text-center bg-gradient-to-r from-amber-500/20 to-amber-400/10 border border-amber-500/30 rounded-md py-2 mb-3">
              <span className="font-display text-2xl font-extrabold text-amber-300">{gangTotals.cost.toFixed(2)} €</span>
              <span className="block text-[9px] uppercase text-gray-400 font-bold">coût estimé (encre {Math.round(gangTotals.cost - gangTotals.film)} cent. + film {gangTotals.film.toFixed(2)} €)</span>
            </p>
            <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-400">
              <label>ml/m² couleur<input type="number" step="0.5" value={mlColorM2} onChange={(e) => setMlColorM2(Number(e.target.value) || 0)} className="w-full bg-[#17181d] border border-[#2e3038] rounded px-1.5 py-1 text-gray-200 outline-none mt-0.5" /></label>
              <label>ml/m² blanc<input type="number" step="0.5" value={mlWhiteM2} onChange={(e) => setMlWhiteM2(Number(e.target.value) || 0)} className="w-full bg-[#17181d] border border-[#2e3038] rounded px-1.5 py-1 text-gray-200 outline-none mt-0.5" /></label>
              <label>€/ml couleur<input type="number" step="0.01" value={eurColor} onChange={(e) => setEurColor(Number(e.target.value) || 0)} className="w-full bg-[#17181d] border border-[#2e3038] rounded px-1.5 py-1 text-gray-200 outline-none mt-0.5" /></label>
              <label>€/ml blanc<input type="number" step="0.01" value={eurWhite} onChange={(e) => setEurWhite(Number(e.target.value) || 0)} className="w-full bg-[#17181d] border border-[#2e3038] rounded px-1.5 py-1 text-gray-200 outline-none mt-0.5" /></label>
              <label className="col-span-2">€/m² de film PET<input type="number" step="0.1" value={filmEur} onChange={(e) => setFilmEur(Number(e.target.value) || 0)} className="w-full bg-[#17181d] border border-[#2e3038] rounded px-1.5 py-1 text-gray-200 outline-none mt-0.5" /></label>
            </div>
            <button onClick={exportGang} className="w-full mt-3 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-400 hover:brightness-110 text-[#17181d] font-display font-extrabold uppercase tracking-wide text-sm px-4 py-3 rounded-md transition-all cursor-pointer shadow-lg shadow-amber-500/20">
              <Download size={16} /> Exporter la gang sheet (PNG)
            </button>
          </div>

          {/* Note honnête */}
          <div className="rounded-xl border border-[#2e3038] bg-[#1b1c22] p-4 text-[11px] text-gray-400 leading-relaxed">
            <p className="flex gap-2 items-start font-bold text-gray-300 mb-1.5"><Info size={14} className="text-amber-400 shrink-0 mt-0.5" /> Comment imprimer avec ces fichiers</p>
            <p>
              Ce module produit des fichiers <strong className="text-gray-200">prêts à imprimer en 300 DPI</strong> : couche couleur,
              couche blanche (masque) et gang sheet complète, en miroir si activé. Sur une imprimante convertie
              (ET-8550, XP-15000…), imprimez la gang sheet via le pilote en qualité photo 300 DPI sur le film PET,
              le blanc étant géré selon votre configuration d'encre blanche (canal dédié ou double passe).
              Les RIP pilotant directement les canaux d'encre (type AcroRIP) peuvent aussi consommer ces PNG.
              Poudre adhesive + presse à chaud : 110-120°C, 12-15 s, puis transfert 150-160°C / 12-15 s.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
