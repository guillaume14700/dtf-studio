"use client";

/* DTF Studio Pro — Éditeur de design (Fabric.js)
   Repère : toutes les coordonnées objets sont en PIXELS DOCUMENT (300 DPI).
   Le canvas viewport = doc * zoom, donc export multiplier = 1/zoom → PNG exact 300 DPI. */

import { useCallback, useEffect, useRef, useState } from "react";
import * as fabric from "fabric";
import {
  MousePointer2, Type, Square, Circle, Triangle, Minus, Paintbrush, ImagePlus,
  Undo2, Redo2, ZoomIn, ZoomOut, Maximize, Save, Download, Boxes, Printer,
  Trash2, Copy, Lock, Unlock, Eye, EyeOff, ArrowUp, ArrowDown, AlignCenterHorizontal,
  AlignCenterVertical, Layers, Sparkles, FilePlus2,
} from "lucide-react";
import {
  DOC_PRESETS, DESIGN_FONTS, SWATCHES, mmToPx, pxToMm, DPI,
  loadDesigns, saveDesign, getDesign, newId, downloadDataUrl, Design,
} from "./store";

type Tool = "select" | "text" | "rect" | "ellipse" | "triangle" | "line" | "brush" | "image";

const TOOLS: { key: Tool; icon: React.ReactNode; label: string }[] = [
  { key: "select", icon: <MousePointer2 size={18} />, label: "Sélection (V)" },
  { key: "text", icon: <Type size={18} />, label: "Texte (T)" },
  { key: "rect", icon: <Square size={18} />, label: "Rectangle (R)" },
  { key: "ellipse", icon: <Circle size={18} />, label: "Ellipse (E)" },
  { key: "triangle", icon: <Triangle size={18} />, label: "Triangle" },
  { key: "line", icon: <Minus size={18} />, label: "Ligne (L)" },
  { key: "brush", icon: <Paintbrush size={18} />, label: "Pinceau (B)" },
  { key: "image", icon: <ImagePlus size={18} />, label: "Importer une image" },
];

