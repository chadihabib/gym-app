/* Start der App */
(function () {
  'use strict';
  const Gym = window.Gym;
  Gym.load();
  Gym.applyTheme();
  Gym.render();

  // Offline-Unterstützung (nur über http/https, nicht bei Doppelklick auf die Datei)
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }

  // Den Browser bitten, die Trainingsdaten nicht von sich aus zu löschen (wichtig auf dem Handy)
  if (navigator.storage && navigator.storage.persist) {
    navigator.storage.persisted().then((ok) => ok || navigator.storage.persist()).catch(() => {});
  }
})();
