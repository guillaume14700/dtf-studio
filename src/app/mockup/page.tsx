"use client";

/* DTF Studio Pro — Mockup 3D textile :
   t-shirt / hoodie / casquette, tailles S→XXXL, palette de couleurs,
   rotation 3D, placement du design, export PNG de la maquette. */

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Boxes, Download, RotateCw, Upload, Loader2 } from "lucide-react";
import { loadDesigns, getDesign, downloadDataUrl, Design } from "@/components/store";

export default function MockupPageWrapper() {
  return (
    <Suspense fallback={<div className="h-[60vh] flex items-center justify-center text-gray-500 animate-pulse font-display uppercase tracking-widest">Chargement du mockup…</div>}>
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
  hoodie: { label: "Hoodie", print: { x: 225, y: 250, w: 190, h: 210 } },
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
  { name: "Blanc", hex: "#f5f5f4" }, { name: "Noir", hex: "#1c1917" }, { name: "Gris chiné", hex: "#9ca3af" },
  { name: "Anthracite", hex: "#3f3f46" }, { name: "Marine", hex: "#1e3a5f" }, { name: "Royal", hex: "#2563eb" },
  { name: "Ciel", hex: "#7dd3fc" }, { name: "Rouge", hex: "#dc2626" }, { name: "Bordeaux", hex: "#7f1d1d" },
  { name: "Orange", hex: "#ea580c" }, { name: "Jaune", hex: "#eab308" }, { name: "Or", hex: "#d4af37" },
  { name: "Vert forêt", hex: "#166534" }, { name: "Vert pomme", hex: "#65a30d" }, { name: "Kaki", hex: "#78716c" },
  { name: "Turquoise", hex: "#0d9488" }, { name: "Rose", hex: "#ec4899" }, { name: "Violet", hex: "#7c3aed" },
  { name: "Lavande", hex: "#c4b5fd" }, { name: "Sable", hex: "#d6c7a1" },
];

function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, ((n >> 16) & 255) + amt));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt));
  const b = Math.max(0, Math.min(255, (n & 255) + amt));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

