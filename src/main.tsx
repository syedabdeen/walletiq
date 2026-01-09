import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initGoogleAuth } from "./lib/nativeGoogleAuth";

// Initialize native Google Auth if on native platform
initGoogleAuth().catch(console.error);

// Manual cache reset: Only run cleanup if ?resetCache=1 is in the URL.
// This prevents aggressive reloads during normal use.
(async () => {
  try {
    const url = new URL(window.location.href);
    if (url.searchParams.get('resetCache') !== '1') return;

    // Clean up service workers and caches
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }

    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }

    // Remove the param and reload clean
    url.searchParams.delete('resetCache');
    window.location.replace(url.toString());
  } catch {
    // ignore
  }
})();

createRoot(document.getElementById("root")!).render(<App />);