const BLENDS = ["source-over", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge", "difference"];

export default function StudioEditor({ initialId }: { initialId?: string | null }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fc = useRef<fabric.Canvas | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const history = useRef<string[]>([]);
  const hIndex = useRef(-1);
  const restoring = useRef(false);
  const idRef = useRef<string>(newId());

  const [ready, setReady] = useState(false);
  const [, setVersion] = useState(0);
  const rerender = useCallback(() => setVersion((v) => v + 1), []);

  const [name, setName] = useState("Design sans titre");
  const [widthMm, setWidthMm] = useState(300);
  const [heightMm, setHeightMm] = useState(400);
  const [preset, setPreset] = useState(DOC_PRESETS[0]!.label);
  const [tool, setTool] = useState<Tool>("select");
  const [zoom, setZoom] = useState(0.2);
  const [box, setBox] = useState({ w: 800, h: 560 });
  const [fill, setFill] = useState("#ffffff");
  const [brushMm, setBrushMm] = useState(3);
  const [msg, setMsg] = useState("");
  const [designs, setDesigns] = useState<Design[]>([]);

  const docW = mmToPx(widthMm);
  const docH = mmToPx(heightMm);

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(""), 3500); };

  /* ---------- Historique ---------- */
  const snapshot = useCallback(() => {
    const c = fc.current;
    if (!c || restoring.current) return;
    const json = JSON.stringify((c as unknown as { toJSON: (p?: string[]) => object }).toJSON(["name"]));
    history.current = history.current.slice(0, hIndex.current + 1);
    history.current.push(json);
    if (history.current.length > 40) history.current.shift();
    hIndex.current = history.current.length - 1;
  }, []);

  const restore = useCallback(async (json: string) => {
    const c = fc.current;
    if (!c) return;
    restoring.current = true;
    await c.loadFromJSON(json);
    c.requestRenderAll();
    restoring.current = false;
    rerender();
  }, [rerender]);

  const undo = useCallback(() => {
    if (hIndex.current > 0) { hIndex.current--; restore(history.current[hIndex.current]!); }
  }, [restore]);
  const redo = useCallback(() => {
    if (hIndex.current < history.current.length - 1) { hIndex.current++; restore(history.current[hIndex.current]!); }
  }, [restore]);

  /* ---------- Init canvas ---------- */
  useEffect(() => {
    if (!canvasRef.current) return;
    const c = new fabric.Canvas(canvasRef.current, {
      backgroundColor: "rgba(0,0,0,0)",
      preserveObjectStacking: true,
      selection: true,
    });
    fc.current = c;

    c.on("object:added", () => { snapshot(); rerender(); });
    c.on("object:removed", () => { snapshot(); rerender(); });
    c.on("object:modified", () => { snapshot(); rerender(); });
    c.on("path:created", () => { snapshot(); rerender(); });
    c.on("selection:created", rerender);
    c.on("selection:updated", rerender);
    c.on("selection:cleared", rerender);
    c.on("mouse:wheel", (opt) => {
      const e = opt.e as unknown as WheelEvent;
      e.preventDefault();
      setZoom((z) => Math.min(4, Math.max(0.02, z * (e.deltaY < 0 ? 1.12 : 0.89))));
    });
    c.on("mouse:down", (opt) => {
      const o = opt as unknown as { absolutePointer?: { x: number; y: number }; scenePoint?: { x: number; y: number } };
      const p = o.absolutePointer ?? o.scenePoint;
      if (!p) return;
      const t = toolRef.current;
      if (t === "select" || t === "brush" || t === "image") return;
      const fillV = fillRef.current;
      let obj: fabric.Object | null = null;
      if (t === "text") {
        obj = new fabric.Textbox("Votre texte", {
          left: p.x, top: p.y, fontFamily: "'Archivo Black', sans-serif",
          fontSize: Math.round(docRef.current.w * 0.09), fill: fillV, width: docRef.current.w * 0.7,
          name: "Texte",
        } as Record<string, unknown>);
      } else if (t === "rect") {
        obj = new fabric.Rect({ left: p.x - docRef.current.w * 0.12, top: p.y - docRef.current.h * 0.08, width: docRef.current.w * 0.24, height: docRef.current.h * 0.16, fill: fillV, name: "Rectangle" } as Record<string, unknown>);
      } else if (t === "ellipse") {
        obj = new fabric.Ellipse({ left: p.x - docRef.current.w * 0.1, top: p.y - docRef.current.h * 0.08, rx: docRef.current.w * 0.1, ry: docRef.current.h * 0.08, fill: fillV, name: "Ellipse" } as Record<string, unknown>);
      } else if (t === "triangle") {
        obj = new fabric.Triangle({ left: p.x - docRef.current.w * 0.1, top: p.y - docRef.current.h * 0.08, width: docRef.current.w * 0.2, height: docRef.current.h * 0.16, fill: fillV, name: "Triangle" } as Record<string, unknown>);
      } else if (t === "line") {
        obj = new fabric.Line([p.x - docRef.current.w * 0.15, p.y, p.x + docRef.current.w * 0.15, p.y], { stroke: fillV, strokeWidth: Math.max(2, docRef.current.w * 0.006), name: "Ligne" } as Record<string, unknown>);
      }
      if (obj) {
        c.add(obj);
        c.setActiveObject(obj);
        setToolState("select");
      }
    });

    setReady(true);
    snapshot();
    return () => { c.dispose(); fc.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Refs pour le handler mouse:down (évite de recréer le canvas) */
  const toolRef = useRef<Tool>(tool);
  const fillRef = useRef(fill);
  const docRef = useRef({ w: docW, h: docH });
  useEffect(() => { toolRef.current = tool; }, [tool]);
  useEffect(() => { fillRef.current = fill; }, [fill]);
  useEffect(() => { docRef.current = { w: docW, h: docH }; }, [docW, docH]);
  const setToolState = (t: Tool) => {
    setTool(t);
    const c = fc.current;
    if (!c) return;
    c.isDrawingMode = t === "brush";
    if (t === "brush") {
      const b = new fabric.PencilBrush(c);
      b.color = fillRef.current;
      b.width = Math.max(2, mmToPx(brushMmRef.current));
      c.freeDrawingBrush = b;
    }
    c.defaultCursor = t === "select" ? "default" : "crosshair";
  };
  const brushMmRef = useRef(brushMm);
  useEffect(() => {
    brushMmRef.current = brushMm;
    const c = fc.current;
    if (c?.freeDrawingBrush) c.freeDrawingBrush.width = Math.max(2, mmToPx(brushMm));
  }, [brushMm]);

  /* ---------- Dimensions / zoom ---------- */
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setBox({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    setBox({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, [ready]);

  useEffect(() => {
    const c = fc.current;
    if (!c || !ready) return;
    c.setDimensions({ width: Math.max(20, docW * zoom), height: Math.max(20, docH * zoom) });
    c.setZoom(zoom);
    c.requestRenderAll();
  }, [zoom, docW, docH, ready]);

  const fit = useCallback(() => {
    setZoom(Math.min((box.w - 24) / docW, (box.h - 24) / docH));
  }, [box, docW, docH]);
  useEffect(() => { if (ready) fit(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [ready, widthMm, heightMm]);

  /* ---------- Chargement initial / design existant ---------- */
  useEffect(() => {
    if (!ready) return;
    setDesigns(loadDesigns());
    const d = getDesign(initialId ?? null);
    const c = fc.current;
    if (d && c) {
      (async () => {
        restoring.current = true;
        await c.loadFromJSON(d.json);
        restoring.current = false;
        setName(d.name); setWidthMm(d.widthMm); setHeightMm(d.heightMm);
        idRef.current = d.id;
        snapshot();
        rerender();
      })();
    } else {
      snapshot();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  /* ---------- Raccourcis clavier ---------- */
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      const c = fc.current;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") { e.preventDefault(); doSave(); return; }
      if (!c) return;
      const k = e.key.toLowerCase();
      if (k === "v") setToolState("select");
      else if (k === "t") setToolState("text");
      else if (k === "r") setToolState("rect");
      else if (k === "e") setToolState("ellipse");
      else if (k === "l") setToolState("line");
      else if (k === "b") setToolState("brush");
      else if ((k === "delete" || k === "backspace") && c.getActiveObject()) {
        c.remove(c.getActiveObject()!);
        c.discardActiveObject();
        c.requestRenderAll();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, undo, redo, name, widthMm, heightMm]);

  /* ---------- Actions ---------- */
  const active = fc.current?.getActiveObject() ?? null;
  const objects = fc.current?.getObjects() ?? [];

  function addObjectFromDataUrl(dataUrl: string) {
    const c = fc.current;
    if (!c) return;
    fabric.FabricImage.fromURL(dataUrl).then((img) => {
      const scale = Math.min((docRef.current.w * 0.6) / (img.width ?? 1), (docRef.current.h * 0.6) / (img.height ?? 1), 1);
      img.set({ left: docRef.current.w / 2, top: docRef.current.h / 2, originX: "center", originY: "center", scaleX: scale, scaleY: scale, name: "Image" } as Record<string, unknown>);
      c.add(img);
      c.setActiveObject(img);
      c.requestRenderAll();
      rerender();
    });
  }

  async function doSave(): Promise<boolean> {
    const c = fc.current;
    if (!c) return false;
    const thumb = c.toDataURL({ format: "png", multiplier: Math.max(0.001, 260 / (docW * zoom)) });
    const json = JSON.stringify((c as unknown as { toJSON: (p?: string[]) => object }).toJSON(["name"]));
    const res = saveDesign({ id: idRef.current, name, updatedAt: Date.now(), widthMm, heightMm, thumb, json });
    if (!res.ok) { flash(`⚠️ ${res.error}`); return false; }
    setDesigns(loadDesigns());
    flash("💾 Design enregistré sur ce poste");
    return true;
  }

  function exportPNG() {
    const c = fc.current;
    if (!c) return;
    const data = c.toDataURL({ format: "png", multiplier: 1 / c.getZoom() });
    downloadDataUrl(data, `${name.replace(/[^\w\-à-ÿ ]+/gi, "").trim() || "design"}_${docW}x${docH}px_${DPI}dpi.png`);
    flash(`📤 PNG ${docW}×${docH}px (300 DPI · ${widthMm}×${heightMm} mm) exporté`);
  }

  async function sendTo(module: "mockup" | "rip") {
    if (await doSave()) window.location.href = `/${module}?id=${idRef.current}`;
  }

  function newDoc() {
    const c = fc.current;
    if (!c) return;
    c.clear();
    c.backgroundColor = "rgba(0,0,0,0)";
    idRef.current = newId();
    setName("Design sans titre");
    history.current = []; hIndex.current = -1;
    snapshot();
    rerender();
  }

  function applyPreset(label: string) {
    setPreset(label);
    const p = DOC_PRESETS.find((x) => x.label === label);
    if (p) { setWidthMm(p.w); setHeightMm(p.h); }
  }

  async function removeWhite(img: fabric.FabricImage, thr: number) {
    const el = img.getElement() as HTMLImageElement;
    const cnv = document.createElement("canvas");
    cnv.width = el.naturalWidth; cnv.height = el.naturalHeight;
    const ctx = cnv.getContext("2d")!;
    ctx.drawImage(el, 0, 0);
    const d = ctx.getImageData(0, 0, cnv.width, cnv.height);
    for (let i = 0; i < d.data.length; i += 4) {
      const m = Math.min(d.data[i]!, d.data[i + 1]!, d.data[i + 2]!);
      if (m > thr) d.data[i + 3] = 0;
      else if (m > thr - 30) d.data[i + 3] = Math.round((d.data[i + 3]! * (thr - m)) / 30);
    }
    ctx.putImageData(d, 0, 0);
    await img.setSrc(cnv.toDataURL("image/png"));
    fc.current?.requestRenderAll();
    snapshot();
    rerender();
    flash("Blanc supprimé (fond transparent)");
  }

  function setFilter(type: string, value?: number) {
    const obj = active;
    if (!obj || obj.type !== "image") return;
    const img = obj as fabric.FabricImage;
    const F = fabric.filters;
    const map: Record<string, () => { type: string }> = {
      brightness: () => new F.Brightness({ brightness: value ?? 0 }),
      contrast: () => new F.Contrast({ contrast: value ?? 0 }),
      saturation: () => new F.Saturation({ saturation: value ?? 0 }),
      blur: () => new F.Blur({ blur: value ?? 0 }),
      grayscale: () => new F.Grayscale(),
      sepia: () => new F.Sepia(),
      invert: () => new F.Invert(),
    };
    const maker = map[type];
    if (!maker) return;
    img.filters = (img.filters ?? []).filter((f) => f.type !== maker().type);
    if (type !== "none") img.filters.push(maker() as never);
    img.applyFilters();
    fc.current?.requestRenderAll();
    rerender();
  }

  const setProp = (key: string, value: unknown) => {
    const obj = active;
    if (!obj) return;
    obj.set(key, value as never);
    obj.setCoords();
    fc.current?.requestRenderAll();
    snapshot();
    rerender();
  };

  const layerName = (o: fabric.Object, i: number): string =>
    String((o as unknown as Record<string, unknown>).name ?? "") ||
    ({ textbox: "Texte", iText: "Texte", rect: "Rectangle", ellipse: "Ellipse", triangle: "Triangle", line: "Ligne", path: "Tracé", image: "Image" }[o.type ?? ""] ?? `Objet ${i + 1}`);

  const sel = active;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anySel = sel ? (sel as unknown as Record<string, any>) : null;
  const isImage = sel?.type === "image";
  const isText = sel?.type === "textbox" || sel?.type === "i-text";

  return (
    <div className="h-[calc(100vh-105px)] flex flex-col gap-2">
      {/* Barre haute */}
      <div className="flex items-center gap-2 flex-wrap bg-[#202128] border border-[#2e3038] rounded-lg px-3 py-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="bg-transparent border border-transparent hover:border-[#2e3038] focus:border-cyan-500 rounded px-2 py-1 text-sm font-bold text-white w-48 outline-none"
          aria-label="Nom du design"
        />
        <select value={preset} onChange={(e) => applyPreset(e.target.value)} className="bg-[#17181d] border border-[#2e3038] rounded px-2 py-1.5 text-xs text-gray-300 outline-none">
          {DOC_PRESETS.map((p) => <option key={p.label}>{p.label}</option>)}
        </select>
        <div className="flex items-center gap-1 text-xs">
          <input type="number" min={10} max={1200} value={widthMm} onChange={(e) => { setWidthMm(Number(e.target.value) || 10); setPreset("Personnalisé"); }} className="w-16 bg-[#17181d] border border-[#2e3038] rounded px-1.5 py-1.5 text-gray-300 outline-none" aria-label="Largeur mm" />
          <span className="text-gray-500">×</span>
          <input type="number" min={10} max={2000} value={heightMm} onChange={(e) => { setHeightMm(Number(e.target.value) || 10); setPreset("Personnalisé"); }} className="w-16 bg-[#17181d] border border-[#2e3038] rounded px-1.5 py-1.5 text-gray-300 outline-none" aria-label="Hauteur mm" />
          <span className="text-gray-500 font-mono ml-1">{docW}×{docH}px @300dpi</span>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-1">
          <IconBtn onClick={undo} label="Annuler (Ctrl+Z)"><Undo2 size={16} /></IconBtn>
          <IconBtn onClick={redo} label="Rétablir (Ctrl+Maj+Z)"><Redo2 size={16} /></IconBtn>
          <span className="w-px h-5 bg-[#2e3038] mx-1" />
          <IconBtn onClick={() => setZoom((z) => Math.max(0.02, z * 0.8))} label="Dézoomer"><ZoomOut size={16} /></IconBtn>
          <span className="text-[11px] font-mono text-gray-400 w-12 text-center">{Math.round(zoom * 100)}%</span>
          <IconBtn onClick={() => setZoom((z) => Math.min(4, z * 1.25))} label="Zoomer"><ZoomIn size={16} /></IconBtn>
          <IconBtn onClick={fit} label="Ajuster à l'écran"><Maximize size={16} /></IconBtn>
          <span className="w-px h-5 bg-[#2e3038] mx-1" />
          <IconBtn onClick={newDoc} label="Nouveau document"><FilePlus2 size={16} /></IconBtn>
          <button onClick={() => void doSave()} className="inline-flex items-center gap-1.5 bg-white/8 hover:bg-white/15 border border-white/15 text-white text-xs font-bold px-3 py-2 rounded-md transition-colors cursor-pointer">
            <Save size={14} /> Enregistrer
          </button>
          <button onClick={() => void sendTo("mockup")} className="inline-flex items-center gap-1.5 bg-fuchsia-500/15 hover:bg-fuchsia-500/25 border border-fuchsia-500/40 text-fuchsia-300 text-xs font-bold px-3 py-2 rounded-md transition-colors cursor-pointer">
            <Boxes size={14} /> Mockup 3D
          </button>
          <button onClick={() => void sendTo("rip")} className="inline-flex items-center gap-1.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-bold px-3 py-2 rounded-md transition-colors cursor-pointer">
            <Printer size={14} /> RIP
          </button>
          <button onClick={exportPNG} className="inline-flex items-center gap-1.5 bg-gradient-to-r from-cyan-500 to-cyan-400 hover:brightness-110 text-[#17181d] text-xs font-extrabold px-3.5 py-2 rounded-md transition-all cursor-pointer shadow-lg shadow-cyan-500/20">
            <Download size={14} /> PNG 300 DPI
          </button>
        </div>
      </div>

      {msg && <div className="text-xs font-bold text-cyan-300 bg-cyan-500/10 border border-cyan-500/30 rounded-md px-3 py-2">{msg}</div>}

      <div className="flex-1 flex gap-2 min-h-0">
        {/* Outils */}
        <div className="w-12 shrink-0 bg-[#202128] border border-[#2e3038] rounded-lg py-2 flex flex-col items-center gap-1">
          {TOOLS.map((t) => (
            <button
              key={t.key}
              title={t.label}
              aria-label={t.label}
              onClick={() => {
                if (t.key === "image") { fileRef.current?.click(); return; }
                setToolState(t.key);
              }}
              className={`w-9 h-9 rounded-md flex items-center justify-center transition-colors cursor-pointer ${tool === t.key ? "bg-cyan-500 text-[#17181d]" : "text-gray-400 hover:text-white hover:bg-white/8"}`}
            >
              {t.icon}
            </button>
          ))}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            const r = new FileReader();
            r.onload = () => { addObjectFromDataUrl(String(r.result)); setToolState("select"); };
            r.readAsDataURL(f);
            e.target.value = "";
          }} />
          <div className="flex-1" />
          <div className="text-[9px] text-gray-600 font-bold uppercase text-center px-0.5 leading-tight">300 dpi</div>
        </div>

        {/* Zone de dessin */}
        <div ref={wrapRef} className="flex-1 min-w-0 overflow-auto rounded-lg border border-[#2e3038] bg-[#1b1c22] flex items-center justify-center p-3">
          <div
            className="shadow-2xl shadow-black/50 shrink-0"
            style={{ backgroundImage: "conic-gradient(#2b2c34 0 25%, #232429 0 50%, #2b2c34 0 75%, #232429 0)", backgroundSize: "18px 18px" }}
          >
            <canvas ref={canvasRef} />
          </div>
        </div>

        {/* Panneau droit */}
        <div className="w-72 shrink-0 flex flex-col gap-2 overflow-y-auto">
          {/* Couleur / pinceau */}
          <Panel title="Couleur & pinceau">
            <div className="flex gap-1.5 items-center mb-2">
              <input type="color" value={fill} onChange={(e) => { setFill(e.target.value); if (sel) setProp("fill", e.target.value); }} className="w-9 h-8 rounded cursor-pointer bg-transparent border border-[#2e3038]" aria-label="Couleur" />
              <div className="grid grid-cols-11 gap-0.5 flex-1">
                {SWATCHES.map((s) => (
                  <button key={s} onClick={() => { setFill(s); if (sel) setProp("fill", s); }} className="w-full aspect-square rounded-sm cursor-pointer hover:scale-110 transition-transform border border-white/10" style={{ background: s }} aria-label={`Couleur ${s}`} />
                ))}
              </div>
            </div>
            {tool === "brush" && (
              <label className="block text-[10px] uppercase font-bold text-gray-500">
                Taille du pinceau : {brushMm} mm
                <input type="range" min={0.5} max={40} step={0.5} value={brushMm} onChange={(e) => setBrushMm(Number(e.target.value))} className="w-full accent-cyan-400" />
              </label>
            )}
            {sel && (
              <div className="grid grid-cols-2 gap-1.5 mt-1">
                <SmallBtn onClick={() => { const o = sel; o.set({ left: docW / 2, originX: "center" } as never); o.setCoords(); fc.current?.requestRenderAll(); snapshot(); rerender(); }}><AlignCenterHorizontal size={13} /> Centrer H</SmallBtn>
                <SmallBtn onClick={() => { const o = sel; o.set({ top: docH / 2, originY: "center" } as never); o.setCoords(); fc.current?.requestRenderAll(); snapshot(); rerender(); }}><AlignCenterVertical size={13} /> Centrer V</SmallBtn>
              </div>
            )}
          </Panel>

          {/* Propriétés */}
          {sel ? (
            <Panel title={`Propriétés — ${layerName(sel, objects.indexOf(sel))}`}>
              <div className="space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <NumField label="Opacité %" min={0} max={100} value={Math.round((sel.opacity ?? 1) * 100)} onChange={(v) => setProp("opacity", v / 100)} />
                  <NumField label="Rotation °" min={-360} max={360} value={Math.round(sel.angle ?? 0)} onChange={(v) => setProp("angle", v)} />
                </div>
                {!isImage && (
                  <label className="block">
                    <span className="text-[10px] uppercase font-bold text-gray-500">Remplissage</span>
                    <input type="color" value={String(sel.fill ?? "#ffffff").startsWith("#") ? String(sel.fill) : "#ffffff"} onChange={(e) => setProp("fill", e.target.value)} className="w-full h-7 rounded cursor-pointer bg-transparent border border-[#2e3038]" />
                  </label>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <label className="block">
                    <span className="text-[10px] uppercase font-bold text-gray-500">Contour</span>
                    <input type="color" value={String(sel.stroke ?? "#000000").startsWith("#") ? String(sel.stroke) : "#000000"} onChange={(e) => setProp("stroke", e.target.value)} className="w-full h-7 rounded cursor-pointer bg-transparent border border-[#2e3038]" />
                  </label>
                  <NumField label="Épaisseur" min={0} max={100} value={Number(sel.strokeWidth ?? 0)} onChange={(v) => setProp("strokeWidth", v)} />
                </div>
                <label className="block">
                  <span className="text-[10px] uppercase font-bold text-gray-500">Fusion (blend)</span>
                  <select value={String(sel.globalCompositeOperation ?? "source-over")} onChange={(e) => setProp("globalCompositeOperation", e.target.value)} className="w-full bg-[#17181d] border border-[#2e3038] rounded px-2 py-1.5 text-gray-300 outline-none">
                    {BLENDS.map((b) => <option key={b}>{b}</option>)}
                  </select>
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <SmallBtn onClick={() => setProp("shadow", sel.shadow ? null : new fabric.Shadow({ color: "rgba(0,0,0,0.55)", blur: docW * 0.02, offsetX: docW * 0.006, offsetY: docW * 0.006 }))}>
                    <Sparkles size={13} /> {sel.shadow ? "Retirer ombre" : "Ombre portée"}
                  </SmallBtn>
                  <SmallBtn onClick={() => {
                    const o = sel;
                    o.clone().then((cl: fabric.Object) => {
                      cl.set({ left: (o.left ?? 0) + docW * 0.03, top: (o.top ?? 0) + docH * 0.02 } as never);
                      fc.current?.add(cl);
                      fc.current?.setActiveObject(cl);
                    });
                  }}><Copy size={13} /> Dupliquer</SmallBtn>
                </div>

                {isText && anySel && (
                  <>
                    <label className="block">
                      <span className="text-[10px] uppercase font-bold text-gray-500">Police</span>
                      <select value={String(anySel.fontFamily ?? "")} onChange={(e) => setProp("fontFamily", e.target.value)} className="w-full bg-[#17181d] border border-[#2e3038] rounded px-2 py-1.5 text-gray-300 outline-none">
                        {DESIGN_FONTS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                      </select>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <NumField label="Taille px" min={8} max={2000} value={Number(anySel.fontSize ?? 100)} onChange={(v) => setProp("fontSize", v)} />
                      <NumField label="Interlettrage" min={-200} max={1200} value={Number(anySel.charSpacing ?? 0)} onChange={(v) => setProp("charSpacing", v)} />
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                      <SmallBtn onClick={() => setProp("fontWeight", anySel.fontWeight === "bold" ? "normal" : "bold")}><span className="font-extrabold">B</span></SmallBtn>
                      <SmallBtn onClick={() => setProp("fontStyle", anySel.fontStyle === "italic" ? "normal" : "italic")}><span className="italic font-serif">I</span></SmallBtn>
                      <SmallBtn onClick={() => setProp("underline", !anySel.underline)}><span className="underline">U</span></SmallBtn>
                      <SmallBtn onClick={() => setProp("textAlign", ["left", "center", "right"][((["left", "center", "right"].indexOf(String(anySel.textAlign)) + 1) % 3)])}><span className="text-[10px] font-bold">{String(anySel.textAlign ?? "left").slice(0, 4).toUpperCase()}</span></SmallBtn>
                    </div>
                  </>
                )}

                {isImage && (
                  <div className="space-y-2 pt-1 border-t border-[#2e3038]">
                    <p className="text-[10px] uppercase font-bold text-gray-500">Retouches image</p>
                    {(["brightness", "contrast", "saturation", "blur"] as const).map((f) => (
                      <FilterSlider key={f} label={{ brightness: "Luminosité", contrast: "Contraste", saturation: "Saturation", blur: "Flou" }[f]} onChange={(v) => setFilter(f, v)} max={f === "blur" ? 1 : 1} step={f === "blur" ? 0.02 : 0.05} />
                    ))}
                    <div className="grid grid-cols-3 gap-1.5">
                      <SmallBtn onClick={() => setFilter("grayscale")}>N&B</SmallBtn>
                      <SmallBtn onClick={() => setFilter("sepia")}>Sépia</SmallBtn>
                      <SmallBtn onClick={() => setFilter("invert")}>Inverser</SmallBtn>
                    </div>
                    <div>
                      <SmallBtn onClick={() => removeWhite(sel as fabric.FabricImage, 235)}>
                        <Sparkles size={13} /> Supprimer le fond blanc
                      </SmallBtn>
                      <p className="text-[10px] text-gray-500 mt-1">Rend le blanc transparent — indispensable pour le DTF sur textiles foncés.</p>
                    </div>
                  </div>
                )}
              </div>
            </Panel>
          ) : (
            <Panel title="Propriétés">
              <p className="text-xs text-gray-500">Sélectionnez un objet (ou cliquez sur un outil puis sur la toile). Raccourcis : V sélection · T texte · R rectangle · E ellipse · L ligne · B pinceau · Suppr effacer.</p>
            </Panel>
          )}

          {/* Calques */}
          <Panel title={`Calques (${objects.length})`} className="flex-1 min-h-40">
            <div className="space-y-1">
              {[...objects].reverse().map((o) => {
                const i = objects.indexOf(o);
                return (
                  <div key={i} className={`flex items-center gap-1 rounded px-1.5 py-1 text-xs ${sel === o ? "bg-cyan-500/15 border border-cyan-500/40 text-white" : "border border-transparent text-gray-400 hover:bg-white/5"}`}>
                    <button onClick={() => { fc.current?.setActiveObject(o); fc.current?.requestRenderAll(); rerender(); }} className="flex-1 min-w-0 text-left truncate cursor-pointer" onDoubleClick={() => { const n = window.prompt("Nom du calque", layerName(o, i)); if (n) { o.set("name", n as never); rerender(); } }}>
                      {layerName(o, i)}
                    </button>
                    <MiniBtn label={o.visible === false ? "Afficher" : "Masquer"} onClick={() => { o.set("visible", o.visible === false); fc.current?.requestRenderAll(); snapshot(); rerender(); }}>
                      {o.visible === false ? <EyeOff size={12} /> : <Eye size={12} />}
                    </MiniBtn>
                    <MiniBtn label={o.selectable === false ? "Déverrouiller" : "Verrouiller"} onClick={() => { const lock = o.selectable !== false; o.set({ selectable: !lock, evented: !lock, lockMovementX: lock, lockMovementY: lock } as never); fc.current?.requestRenderAll(); rerender(); }}>
                      {o.selectable === false ? <Lock size={12} /> : <Unlock size={12} />}
                    </MiniBtn>
                    <MiniBtn label="Monter" onClick={() => { fc.current?.bringObjectForward(o); snapshot(); rerender(); }}><ArrowUp size={12} /></MiniBtn>
                    <MiniBtn label="Descendre" onClick={() => { fc.current?.sendObjectBackwards(o); snapshot(); rerender(); }}><ArrowDown size={12} /></MiniBtn>
                    <MiniBtn label="Supprimer" onClick={() => { fc.current?.remove(o); rerender(); }}><Trash2 size={12} /></MiniBtn>
                  </div>
                );
              })}
              {objects.length === 0 && <p className="text-xs text-gray-600 px-1 py-2">Document vide — commencez par un texte ou importez une image.</p>}
            </div>
            {designs.length > 0 && (
              <div className="mt-3 pt-2 border-t border-[#2e3038]">
                <p className="text-[10px] uppercase font-bold text-gray-500 mb-1 flex items-center gap-1"><Layers size={11} /> Ouvrir un design</p>
                <select
                  className="w-full bg-[#17181d] border border-[#2e3038] rounded px-2 py-1.5 text-xs text-gray-300 outline-none"
                  value=""
                  onChange={(e) => { if (e.target.value) window.location.href = `/editeur?id=${e.target.value}`; }}
                >
                  <option value="">— Designs enregistrés ({designs.length}) —</option>
                  {designs.map((d) => <option key={d.id} value={d.id}>{d.name} · {d.widthMm}×{d.heightMm}mm</option>)}
                </select>
              </div>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}

/* ---------- Petits composants UI ---------- */
function IconBtn({ children, onClick, label }: { children: React.ReactNode; onClick: () => void; label: string }) {
  return (
    <button onClick={onClick} title={label} aria-label={label} className="w-8 h-8 rounded-md flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer">
      {children}
    </button>
  );
}

function Panel({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-[#202128] border border-[#2e3038] rounded-lg p-3 ${className}`}>
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">{title}</p>
      {children}
    </div>
  );
}

function SmallBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className="inline-flex items-center justify-center gap-1 bg-white/6 hover:bg-white/12 border border-[#2e3038] rounded px-2 py-1.5 text-[11px] font-bold text-gray-300 transition-colors cursor-pointer">
      {children}
    </button>
  );
}

function MiniBtn({ children, onClick, label }: { children: React.ReactNode; onClick: () => void; label: string }) {
  return (
    <button onClick={onClick} title={label} aria-label={label} className="p-1 rounded text-gray-500 hover:text-white hover:bg-white/10 cursor-pointer">
      {children}
    </button>
  );
}

function NumField({ label, value, onChange, min, max }: { label: string; value: number; onChange: (v: number) => void; min: number; max: number }) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase font-bold text-gray-500">{label}</span>
      <input type="number" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full bg-[#17181d] border border-[#2e3038] rounded px-2 py-1 text-gray-200 outline-none focus:border-cyan-500" />
    </label>
  );
}

function FilterSlider({ label, onChange, max, step }: { label: string; onChange: (v: number) => void; max: number; step: number }) {
  return (
    <label className="block text-[10px] uppercase font-bold text-gray-500">
      {label}
      <input type="range" min={0} max={max} step={step} defaultValue={0} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-cyan-400" />
    </label>
  );
}
