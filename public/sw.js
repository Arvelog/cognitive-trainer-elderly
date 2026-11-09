// Offline support for «Поруч»: the app shell and every file it has loaded stay available without internet.
// Pages: network first, falling back to the saved copy. Built assets (hashed names), images, fonts: cache first.
const CACHE = 'poruch-v2';
const SHELL = ['/', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon.svg',
  // Task pictures, so writing and scene tasks keep their image even when first opened offline.
  '/images/practice/01.webp', '/images/practice/02.webp', '/images/practice/03.webp', '/images/scenes/woman-cooking.jpg'];
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

// The page's own scripts and styles have hashed names, so they are read from the page itself.
const cacheAssetsOf = async (page) => {
  const html = await page.text();
  const assets = [...new Set([...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((match) => match[1]))];
  const cache = await caches.open(CACHE);
  const missing = (await Promise.all(assets.map(async (url) => (await cache.match(url, { ignoreVary: true })) ? null : url))).filter(Boolean);
  await cache.addAll(missing);
};
const precache = async () => {
  const cache = await caches.open(CACHE);
  await cache.addAll(SHELL);
  await cacheAssetsOf(await cache.match('/'));
};
self.addEventListener('install', (event) => {
  event.waitUntil(precache().then(() => self.skipWaiting()));
});
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});

const save = (request, response) => {
  if (response && (response.ok || response.type === 'opaque')) caches.open(CACHE).then((cache) => cache.put(request, response.clone()));
  return response;
};

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  const sameOrigin = url.origin === self.location.origin;
  if (sameOrigin && url.pathname.startsWith('/api/')) return;
  if (!sameOrigin && !FONT_HOSTS.includes(url.hostname)) return;
  if (request.mode === 'navigate') {
    // A fresh page may point to new hashed files; they are saved for the next offline visit.
    event.respondWith(fetch(request).then((response) => {
      if (response.ok && url.pathname === '/') event.waitUntil(cacheAssetsOf(response.clone()).catch(() => {}));
      return save('/', response);
    }).catch(() => caches.match('/', { ignoreVary: true })));
    return;
  }
  event.respondWith(caches.match(request, { ignoreVary: true }).then((hit) => hit || fetch(request).then((response) => save(request, response))));
});
