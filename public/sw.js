self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => {
      // 👈 구글 컴파일러 합격을 위해 올바른 HTML Content-Type으로 응답 헤더 구성
      return new Response(
        '<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><title>오프라인</title></head><body><p>네트워크 연결이 오프라인 상태입니다.</p><body></html>',
        {
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        }
      );
    })
  );
});