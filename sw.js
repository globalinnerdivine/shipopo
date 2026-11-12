// オフラインでも開けるようにするための仕組み（ファイルを端末にとっておく）
const CACHE = 'shipopo-v3';
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'css/style.css',
  'js/data.js', 'js/fairy.js', 'js/store.js', 'js/music.js', 'js/world.js', 'js/items.js', 'js/screens.js', 'js/island.js', 'js/shop.js', 'js/activity.js', 'js/main.js',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // アプリのファイル：まずネット（新しい版）→ だめなら端末のコピー
  if (url.origin === location.origin) {
    e.respondWith(fetch(req).then(res => { const cp = res.clone(); caches.open(CACHE).then(c => c.put(req, cp)); return res; }).catch(() => caches.match(req).then(r => r || caches.match('index.html'))));
    return;
  }
  // フォント：端末のコピーを先に使う
  if (url.host.includes('fonts.googleapis.com') || url.host.includes('fonts.gstatic.com')) {
    e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => { const cp = res.clone(); caches.open(CACHE).then(c => c.put(req, cp)); return res; })));
  }
});
