"use client";

import { useEffect, useState } from "react";
import { Usb, Download, Monitor, Apple, FileText, Globe, Info } from "lucide-react";
import { downloadText } from "@/components/store";

export default function UsbPage() {
  const [origin, setOrigin] = useState("");
  useEffect(() => { setOrigin(`${window.location.origin}`); }, []);
  const url = origin || "https://VOTRE-SITE/studio";

  const FILES = [
    {
      icon: <Monitor size={22} />, title: "Lanceur Windows", sub: "Double-clic → le studio s'ouvre.", tint: "bg-indigo-50 text-indigo-600",
      get: () => downloadText(`[InternetShortcut]\r\nURL=${url}\r\n`, "DTF-Studio.url"),
    },
    {
      icon: <Apple size={22} />, title: "Lanceur Mac", sub: "1re fois : clic droit → Ouvrir.", tint: "bg-fuchsia-50 text-fuchsia-600",
      get: () => downloadText(
        `<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n<plist version="1.0">\n<dict>\n\t<key>URL</key>\n\t<string>${url}</string>\n</dict>\n</plist>\n`,
        "DTF-Studio.webloc", "application/xml"
      ),
    },
    {
      icon: <Globe size={22} />, title: "Lanceur universel", sub: "Fonctionne sur tous les postes.", tint: "bg-amber-50 text-amber-600",
      get: () => downloadText(
        `<!doctype html>\n<html lang="fr">\n<head>\n<meta charset="utf-8">\n<meta http-equiv="refresh" content="0;url=${url}">\n<title>DTF Studio Pro</title>\n<style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f4f5f7;color:#0f172a;font-family:system-ui,sans-serif}a{color:#4f46e5;font-weight:700}</style>\n</head>\n<body>\n<div style="text-align:center">\n<h1 style="letter-spacing:2px">DTF STUDIO PRO</h1>\n<p>Ouverture automatique… Si rien ne se passe : <a href="${url}">cliquez ici</a></p>\n</div>\n</body>\n</html>\n`,
        "Lanceur-DTF-Studio.html", "text/html;charset=utf-8"
      ),
    },
    {
      icon: <FileText size={22} />, title: "Mode d'emploi", sub: "À glisser dans la clé avec les lanceurs.", tint: "bg-emerald-50 text-emerald-600",
      get: () => downloadText(
        `DTF STUDIO PRO — MODE D'EMPLOI DE LA CLE USB\n================================================\n\n1. Branchez la cle USB sur le PC ou le Mac.\n2. Ouvrez la cle dans l'explorateur de fichiers.\n3. Double-cliquez sur :\n   - Windows : "DTF-Studio.url" (ou le lanceur .html)\n   - Mac     : "DTF-Studio.webloc" (1re fois : clic droit > Ouvrir)\n4. Le studio s'ouvre en plein ecran dans le navigateur.\n\nPour en faire une application du bureau (icone, plein ecran) :\ndans le navigateur, menu > "Installer l'application".\n\nAdresse du studio : ${url}\n\nLes designs crees restent sur l'appareil utilise.\nPensez a exporter les PNG 300 DPI pour les archiver sur la cle.\n`,
        "LISEZ-MOI.txt"
      ),
    },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-indigo-500 mb-1.5 flex items-center gap-2"><Usb size={14} /> Distribution sur site</p>
        <h1 className="font-display text-4xl md:text-5xl font-extrabold text-slate-900 leading-none tracking-tight">Clé USB client</h1>
        <p className="mt-3 text-slate-500 text-sm max-w-xl">
          Copiez ces 4 fichiers sur une clé USB. Chez votre client, un double-clic ouvre DTF Studio Pro —
          sur PC comme sur Mac, <strong>zéro installation, zéro blocage antivirus</strong>.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {FILES.map((f) => (
          <button key={f.title} onClick={f.get}
            className="text-left rounded-2xl border border-slate-200 bg-white p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer group shadow-sm">
            <span className={`w-11 h-11 rounded-xl ${f.tint} flex items-center justify-center mb-3 group-hover:scale-105 transition-transform`}>{f.icon}</span>
            <p className="font-display text-xl font-extrabold text-slate-900">{f.title}</p>
            <p className="text-xs text-slate-500 mt-1">{f.sub}</p>
            <span className="inline-flex items-center gap-1.5 mt-3 text-xs font-bold text-indigo-600">
              <Download size={14} /> Télécharger le fichier
            </span>
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">
        <p className="flex gap-2 items-start text-slate-700 font-bold mb-1"><Info size={16} className="text-indigo-500 shrink-0 mt-0.5" /> Comment ça marche</p>
        <p className="leading-relaxed">
          Les fichiers pointent vers l&apos;adresse du studio indiquée plus haut. Le client a besoin d&apos;une connexion Internet
          (4G ou Wi-Fi) au premier lancement, comme pour n&apos;importe quel site. Une fois installé comme application
          (menu du navigateur → « Installer »), le studio garde sa propre icône et s&apos;ouvre en plein écran.
        </p>
      </div>
    </div>
  );
}