function Garment({ g, color, gid }: { g: GarmentKey; color: string; gid: string }) {
  const dark = shade(color, -28);
  const light = shade(color, 14);
  if (g === "cap") {
    return (
      <g>
        <path d={`M110 262 C110 108 530 108 530 262 C530 270 528 274 524 276 C400 252 240 252 116 276 C112 274 110 270 110 262 Z`} fill={color} />
        <path d={`M110 262 C110 108 320 90 320 90 L320 252 C240 252 170 258 116 276 C112 274 110 270 110 262 Z`} fill={light} opacity="0.35" />
        <path d={`M116 276 C240 252 400 252 524 276 C545 306 520 338 436 348 C336 360 216 354 158 340 C100 326 98 296 116 276 Z`} fill={dark} />
        <path d={`M140 285 C250 264 390 264 500 285 C512 305 495 325 430 333 C340 343 230 338 175 327 C128 317 128 298 140 285 Z`} fill={color} opacity="0.5" />
        <line x1="320" y1="92" x2="320" y2="252" stroke={dark} strokeWidth="3" opacity="0.6" />
        <line x1="215" y1="112" x2="240" y2="256" stroke={dark} strokeWidth="2.5" opacity="0.45" />
        <line x1="425" y1="112" x2="400" y2="256" stroke={dark} strokeWidth="2.5" opacity="0.45" />
        <circle cx="320" cy="92" r="11" fill={dark} />
      </g>
    );
  }
  if (g === "hoodie") {
    return (
      <g>
        <path d={`M226 96 C226 34 414 34 414 96 C392 140 350 160 320 160 C290 160 248 140 226 96 Z`} fill={dark} />
        <path d={`M238 92 C238 48 402 48 402 92 C384 128 348 146 320 146 C292 146 256 128 238 92 Z`} fill={shade(color, -46)} />
        <path d={`M228 88 C196 98 168 108 146 120 L74 214 L152 280 L186 240 L186 668 Q320 700 454 668 L454 240 L488 280 L566 214 L494 120 C472 108 444 98 412 88 C392 132 356 152 320 152 C284 152 248 132 228 88 Z`} fill={color} />
        <path d={`M186 240 L186 668 Q240 682 280 686 L280 160 C250 150 236 124 228 88 C196 98 168 108 146 120 L74 214 L152 280 Z`} fill={light} opacity="0.25" />
        <path d={`M232 500 L408 500 L424 600 Q320 628 216 600 Z`} fill={dark} opacity="0.85" />
        <path d={`M232 500 L408 500 L412 522 Q320 545 228 522 Z`} fill={shade(color, -40)} />
        <rect x="139" y="264" width="34" height="20" rx="8" fill={dark} transform="rotate(-40 156 274)" />
        <rect x="467" y="264" width="34" height="20" rx="8" fill={dark} transform="rotate(40 484 274)" />
        <line x1="292" y1="150" x2="288" y2="238" stroke={shade(color, 40)} strokeWidth="5" strokeLinecap="round" />
        <line x1="348" y1="150" x2="352" y2="238" stroke={shade(color, 40)} strokeWidth="5" strokeLinecap="round" />
        <circle cx="288" cy="242" r="4.5" fill={shade(color, 40)} />
        <circle cx="352" cy="242" r="4.5" fill={shade(color, 40)} />
      </g>
    );
  }
  return (
    <g>
      <path d={`M228 84 C198 92 172 100 148 112 L78 206 L156 272 L188 234 L188 648 Q320 678 452 648 L452 234 L484 272 L562 206 L492 112 C468 100 442 92 412 84 C392 126 356 146 320 146 C284 146 248 126 228 84 Z`} fill={color} />
      <path d={`M188 234 L188 648 Q240 662 276 666 L276 150 C250 140 238 118 228 84 C198 92 172 100 148 112 L78 206 L156 272 Z`} fill={light} opacity="0.3" />
      <path d={`M452 234 L452 648 Q420 658 396 662 L396 146 C420 132 402 112 412 84 C442 92 468 100 492 112 L562 206 L484 272 Z`} fill={dark} opacity="0.35" />
      <path d={`M228 84 C248 126 284 146 320 146 C356 146 392 126 412 84 C392 100 358 110 320 110 C282 110 248 100 228 84 Z`} fill={dark} />
      <path d={`M188 636 Q320 666 452 636 L452 648 Q320 678 188 648 Z`} fill={dark} opacity="0.5" />
    </g>
  );
}

