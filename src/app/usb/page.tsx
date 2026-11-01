"use client";

import { useEffect, useState } from "react";
import { Usb, Download, Monitor, Apple, FileText, Globe, Info } from "lucide-react";
import { downloadText } from "@/components/store";

export default function UsbPage() {
  const [origin, setOrigin] = useState("");
  useEffect(() => { setOrigin(`${window.location.origin}/studio`); }, []);
  const url = origin || "https://VOTRE-SITE/studio";

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-emerald-400 mb-2 flex items-center gap-2">
          <Usb size={14} /> Distribution sans installation
        </p>
        <h1 className="font-display text-4xl md:text-5xl font-extrabold uppercase text-white leading-none">Kit clé USB</h1>
        <p className="mt-3 text-gray-400 text-sm max-w-xl">
          Copiez ces 4 fichiers sur une clé USB. Chez votre client (PC ou Mac), un double-clic sur le lanceur
          ouvre <strong className="text-white">DTF Studio Pro</strong> en plein écran — aucune installation,
          aucun compte, fonctionne aussi en l'installant comme application (menu du navigateur → « Installer »).
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <button
          onClick={() => downloadText(`[InternetShortcut]\r\nURL=${url}\r\n`, "DTF-Studio.url")}
          className="text-left rounded-xl border border-[#2e3038] bg-[#202128] p-5 hover:border-cyan-500/40 transition-colors cursor-pointer group"
        >
          <span className="w-11 h-11 rounded-lg bg-cyan-500/15 text-cyan-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform"><Monitor size={22} /></span>
          <p className="font-display text-xl font-extrabold uppercase text-white">1 · Lanceur Windows</p>
          <p className="text-xs text-gray-400 mt-1">Fichier <span className="font-mono text-cyan-400">DTF-Studio.url</span> — double-clic → le studio s'ouvre dans le navigateur.</p>
          <span className="inline-flex items-center gap-1.5 mt-3 text-xs font-bold text-cyan-400"><Download size={14} /> Télécharger</span>
        </button>

        <button
          onClick={() => downloadText(
            `<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n<plist version="1.0">\n<dict>\n\t<key>URL</key>\n\t<string>${url}</string>\n</dict>\n</plist>\n`,
            "DTF-Studio.webloc", "application/xml"
          )}
          className="text-left rounded-xl border border-[#2e3038] bg-[#202128] p-5 hover:border-fuchsia-500/40 transition-colors cursor-pointer group"
        >
          <span className="w-11 h-11 rounded-lg bg-fuchsia-500/15 text-fuchsia-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform"><Apple size={22} /></span>
          <p className="font-display text-xl font-extrabold uppercase text-white">2 · Lanceur Mac</p>
          <p className="text-xs text-gray-400 mt-1">Fichier <span className="font-mono text-fuchsia-400">DTF-Studio.webloc</span> — double-clic (1re fois : clic droit → Ouvrir).</p>
          <span className="inline-flex items-center gap-1.5 mt-3 text-xs font-bold text-fuchsia-400"><Download size={14} /> Télécharger</span>
        </button>

        <button
          onClick={() => downloadText(
            `<!doctype html>\n<html lang="fr">\n<head>\n<meta charset="utf-8">\n<meta http-equiv="refresh" content="0;url=${url}">\n<title>DTF Studio Pro</title>\n<style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#17181d;color:#fff;font-family:system-ui,sans-serif}a{color:#22d3ee;font-weight:700}</style>\n</head>\n<body>\n<div style="text-align:center">\n<h1 style="letter-spacing:2px">DTF STUDIO PRO</h1>\n<p>Ouverture automatique… Si rien ne se passe : <a href="${url}">cliquez ici</a></p>\n</div>\n</body>\n</html>\n`,
            "Lanceur-DTF-Studio.html", "text/html;charset=utf-8"
          )}
          className="text-left rounded-xl border border-[#2e3038] bg-[#202128] p-5 hover:border-amber-500/40 transition-colors cursor-pointer group"
        >
          <span className="w-11 h-11 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform"><Globe size={22} /></span>
          <p className="font-display text-xl font-extrabold uppercase text-white">3 · Lanceur universel</p>
          <p className="text-xs text-gray-400 mt-1">Fichier <span className="font-mono text-amber-400">Lanceur-DTF-Studio.html</span> — fonctionne partout, même si .url/.webloc sont bloqués.</p>
          <span className="inline-flex items-center gap-1.5 mt-3 text-xs font-bold text-amber-400"><Download size={14} /> Télécharger</span>
        </button>

        <button
          onClick={() => downloadText(
            `DTF STUDIO PRO — MODE D'EMPLOI DE LA CLE USB\n================================================\n\n1. Branchez la clé USB sur le PC ou le Mac.\n2. Ouvrez la clé dans l'explorateur de fichiers.\n3. Double-cliquez sur :\n   - Windows : "DTF-Studio.url" (ou le Lanceur .html)\n   - Mac     : "DTF-Studio.webloc" (1re fois : clic droit > Ouvrir)\n4. Le studio s'ouvre en plein écran dans le navigateur.\n\nASTUCE — Installer comme une vraie application :\n   Dans le navigateur, menu > "Installer l'application" (ou le bouton\n   d'installation dans la barre d'adresse). Le studio aura ensuite sa\n   propre icône sur le bureau, sans clé USB.\n\nAdresse du studio : ${url}\n\nVos designs sont enregistrés dans le navigateur du poste utilisé.\nPensez a exporter vos PNG 300 DPI pour les archiver sur la clé.\n`,
            "LISEZ-MOI.txt"
          )}
          className="text-left rounded-xl border border-[#2e3038] bg-[#202128] p-5 hover:border-emerald-500/40 transition-colors cursor-pointer group"
        >
          <span className="w-11 h-11 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform"><FileText size={22} /></span>
          <p className="font-display text-xl font-extrabold uppercase text-white">4 · Mode d'emploi</p>
          <p className="text-xs text-gray-400 mt-1">Fichier <span className="font-mono text-emerald-400">LISEZ-MOI.txt</span> — instructions imprimables pour vos clients.</p>
          <span className="inline-flex items-center gap-1.5 mt-3 text-xs font-bold text-emerald-400"><Download size={14} /> Télécharger</span>
        </button>
      </div>

      <div className="rounded-xl border border-[#2e3038] bg-[#202128] p-5 text-sm text-gray-400 space-y-2">
        <p className="flex gap-2 items-start text-gray-300 font-bold"><Info size={16} className="text-cyan-400 shrink-0 mt-0.5" /> Pourquoi pas un .exe / .dmg classique ?</p>
        <p>
          Les systèmes modernes (Windows 11, macOS) bloquent les installations depuis une clé USB non signées
          (SmartScreen, Gatekeeper) — c'est précisément ce que fait ce kit : <strong className="text-white">zéro installation, zéro blocage</strong>.
          Le studio est une application web installable (PWA) : vos clients peuvent aussi l'installer durablement
          sur leur bureau depuis le navigateur.
        </p>
        <p className="pt-1">
          🏭 <strong className="text-white">Version native hors-ligne plus tard :</strong> le code du studio est prêt pour être
          empaqueté en exécutable Windows/macOS (Electron ou Tauri) par un développeur — comptez 1 à 2 jours de mission.
        </p>
      </div>
    </div>
  );
}
