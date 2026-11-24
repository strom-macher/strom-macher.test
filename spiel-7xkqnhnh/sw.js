// Offline-Modus: das Spiel merkt sich seine Dateien beim ersten Öffnen und startet danach auch ohne Netz.
// Mit Netz holt es zuerst die neueste Fassung (so kommen neue Versionen an), ohne Netz nimmt es die gemerkte.
// Anfragen an andere Adressen (die Bestenliste bei Supabase) lässt es in Ruhe.
const VERSION = '20261124193739';
const CACHE = `kilowatt-holdem-${VERSION}`;
const DATEIEN = ['./', './index.html', './manifest.webmanifest', './icons/icon-180.png', './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(DATEIEN)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((namen) => Promise.all(namen.filter((n) => n.startsWith('kilowatt-holdem-') && n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const anfrage = e.request;
  if (anfrage.method !== 'GET' || new URL(anfrage.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(anfrage)
      .then((antwort) => {
        if (antwort.ok) { const kopie = antwort.clone(); caches.open(CACHE).then((c) => c.put(anfrage, kopie)); }
        return antwort;
      })
      .catch(() => caches.match(anfrage, { ignoreSearch: true }).then((treffer) => treffer ?? caches.match('./index.html'))),
  );
});
