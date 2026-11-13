/* Oberfläche: Icons, Router, Dialoge, Pausentimer */
(function () {
  'use strict';
  const Gym = window.Gym;
  const esc = Gym.esc;

  /* ---------- Icons ---------- */
  const I = (d) => `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const icon = (Gym.icon = {
    home: I('<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>'),
    history: I('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
    plus: I('<path d="M12 5v14M5 12h14"/>'),
    minus: I('<path d="M5 12h14"/>'),
    chart: I('<path d="M3 20h18"/><path d="M4 16l5-6 4 3 7-8"/>'),
    more: I('<circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/>'),
    grid: I('<rect x="4" y="4" width="6" height="6" rx="1.5"/><rect x="14" y="4" width="6" height="6" rx="1.5"/><rect x="4" y="14" width="6" height="6" rx="1.5"/><rect x="14" y="14" width="6" height="6" rx="1.5"/>'),
    dumbbell: I('<path d="M7 7v10M17 7v10M3.5 9.500v5M20.5 9.500v5M7 12h10"/>'),
    list: I('<path d="M9 6h11M9 12h11M9 18h11"/><path d="M4.500 6h.01M4.500 12h.01M4.500 18h.01"/>'),
    scale: I('<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M8.500 9a4.500 4.500 0 0 1 7 0L14 11.500h-4z"/>'),
    calc: I('<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8.500 7.500h7"/><path d="M8.500 12h.01M12 12h.01M15.500 12h.01M8.500 16h.01M12 16h.01M15.500 16h.01"/>'),
    gear: I('<circle cx="12" cy="12" r="3"/><path d="M12 2.500v3M12 18.500v3M4.900 4.900l2.200 2.200M16.900 16.900l2.200 2.200M2.500 12h3M18.500 12h3M4.900 19.100l2.200-2.200M16.900 7.100l2.200-2.200"/>'),
    trash: I('<path d="M4 7h16M9 7V4h6v3M6.500 7l1 13h9l1-13"/>'),
    check: I('<path d="M5 12.500l4.500 4.500L19 7.500"/>'),
    x: I('<path d="M6 6l12 12M18 6L6 18"/>'),
    right: I('<path d="M9 6l6 6-6 6"/>'),
    left: I('<path d="M15 6l-6 6 6 6"/>'),
    up: I('<path d="M6 15l6-6 6 6"/>'),
    down: I('<path d="M6 9l6 6 6-6"/>'),
    timer: I('<circle cx="12" cy="13.500" r="7.500"/><path d="M12 9.500v4l2.500 2M9.500 2.500h5"/>'),
    trophy: I('<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H4.500v1a3.500 3.500 0 0 0 3.500 3.500M16 6h3.500v1a3.500 3.500 0 0 1-3.500 3.500M12 13v4M8.500 20h7M10 17h4"/>'),
    edit: I('<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.500 6.500l4 4"/>'),
    play: I('<path d="M8 5v14l11-7z"/>'),
    search: I('<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.500-3.500"/>'),
    flame: I('<path d="M12 3c.500 3.500 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3.500 2-4.500 0 2 .800 3 2 3.500-.500-3 .200-6 1-9z"/>'),
    table: I('<rect x="3" y="4.500" width="18" height="15" rx="2"/><path d="M3 9.500h18M3 14.500h18M9 4.500v15"/>'),
    repeat: I('<path d="M4 11V9a3 3 0 0 1 3-3h12l-3-3M20 13v2a3 3 0 0 1-3 3H5l3 3"/>'),
    plates: I('<path d="M2.500 12h19"/><rect x="6" y="6" width="3" height="12" rx="1"/><rect x="15" y="6" width="3" height="12" rx="1"/>'),
    calendar: I('<rect x="3.500" y="5" width="17" height="15" rx="2"/><path d="M3.500 10h17M8 3v4M16 3v4"/>'),
    download: I('<path d="M12 4v11M7.500 11l4.500 4.500 4.500-4.500M5 20h14"/>'),
    upload: I('<path d="M12 15.500V4.500M7.500 9L12 4.500 16.500 9M5 20h14"/>'),
  });

  /* ---------- Seitengerüst ---------- */
  // smartBack: zurück zur vorherigen Ansicht (falls vorhanden), sonst zum festen Ziel
  Gym.page = ({ title, back, smartBack, actions, body }) => `
    <header class="top">
      ${back ? `<a class="icon-btn" href="${back}" ${smartBack ? 'data-act="navBack"' : ''} aria-label="Zurück">${icon.left}</a>` : ''}
      <h1>${esc(title)}</h1>
      <div class="top-actions">${actions || ''}</div>
    </header>
    <div class="content">${body}</div>`;

  Gym.emptyState = (ic, title, text, extra) => `
    <div class="empty">${ic}<h3>${esc(title)}</h3><p>${esc(text)}</p>${extra || ''}</div>`;

  /* ---------- Router ---------- */
  const routes = [];
  Gym.route = (pattern, tab, fn) => routes.push({ re: new RegExp('^' + pattern + '$'), tab, fn });
  Gym.render = () => {
    const view = document.getElementById('view');
    const hash = location.hash.slice(1) || '/home';
    Gym.charts.clear();
    for (const r of routes) {
      const m = hash.match(r.re);
      if (!m) continue;
      const v = r.fn(...m.slice(1).map(decodeURIComponent));
      if (!v) return; // Route hat umgeleitet
      view.innerHTML = v.html;
      document.querySelectorAll('#nav a').forEach((a) => a.classList.toggle('active', a.dataset.tab === r.tab));
      if (v.after) v.after(view);
      Gym.tick();
      return;
    }
    location.replace('#/home');
  };
  Gym.go = (h) => { if (location.hash === h) Gym.render(); else location.hash = h; };
  let depth = 0, backing = false;
  window.addEventListener('hashchange', () => {
    if (backing) { depth = Math.max(0, depth - 1); backing = false; } else depth++;
    Gym.closeModal(); window.scrollTo(0, 0); Gym.render();
  });
  Gym.act.navBack = (el, e) => { if (depth > 0) { e.preventDefault(); backing = true; history.back(); } };

  /* ---------- Ereignisse (Delegation über data-Attribute) ---------- */
  const delegate = (type, attr) =>
    document.addEventListener(type, (e) => {
      const el = e.target.closest && e.target.closest(`[data-${attr}]`);
      if (!el) return;
      const fn = Gym.act[el.dataset[attr]];
      if (fn) fn(el, e);
    });
  delegate('click', 'act');
  delegate('input', 'input');
  delegate('change', 'change');
  document.addEventListener('submit', (e) => {
    const f = e.target.closest('form[data-submit]');
    if (!f) return;
    e.preventDefault();
    const fn = Gym.act[f.dataset.submit];
    if (fn) fn(f, e);
  });
  // Zahlenfelder: beim Antippen alles markieren
  document.addEventListener('focusin', (e) => { if (e.target.matches && e.target.matches('input.set-in, input.num')) e.target.select(); });

  /* ---------- Toast ---------- */
  let toastT = null;
  Gym.toast = (msg) => {
    const root = document.getElementById('toast-root');
    root.innerHTML = `<div class="toast" role="status">${esc(msg)}</div>`;
    clearTimeout(toastT);
    toastT = setTimeout(() => { root.innerHTML = ''; }, 2600);
  };

  /* ---------- Dialog ---------- */
  let onModalClose = null;
  Gym.modal = ({ title, body, after, onClose }) => {
    const root = document.getElementById('modal-root');
    root.innerHTML = `
      <div class="modal-back" data-act="modalBack">
        <div class="modal" role="dialog" aria-modal="true" aria-label="${esc(title)}">
          <div class="modal-head"><h2>${esc(title)}</h2><button class="icon-btn" data-act="modalClose" aria-label="Schließen">${icon.x}</button></div>
          <div class="modal-body">${body}</div>
        </div>
      </div>`;
    document.body.classList.add('modal-open');
    onModalClose = onClose || null;
    if (after) after(root.querySelector('.modal'));
  };
  Gym.closeModal = () => {
    const root = document.getElementById('modal-root');
    if (!root.innerHTML) return;
    root.innerHTML = '';
    document.body.classList.remove('modal-open');
    const cb = onModalClose; onModalClose = null;
    if (cb) cb();
  };
  Gym.act.modalClose = () => Gym.closeModal();
  Gym.act.modalBack = (el, e) => { if (e.target === el) Gym.closeModal(); };
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') Gym.closeModal(); });

  Gym.confirm = (title, text, okLabel, danger) =>
    new Promise((resolve) => {
      let answered = false;
      Gym.act.confirmYes = () => { answered = true; Gym.closeModal(); resolve(true); };
      Gym.act.confirmNo = () => Gym.closeModal();
      Gym.modal({
        title,
        body: `<p class="lead">${esc(text)}</p>
          <div class="row-btns">
            <button class="btn ghost" data-act="confirmNo">Abbrechen</button>
            <button class="btn ${danger ? 'danger' : 'primary'}" data-act="confirmYes">${esc(okLabel || 'OK')}</button>
          </div>`,
        onClose: () => { if (!answered) resolve(false); },
      });
    });

  /* ---------- Übungsauswahl ---------- */
  const pick = { q: '', muscle: '', cb: null };
  const pickList = () => {
    const q = pick.q.trim().toLowerCase();
    const list = Gym.exercises()
      .filter((e) => (!pick.muscle || e.muscle === pick.muscle) && (!q || e.name.toLowerCase().includes(q)))
      .sort((a, b) => a.name.localeCompare(b.name, 'de'));
    if (!list.length) return `<p class="muted center pad">Keine Übung gefunden.</p>`;
    return list.map((e) => `
      <button class="list-item" data-act="pickChoose" data-id="${esc(e.id)}">
        <span class="li-main"><strong>${esc(e.name)}</strong><small>${esc(e.muscle)} · ${esc(e.equip)}</small></span>
        ${icon.plus}
      </button>`).join('');
  };
  const pickChips = () => ['', ...Gym.MUSCLES].map((m) =>
    `<button class="chip ${pick.muscle === m ? 'on' : ''}" data-act="pickMuscle" data-m="${esc(m)}">${esc(m || 'Alle')}</button>`).join('');

  Gym.pickExercise = (cb) => {
    pick.q = ''; pick.muscle = ''; pick.cb = cb;
    Gym.modal({
      title: 'Übung auswählen',
      body: `
        <div class="search">${icon.search}<input type="search" placeholder="Übung suchen" data-input="pickSearch" aria-label="Übung suchen"></div>
        <div class="chips scroll" id="pick-chips">${pickChips()}</div>
        <div class="list tall" id="pick-list">${pickList()}</div>
        <button class="btn ghost block" data-act="pickNew">${icon.plus} Eigene Übung anlegen</button>`,
    });
  };
  Gym.act.pickSearch = (el) => { pick.q = el.value; document.getElementById('pick-list').innerHTML = pickList(); };
  Gym.act.pickMuscle = (el) => {
    pick.muscle = el.dataset.m;
    document.getElementById('pick-chips').innerHTML = pickChips();
    document.getElementById('pick-list').innerHTML = pickList();
  };
  Gym.act.pickChoose = (el) => { const cb = pick.cb; Gym.closeModal(); if (cb) cb(el.dataset.id); };
  Gym.act.pickNew = () => { const cb = pick.cb; Gym.exerciseForm(null, (ex) => { if (cb) cb(ex.id); }); };

  // Formular für eigene Übungen (neu oder bearbeiten)
  Gym.exerciseForm = (ex, done) => {
    const opt = (list, cur) => list.map((v) => `<option ${v === cur ? 'selected' : ''}>${esc(v)}</option>`).join('');
    Gym.act.exFormSave = (form) => {
      const name = form.elements.name.value.trim();
      if (!name) return Gym.toast('Bitte einen Namen eingeben');
      let target = ex;
      if (!target) { target = { id: 'c-' + Gym.uid(), custom: true }; Gym.S.customExercises.push(target); }
      target.name = name;
      target.muscle = form.elements.muscle.value;
      target.equip = form.elements.equip.value;
      if (!ex) target.kind = form.elements.kind.value;
      Gym.save();
      Gym.closeModal();
      if (done) done(target);
    };
    Gym.modal({
      title: ex ? 'Übung bearbeiten' : 'Eigene Übung',
      body: `<form data-submit="exFormSave" class="form">
        <label>Name<input name="name" required maxlength="60" value="${esc(ex ? ex.name : '')}" autocomplete="off"></label>
        <label>Muskelgruppe<select name="muscle">${opt(Gym.MUSCLES, ex ? ex.muscle : 'Brust')}</select></label>
        <label>Gerät<select name="equip">${opt(Gym.EQUIPMENT, ex ? ex.equip : 'Langhantel')}</select></label>
        ${ex ? '' : `<label>Erfassung<select name="kind">${Object.entries(Gym.KINDS).map(([k, v]) => `<option value="${k}">${esc(v)}</option>`).join('')}</select></label>`}
        <button class="btn primary block">Speichern</button>
      </form>`,
      after: (m) => m.querySelector('input[name=name]').focus(),
    });
  };

  /* ---------- Pausentimer und Uhren ---------- */
  let audio = null;
  Gym.unlockAudio = () => {
    try { audio = audio || new (window.AudioContext || window.webkitAudioContext)(); if (audio.state === 'suspended') audio.resume(); } catch (e) { /* kein Ton verfügbar */ }
  };
  Gym.beep = () => {
    if (!Gym.S.settings.sound) return;
    try {
      Gym.unlockAudio();
      [0, 0.22, 0.44].forEach((d, i) => {
        const o = audio.createOscillator(), g = audio.createGain();
        o.frequency.value = i === 2 ? 1175 : 880;
        g.gain.setValueAtTime(0.0001, audio.currentTime + d);
        g.gain.exponentialRampToValueAtTime(0.25, audio.currentTime + d + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + d + 0.18);
        o.connect(g).connect(audio.destination);
        o.start(audio.currentTime + d); o.stop(audio.currentTime + d + 0.2);
      });
    } catch (e) { /* ignorieren */ }
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
  };

  // rest: { end, total } – liegt im gespeicherten Zustand, übersteht also ein Neuladen
  Gym.startRest = (sec) => {
    Gym.unlockAudio();
    Gym.S.rest = { end: Date.now() + sec * 1000, total: sec };
    Gym.save(); Gym.tick();
  };
  Gym.act.restAdd = (el) => {
    const r = Gym.S.rest; if (!r) return;
    const d = Number(el.dataset.d);
    r.end = Math.max(Date.now(), r.end + d * 1000);
    r.total = Math.max(1, r.total + d);
    Gym.save(); Gym.tick();
  };
  Gym.act.restSkip = () => { Gym.S.rest = null; Gym.save(); Gym.tick(); };

  let restDoneUntil = 0;
  Gym.tick = () => {
    const now = Date.now();
    // Laufzeit des aktiven Trainings
    const a = Gym.S.active;
    document.querySelectorAll('[data-elapsed]').forEach((el) => { el.textContent = a ? Gym.fmt.clock((now - a.start) / 1000) : ''; });
    // Pausentimer
    const bar = document.getElementById('rest-bar');
    const r = Gym.S.rest;
    if (r && now >= r.end) {
      const late = now - r.end;
      Gym.S.rest = null; Gym.save();
      if (late < 5000) { Gym.beep(); restDoneUntil = now + 3500; }
    }
    if (Gym.S.rest) {
      const left = Math.ceil((Gym.S.rest.end - now) / 1000);
      const pct = Math.max(0, Math.min(100, ((Gym.S.rest.end - now) / (Gym.S.rest.total * 1000)) * 100));
      if (!bar.dataset.on) {
        bar.dataset.on = '1'; bar.hidden = false; bar.classList.remove('done');
        bar.innerHTML = `<div class="rest-fill"></div>
          <div class="rest-in">
            <span class="rest-label">${icon.timer}<span>Pause</span><strong class="rest-time"></strong></span>
            <span class="rest-btns">
              <button class="btn sm ghost" data-act="restAdd" data-d="-15">−15</button>
              <button class="btn sm ghost" data-act="restAdd" data-d="15">+15</button>
              <button class="btn sm" data-act="restSkip">Weiter</button>
            </span>
          </div>`;
      }
      bar.querySelector('.rest-time').textContent = Gym.fmt.clock(left);
      bar.querySelector('.rest-fill').style.width = pct + '%';
    } else if (now < restDoneUntil) {
      delete bar.dataset.on; bar.hidden = false; bar.classList.add('done');
      bar.innerHTML = `<div class="rest-in"><span class="rest-label">${icon.check}<strong>Pause vorbei – weiter geht's!</strong></span></div>`;
    } else if (!bar.hidden) {
      delete bar.dataset.on; bar.hidden = true; bar.innerHTML = '';
    }
    document.body.classList.toggle('has-rest', !bar.hidden);
    if (Gym.toolTick) Gym.toolTick(now);
  };
  setInterval(() => Gym.tick(), 250);

  /* ---------- Darstellung ---------- */
  Gym.applyTheme = () => {
    const t = Gym.S.settings.theme;
    const dark = t === 'dark' || (t === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    const meta = document.querySelector('meta[name=theme-color]');
    if (meta) meta.content = dark ? '#0d0d0d' : '#f9f9f7';
  };
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => Gym.applyTheme());
})();
