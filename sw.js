/* Wottrich (iPad) — service worker: guarda todo el paquete para usarlo sin internet */
const CACHE = 'wottrich-ipad-v9';

const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './logo.png',
  './favicon.ico',
  './icons/apple-touch-icon.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './apps/shell.js',

  './apps/cronometro/',
  './apps/cronometro/index.html',
  './apps/cronometro/xlsx.full.min.js',
  './apps/cronometro/supabase.js',
  './apps/cronometro/manifest.webmanifest',
  './apps/cronometro/icon-192.png',
  './apps/cronometro/icon-512.png',
  './apps/cronometro/apple-touch-icon.png',
  './apps/cronometro/icons/apple-touch-icon.png',
  './apps/cronometro/icons/icon-192.png',
  './apps/cronometro/icons/icon-512.png',

  './apps/gym/',
  './apps/gym/index.html',

  './apps/pizarra/',
  './apps/pizarra/index.html',

  './apps/analisis/',
  './apps/analisis/index.html',

  './apps/nutricion/',
  './apps/nutricion/index.html',

  './apps/crono/',
  './apps/crono/index.html',
  './apps/crono/xlsx.full.min.js',
  './apps/crono/audio-beep.wav',
  './apps/crono/audio-voice.wav'
];

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await Promise.allSettled(SHELL.map((u) => c.add(u)));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // La nube (Supabase) y cualquier otro dominio: siempre a la red.
  if (url.origin !== self.location.origin) return;

  // Navegacion: red primero (para ver cambios al publicar), cache si no hay internet.
  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      try {
        const res = await fetch(req);
        const c = await caches.open(CACHE);
        c.put(req.url, res.clone());
        return res;
      } catch (err) {
        const hit = await caches.match(req.url);
        if (hit) return hit;
        const home = await caches.match('./index.html');
        return home || Response.error();
      }
    })());
    return;
  }

  // Archivos del propio sitio: cache primero, red como respaldo.
  e.respondWith((async () => {
    const hit = await caches.match(req);
    if (hit) return hit;
    try {
      const res = await fetch(req);
      if (res && res.ok) {
        const c = await caches.open(CACHE);
        c.put(req, res.clone());
      }
      return res;
    } catch (err) {
      return Response.error();
    }
  })());
});
