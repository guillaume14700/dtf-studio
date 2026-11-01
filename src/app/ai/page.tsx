"use client";

/* Générateur IA — images PNG fond transparent pour visuels DTF (gratuit, sans clé). */

import { useRef, useState } from "react";
import Link from "next/link";
import { Sparkles, Download, Loader2, RefreshCw, Wand2, Image as ImageIcon } from "lucide-react";
import { downloadDataUrl, mmToPx } from "@/components/store";

const STYLES = [
  { id: "sticker", label: "Sticker vectoriel", v: "clean vector sticker design, bold outlines, flat modern vector, t-shirt print" },
  { id: "3d", label: "3D premium", v: "premium 3D render, glossy, dramatic lighting, t-shirt graphic" },
  { id: "retro", label: "Rétro 70s/80s", v: "retro 80s design, grainy texture, vintage sunset colors, t-shirt print" },
  { id: "neon", label: "Néon", v: "neon glowing design, dark accents, electric colors, streetwear graphic" },
  { id: "cartoon", label: "Cartoon / mignon", v: "cute cartoon character, thick outlines, kawaii, merchandise design" },
  { id: "logo", label: "Logo minimal", v: "minimalist logo, geometric, elegant, monochrome accents" },
  { id: "typo", label: "Typographie", v: "bold typography poster, dynamic lettering, streetwear" },
  { id: "phare", label: "Phare / animal", v: "wild animal illustration, fierce, detailed, sports team style" },
];

const SIZES = [
  { label: "Carré 1024", w: 1024, h: 1024 },
  { label: "Portrait 3:4", w: 896, h: 1152 },
  { label: "T-shirt 4:5", w: 896, h: 1120 },
  { label: "Panneau 21:9", w: 1344, h: 576 },
];

