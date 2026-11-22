// Salon 15 — Service Worker, nur für Laurins Mitteilungen (kein Offline-Cache).
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("push", (e) => {
  let d = {};
  try {
    d = e.data ? e.data.json() : {};
  } catch {
    d = { title: "Salon 15", body: e.data ? e.data.text() : "" };
  }
  e.waitUntil(
    self.registration.showNotification(d.title || "Salon 15", {
      body: d.body || "",
      icon: "/apple-icon.png",
      badge: "/apple-icon.png",
      data: { url: d.url || "/admin" },
    }),
  );
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || "/admin";
  e.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((list) => {
        for (const c of list) {
          if ("focus" in c) {
            c.navigate(url).catch(() => {});
            return c.focus();
          }
        }
        return self.clients.openWindow(url);
      }),
  );
});
