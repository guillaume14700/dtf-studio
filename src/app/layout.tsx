import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "DTF Studio Pro — Création, mockup 3D et RIP DTF",
  description:
    "Studio DTF professionnel : création de visuels (avec IA), mockups textiles, impression DTF — canal blanc, séparations d'encre, mise en page et coûts.",
  applicationName: "DTF Studio Pro",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "DTF Studio Pro" },
  icons: {
    icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = { themeColor: "#4f46e5", width: "device-width", initialScale: 1 };

const TABS = [
  { href: "/", label: "Accueil" },
  { href: "/editeur", label: "Création" },
  { href: "/ai", label: "Générateur IA" },
  { href: "/mockup", label: "Mockup 3D" },
  { href: "/rip", label: "Impression DTF" },
  { href: "/usb", label: "Clé USB" },
];

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body className="antialiased">
        <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-slate-200 shadow-sm">
          <div className="max-w-[1600px] mx-auto px-4 md:px-6 h-14 flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2.5 shrink-0">
              <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-fuchsia-600 flex items-center justify-center font-display font-extrabold text-white text-[11px] shadow-md shadow-indigo-500/20">
                DTF
              </span>
              <span className="font-display text-lg font-extrabold tracking-tight text-slate-900 leading-none">
                Studio <span className="bg-gradient-to-r from-cyan-600 to-fuchsia-600 bg-clip-text text-transparent">Pro</span>
              </span>
            </Link>
            <nav className="flex items-center gap-0.5 overflow-x-auto ml-2">
              {TABS.map((t) => (
                <Link key={t.href} href={t.href}
                  className="px-3 py-1.5 rounded-md text-[13px] font-semibold text-slate-500 hover:text-slate-900 hover:bg-slate-100 whitespace-nowrap transition-colors">
                  {t.label}
                </Link>
              ))}
            </nav>
            <div className="flex-1" />
            <span className="hidden md:inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-400 border border-slate-200 bg-slate-50 rounded-full px-3 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Atelier DTF
            </span>
          </div>
        </header>
        <main className="max-w-[1600px] mx-auto px-4 md:px-6 py-6">{children}</main>
        <footer className="border-t border-slate-200 mt-10 bg-white">
          <div className="max-w-[1600px] mx-auto px-6 py-4 text-[11px] text-slate-400 flex flex-wrap gap-3 justify-between">
            <span>DTF Studio Pro — votre atelier DTF numérique.</span>
            <span>Création · IA · Mockups · Impression</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
