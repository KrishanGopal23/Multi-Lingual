self.addEventListener("push", (event) => {
  let payload = {};

  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { body: event.data?.text() || "New message" };
  }

  const title = payload.title || "New message";
  const options = {
    body: payload.body || "You have a new message.",
    data: payload.data || {},
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ("focus" in client) {
            client.navigate(url);
            return client.focus();
          }
        }

        if (self.clients.openWindow) {
          return self.clients.openWindow(url);
        }

        return null;
      }),
  );
});

self.addEventListener("sync", (event) => {
  if (event.tag !== "mlc-sync") {
    return;
  }

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      clients.forEach((client) => {
        client.postMessage({ type: "mlc-sync" });
      });
    }),
  );
});
