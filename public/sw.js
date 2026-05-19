self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// 👈 구글 WebAPK 컴파일 서버가 요구하는 표준 fetch 구조로 수정
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => {
      return new Response("네트워크 연결이 오프라인 상태입니다.");
    })
  );
});