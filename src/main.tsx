import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Safety cleanup: if an old PWA service-worker cached a broken build (common in mobile testing),
// it can make the app look "stuck". Unregister + clear caches so the latest code loads.
// If this tab was controlled by a service worker, we do a one-time reload (with a query flag)
// so the browser re-fetches fresh assets from the network.
(async () => {
  try {
    const url = new URL(window.location.href);
    const alreadyReset = url.searchParams.get('__swreset') === '1';

    let hadController = false;

    if ('serviceWorker' in navigator) {
      hadController = !!navigator.serviceWorker.controller;
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }

    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }

    if (hadController && !alreadyReset) {
      url.searchParams.set('__swreset', '1');
      window.location.replace(url.toString());
    }
  } catch {
    // ignore
  }
})();

createRoot(document.getElementById("root")!).render(<App />);

