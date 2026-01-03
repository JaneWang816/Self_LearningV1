// public/sw.js
// 簡單的 Service Worker - 用於 PWA 安裝功能

const CACHE_NAME = 'learning-platform-v2';

// 安裝事件 - 立即接管
self.addEventListener('install', (event) => {
  console.log('Service Worker 安裝中...', CACHE_NAME);
  // 強制新的 Service Worker 立即接管
  self.skipWaiting();
});

// 啟動事件 - 清除舊快取
self.addEventListener('activate', (event) => {
  console.log('Service Worker 已啟動', CACHE_NAME);
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('刪除舊快取:', name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      // 立即控制所有客戶端
      return clients.claim();
    })
  );
});

// 攔截請求（直接走網路，不做離線快取）
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});

// 監聽訊息（支援手動更新）
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});
