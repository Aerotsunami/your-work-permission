const CACHE = "ne-segodnya-v5";
const BASE = new URL(self.registration.scope).pathname.replace(/\/$/, "");
const assetPath = (path) => `${BASE}/${path}`;
const ASSETS = [
  `${BASE}/`,
  assetPath("manifest.webmanifest"),
  assetPath("cosmic-bg.png"),
  assetPath("astral-chart.png"),
  assetPath("magic-orb.png"),
  assetPath("icon-192.png"),
  assetPath("icon-512.png")
];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(ASSETS);

    const shellResponse = await fetch(`${BASE}/`, { cache: "reload" });
    const shellText = await shellResponse.clone().text();
    await cache.put(`${BASE}/`, shellResponse);

    const buildAssets = [...shellText.matchAll(/(?:src|href)="([^"]+)"/g)]
      .map((match) => match[1])
      .filter((url) => url.startsWith(`${BASE}/`) && !ASSETS.includes(url));

    await cache.addAll(buildAssets);
  })());
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const path = new URL(event.request.url).pathname;
    const cached = await cache.match(path, { ignoreSearch: true, ignoreVary: true });
    if (cached) return cached;

    try {
      const response = await fetch(event.request);
      if (response.ok) await cache.put(event.request, response.clone());
      return response;
    } catch (error) {
      if (event.request.mode === "navigate") return cache.match(`${BASE}/`);
      throw error;
    }
  })());
});
