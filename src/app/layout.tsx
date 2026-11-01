import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "DTF Studio Pro — Création, mockup 3D et RIP DTF",
  description:
    "Studio DTF professionnel : éditeur de design 300 DPI, mockups textiles (t-shirt, hoodie, casquette, S→XXXL), RIP avec canal blanc, gang sheet et profils Epson.",
  applicationName: "DTF Studio Pro",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "DTF Studio Pro" },
  icons: {
    icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#17181d",
  width: "device-width",
  initialScale: 1,
};

const TABS = [
  { href: "/", label: "Accueil" },
  { href: "/editeur", label: "Éditeur de design" },
  { href: "/mockup", label: "Mockup 3D" },
  { href: "/rip", label: "RIP DTF" },
  { href: "/usb", label: "Clé USB" },
];

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body className="bg-[#17181d] text-gray-200 antialiased">
        <link
          href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700;800&family=Barlow:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600&family=Archivo+Black&family=Bebas+Neue&family=Permanent+Marker&family=Pacifico&family=Oswald:wght@400;600&family=Playfair+Display:ital,wght@0,700;1,700&display=swap"
          rel="stylesheet"
        />
        <header className="sticky top-0 z-40 bg-[#202128]/95 backdrop-blur border-b border-[#2e3038]">
          <div className="max-w-[1600px] mx-auto px-4 md:px-6 h-14 flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2.5 shrink-0">
              <span className="w-8 h-8 rounded-md bg-gradient-to-br from-cyan-400 to-fuchsia-500 flex items-center justify-center font-display font-extrabold text-[#17181d] text-sm shadow-lg shadow-cyan-500/20">
                DTF
              </span>
              <span className="font-display text-lg font-extrabold uppercase tracking-wide text-white leading-none">
                Studio <span className="bg-gradient-to-r from-cyan-400 to-fuchsia-400 bg-clip-text text-transparent">Pro</span>
              </span>
            </Link>
            <nav className="flex items-center gap-1 overflow-x-auto ml-2">
              {TABS.map((t) => (
                <Link
                  key={t.href}
                  href={t.href}
                  className="px-3 py-1.5 rounded-md text-[13px] font-semibold text-gray-400 hover:text-white hover:bg-white/8 whitespace-nowrap transition-colors"
                >
                  {t.label}
                </Link>
              ))}
            </nav>
            <div className="flex-1" />
            <span className="hidden md:inline text-[10px] font-bold uppercase tracking-widest text-gray-500 border border-[#2e3038] rounded px-2 py-1">
              300 DPI · CMYK-ready · White ink
            </span>
          </div>
        </header>
        <main className="max-w-[1600px] mx-auto px-4 md:px-6 py-6">{children}</main>
        <footer className="border-t border-[#2e3038] mt-10">
          <div className="max-w-[1600px] mx-auto px-6 py-4 text-[11px] text-gray-500 flex flex-wrap gap-3 justify-between">
            <span>DTF Studio Pro — création, prévisualisation textile et préparation d'impression DTF.</span>
            <span>Export PNG 300 DPI · Canal blanc · Gang sheet · Profils Epson ET-8550 / XP-15000 / rouleaux 30-60 cm</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
