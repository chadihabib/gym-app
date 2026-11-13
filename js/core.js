/* Kern: Speicher, Hilfsfunktionen, Statistik */
(function () {
  'use strict';
  const Gym = window.Gym;
  const KEY = 'gymapp.v1';

  /* ---------- Speicher ---------- */
  const blank = () => ({
    version: 1,
    settings: { name: '', theme: 'dark', restSec: 90, autoRest: true, sound: true, barKg: 20, heightCm: null, weeklyGoal: 3 },
    customExercises: [],
    routines: null,
    workouts: [],
    active: null,
    body: [],
  });

  Gym.load = () => {
    const s = blank();
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const p = JSON.parse(raw);
        const settings = Object.assign(s.settings, p.settings || {});
        Object.assign(s, p, { settings });
      }
    } catch (e) { console.warn('Daten konnten nicht geladen werden', e); }
    if (!s.routines) s.routines = Gym.defaultRoutines();
    Gym.S = s;
  };

  Gym.save = () => {
    try { localStorage.setItem(KEY, JSON.stringify(Gym.S)); }
    catch (e) { console.warn(e); Gym.toast && Gym.toast('Speichern fehlgeschlagen (Speicher voll?)'); }
  };
  let saveT = null;
  Gym.saveSoon = () => { clearTimeout(saveT); saveT = setTimeout(() => { saveT = null; Gym.save(); }, 300); };
  // Noch ausstehende Eingaben sichern, wenn die Seite verlassen wird
  window.addEventListener('pagehide', () => { if (saveT) { clearTimeout(saveT); saveT = null; Gym.save(); } });

  Gym.resetAll = () => { localStorage.removeItem(KEY); Gym.load(); };

  /* ---------- Allgemeine Helfer ---------- */
  Gym.uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  Gym.esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  Gym.parseNum = (str) => {
    const v = parseFloat(String(str).replace(',', '.'));
    return isFinite(v) && v >= 0 ? v : null;
  };
  Gym.clone = (o) => JSON.parse(JSON.stringify(o));

  const pad = (n) => String(n).padStart(2, '0');
  const DF = (o) => new Intl.DateTimeFormat('de-DE', o);
  const fDate = DF({ weekday: 'short', day: 'numeric', month: 'short' });
  const fDateY = DF({ weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  const fLong = DF({ weekday: 'long', day: 'numeric', month: 'long' });
  const fDayMon = DF({ day: 'numeric', month: 'short' });
  const fDayMonY = DF({ day: 'numeric', month: 'short', year: '2-digit' });
  const fMonth = DF({ month: 'long', year: 'numeric' });
  const fMon = DF({ month: 'short' });
  const fTime = DF({ hour: '2-digit', minute: '2-digit' });

  Gym.dayKey = (ts) => { const d = new Date(ts); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
  Gym.dayStart = (ts) => { const d = new Date(ts); d.setHours(0, 0, 0, 0); return d.getTime(); };
  Gym.addDays = (ts, n) => { const d = new Date(ts); d.setDate(d.getDate() + n); return d.getTime(); };
  Gym.weekStart = (ts) => { const d = new Date(ts); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d.getTime(); };
  Gym.monthStart = (ts) => { const d = new Date(ts); return new Date(d.getFullYear(), d.getMonth(), 1).getTime(); };
  Gym.keyToTs = (key) => { const [y, m, d] = key.split('-').map(Number); return new Date(y, m - 1, d, 12).getTime(); };

  const num = (v, d = 1) => Number(v).toLocaleString('de-DE', { maximumFractionDigits: d });
  Gym.fmt = {
    num,
    input: (v) => (v == null ? '' : String(v).replace('.', ',')),
    kg: (v) => (v >= 10000 ? num(v / 1000, 1) + ' t' : num(v, 0) + ' kg'),
    date: (ts) => (new Date(ts).getFullYear() === new Date().getFullYear() ? fDate.format(ts) : fDateY.format(ts)),
    long: (ts) => fLong.format(ts),
    dayMon: (ts) => fDayMon.format(ts),
    dayMonY: (ts) => fDayMonY.format(ts),
    month: (ts) => fMonth.format(ts),
    mon: (ts) => fMon.format(ts),
    time: (ts) => fTime.format(ts),
    dm: (ts) => { const d = new Date(ts); return `${d.getDate()}.${d.getMonth() + 1}.`; },
    dur: (ms) => { const m = Math.max(0, Math.round(ms / 60000)); return m < 60 ? `${m} min` : `${Math.floor(m / 60)}:${pad(m % 60)} h`; },
    clock: (sec) => {
      sec = Math.max(0, Math.floor(sec));
      const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
      return h ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
    },
    secs: (sec) => (sec >= 60 ? `${Math.floor(sec / 60)}:${pad(Math.round(sec % 60))} min` : `${num(sec, 0)} s`),
    rel: (ts) => {
      const diff = Math.round((Gym.dayStart(Date.now()) - Gym.dayStart(ts)) / 86400000);
      if (diff === 0) return 'Heute';
      if (diff === 1) return 'Gestern';
      return Gym.fmt.date(ts);
    },
  };

  /* ---------- Übungen ---------- */
  Gym.exercises = () => Gym.LIBRARY.concat(Gym.S.customExercises.filter((e) => !e.archived));
  Gym.ex = (id) =>
    Gym.LIBRARY.find((e) => e.id === id) ||
    Gym.S.customExercises.find((e) => e.id === id) ||
    { id, name: 'Unbekannte Übung', muscle: 'Sonstiges', equip: 'Sonstiges', kind: 'weight' };

  // Spalten der Satz-Eingabe je Übungsart: [Feld, Kopfzeile]
  Gym.fields = (kind) => ({
    weight: [['w', 'kg'], ['r', 'Wdh.']],
    body: [['w', '+kg'], ['r', 'Wdh.']],
    time: [['r', 'Sek.']],
    cardio: [['w', 'km'], ['r', 'Min.']],
  }[kind]);

  Gym.setValid = (ex, s) => {
    if (ex.kind === 'weight') return s.w != null && s.r > 0;
    if (ex.kind === 'cardio') return s.r > 0 || s.w > 0;
    return s.r > 0;
  };

  Gym.fmtSet = (ex, s) => {
    const n = Gym.fmt.num;
    if (ex.kind === 'weight') return `${n(s.w, 2)} kg × ${n(s.r, 0)}`;
    if (ex.kind === 'body') return s.w ? `+${n(s.w, 2)} kg × ${n(s.r, 0)}` : `${n(s.r, 0)} Wdh.`;
    if (ex.kind === 'time') return Gym.fmt.secs(s.r);
    return [s.w ? `${n(s.w, 2)} km` : '', s.r ? `${n(s.r, 0)} min` : ''].filter(Boolean).join(' · ');
  };
  Gym.fmtSetShort = (ex, s) => {
    const n = Gym.fmt.num;
    if (ex.kind === 'weight') return `${n(s.w, 2)} × ${n(s.r, 0)}`;
    if (ex.kind === 'body') return s.w ? `+${n(s.w, 2)} × ${n(s.r, 0)}` : `${n(s.r, 0)} Wdh.`;
    if (ex.kind === 'time') return `${n(s.r, 0)} s`;
    return [s.w ? `${n(s.w, 2)} km` : '', s.r ? `${n(s.r, 0)}'` : ''].filter(Boolean).join(' · ');
  };

  /* ---------- Kennzahlen ---------- */
  Gym.e1rm = (w, r) => (!w || !r ? 0 : r === 1 ? w : w * (1 + r / 30)); // Epley
  Gym.setVol = (ex, s) => (ex.kind === 'weight' || ex.kind === 'body' ? (s.w || 0) * (s.r || 0) : 0);
  Gym.wVolume = (w) => w.entries.reduce((a, en) => { const ex = Gym.ex(en.exId); return a + en.sets.reduce((b, s) => b + Gym.setVol(ex, s), 0); }, 0);
  Gym.wSets = (w) => w.entries.reduce((a, en) => a + en.sets.length, 0);
  Gym.wDur = (w) => Math.max(0, (w.end || Date.now()) - w.start);

  // Kennzahlen einer Übung innerhalb eines Trainings
  Gym.sessionMetrics = (ex, sets) => {
    const m = { maxW: 0, e1rm: 0, vol: 0, maxR: 0, totR: 0, maxT: 0, totT: 0, dist: 0, mins: 0 };
    for (const s of sets) {
      const w = s.w || 0, r = s.r || 0;
      if (ex.kind === 'weight') {
        if (r > 0) { m.maxW = Math.max(m.maxW, w); m.e1rm = Math.max(m.e1rm, Gym.e1rm(w, r)); }
        m.vol += w * r;
      } else if (ex.kind === 'body') {
        m.maxR = Math.max(m.maxR, r); m.totR += r; m.vol += w * r;
      } else if (ex.kind === 'time') {
        m.maxT = Math.max(m.maxT, r); m.totT += r;
      } else { m.dist += w; m.mins += r; }
    }
    return m;
  };

  // Auswählbare Verlaufs-Kennzahlen je Übungsart
  Gym.metricDefs = (kind) => {
    const n = Gym.fmt.num;
    return {
      weight: [
        { key: 'e1rm', label: '1RM (geschätzt)', fmt: (v) => n(v, 1) + ' kg' },
        { key: 'maxW', label: 'Max. Gewicht', fmt: (v) => n(v, 2) + ' kg' },
        { key: 'vol', label: 'Volumen', fmt: (v) => Gym.fmt.kg(v) },
      ],
      body: [
        { key: 'maxR', label: 'Max. Wdh.', fmt: (v) => n(v, 0) + ' Wdh.' },
        { key: 'totR', label: 'Wdh. gesamt', fmt: (v) => n(v, 0) + ' Wdh.' },
      ],
      time: [
        { key: 'maxT', label: 'Längste Zeit', fmt: (v) => Gym.fmt.secs(v) },
        { key: 'totT', label: 'Gesamtzeit', fmt: (v) => Gym.fmt.secs(v) },
      ],
      cardio: [
        { key: 'dist', label: 'Distanz', fmt: (v) => n(v, 2) + ' km' },
        { key: 'mins', label: 'Dauer', fmt: (v) => n(v, 0) + ' min' },
      ],
    }[kind];
  };

  Gym.PR_KEYS = { weight: ['maxW', 'e1rm'], body: ['maxR'], time: ['maxT'], cardio: ['dist'] };
  Gym.PR_LABEL = { maxW: 'Schwerstes Gewicht', e1rm: 'Bestes 1RM (geschätzt)', maxR: 'Meiste Wiederholungen', maxT: 'Längste Zeit', dist: 'Längste Distanz' };
  Gym.fmtMetric = (ex, key, v) => { const d = Gym.metricDefs(ex.kind).find((x) => x.key === key); return d ? d.fmt(v) : String(v); };

  Gym.sorted = () => Gym.S.workouts.slice().sort((a, b) => a.start - b.start);

  // Verlauf einer Übung: ein Eintrag pro Training, aufsteigend nach Datum
  Gym.exerciseHistory = (exId) => {
    const ex = Gym.ex(exId), out = [];
    for (const w of Gym.sorted()) {
      const sets = [];
      for (const en of w.entries) if (en.exId === exId) sets.push(...en.sets);
      if (sets.length) out.push({ ts: w.start, wid: w.id, name: w.name, sets, m: Gym.sessionMetrics(ex, sets) });
    }
    return out;
  };

  // Sätze der Übung aus dem letzten Training vor `before`
  Gym.lastSets = (exId, before, skipId) => {
    let best = null;
    for (const w of Gym.S.workouts) {
      if (w.id === skipId || w.start >= before) continue;
      if (best && w.start < best.start) continue;
      if (w.entries.some((en) => en.exId === exId)) best = w;
    }
    if (!best) return null;
    const sets = [];
    for (const en of best.entries) if (en.exId === exId) sets.push(...en.sets);
    return sets;
  };

  // Bestwerte einer Übung mit Datum
  Gym.records = (exId) => {
    const ex = Gym.ex(exId), rec = {};
    for (const h of Gym.exerciseHistory(exId)) {
      for (const d of Gym.metricDefs(ex.kind)) {
        const v = h.m[d.key];
        if (v > 0 && (!rec[d.key] || v > rec[d.key].v)) rec[d.key] = { v, ts: h.ts };
      }
    }
    return rec;
  };

  // Rekorde aller Trainings neu bestimmen (nach jeder Änderung am Verlauf)
  Gym.recomputePRs = () => {
    const best = {};
    for (const w of Gym.sorted()) {
      w.prs = [];
      for (const en of w.entries) {
        const ex = Gym.ex(en.exId);
        const m = Gym.sessionMetrics(ex, en.sets);
        const b = (best[en.exId] = best[en.exId] || {});
        let hit = false; // höchstens ein Rekord je Übung und Training (der erste, wichtigste)
        for (const key of Gym.PR_KEYS[ex.kind]) {
          const v = m[key];
          if (!(v > 0)) continue;
          if (b[key] != null && v > b[key] && !hit) {
            hit = true;
            const old = w.prs.find((p) => p.exId === en.exId);
            if (old) { old.key = key; old.v = v; } else w.prs.push({ exId: en.exId, key, v });
          }
          b[key] = Math.max(b[key] || 0, v);
        }
      }
    }
  };

  // Zeit-Buckets (Wochen, bei langen Zeiträumen Monate) von `from` bis heute
  Gym.buckets = (from) => {
    const now = Date.now(), out = [];
    const weeks = Math.round((Gym.weekStart(now) - Gym.weekStart(from)) / (7 * 86400000)) + 1;
    if (weeks <= 53) {
      for (let t = Gym.weekStart(from); t <= now; t = Gym.addDays(t, 7)) {
        const end = Gym.addDays(t, 7);
        out.push({ start: t, end, label: Gym.fmt.dm(t), tip: `Woche ${Gym.fmt.dayMon(t)} – ${Gym.fmt.dayMon(Gym.addDays(t, 6))}` });
      }
    } else {
      let d = new Date(Gym.monthStart(from));
      while (d.getTime() <= now) {
        const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
        out.push({ start: d.getTime(), end: next.getTime(), label: Gym.fmt.mon(d.getTime()), tip: Gym.fmt.month(d.getTime()) });
        d = next;
      }
    }
    for (const b of out) {
      b.workouts = Gym.S.workouts.filter((w) => w.start >= b.start && w.start < b.end);
      b.count = b.workouts.length;
      b.volume = b.workouts.reduce((a, w) => a + Gym.wVolume(w), 0);
    }
    out.unit = weeks <= 53 ? 'Woche' : 'Monat';
    return out;
  };

  // Wochen in Folge mit mindestens einem Training
  Gym.weekStreak = () => {
    const have = new Set(Gym.S.workouts.map((w) => Gym.weekStart(w.start)));
    let t = Gym.weekStart(Date.now());
    if (!have.has(t)) t = Gym.addDays(t, -7);
    let n = 0;
    while (have.has(t)) { n++; t = Gym.addDays(t, -7); }
    return n;
  };

  /* ---------- Trainings anlegen ---------- */
  Gym.newWorkout = (name, routine) => {
    const w = { id: Gym.uid(), name: name || 'Training', start: Date.now(), end: null, notes: '', routineId: routine ? routine.id : null, entries: [], prs: [] };
    if (routine) {
      for (const it of routine.items) {
        const n = Math.max(1, it.sets || 3);
        w.entries.push({ id: Gym.uid(), exId: it.exId, target: it.reps || '', sets: Array.from({ length: n }, () => ({ w: null, r: null, done: false })) });
      }
    }
    return w;
  };

  // Entwurf bereinigen: nur gültige (im Live-Modus abgehakte) Sätze behalten
  Gym.cleanWorkout = (w, onlyDone) => {
    const out = Gym.clone(w);
    out.entries = out.entries
      .map((en) => {
        const ex = Gym.ex(en.exId);
        en.sets = en.sets.filter((s) => (!onlyDone || s.done) && Gym.setValid(ex, s)).map((s) => ({ w: s.w, r: s.r, done: true }));
        return en;
      })
      .filter((en) => en.sets.length);
    return out;
  };

  /* ---------- Beispieldaten ---------- */
  Gym.loadDemo = () => {
    const S = Gym.S, now = Date.now();
    let seed = 42;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const round = (v, step) => Math.round(v / step) * step;
    const plan = [
      ['Push', [['bankdruecken', 60, 2.5, 4, 7], ['kh-schraegbank', 20, 2, 3, 9], ['kh-schulterdruecken', 16, 2, 3, 9], ['seitheben', 8, 1, 3, 13], ['trizepsdruecken', 22.5, 2.5, 3, 11]]],
      ['Pull', [['kreuzheben', 90, 5, 3, 5], ['klimmzuege', 0, 0, 3, 7], ['lh-rudern', 50, 2.5, 3, 9], ['face-pulls', 17.5, 2.5, 3, 13], ['kh-curls', 10, 1, 3, 11]]],
      ['Beine', [['kniebeugen', 75, 2.5, 4, 7], ['rum-kreuzheben', 65, 2.5, 3, 9], ['beinpresse', 120, 5, 3, 11], ['beinbeuger', 35, 2.5, 3, 11], ['wadenheben', 60, 5, 4, 13], ['plank', 0, 0, 2, 50]]],
    ];
    const weeks = 16;
    let k = 0;
    const start0 = Gym.addDays(Gym.weekStart(now), -7 * (weeks - 1));
    for (let wk = 0; wk < weeks; wk++) {
      const days = rnd() < 0.25 ? [0, 3] : rnd() < 0.5 ? [0, 2, 4] : [0, 1, 3, 5];
      for (const d of days) {
        const start = Gym.addDays(start0, wk * 7 + d) + (17 + Math.floor(rnd() * 3)) * 3600000 + Math.floor(rnd() * 50) * 60000;
        if (start > now - 3600000) continue;
        const [name, exs] = plan[k % 3];
        const cycle = Math.floor(k / 3);
        k++;
        const w = { id: Gym.uid(), name, start, end: start + (50 + Math.floor(rnd() * 30)) * 60000, notes: '', routineId: null, entries: [], prs: [], demo: true };
        for (const [exId, base, inc, nSets, reps] of exs) {
          const ex = Gym.ex(exId);
          const prog = cycle * 0.3 + (rnd() - 0.5) * 1.6;
          const sets = [];
          for (let i = 0; i < nSets; i++) {
            const r = Math.max(1, Math.round(reps + (rnd() - 0.5) * 2.4 - i * 0.6 + (ex.kind !== 'weight' ? cycle * 0.2 : 0)));
            const wgt = ex.kind === 'weight' ? Math.max(inc, round(base + prog * inc, inc)) : null;
            sets.push({ w: wgt, r: ex.kind === 'time' ? round(r + cycle, 5) : r, done: true });
          }
          w.entries.push({ id: Gym.uid(), exId, sets });
        }
        S.workouts.push(w);
      }
    }
    for (let wk = 0; wk < weeks; wk++) {
      const ts = Gym.addDays(start0, wk * 7 + 1);
      if (ts > now) break;
      S.body.push({ id: Gym.uid(), date: Gym.dayKey(ts), weight: Math.round((78.4 + wk * 0.16 + (rnd() - 0.5) * 0.9) * 10) / 10, fat: Math.round((17.5 - wk * 0.12 + (rnd() - 0.5) * 0.5) * 10) / 10, waist: Math.round((86 - wk * 0.1) * 10) / 10, demo: true });
    }
    if (!S.settings.heightCm) S.settings.heightCm = 181;
    Gym.recomputePRs();
    Gym.save();
  };
  Gym.hasDemo = () => Gym.S.workouts.some((w) => w.demo) || Gym.S.body.some((b) => b.demo);
  Gym.removeDemo = () => {
    Gym.S.workouts = Gym.S.workouts.filter((w) => !w.demo);
    Gym.S.body = Gym.S.body.filter((b) => !b.demo);
    Gym.recomputePRs();
    Gym.save();
  };
})();
