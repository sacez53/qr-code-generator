// Active le fonctionnement hors ligne quand le site est servi en HTTPS.
(() => {
  "use strict";

  const local = ["localhost", "127.0.0.1", "[::1]"].includes(location.hostname);
  if (!("serviceWorker" in navigator) || (location.protocol !== "https:" && !local)) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {
      // Le site reste utilisable en ligne si le navigateur refuse l'installation.
    });
  });
})();