export default function AIPage() {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState(STYLES[0]!);
  const [size, setSize] = useState(SIZES[0]!);
  const [busy, setBusy] = useState(false);
  const [img, setImg] = useState<string | null>(null);
  const [transparent, setTransparent] = useState<string | null>(null);
  const [thr, setThr] = useState(225);
  const [err, setErr] = useState("");
  const [history, setHistory] = useState<{ url: string; prompt: string; style: string }[]>([]);
  const workRef = useRef<HTMLCanvasElement | null>(null);

  async function generate() {
    if (!prompt.trim() || busy) return;
    setBusy(true); setErr("");
    try {
      const r = await fetch(`/api/ai?prompt=${encodeURIComponent(prompt.trim())}&style=${encodeURIComponent(style.v)}&width=${size.w}&height=${size.h}`);
      if (!r.ok) { const d = (await r.json().catch(() => ({}))) as { error?: string }; throw new Error(d.error ?? "Erreur IA"); }
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      setImg(url);
      setTransparent(null);
      setHistory((h) => [{ url, prompt: prompt.trim(), style: style.label }, ...h].slice(0, 8));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erreur");
    } finally { setBusy(false); }
  }

  function toTransparent() {
    const image = new Image();
    image.onload = () => {
      const cap = 1600;
      const s = Math.min(1, cap / Math.max(image.naturalWidth, image.naturalHeight));
      const w = Math.max(1, Math.round(image.naturalWidth * s));
      const h = Math.max(1, Math.round(image.naturalHeight * s));
      const cnv = document.createElement("canvas");
      cnv.width = w; cnv.height = h;
      const ctx = cnv.getContext("2d")!;
      ctx.drawImage(image, 0, 0, w, h);
      const d = ctx.getImageData(0, 0, w, h);
      for (let i = 0; i < d.data.length; i += 4) {
        const m = Math.min(d.data[i * 4]!, d.data[i * 4 + 1]!, d.data[i * 4 + 2]!);
        if (m >= thr) d.data[i * 4 + 3] = 0;
        else if (m >= thr - 35) d.data[i * 4 + 3] = Math.round((d.data[i * 4 + 3]! * (thr - m)) / 35);
      }
      ctx.putImageData(d, 0, 0);
      workRef.current = cnv;
      setTransparent(cnv.toDataURL("image/png"));
    };
    image.src = img!;
  }

  function download(kind: "ai" | "transparent") {
    if (kind === "transparent") {
      const cnv = workRef.current;
      if (!cnv) return;
      const full = document.createElement("canvas");
      const w = mmToPx(300);
      full.width = w; full.height = Math.round(w * (cnv.height / cnv.width));
      const ctx = full.getContext("2d")!;
      const s = Math.min(full.width / cnv.width, full.height / cnv.height);
      ctx.drawImage(cnv, (full.width - cnv.width * s) / 2, (full.height - cnv.height * s) / 2, cnv.width * s, cnv.height * s);
      downloadDataUrl(full.toDataURL("image/png"), `design-ia_${full.width}x${full.height}px_300dpi.png`);
    } else if (img) {
      const a = document.createElement("a");
      a.href = img; a.download = "design-ia-original.png"; a.click();
    }
  }

  function toEditor() {
    const cnv = workRef.current;
    if (!cnv) return;
    try {
      localStorage.setItem("dtf-ai-incoming", JSON.stringify({ url: cnv.toDataURL("image/png"), prompt: prompt.trim() }));
    } catch { /* image trop lourde pour le stockage : l'éditeur l'ignorera */ }
    window.location.href = "/editeur?ai=1";
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-indigo-500 mb-1.5 flex items-center gap-2"><Sparkles size={14} /> Création assistée par IA</p>
        <h1 className="font-display text-4xl md:text-5xl font-extrabold text-slate-900 leading-none tracking-tight">Générateur de visuels</h1>
        <p className="text-sm text-slate-500 mt-2 max-w-2xl">
          Décrivez votre idée : l&apos;IA génère le visuel, le fond blanc est retiré automatiquement
          (PNG transparent prêt pour le DTF), exportable en 300 DPI ou directement dans l&apos;Éditeur.
        </p>
      </div>

      <div className="grid lg:grid-cols-[420px_1fr] gap-5">
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Votre idée</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              placeholder="Ex : un lion majestueux avec une couronne, style phare de sport, couleurs or et noir"
              className="w-full rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none px-3 py-2.5 text-sm"
            />
            <div className="flex gap-2 mt-2">
              <button onClick={generate} disabled={busy || !prompt.trim()}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-display font-extrabold uppercase tracking-wide text-sm px-4 py-3 rounded-lg transition-all cursor-pointer shadow-lg shadow-indigo-600/25">
                {busy ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />} {busy ? "Génération…" : "Générer le visuel"}
              </button>
              {img && !busy && <button onClick={generate} title="Régénérer" aria-label="Régénérer" className="p-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer transition-colors"><RefreshCw size={16} /></button>}
            </div>
            {err && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2 mt-2">{err}</p>}
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Style</p>
              <div className="flex flex-wrap gap-1.5">
                {STYLES.map((s) => (
                  <button key={s.id} onClick={() => setStyle(s)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${style.id === s.id ? "bg-indigo-600 text-white shadow" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Format</p>
              <div className="grid grid-cols-2 gap-1.5">
                {SIZES.map((s) => (
                  <button key={s.label} onClick={() => setSize(s)}
                    className={`px-2.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${size.label === s.label ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {history.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Dernières générations</p>
              <div className="grid grid-cols-4 gap-2">
                {history.map((h, i) => (
                  <button key={i} onClick={() => { setImg(h.url); setTransparent(null); }} title={h.prompt}
                    className={`aspect-square rounded-md overflow-hidden border-2 cursor-pointer transition-all bg-[conic-gradient(#f7f8fa_0_25%,#eef1f5_0_50%,#f7f8fa_0_75%,#eef1f5_0)] bg-[length:14px_14px] ${img === h.url ? "border-indigo-500" : "border-transparent hover:border-slate-300"}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={h.url} alt={h.prompt} className="w-full h-full object-contain" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm min-h-[420px] flex items-center justify-center">
            {busy ? (
              <div className="text-center py-16">
                <div className="w-14 h-14 mx-auto rounded-full bg-indigo-50 flex items-center justify-center anim-ai">
                  <Sparkles size={26} className="text-indigo-600" />
                </div>
                <p className="font-display font-extrabold uppercase tracking-wide text-slate-700 mt-4">Création en cours…</p>
                <p className="text-xs text-slate-400 mt-1">30 secondes en général — chaque image est unique</p>
              </div>
            ) : img ? (
              <div className="w-full space-y-3">
                <div className="rounded-lg overflow-hidden border border-slate-200 bg-[conic-gradient(#f7f8fa_0_25%,#eef1f5_0_50%,#f7f8fa_0_75%,#eef1f5_0)] bg-[length:18px_18px] flex items-center justify-center p-4 max-h-[560px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={transparent ?? img} alt="Résultat IA" className="max-w-full max-h-[520px] object-contain" />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {!transparent && (
                    <button onClick={toTransparent} className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3.5 py-2.5 rounded-lg cursor-pointer transition-colors">
                      <Wand2 size={14} /> Retirer le fond blanc
                    </button>
                  )}
                  {transparent && (
                    <label className="inline-flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-2 text-xs font-bold text-slate-600">
                      Seuil de retrait
                      <input type="range" min={160} max={255} value={thr} onChange={(e) => { setThr(Number(e.target.value)); toTransparent(); }} className="accent-indigo-600 w-28" />
                    </label>
                  )}
                  {transparent && (
                    <button onClick={toEditor} className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3.5 py-2.5 rounded-lg cursor-pointer transition-colors shadow-lg shadow-indigo-600/25">
                      <ImageIcon size={14} /> Ouvrir dans l&apos;Éditeur
                    </button>
                  )}
                  <button onClick={() => download(transparent ? "transparent" : "ai")} className="inline-flex items-center gap-1.5 bg-white border border-slate-300 hover:border-slate-400 text-slate-700 text-xs font-bold px-3.5 py-2.5 rounded-lg cursor-pointer transition-colors">
                    <Download size={14} /> PNG {transparent ? "transparent 300 DPI" : "original"}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">Astuce : après « Retirer le fond blanc », ajustez le seuil si des bords blancs restent, puis « Ouvrir dans l&apos;Éditeur » pour ajouter du texte ou retoucher.</p>
              </div>
            ) : (
              <div className="text-center py-16 text-slate-400">
                <Sparkles size={34} className="mx-auto mb-3" />
                <p className="font-semibold text-sm">Votre visuel apparaîtra ici</p>
                <p className="text-xs mt-1">Exemples : « loup bleu néon style streetwear » · « fleur de lys dorée, logo minimal » · « skate old school 80s »</p>
              </div>
            )}
          </div>
          <Link href="/editeur" className="inline-flex items-center gap-1.5 text-sm font-bold text-indigo-600 hover:text-indigo-700">
            Ouvrir l&apos;éditeur de design →
          </Link>
        </div>
      </div>
    </div>
  );
}