function MockupPage({ initialId }: { initialId?: string | null }) {
  const [garment, setGarment] = useState<GarmentKey>("tshirt");
  const [sizeIdx, setSizeIdx] = useState(2);
  const [color, setColor] = useState(COLORS[1]!.hex);
  const [design, setDesign] = useState<string | null>(null);
  const [designName, setDesignName] = useState("");
  const [scale, setScale] = useState(80);
  const [offX, setOffX] = useState(0);
  const [offY, setOffY] = useState(0);
  const [rotY, setRotY] = useState(0);
  const [designs, setDesigns] = useState<Design[]>([]);
  const [busy, setBusy] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => { setDesigns(loadDesigns()); }, []);

  useEffect(() => {
    const d = getDesign(initialId ?? null) ?? loadDesigns()[0];
    if (!d) return;
    setBusy(true);
    const c = document.createElement("canvas");
    const scene = JSON.parse(d.json) as { objects?: unknown[] };
    import("fabric").then(async (fabric) => {
      const sc = new fabric.StaticCanvas(undefined, { width: 1200, height: Math.round(1200 * (d.heightMm / d.widthMm)) });
      await sc.loadFromJSON(JSON.stringify(scene));
      const mul = 1200 / (sc.getWidth() || 1);
      const url = sc.toDataURL({ format: "png", multiplier: Math.max(mul, 0.1) });
      setDesign(url);
      setDesignName(d.name);
      sc.dispose();
      c.remove();
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

  const print = GARMENTS[garment].print;
  const size = SIZES[sizeIdx]!;
  const gid = useMemo(() => `g-${Math.random().toString(36).slice(2, 8)}`, []);

  async function exportMockup() {
    if (!svgRef.current) return;
    setBusy(true);
    try {
      const svg = svgRef.current.cloneNode(true) as SVGSVGElement;
      svg.setAttribute("width", "1400");
      svg.setAttribute("height", garment === "cap" ? "920" : "1575");
      const str = new XMLSerializer().serializeToString(svg);
      const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(str)}`;
      const img = new Image();
      await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url; });
      const c = document.createElement("canvas");
      c.width = 1400; c.height = garment === "cap" ? 920 : 1575;
      const ctx = c.getContext("2d")!;
      ctx.fillStyle = "#f4f4f5";
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0, c.width, c.height);
      downloadDataUrl(c.toDataURL("image/png"), `mockup-${garment}-${size.key}-${designName || "design"}.png`);
    } finally { setBusy(false); }
  }

  const imgH = (print.w * 0 + print.h) * (scale / 100);
  const imgW = print.w * (scale / 100);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-fuchsia-400 mb-1.5 flex items-center gap-2"><Boxes size={14} /> Prévisualisation textile</p>
          <h1 className="font-display text-4xl md:text-5xl font-extrabold uppercase text-white leading-none">Mockup 3D</h1>
          <p className="text-sm text-gray-400 mt-2">Vérifiez le rendu avant impression : vêtement, taille, couleur, placement.</p>
        </div>
        <button onClick={exportMockup} disabled={!design || busy} className="inline-flex items-center gap-2 bg-gradient-to-r from-fuchsia-500 to-fuchsia-400 hover:brightness-110 disabled:opacity-40 text-[#17181d] font-display font-extrabold uppercase tracking-wide text-sm px-5 py-3 rounded-md transition-all cursor-pointer shadow-lg shadow-fuchsia-500/20">
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} Exporter la maquette
        </button>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-4">
        {/* Scène */}
        <div className="rounded-xl border border-[#2e3038] bg-gradient-to-b from-[#232429] to-[#1b1c22] p-4 flex items-center justify-center min-h-[520px]" style={{ perspective: "1400px" }}>
          <div style={{ transform: `rotateY(${rotY}deg)`, transformStyle: "preserve-3d", transition: "transform 0.15s ease-out" }}>
            <svg ref={svgRef} viewBox="0 0 640 720" className="w-full max-w-[560px] h-auto drop-shadow-2xl" style={{ filter: `brightness(${1 - Math.abs(rotY) / 400})` }}>
              <defs>
                <linearGradient id={`${gid}-sh`} x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#000" stopOpacity="0.28" />
                  <stop offset="18%" stopColor="#000" stopOpacity="0.05" />
                  <stop offset="45%" stopColor="#fff" stopOpacity="0.06" />
                  <stop offset="75%" stopColor="#000" stopOpacity="0.06" />
                  <stop offset="100%" stopColor="#000" stopOpacity="0.32" />
                </linearGradient>
                <clipPath id={`${gid}-clip`}>
                  <rect x={print.x} y={print.y} width={print.w} height={print.h} rx="6" />
                </clipPath>
              </defs>
              <Garment g={garment} color={color} gid={gid} />
              {design && (
                <g clipPath={`url(#${gid}-clip)`}>
                  <image
                    href={design}
                    x={print.x + print.w / 2 - imgW / 2 + offX}
                    y={print.y + print.h / 2 - imgH / 2 + offY}
                    width={Math.max(4, imgW)}
                    height={Math.max(4, imgH)}
                    preserveAspectRatio="xMidYMid meet"
                    style={{ mixBlendMode: color === "#f5f5f4" || color === "#d6c7a1" || color === "#c4b5fd" || color === "#fbbf24" ? "multiply" : "normal" }}
                  />
                  <rect x={print.x} y={print.y} width={print.w} height={print.h} fill={`url(#${gid}-sh)`} style={{ mixBlendMode: "multiply" }} opacity="0.75" />
                </g>
              )}
              <rect x="0" y="0" width="640" height="720" fill={`url(#${gid}-sh)`} opacity="0.28" style={{ mixBlendMode: "multiply", pointerEvents: "none" }} />
            </svg>
          </div>
        </div>

        {/* Contrôles */}
        <div className="space-y-3">
          <div className="rounded-lg border border-[#2e3038] bg-[#202128] p-3.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Support</p>
            <div className="grid grid-cols-3 gap-1.5">
              {(Object.keys(GARMENTS) as GarmentKey[]).map((g) => (
                <button key={g} onClick={() => setGarment(g)} className={`px-2 py-2 rounded-md text-xs font-bold transition-all cursor-pointer ${garment === g ? "bg-fuchsia-500 text-[#17181d]" : "bg-white/6 text-gray-400 hover:bg-white/12"}`}>
                  {GARMENTS[g].label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-[#2e3038] bg-[#202128] p-3.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Taille — {size.key} <span className="text-gray-600 normal-case font-normal">(poitrine {size.chest})</span></p>
            <div className="grid grid-cols-6 gap-1">
              {SIZES.map((s, i) => (
                <button key={s.key} onClick={() => setSizeIdx(i)} className={`px-1 py-1.5 rounded text-[11px] font-bold transition-all cursor-pointer ${i === sizeIdx ? "bg-cyan-400 text-[#17181d]" : "bg-white/6 text-gray-400 hover:bg-white/12"}`}>
                  {s.key}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-[#2e3038] bg-[#202128] p-3.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Couleur du vêtement</p>
            <div className="grid grid-cols-7 gap-1.5">
              {COLORS.map((c) => (
                <button key={c.hex} title={c.name} onClick={() => setColor(c.hex)} className={`aspect-square rounded-md border-2 cursor-pointer transition-transform hover:scale-110 ${color === c.hex ? "border-cyan-400 scale-110" : "border-white/15"}`} style={{ background: c.hex }} aria-label={c.name} />
              ))}
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="aspect-square rounded-md cursor-pointer bg-transparent border-2 border-dashed border-white/25" title="Couleur personnalisée" aria-label="Couleur personnalisée" />
            </div>
          </div>

          <div className="rounded-lg border border-[#2e3038] bg-[#202128] p-3.5 space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Design</p>
            <select
              className="w-full bg-[#17181d] border border-[#2e3038] rounded px-2 py-2 text-xs text-gray-300 outline-none"
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
              <option value="">— Designs enregistrés ({designs.length}) —</option>
              {designs.map((d) => <option key={d.id} value={d.name}>{d.name}</option>)}
            </select>
            <label className="flex items-center justify-center gap-2 w-full bg-white/6 hover:bg-white/12 border border-dashed border-[#2e3038] rounded-md px-3 py-2.5 text-xs font-bold text-gray-300 cursor-pointer transition-colors">
              <Upload size={14} /> Importer un PNG
              <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => onFile(e.target.files?.[0] ?? null)} />
            </label>
          </div>

          <div className="rounded-lg border border-[#2e3038] bg-[#202128] p-3.5 space-y-2.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Placement & 3D</p>
            {[
              { l: `Taille du visuel — ${scale}%`, v: scale, set: setScale, min: 10, max: 100, step: 1 },
              { l: `Décalage horizontal — ${offX}`, v: offX, set: setOffX, min: -90, max: 90, step: 1 },
              { l: `Décalage vertical — ${offY}`, v: offY, set: setOffY, min: -110, max: 110, step: 1 },
              { l: `Rotation 3D — ${rotY}°`, v: rotY, set: setRotY, min: -35, max: 35, step: 1 },
            ].map((s) => (
              <label key={s.l} className="block text-[10px] font-bold text-gray-400">
                {s.l}
                <input type="range" min={s.min} max={s.max} step={s.step} value={s.v} onChange={(e) => s.set(Number(e.target.value))} className="w-full accent-fuchsia-400" />
              </label>
            ))}
            <button onClick={() => { setScale(80); setOffX(0); setOffY(0); setRotY(0); }} className="w-full inline-flex items-center justify-center gap-1.5 bg-white/6 hover:bg-white/12 border border-[#2e3038] rounded px-2 py-2 text-[11px] font-bold text-gray-300 cursor-pointer transition-colors">
              <RotateCw size={12} /> Réinitialiser le placement
            </button>
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-500">
        💡 Rendu réaliste : le visuel épouse la couleur du vêtement (fusion multiply sur tissus clairs) avec ombrage textile.
        Taille {size.key} : proportion du vêtement ajustée ({size.chest} de poitrine). Export PNG haute résolution pour vos devis et réseaux sociaux.
      </p>
    </div>
  );
}
