const CACHE = "ne-segodnya-v4";
const ASSETS = [
  "/",
  "/manifest.webmanifest",
  "/cosmic-bg.png",
  "/astral-chart.png",
  "/magic-orb.png",
  "/icon-192.png",
  "/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(ASSETS);

    const shellResponse = await fetch("/", { cache: "reload" });
    const shellText = await shellResponse.clone().text();
    await cache.put("/", shellResponse);

    const buildAssets = [...shellText.matchAll(/(?:src|href)="([^"]+)"/g)]
      .map((match) => match[1])
      .filter((url) => url.startsWith("/") && !ASSETS.includes(url));

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
      if (event.request.mode === "navigate") return cache.match("/");
      throw error;
    }
  })());
});
