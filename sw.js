// Guarda la app en la tablet para que ande aunque se corte el Wi-Fi.
// Primero intenta la versión nueva de internet; si no hay conexión, usa la guardada.
// También muestra los avisos (push) en el celular de la familia aunque la página esté cerrada.
const CACHE = 'hablemos-v10';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon.svg', './icon-192.png', './icon-512.png', './icon-maskable.png', './familia.html', './familia.webmanifest'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then((r) => { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); return r; })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});

// Llega un aviso: lo mostramos. El de ¡Ayuda! queda fijo en pantalla y vibra fuerte.
self.addEventListener('push', (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (_) { d = { body: e.data && e.data.text() }; }
  const urgente = !!d.urgente;
  e.waitUntil(self.registration.showNotification(d.title || 'Hablemos', {
    body: d.body || '',
    icon: 'icon-192.png',
    badge: 'icon-192.png',
    tag: urgente ? 'hablemos-ayuda' : 'hablemos-msg',
    renotify: true,
    requireInteraction: urgente,
    vibrate: urgente ? [500, 150, 500, 150, 500, 150, 900] : [200, 100, 200],
    data: { url: './familia.html' },
  }));
});

// Tocar el aviso abre (o trae al frente) la página de mensajes de la familia
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = new URL(e.notification.data && e.notification.data.url || './familia.html', self.registration.scope).href;
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then((ws) => {
    const w = ws.find((c) => c.url.includes('familia.html'));
    return w ? w.focus() : clients.openWindow(url);
  }));
});
