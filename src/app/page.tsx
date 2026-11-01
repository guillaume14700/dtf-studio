"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Brush, Boxes, Printer, Usb, Plus, Trash2, PenTool, ArrowRight, Sparkles } from "lucide-react";
import { loadDesigns, deleteDesign, Design, pxToMm } from "@/components/store";

const MODULES = [
  {
    href: "/studio/editeur", icon: <Brush size={24} />, title: "Éditeur de design",
    desc: "Studio de création façon Photoshop : calques, textes, formes, pinceau, images, filtres, suppression du blanc. Export PNG 300 DPI à la taille exacte (mm).",
    accent: "from-cyan-500/20 to-cyan-500/5 border-cyan-500/30",
  },
  {
    href: "/studio/mockup", icon: <Boxes size={24} />, title: "Mockup 3D textile",
    desc: "Prévisualisation réaliste sur t-shirt, hoodie et casquette : 6 tailles (S → XXXL), 20 couleurs de vêtements, rotation 3D, export de la maquette.",
    accent: "from-fuchsia-500/20 to-fuchsia-500/5 border-fuchsia-500/30",
  },
  {
    href: "/studio/rip", icon: <Printer size={24} />, title: "RIP DTF",
    desc: "Canal blanc automatique (seuil, opacité, choke), miroir, gang sheet multi-designs, profils Epson ET-8550 / XP-15000 / rouleaux 30-60 cm, estimation encre & coût, exports 300 DPI.",
    accent: "from-amber-500/20 to-amber-500/5 border-amber-500/30",
  },
  {
    href: "/studio/usb", icon: <Usb size={24} />, title: "Kit clé USB",
    desc: "Les fichiers à copier sur une clé USB : double-clic → DTF Studio s'ouvre sur n'importe quel PC ou Mac, sans installation.",
    accent: "from-emerald-500/20 to-emerald-500/5 border-emerald-500/30",
  },
];

export default function StudioHome() {
  const [designs, setDesigns] = useState<Design[] | null>(null);

  useEffect(() => { setDesigns(loadDesigns()); }, []);

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="relative rounded-xl border border-[#2e3038] bg-gradient-to-br from-[#202128] to-[#17181d] overflow-hidden p-7 md:p-9">
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-fuchsia-500/10 blur-3xl" />
        <div className="relative">
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-cyan-400 mb-2 flex items-center gap-2">
            <Sparkles size={14} /> Suite DTF professionnelle — 100 % navigateur, PC & Mac
          </p>
          <h1 className="font-display text-4xl md:text-6xl font-extrabold uppercase leading-[0.95] text-white">
            DTF Studio <span className="bg-gradient-to-r from-cyan-400 to-fuchsia-400 bg-clip-text text-transparent">Pro</span>
          </h1>
          <p className="mt-3 text-gray-400 max-w-2xl text-sm md:text-base">
            Créez vos visuels comme dans Photoshop, prévisualisez-les en 3D sur textiles (S → XXXL, 20 couleurs),
            puis préparez l'impression DTF : canal blanc, miroir, gang sheet et exports 300 DPI prêts pour
            Epson ET-8550, XP-15000 et toutes les imprimantes converties.
          </p>
          <div className="mt-5 flex gap-3 flex-wrap">
            <Link href="/editeur" className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-cyan-400 text-[#17181d] font-display font-extrabold uppercase tracking-wide text-sm px-5 py-3 rounded-md hover:brightness-110 transition-all shadow-lg shadow-cyan-500/25">
              <PenTool size={17} /> Nouveau design
            </Link>
            <Link href="/rip" className="inline-flex items-center gap-2 bg-white/8 border border-white/15 text-white font-display font-extrabold uppercase tracking-wide text-sm px-5 py-3 rounded-md hover:bg-white/15 transition-all">
              <Printer size={17} /> Ouvrir le RIP
            </Link>
          </div>
        </div>
      </div>

      {/* Modules */}
      <div className="grid md:grid-cols-2 gap-4">
        {MODULES.map((m) => (
          <Link key={m.href} href={m.href} className={`group rounded-xl border bg-gradient-to-br ${m.accent} p-5 hover:scale-[1.01] hover:shadow-xl transition-all`}>
            <div className="flex items-start gap-4">
              <span className="w-12 h-12 rounded-lg bg-[#202128] border border-white/10 flex items-center justify-center text-white shrink-0 group-hover:border-cyan-400/50 transition-colors">
                {m.icon}
              </span>
              <div className="min-w-0">
                <h2 className="font-display text-2xl font-extrabold uppercase text-white leading-none flex items-center gap-2">
                  {m.title} <ArrowRight size={16} className="text-gray-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
                </h2>
                <p className="text-sm text-gray-400 mt-2 leading-relaxed">{m.desc}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Mes designs */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-2xl font-extrabold uppercase text-white">Mes designs</h2>
          <Link href="/editeur" className="inline-flex items-center gap-1.5 text-sm font-bold text-cyan-400 hover:text-cyan-300">
            <Plus size={16} /> Créer
          </Link>
        </div>
        {designs == null ? (
          <div className="h-24 rounded-lg bg-[#202128] animate-pulse" />
        ) : designs.length === 0 ? (
          <p className="text-sm text-gray-500 bg-[#202128] border border-dashed border-[#2e3038] rounded-lg px-4 py-6 text-center">
            Aucun design enregistré pour le moment — ils sont sauvegardés dans ce navigateur (poste de travail).
            Créez votre premier visuel dans l'Éditeur, puis retrouvez-le ici, dans le Mockup 3D et le RIP.
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3">
            {designs.map((d) => (
              <div key={d.id} className="group rounded-lg border border-[#2e3038] bg-[#202128] overflow-hidden hover:border-cyan-500/40 transition-colors">
                <Link href={`/studio/editeur?id=${d.id}`} className="block aspect-square p-2" style={{ backgroundImage: "conic-gradient(#2a2b33 0 25%, #232429 0 50%, #2a2b33 0 75%, #232429 0)", backgroundSize: "16px 16px" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={d.thumb} alt={d.name} className="w-full h-full object-contain" />
                </Link>
                <div className="px-2.5 py-2 border-t border-[#2e3038] flex items-center gap-1.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-white truncate">{d.name}</p>
                    <p className="text-[10px] text-gray-500">{d.widthMm}×{d.heightMm} mm · {new Date(d.updatedAt).toLocaleDateString("fr-FR")}</p>
                  </div>
                  <button
                    onClick={() => { deleteDesign(d.id); setDesigns(loadDesigns()); }}
                    className="p-1 rounded text-gray-500 hover:text-red-400 cursor-pointer"
                    aria-label="Supprimer"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-xs text-gray-500 bg-[#202128] border border-[#2e3038] rounded-lg px-4 py-3">
        💡 Vos designs sont enregistrés <strong className="text-gray-300">dans le navigateur de ce poste</strong> (comme un logiciel local).
        Exportez régulièrement vos PNG 300 DPI pour les archiver. Pour vos clients : partagez le lien du studio
        (page <Link href="/usb" className="text-cyan-400 underline">Clé USB</Link>) ou installez-le en application (menu du navigateur → Installer).
      </p>
    </div>
  );
}
