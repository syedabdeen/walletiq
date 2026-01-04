import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Safety cleanup: if an old PWA service-worker cached a broken build (common in mobile testing),
// it can make the app look "stuck". Unregister + clear caches so the latest code loads.
(async () => {
  try {
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch {
    // ignore
  }
})();

createRoot(document.getElementById("root")!).render(<App />);

