// public/sw.js
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // 에지 환경과의 충돌을 방지하기 위해 기본 패스스루 설정
  return;
});