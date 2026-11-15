/* Start der App */
(function () {
  'use strict';
  const Gym = window.Gym;
  Gym.load();
  Gym.applyTheme();
  Gym.render();

  // Kein versehentliches Zoomen, wie in einer normalen App. Viewport-Angabe und CSS (touch-action)
  // decken Android ab; iOS-Safari ignoriert beides teilweise, deshalb zusätzlich die Gesten abfangen.
  ['gesturestart', 'gesturechange', 'gestureend'].forEach((t) => document.addEventListener(t, (e) => e.preventDefault(), { passive: false }));
  document.addEventListener('touchmove', (e) => { if (e.touches.length > 1) e.preventDefault(); }, { passive: false });

  // Offline-Unterstützung (nur über http/https, nicht bei Doppelklick auf die Datei)
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }

  // Den Browser bitten, die Trainingsdaten nicht von sich aus zu löschen (wichtig auf dem Handy)
  if (navigator.storage && navigator.storage.persist) {
    navigator.storage.persisted().then((ok) => ok || navigator.storage.persist()).catch(() => {});
  }
})();
