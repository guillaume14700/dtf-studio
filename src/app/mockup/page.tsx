"use client";

/* Mockup 3D textile — rendu premium : studio clair, gradients de panneaux,
   coutures, texture tissu, ombre portée, S→XXXL, 20 couleurs, rotation 3D. */

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Boxes, Download, RotateCw, Upload, Loader2 } from "lucide-react";
import { loadDesigns, getDesign, downloadDataUrl, Design } from "@/components/store";

export default function MockupPageWrapper() {
  return (
    <Suspense fallback={<div className="h-[60vh] flex items-center justify-center text-slate-400 animate-pulse font-display uppercase tracking-widest">Chargement…</div>}>
      <MockupInner />
    </Suspense>
  );
}

function MockupInner() {
  const params = useSearchParams();
  return <MockupPage initialId={params.get("id")} />;
}

type GarmentKey = "tshirt" | "hoodie" | "cap";

const GARMENTS: Record<GarmentKey, { label: string; print: { x: number; y: number; w: number; h: number } }> = {
  tshirt: { label: "T-shirt", print: { x: 222, y: 215, w: 196, h: 250 } },
  hoodie: { label: "Hoodie", print: { x: 225, y: 255, w: 190, h: 205 } },
  cap: { label: "Casquette", print: { x: 245, y: 150, w: 150, h: 95 } },
};

const SIZES = [
  { key: "S", scale: 0.94, chest: "48 cm" },
  { key: "M", scale: 0.97, chest: "51 cm" },
  { key: "L", scale: 1.0, chest: "54 cm" },
  { key: "XL", scale: 1.03, chest: "58 cm" },
  { key: "XXL", scale: 1.06, chest: "62 cm" },
  { key: "XXXL", scale: 1.1, chest: "66 cm" },
];

const COLORS = [
  { name: "Blanc cassé", hex: "#f3f2ee" }, { name: "Noir profond", hex: "#232326" }, { name: "Gris chiné", hex: "#a3a7ad" },
  { name: "Anthracite", hex: "#43434a" }, { name: "Marine", hex: "#223a5e" }, { name: "Bleu royal", hex: "#2b5fd9" },
  { name: "Ciel", hex: "#a8d3f0" }, { name: "Rouge", hex: "#d63426" }, { name: "Bordeaux", hex: "#7d1f2d" },
  { name: "Orange vif", hex: "#f26522" }, { name: "Jaune", hex: "#f0c531" }, { name: "Or", hex: "#c9a227" },
  { name: "Vert sapin", hex: "#1d5c3a" }, { name: "Vert kiwi", hex: "#8db844" }, { name: "Kaki", hex: "#7a7a5c" },
  { name: "Turquoise", hex: "#2ea6a0" }, { name: "Rose", hex: "#e56aa2" }, { name: "Violet", hex: "#6d3fb0" },
  { name: "Lavande", hex: "#c5b6e8" }, { name: "Camel", hex: "#c19a6b" },
];

function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, ((n >> 16) & 255) + amt));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt));
  const b = Math.max(0, Math.min(255, (n & 255) + amt));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

