/* Service worker PLanning Pro — installabilité PWA + socle hors-ligne léger.
   Les API et les pages authentifiées ne sont JAMAIS mises en cache. */
const CACHE = "planning-pro-v1";
const PRECACHE = ["/icons/icon-192.png", "/icons/icon-512.png", "/manifest.webmanifest"];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return; // données temps réel : toujours le réseau

  const isStatic =
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/images/");

  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok && isStatic) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(async () => {
        const cached = await caches.match(req);
        if (cached) return cached;
        if (req.mode === "navigate") {
          return new Response(
            `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Hors ligne</title></head>
<body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#16191e;color:#fff;font-family:system-ui,sans-serif">
<div style="text-align:center;padding:24px">
<div style="height:10px;width:180px;margin:0 auto 20px;border-radius:99px;background:repeating-linear-gradient(-45deg,#ffc400 0 12px,#16191e 12px 24px)"></div>
<h1 style="font-size:26px;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px">Pas de réseau</h1>
<p style="color:#9ca3af;font-size:14px;max-width:300px">Le planning nécessite une connexion (4G/Wi-Fi). Retrouvez du réseau puis réessayez — vos alertes et messages vous attendent.</p>
<button onclick="location.reload()" style="margin-top:16px;background:#f26a1b;color:#fff;border:0;border-radius:8px;padding:12px 22px;font-weight:700;font-size:14px;text-transform:uppercase;letter-spacing:1px;cursor:pointer">Réessayer</button>
</div></body></html>`,
            { headers: { "Content-Type": "text/html; charset=utf-8" } }
          );
        }
        return Response.error();
      })
  );
});

/* Clic sur une notification système (si autorisée) → ouvrir l'appli */
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(self.clients.openWindow("/notifications"));
});