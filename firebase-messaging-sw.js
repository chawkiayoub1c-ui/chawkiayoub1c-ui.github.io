// Service worker للإشعارات (رسائل جديدة + مكالمات). بدون مكتبة Firebase.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));

self.addEventListener("push", e => {
  let p = {};
  try { p = e.data ? e.data.json() : {}; } catch (_) {}
  const d = p.data || p.notification || p;
  if (!d || (!d.title && !d.body)) return;
  e.waitUntil((async () => {
    // إذا كان التطبيق مفتوحا وظاهرا، التطبيق نفسه كيعرض الرسائل والمكالمات
    const list = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    if (list.some(c => c.visibilityState === "visible")) return;
    const call = d.kind === "call";
    await self.registration.showNotification(d.title || "Unfollow Radar", {
      body: d.body || "",
      icon: new URL("apple-touch-icon.png", self.location.href).href,
      badge: new URL("apple-touch-icon.png", self.location.href).href,
      tag: d.tag || "msg",
      renotify: true,
      requireInteraction: call,
      vibrate: call ? [400, 200, 400, 200, 400, 200, 400] : [120, 60, 120],
      data: { url: d.url || "chat.html" }
    });
  })());
});

self.addEventListener("notificationclick", e => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || "chat.html", self.location.href).href;
  e.waitUntil((async () => {
    const list = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const c of list) {
      if (c.url.split("?")[0] === url.split("?")[0] && "focus" in c) {
        await c.focus();
        try { c.postMessage({ go: url }); } catch (_) {}
        return;
      }
    }
    await self.clients.openWindow(url);
  })());
});