function MockupPage({ initialId }: { initialId?: string | null }) {
  const [garment, setGarment] = useState<GarmentKey>("tshirt");
  const [sizeIdx, setSizeIdx] = useState(2);
  const [color, setColor] = useState(COLORS[1]!.hex);
  const [design, setDesign] = useState<string | null>(null);
  const [designName, setDesignName] = useState("");
  const [scale, setScale] = useState(85);
  const [offX, setOffX] = useState(0);
  const [offY, setOffY] = useState(0);
  const [rotY, setRotY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [designs, setDesigns] = useState<Design[]>([]);
  const [busy, setBusy] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });

  useEffect(() => { setDesigns(loadDesigns()); }, []);

  useEffect(() => {
    const d = getDesign(initialId ?? null) ?? loadDesigns()[0];
    if (!d) return;
    setBusy(true);
    import("fabric").then(async (fabric) => {
      const sc = new fabric.StaticCanvas(undefined, { width: 1200, height: Math.round(1200 * (d.heightMm / d.widthMm)) });
      await sc.loadFromJSON(d.json);
      const mul = 1200 / (sc.getWidth() || 1);
      setDesign(sc.toDataURL({ format: "png", multiplier: Math.max(mul, 0.1) }));
      setDesignName(d.name);
      sc.dispose();
      setBusy(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialId]);

  function onFile(f: File | null) {
    if (!f) return;
    const r = new FileReader();
    r.onload = () => { setDesign(String(r.result)); setDesignName(f.name); };
    r.readAsDataURL(f);
  }

  /* Rotation 3D par glisser horizontal */
  useEffect(() => {
    if (!dragging) return;
    const move = (e: PointerEvent) => {
      const dx = e.clientX - dragStart.current.x;
      setRotY(Math.max(-35, Math.min(35, dragStart.current.oy + dx * 0.25)));
    };
    const up = () => setDragging(false);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
  }, [dragging]);

  function onStageDown(e: React.PointerEvent) {
    if (e.target !== stageRef.current) return;
    dragStart.current = { x: e.clientX, y: e.clientY, ox: 0, oy: 0 };
    setDragging(true);
  }
  function onStageMove(e: React.PointerEvent) {
    if (!dragging) return;
    const rect = stageRef.current!.getBoundingClientRect();
    const s = Math.min(560 / rect.width, 1) * 1;
    dragStart.current.x = e.clientX;
    const dx = e.movementX, dy = e.movementY;
    setOffX((x) => Math.max(-110, Math.min(110, x + dx / (rect.width / 640))));
    setOffY((y) => Math.max(-130, Math.min(130, y + dy / (rect.width / 640))));
    void s; void dy;
  }

  const print = GARMENTS[garment].print;
  const size = SIZES[sizeIdx]!;
  const gid = useMemo(() => `g${Math.random().toString(36).slice(2, 8)}`, []);
  const light = shade(color, 22);
  const dark = shade(color, -30);
  const darker = shade(color, -58);

  async function exportMockup() {
    if (!svgRef.current) return;
    setBusy(true);
    try {
      const svg = svgRef.current.cloneNode(true) as SVGSVGElement;
      svg.setAttribute("width", "1600");
      svg.setAttribute("height", "1800");
      const str = new XMLSerializer().serializeToString(svg);
      const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(str)}`;
      const img = new Image();
      await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url; });
      const c = document.createElement("canvas");
      c.width = 1600; c.height = 1800;
      const ctx = c.getContext("2d")!;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0, c.width, c.height);
      downloadDataUrl(c.toDataURL("image/png"), `maquette-${garment}-${size.key}-${designName || "design"}.png`);
    } finally { setBusy(false); }
  }

  const lightFabric = color === COLORS[0]!.hex || color === COLORS[18]!.hex || color === COLORS[7]!.hex === false;
  const useMultiply = ["#f3f2ee", "#a8d3f0", "#c5b6e8", "#f0c531", "#c19a6b", "#c9a227", "#a3a7ad"].includes(color);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-indigo-500 mb-1.5 flex items-center gap-2"><Boxes size={14} /> Prévisualisation textile</p>
          <h1 className="font-display text-4xl md:text-5xl font-extrabold text-slate-900 leading-none tracking-tight">Mockup 3D</h1>
          <p className="text-sm text-slate-500 mt-2">Votre visuel en situation — glissez la souris sur la scène pour tourner le vêtement.</p>
        </div>
        <button onClick={exportMockup} disabled={!design || busy} className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-display font-extrabold uppercase tracking-wide text-sm px-5 py-3 rounded-lg transition-all cursor-pointer shadow-lg shadow-indigo-600/25">
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} Maquette HD
        </button>
      </div>

      <div className="grid lg:grid-cols-[1fr_330px] gap-4">
        {/* Scène studio */}
        <div
          ref={stageRef}
          onPointerDown={onStageDown}
          onPointerMove={onStageMove}
          className="rounded-2xl border border-slate-200 overflow-hidden flex items-center justify-center min-h-[560px] cursor-ew-resize select-none touch-none"
          style={{
            background: "radial-gradient(120% 90% at 50% 12%, #ffffff 0%, #eef0f4 55%, #dfe3ea 100%)",
            perspective: "1500px",
          }}
        >
          <div style={{ transform: `rotateY(${rotY}deg)`, transformStyle: "preserve-3d", transition: dragging ? "none" : "transform .2s ease-out" }}>
            <svg ref={svgRef} viewBox="0 0 640 720" className="w-full max-w-[560px] h-auto" style={{ filter: `brightness(${1 - Math.abs(rotY) / 500})` }}>
              <defs>
                <linearGradient id={`${gid}-studio`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="100%" stopColor="#e6e9ef" />
                </linearGradient>
                <radialGradient id={`${gid}-floor`} cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#0f172a" stopOpacity="0.30" />
                  <stop offset="70%" stopColor="#0f172a" stopOpacity="0.10" />
                  <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
                </radialGradient>
                <linearGradient id={`${gid}-body`} x1="0" y1="0" x2="0.15" y2="1">
                  <stop offset="0%" stopColor={light} />
                  <stop offset="45%" stopColor={color} />
                  <stop offset="100%" stopColor={shade(color, -18)} />
                </linearGradient>
                <linearGradient id={`${gid}-sleeveL`} x1="1" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} />
                  <stop offset="100%" stopColor={dark} />
                </linearGradient>
                <linearGradient id={`${gid}-sleeveR`} x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor={color} />
                  <stop offset="100%" stopColor={dark} />
                </linearGradient>
                <linearGradient id={`${gid}-hood`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={dark} />
                  <stop offset="100%" stopColor={darker} />
                </linearGradient>
                <linearGradient id={`${gid}-crown`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={light} />
                  <stop offset="100%" stopColor={shade(color, -14)} />
                </linearGradient>
                <filter id={`${gid}-soft`} x="-40%" y="-40%" width="180%" height="180%">
                  <feGaussianBlur stdDeviation="10" />
                </filter>
                <filter id={`${gid}-tex`} x="0" y="0" width="100%" height="100%">
                  <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" />
                  <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0.6 0.6 0.6 0 0" />
                </filter>
                <clipPath id={`${gid}-clip`}>
                  <rect x={print.x} y={print.y} width={print.w} height={print.h} rx="6" />
                </clipPath>
              </defs>

              {/* Sol */}
              <ellipse cx="320" cy={garment === "cap" ? 392 : 690} rx="230" ry="26" fill={`url(#${gid}-floor)`} />

              <g transform={`translate(320 ${garment === "cap" ? 250 : 400}) scale(${size.scale}) translate(-320 -${garment === "cap" ? 250 : 400})`}>
                {garment === "cap" ? (
                  <g>
                    {/* Casquette */}
                    <path d={`M110 262 C110 108 530 108 530 262 C530 270 528 274 524 276 C400 252 240 252 116 276 C112 274 110 270 110 262 Z`} fill={`url(#${gid}-crown)`} />
                    <path d={`M225 118 C245 210 240 246 236 254 M415 118 C395 210 400 246 404 254 M320 106 L320 250`} stroke={darker} strokeWidth="2.5" fill="none" opacity="0.55" />
                    <path d={`M175 130 C190 200 190 240 186 250 M465 130 C450 200 450 240 454 250`} stroke={darker} strokeWidth="1.8" fill="none" opacity="0.35" strokeDasharray="4 4" />
                    <path d={`M116 276 C240 252 400 252 524 276 C545 306 520 338 436 348 C336 360 216 354 158 340 C100 326 98 296 116 276 Z`} fill={dark} />
                    <path d={`M140 285 C250 264 390 264 500 285 C512 305 495 325 430 333 C340 343 230 338 175 327 C128 317 128 298 140 285 Z`} fill={color} opacity="0.45" />
                    <path d={`M158 340 C216 354 336 360 436 348`} stroke={light} strokeWidth="2" fill="none" opacity="0.5" strokeDasharray="5 5" />
                    <circle cx="320" cy="100" r="11" fill={darker} />
                    <circle cx="320" cy="100" r="5" fill={dark} />
                  </g>
                ) : garment === "hoodie" ? (
                  <g>
                    {/* Capuche */}
                    <path d={`M226 96 C226 30 414 30 414 96 C392 142 350 162 320 162 C290 162 248 142 226 96 Z`} fill={`url(#${gid}-hood)`} />
                    <path d={`M240 92 C240 46 400 46 400 92 C382 128 348 146 320 146 C292 146 258 128 240 92 Z`} fill={darker} />
                    <path d={`M246 96 C246 60 394 60 394 96`} stroke={shade(color, 30)} strokeWidth="3" fill="none" opacity="0.4" strokeDasharray="5 5" />
                    {/* Corps */}
                    <path d={`M228 88 C196 98 168 108 146 120 L74 214 L152 280 L186 240 L186 668 Q320 700 454 668 L454 240 L488 280 L566 214 L494 120 C472 108 444 98 412 88 C392 132 356 152 320 152 C284 152 248 132 228 88 Z`} fill={`url(#${gid}-body)`} />
                    <path d={`M186 240 L186 668 Q240 682 278 686 L278 156 C252 146 238 122 228 88 C196 98 168 108 146 120 L74 214 L152 280 Z`} fill={light} opacity="0.22" />
                    <path d={`M454 240 L454 668 Q420 658 396 662 L396 148 C420 134 402 112 412 88 C442 96 468 106 494 120 L566 214 L488 280 Z`} fill={darker} opacity="0.28" />
                    {/* Coutures épaules / côtés */}
                    <path d={`M228 92 C210 128 196 200 188 250 M412 92 C430 128 444 200 452 250`} stroke={darker} strokeWidth="2" fill="none" opacity="0.5" strokeDasharray="6 5" />
                    {/* Poche kangourou */}
                    <path d={`M236 508 L404 508 L422 606 Q320 632 218 606 Z`} fill={dark} opacity="0.9" />
                    <path d={`M236 508 L404 508 L410 534 Q320 556 230 534 Z`} fill={darker} opacity="0.85" />
                    <path d={`M236 512 L404 512`} stroke={light} strokeWidth="2" opacity="0.4" strokeDasharray="5 5" />
                    {/* Cordon */}
                    <path d={`M292 152 C290 190 289 216 289 240 M348 152 C350 190 351 216 351 240`} stroke={light} strokeWidth="5" strokeLinecap="round" fill="none" />
                    <circle cx="289" cy="244" r="4.5" fill={light} />
                    <circle cx="351" cy="244" r="4.5" fill={light} />
                    {/* ourlet */}
                    <path d={`M188 656 Q320 686 452 656 L452 668 Q320 698 188 668 Z`} fill={darker} opacity="0.5" />
                  </g>
                ) : (
                  <g>
                    {/* T-shirt */}
                    <path d={`M228 84 C198 92 172 100 148 112 L78 206 L156 272 L188 234 L188 648 Q320 678 452 648 L452 234 L484 272 L562 206 L492 112 C468 100 442 92 412 84 C392 126 356 146 320 146 C284 146 248 126 228 84 Z`} fill={`url(#${gid}-body)`} />
                    <path d={`M188 234 L188 648 Q240 662 274 666 L274 152 C250 142 238 118 228 84 C198 92 172 100 148 112 L78 206 L156 272 Z`} fill={light} opacity="0.30" />
                    <path d={`M452 234 L452 648 Q420 658 396 662 L396 148 C420 132 402 112 412 84 C442 92 468 100 492 112 L562 206 L484 272 Z`} fill={darker} opacity="0.35" />
                    {/* Coutures */}
                    <path d={`M228 90 C208 128 194 200 189 240 M412 90 C432 128 446 200 451 240 M156 268 L186 236 M484 268 L454 236`} stroke={darker} strokeWidth="2" fill="none" opacity="0.55" strokeDasharray="6 5" />
                    <path d={`M196 640 Q320 668 444 640`} stroke={darker} strokeWidth="2" fill="none" opacity="0.45" strokeDasharray="6 5" />
                    {/* Col rond côtelé */}
                    <path d={`M228 84 C248 126 284 146 320 146 C356 146 392 126 412 84 C392 102 358 112 320 112 C282 112 248 102 228 84 Z`} fill={dark} />
                    <path d={`M236 92 C254 126 288 142 320 142 C352 142 386 126 404 92`} stroke={darker} strokeWidth="3" fill="none" opacity="0.7" />
                    <path d={`M240 98 C258 128 290 140 320 140 C350 140 382 128 400 98`} stroke={light} strokeWidth="1.6" fill="none" opacity="0.5" strokeDasharray="3 4" />
                  </g>
                )}
                {/* Texture tissu */}
                <rect x="60" y="30" width="520" height="660" fill={color} filter={`url(#${gid}-tex)`} opacity="0.05" style={{ mixBlendMode: "multiply" }} clipPath={`url(#${garment === "cap" ? gid : gid}-clip)`} />

                {/* Visuel imprimé */}
                {design && (
                  <g clipPath={`url(#${gid}-clip)`}>
                    <image
                      href={design}
                      x={print.x + print.w / 2 - (print.w * scale) / 200 + offX}
                      y={print.y + print.h / 2 - (print.h * scale) / 200 + offY}
                      width={Math.max(4, print.w * (scale / 100))}
                      height={Math.max(4, print.h * (scale / 100))}
                      preserveAspectRatio="xMidYMid meet"
                      style={{ mixBlendMode: useMultiply ? "multiply" : "normal" }}
                    />
                  </g>
                )}
              </g>
            </svg>
          </div>
        </div>

        {/* Contrôles */}
        <div className="space-y-3">
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Support</p>
            <div className="grid grid-cols-3 gap-1.5">
              {(Object.keys(GARMENTS) as GarmentKey[]).map((g) => (
                <button key={g} onClick={() => setGarment(g)}
                  className={`px-2 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${garment === g ? "bg-indigo-600 text-white shadow" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                  {GARMENTS[g].label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Taille — {size.key} <span className="normal-case font-normal">({size.chest})</span></p>
            <div className="grid grid-cols-6 gap-1">
              {SIZES.map((s, i) => (
                <button key={s.key} onClick={() => setSizeIdx(i)}
                  className={`px-1 py-1.5 rounded-md text-[11px] font-bold transition-all cursor-pointer ${i === sizeIdx ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                  {s.key}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Couleur du vêtement</p>
            <div className="grid grid-cols-7 gap-1.5">
              {COLORS.map((c) => (
                <button key={c.hex} title={c.name} onClick={() => setColor(c.hex)}
                  className={`aspect-square rounded-md border transition-transform hover:scale-110 cursor-pointer ${color === c.hex ? "ring-2 ring-indigo-500 ring-offset-1 scale-110 border-white" : "border-black/10"}`}
                  style={{ background: c.hex }} aria-label={c.name} />
              ))}
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)}
                className="aspect-square rounded-md cursor-pointer bg-transparent border-2 border-dashed border-slate-300" title="Couleur personnalisée" aria-label="Couleur personnalisée" />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Visuel</p>
            <select
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 text-xs text-slate-700 outline-none focus:border-indigo-500"
              value={designName}
              onChange={(e) => {
                const d = designs.find((x) => x.name === e.target.value);
                if (!d) return;
                setBusy(true);
                import("fabric").then(async (fabric) => {
                  const sc = new fabric.StaticCanvas(undefined, { width: 1200, height: Math.round(1200 * (d.heightMm / d.widthMm)) });
                  await sc.loadFromJSON(d.json);
                  const mul = 1200 / (sc.getWidth() || 1);
                  setDesign(sc.toDataURL({ format: "png", multiplier: Math.max(mul, 0.1) }));
                  setDesignName(d.name);
                  sc.dispose();
                  setBusy(false);
                });
              }}
            >
              <option value="">— Mes designs ({designs.length}) —</option>
              {designs.map((d) => <option key={d.id} value={d.name}>{d.name}</option>)}
            </select>
            <label className="flex items-center justify-center gap-2 w-full bg-slate-50 hover:bg-slate-100 border border-dashed border-slate-300 rounded-lg px-3 py-2.5 text-xs font-bold text-slate-600 cursor-pointer transition-colors">
              <Upload size={14} /> Importer un PNG
              <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => onFile(e.target.files?.[0] ?? null)} />
            </label>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm space-y-2.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Placement & 3D</p>
            {[
              { l: `Taille du visuel — ${scale}%`, v: scale, set: setScale, min: 10, max: 100, step: 1 },
              { l: `Décalage horizontal — ${offX}`, v: offX, set: setOffX, min: -110, max: 110, step: 1 },
              { l: `Décalage vertical — ${offY}`, v: offY, set: setOffY, min: -130, max: 130, step: 1 },
              { l: `Rotation 3D — ${rotY}°`, v: rotY, set: setRotY, min: -35, max: 35, step: 1 },
            ].map((s) => (
              <label key={s.l} className="block text-[10px] font-bold text-slate-500">
                {s.l}
                <input type="range" min={s.min} max={s.max} step={s.step} value={s.v} onChange={(e) => s.set(Number(e.target.value))} className="w-full accent-indigo-600" />
              </label>
            ))}
            <button onClick={() => { setScale(85); setOffX(0); setOffY(0); setRotY(0); }}
              className="w-full inline-flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg px-2 py-2 text-[11px] font-bold text-slate-600 cursor-pointer transition-colors">
              <RotateCw size={12} /> Réinitialiser
            </button>
            <p className="text-[10px] text-slate-400 leading-relaxed"> Glissez horizontalement sur la scène pour faire tourner le vêtement, verticalement pour déplacer le visuel.</p>
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-400">
        Rendu premium : ombrage et texture tissu, couture, fusion du visuel avec la couleur du textile. Maquette exportée en 1600 × 1800 px — idéale pour vos devis et vos réseaux.
      </p>
    </div>
  );
}
