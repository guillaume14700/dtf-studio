"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Brush, Sparkles, Shirt, Printer, Usb, Plus, Trash2, ArrowRight, Check } from "lucide-react";
import { loadDesigns, deleteDesign, Design } from "@/components/store";

const MODULES = [
  { href: "/editeur", icon: <Brush size={22} />, title: "Création de design", accent: "from-indigo-500/10 to-indigo-500/0 border-indigo-200", desc: "Studio de design complet : calques, textes, formes, images, retouches. Export PNG 300 DPI à la taille exacte de votre tirage." },
  { href: "/ai", icon: <Sparkles size={22} />, title: "Générateur IA", accent: "from-fuchsia-500/10 to-fuchsia-500/0 border-fuchsia-200", desc: "Décrivez votre idée, l'IA crée le visuel, fond blanc retiré automatiquement. Huit styles prêts : sticker, 3D, rétro, néon, cartoon…" },
  { href: "/mockup", icon: <Shirt size={22} />, title: "Mockup 3D", accent: "from-cyan-500/10 to-cyan-500/0 border-cyan-200", desc: "Votre visuel en situation : t-shirt, hoodie, casquette. Six tailles du S au XXXL, vingt couleurs, rotation 3D, export de la maquette." },
  { href: "/rip", icon: <Printer size={22} />, title: "Impression DTF", accent: "from-amber-500/10 to-amber-500/0 border-amber-200", desc: "Canal blanc, séparations d'encre, test de têtes, feuilles A4/A3/A3+/A2 ou rouleau, mise en page, coût de revient, impression directe." },
];

export default function StudioHome() {
  const [designs, setDesigns] = useState<Design[] | null>(null);
  useEffect(() => { setDesigns(loadDesigns()); }, []);

  return (
    <div className="space-y-8">
      <div className="relative rounded-2xl border border-slate-200 bg-white overflow-hidden p-7 md:p-9 shadow-sm">
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-indigo-500/8 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-fuchsia-500/8 blur-3xl" />
        <div className="relative">
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-indigo-500 mb-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" /> Votre atelier DTF numérique
          </p>
          <h1 className="font-display text-4xl md:text-6xl font-extrabold text-slate-900 leading-[1.02] tracking-tight">
            DTF Studio <span className="bg-gradient-to-r from-indigo-600 to-fuchsia-600 bg-clip-text text-transparent">Pro</span>
          </h1>
          <p className="mt-3 text-slate-500 max-w-2xl text-sm md:text-base">
            Créez des visuels (même avec l&apos;IA), prévisualisez-les sur textile en 3D,
            puis imprimez en DTF : canal blanc, séparations d&apos;encre et mise en page — du croquis au film.
          </p>
          <div className="mt-5 flex gap-3 flex-wrap">
            <Link href="/editeur" className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-display font-extrabold uppercase tracking-wide text-sm px-5 py-3 rounded-lg transition-all shadow-lg shadow-indigo-600/25">
              <Plus size={17} /> Nouveau design
            </Link>
            <Link href="/ai" className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-display font-extrabold uppercase tracking-wide text-sm px-5 py-3 rounded-lg transition-all">
              <Sparkles size={16} /> Générer avec l&apos;IA
            </Link>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {MODULES.map((m) => (
          <Link key={m.href} href={m.href} className={`group rounded-2xl border bg-gradient-to-br ${m.accent} p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all`}>
            <div className="flex items-start gap-4">
              <span className="w-12 h-12 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-700 shrink-0 group-hover:text-indigo-600 group-hover:border-indigo-200 transition-colors">
                {m.icon}
              </span>
              <div className="min-w-0">
                <h2 className="font-display text-2xl font-extrabold text-slate-900 leading-none flex items-center gap-2">
                  {m.title} <ArrowRight size={16} className="text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                </h2>
                <p className="text-sm text-slate-500 mt-2 leading-relaxed">{m.desc}</p>
              </div>
            </div>
          </Link>
        ))}
        <Link href="/usb" className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-5 hover:border-slate-400 transition-all">
          <div className="flex items-start gap-4">
            <span className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 shrink-0"><Usb size={22} /></span>
            <div>
              <h2 className="font-display text-2xl font-extrabold text-slate-700 leading-none">Clé USB client</h2>
              <p className="text-sm text-slate-500 mt-2">Fichiers à copier sur une clé USB : double-clic chez le client, le studio s&apos;ouvre.</p>
            </div>
          </div>
        </Link>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-2xl font-extrabold text-slate-900">Mes designs</h2>
          <Link href="/editeur" className="inline-flex items-center gap-1.5 text-sm font-bold text-indigo-600 hover:text-indigo-700">
            <Plus size={16} /> Créer
          </Link>
        </div>
        {designs == null ? (
          <div className="h-24 rounded-xl bg-slate-100 animate-pulse" />
        ) : designs.length === 0 ? (
          <p className="text-sm text-slate-400 bg-white border border-dashed border-slate-300 rounded-xl px-4 py-8 text-center">
            Votre premier visuel n&apos;attend que vous — <Link href="/editeur" className="text-indigo-600 font-bold underline">créer</Link> ou <Link href="/ai" className="text-indigo-600 font-bold underline">générer avec l&apos;IA</Link>.
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3">
            {designs.map((d) => (
              <div key={d.id} className="group rounded-xl border border-slate-200 bg-white overflow-hidden hover:shadow-md transition-all">
                <Link href={`/editeur?id=${d.id}`} className="block aspect-square p-2 bg-[conic-gradient(#f7f8fa_0_25%,#eef1f5_0_50%,#f7f8fa_0_75%,#eef1f5_0)] bg-[length:16px_16px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={d.thumb} alt={d.name} className="w-full h-full object-contain" />
                </Link>
                <div className="px-2.5 py-2 border-t border-slate-100 flex items-center gap-1.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-800 truncate flex items-center gap-1.5">
                      {d.name} {d.id === designs[0]?.id && <Check size={11} className="text-emerald-500" />}
                    </p>
                    <p className="text-[10px] text-slate-400">{d.widthMm}×{d.heightMm} mm · {new Date(d.updatedAt).toLocaleDateString("fr-FR")}</p>
                  </div>
                  <button onClick={() => { deleteDesign(d.id); setDesigns(loadDesigns()); }} className="p-1 rounded text-slate-300 hover:text-red-500 cursor-pointer" aria-label="Supprimer">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-xs text-slate-400">Vos designs restent enregistrés sur cet appareil. Pensez à exporter vos PNG 300 DPI pour les archiver.</p>
    </div>
  );
}
