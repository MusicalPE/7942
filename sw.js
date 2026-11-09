// 7942 선생님 앱 서비스 워커 — 앱으로 설치되게만 하고, 파일은 저장하지 않음
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
// 늘 새 판 받기: 기기에 남은 옛 판 대신 서버의 새 판을 먼저 확인
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(fetch(req, { cache: "no-cache" }).catch(() => fetch(req)));
});
