// ============================================================
// Service Worker：オフラインでも動くようにファイルをキャッシュ
// （iPadで「ホーム画面に追加」したあと、ネットがなくても起動できる）
// ============================================================

const CACHE = "hiragana-v2"; // 中身を更新したらバージョンを上げる

// 最初にキャッシュしておくファイル一覧
const ASSETS = [
  "./",
  "./index.html",
  "./css/style.css",
  "./js/app.js",
  "./js/data.js",
  "./js/speech.js",
  "./js/audio.js",
  "./js/trace.js",
  "./js/strokes.js",
  "./js/strokeAnim.js",
  "./manifest.webmanifest",
  "./icons/icon.svg",
];

// インストール時：必要なファイルをまとめて保存
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

// 有効化時：古いバージョンのキャッシュを削除
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// 取得時：キャッシュ優先（なければネットワーク）
self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then((hit) => hit || fetch(e.request))
  );
});
