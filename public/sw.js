// public/sw.js
// 簡單的 Service Worker - 用於 PWA 安裝功能

const CACHE_NAME = 'learning-platform-v1';

// 安裝事件
self.addEventListener('install', (event) => {
  console.log('Service Worker 安裝中...');
  self.skipWaiting();
});

// 啟動事件
self.addEventListener('activate', (event) => {
  console.log('Service Worker 已啟動');
  event.waitUntil(clients.claim());
});

// 攔截請求（直接走網路，不做離線快取）
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
