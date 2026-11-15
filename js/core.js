/* Kern: Speicher, Hilfsfunktionen, Statistik */
(function () {
  'use strict';
  const Gym = window.Gym;
  const KEY = 'gymapp.v1';

  /* ---------- Speicher ---------- */
  const blank = () => ({
    version: 1,
    settings: { name: '', theme: 'dark', restSec: 90, autoRest: true, sound: true, barKg: 20, heightCm: null, weeklyGoal: 3, lastGymId: null, coach: true },
    gyms: [],       // [{ id, name }]
    exBound: {},    // Übung -> true/false: nur im selben Gym vergleichen (überschreibt die Vorgabe)
    exCoach: {},    // Übung -> { min, max, step }: eigener Wiederholungsbereich und Gewichtsschritt
    plan: null,     // freiwilliger Trainingsplan: { days, level, wave, slots: [{ type, load }], pos }
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
    ago: (ts) => {
      const d = Math.round((Gym.dayStart(Date.now()) - Gym.dayStart(ts)) / 86400000);
      if (d <= 0) return 'heute';
      if (d === 1) return 'gestern';
      if (d < 14) return `vor ${d} Tagen`;
      if (d < 70) return `vor ${Math.round(d / 7)} Wochen`;
      return `vor ${Math.round(d / 30)} Monaten`;
    },
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

  /* ---------- Gyms ---------- */
  Gym.gym = (id) => (id && Gym.S.gyms.find((g) => g.id === id)) || null;
  Gym.gymName = (id) => { const g = Gym.gym(id); return g ? g.name : ''; };
  // Das zuletzt gewählte Gym (für das nächste Training vorausgewählt)
  Gym.currentGymId = () => { const g = Gym.gym(Gym.S.settings.lastGymId); return g ? g.id : null; };
  // Geräte und Kabelzüge unterscheiden sich je Studio: Werte nur im selben Gym vergleichen
  Gym.isGymBound = (ex) => {
    const o = Gym.S.exBound[ex.id];
    return o != null ? o : ex.equip === 'Maschine' || ex.equip === 'Kabel';
  };
  // Gym-Filter: undefined = alle Gyms, null = Trainings ohne Gym, sonst die Gym-ID
  Gym.inGym = (w, f) => f === undefined || (w.gymId || null) === f;
  // Filter, mit dem die Übung in diesem Training verglichen wird
  Gym.cmpGym = (ex, w) => (Gym.S.gyms.length && Gym.isGymBound(ex) ? w.gymId || null : undefined);

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
  // gymFilter: undefined = alle Gyms, null = ohne Gym, sonst Gym-ID
  Gym.exerciseHistory = (exId, gymFilter) => {
    const ex = Gym.ex(exId), out = [];
    for (const w of Gym.sorted()) {
      if (!Gym.inGym(w, gymFilter)) continue;
      const sets = [];
      for (const en of w.entries) if (en.exId === exId) sets.push(...en.sets);
      if (sets.length) out.push({ ts: w.start, wid: w.id, name: w.name, gymId: w.gymId || null, load: w.load || null, sets, m: Gym.sessionMetrics(ex, sets) });
    }
    return out;
  };

  // Sätze der Übung aus dem letzten Training vor `before`
  Gym.lastSets = (exId, before, skipId, gymFilter) => {
    let best = null;
    for (const w of Gym.S.workouts) {
      if (w.id === skipId || w.start >= before || !Gym.inGym(w, gymFilter)) continue;
      if (best && w.start < best.start) continue;
      if (w.entries.some((en) => en.exId === exId)) best = w;
    }
    if (!best) return null;
    const sets = [];
    for (const en of best.entries) if (en.exId === exId) sets.push(...en.sets);
    return sets;
  };

  // Bestwerte einer Übung mit Datum
  Gym.records = (exId, gymFilter) => {
    const ex = Gym.ex(exId), rec = {};
    for (const h of Gym.exerciseHistory(exId, gymFilter)) {
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
        // Gymgebundene Übungen (Geräte, Kabel) zählen je Gym getrennt
        const scope = Gym.cmpGym(ex, w);
        const bk = scope === undefined ? en.exId : en.exId + '|' + (scope || '');
        const b = (best[bk] = best[bk] || {});
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
  Gym.buckets = (from, list) => {
    const now = Date.now(), out = [];
    list = list || Gym.S.workouts;
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
      b.workouts = list.filter((w) => w.start >= b.start && w.start < b.end);
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

  /* ---------- Coach: Gewichtsvorschläge nach doppelter Progression ---------- */
  // Regel: Erst die Wiederholungen steigern, dann das Gewicht. Maßgeblich ist der erste Arbeitssatz.
  const BANDS = [[3, 5], [5, 8], [8, 12], [12, 15], [15, 20]];
  const STEP_BY_EQUIP = { Langhantel: 2.5, Kurzhantel: 2, Maschine: 5, Kabel: 2.5, Kettlebell: 4 };
  const round2 = (v) => Math.round(v * 100) / 100;
  const TARGET_RE = /^\s*(\d+)(?:\s*[–-]\s*(\d+))?\s*$/;

  // Wiederholungsbereich und Gewichtsschritt einer Übung.
  // Quelle: selbst festgelegt ('own'), Ziel der Routine ('routine'), schwerer oder leichter Tag
  // laut Trainingsplan ('plan') oder aus dem Verlauf erkannt ('auto')
  Gym.coachCfg = (ex, en, hist, load) => {
    const own = Gym.S.exCoach[ex.id] || {};
    let min = own.min, max = own.max, src = 'own';
    if (!(min > 0 && max >= min)) {
      const m = en && en.target ? String(en.target).match(TARGET_RE) : null;
      if (m) {
        min = +m[1]; max = +(m[2] || m[1]); src = 'routine';
        if (max < min) [min, max] = [max, min];
      } else if (load) {
        [min, max] = Gym.LOAD[load].range; src = 'plan';
      } else {
        // Band, in dem die üblichen Wiederholungen der letzten drei Trainings liegen (nur Arbeitssätze)
        const reps = [];
        for (const h of hist.slice(-3)) {
          const top = Math.max(...h.sets.map((s) => s.w || 0));
          for (const s of h.sets) if (s.r > 0 && (s.w || 0) === top) reps.push(s.r);
        }
        reps.sort((a, b) => a - b);
        const med = reps.length ? reps[Math.floor(reps.length / 2)] : 10;
        let i = BANDS.findIndex((b) => med <= b[1]);
        if (i < 0) i = BANDS.length - 1;
        // Liegt der übliche Wert genau auf einer Bandgrenze (z. B. immer 8), entscheidet die Streuung:
        // Nur wer schon darunter lag, bekommt das untere Band. Sonst das obere, damit erst die
        // Wiederholungen steigen und nicht vorschnell das Gewicht.
        if (i < BANDS.length - 1 && med === BANDS[i][1] && !reps.some((r) => r < med)) i++;
        min = BANDS[i][0]; max = BANDS[i][1]; src = 'auto';
      }
    }
    let step = own.step, stepSrc = 'own';
    if (!(step > 0)) {
      // Kleinster Abstand zwischen bisher genutzten Gewichten, sonst üblicher Schritt je Gerät
      stepSrc = 'auto';
      const ws = Array.from(new Set(hist.flatMap((h) => h.sets.map((s) => s.w || 0)).filter((v) => v > 0))).sort((a, b) => a - b);
      let d = Infinity;
      for (let i = 1; i < ws.length; i++) d = Math.min(d, ws[i] - ws[i - 1]);
      step = isFinite(d) && d >= 0.5 && d <= 10 ? round2(d) : STEP_BY_EQUIP[ex.equip] || 2.5;
    }
    return { min, max, step, src, stepSrc };
  };

  // Vorschlag für eine Übung im laufenden Training, gestützt auf das letzte Training (je Gym, wenn gymgebunden)
  Gym.coach = (ex, en, w) => {
    if (Gym.S.settings.coach === false) return null;
    if (ex.kind !== 'weight' && ex.kind !== 'body') return null;
    const all = Gym.exerciseHistory(ex.id, Gym.cmpGym(ex, w)).filter((h) => h.wid !== w.id);
    if (!all.length) return null;
    // Schwerer oder leichter Tag laut Trainingsplan: Verglichen wird nur mit Trainings derselben Sorte,
    // weil zu 6 und zu 12 Wiederholungen verschiedene Gewichte gehören.
    const load = Gym.coachLoad(ex, en, w);
    let hist = load ? all.filter((h) => h.load === load) : all;
    const cfg = Gym.coachCfg(ex, en, all, load);
    const n = (v) => Gym.fmt.num(v, 2);
    const range = cfg.min === cfg.max ? `${cfg.min}` : `${cfg.min}–${cfg.max}`;
    // Standard: Jeder Satz ging ans Limit. Ist ein Satz als „nicht am Limit“ markiert (s.rir),
    // zählt die geschätzte Reserve mit: 1–2 übrig = +1, 3 oder mehr übrig = +3 Wiederholungen.
    const eff = (s) => s.r + (s.rir === 4 ? 3 : s.rir === 2 ? 1 : 0);
    const loadNote = load ? ` Laut Plan ist heute ein ${Gym.LOAD[load].label}er Tag: Grundübungen mit ${range} Wiederholungen.` : '';
    // Für diese Sorte Tag gibt es noch kein Training. Lag das letzte Training ohnehin schon in diesem
    // Bereich, zählt es wie üblich. Sonst wird das Gewicht daraus geschätzt (Epley).
    const prev = all[all.length - 1];
    if (!hist.length) {
      const ps = prev.sets.filter((s) => s.r > 0);
      const first = ps.find((s) => (s.w || 0) === Math.max(...ps.map((x) => x.w || 0)));
      if (first && eff(first) >= cfg.min && eff(first) <= cfg.max) hist = [prev];
    }
    if (!hist.length) {
      const e =Math.max(0, ...prev.sets.filter((s) => s.r > 0).map((s) => Gym.e1rm(s.w || 0, eff(s))));
      if (!(e > 0)) return null;
      const r = cfg.min + 1;
      // 5 % Abschlag, weil die Formel über verschiedene Wiederholungsbereiche hinweg ungenau ist
      const weight = round2(Math.max(cfg.step, Math.floor((e * 0.95) / (1 + r / 30) / cfg.step) * cfg.step));
      return {
        kind: 'est', weight, cfg, range, load, last: prev, planAt: () => ({ w: weight, r }),
        text: `Etwa ${n(weight)} kg zum Einstieg`,
        why: `Für einen ${Gym.LOAD[load].label}en Tag gibt es bei dieser Übung noch kein Training. Das Gewicht ist aus deinem letzten Training geschätzt und eher vorsichtig gewählt. Ab dem nächsten ${Gym.LOAD[load].label}en Tag rechnet die App mit deinen echten Werten.${loadNote}`,
      };
    }
    const last = hist[hist.length - 1];
    const sets = last.sets.filter((s) => s.r > 0);
    if (!sets.length) return null;
    // Arbeitssätze sind die Sätze mit dem höchsten Gewicht; leichtere gelten als Aufwärmen
    const top = (list) => Math.max(...list.map((s) => s.w || 0));
    const W = top(sets);
    const isWork = (s) => (s.w || 0) === W;
    const work = sets.filter(isWork);
    const reps = work.map(eff);
    const capped = reps.map((r) => Math.min(r, cfg.max));
    const held = work.some((s) => s.rir);
    let kind, weight = W, target, text, why;
    // Maßgeblich ist der erste Arbeitssatz: Wer bis ans Limit trainiert, schafft in späteren Sätzen
    // fast immer weniger. Gesteigert wird, wenn der erste Satz oben ist und keiner unter dem Bereich liegt.
    const firstTop = reps[0] >= cfg.max;
    const allIn = reps.every((r) => r >= cfg.min);
    const plusOne = () => { const t = capped.slice(); const i = t.findIndex((r) => r < cfg.max); if (i >= 0) t[i]++; return t; };
    if (!W) {
      // Reines Körpergewicht: nur die Wiederholungen steigern
      if (firstTop && allIn) {
        kind = 'top'; target = work.map((s) => Math.max(s.r, cfg.min));
        text = 'Obergrenze erreicht';
        why = `Der erste Satz hat ${cfg.max} oder mehr Wiederholungen und alle Sätze liegen im Bereich ${range}. Nimm Zusatzgewicht oder eine schwerere Variante.`;
      } else {
        kind = 'rep'; target = plusOne();
        text = 'Eine Wiederholung mehr';
        why = `Der erste Satz hat die ${cfg.max} Wiederholungen noch nicht erreicht oder ein Satz liegt unter ${cfg.min}. Ein Satz bekommt eine Wiederholung mehr.`;
      }
    } else if (firstTop && allIn) {
      // Hatten alle Sätze an der Obergrenze noch deutlich Reserve, gleich zwei Schritte
      const steps = work.every((s) => s.rir === 4 && s.r >= cfg.max) ? 2 : 1;
      kind = 'up'; weight = round2(W + steps * cfg.step); target = reps.map(() => cfg.min);
      text = `Steigern auf ${n(weight)} kg`;
      why = `Der erste Satz hat ${cfg.max} oder mehr Wiederholungen erreicht und kein Satz lag unter ${cfg.min}. Mit dem höheren Gewicht geht es bei ${cfg.min} Wiederholungen wieder los.${steps === 2 ? ' Weil du überall deutlich Reserve hattest, sind es gleich zwei Schritte.' : ''}`;
    } else if (allIn) {
      kind = 'rep'; target = plusOne();
      text = `${n(W)} kg, eine Wiederholung mehr`;
      why = `Alle Sätze liegen im Bereich ${range}, der erste hat die ${cfg.max} aber noch nicht erreicht. Sobald er sie schafft, steigt das Gewicht.`;
    } else {
      // Mindestens ein Satz unter dem Bereich. Entlastet wird nur, wenn schon der erste Satz
      // zweimal in Folge (bei gleichem oder höherem Gewicht) darunter lag.
      const prev = hist.length > 1 ? hist[hist.length - 2].sets.filter((s) => s.r > 0) : null;
      const prevTop = prev && prev.length ? top(prev) : 0;
      const prevFirst = prev && prev.length ? prev.find((s) => (s.w || 0) === prevTop) : null;
      const prevMiss = prevFirst && prevTop >= W && eff(prevFirst) < cfg.min;
      if (reps[0] < cfg.min && prevMiss) {
        kind = 'down'; weight = round2(Math.max(cfg.step, Math.round((W * 0.9) / cfg.step) * cfg.step));
        target = reps.map(() => Math.round((cfg.min + cfg.max) / 2));
        text = `Entlasten auf ${n(weight)} kg`;
        why = `Zweimal in Folge lag schon der erste Satz unter ${cfg.min} Wiederholungen. Mit etwa 10 % weniger Gewicht sauber neu aufbauen.`;
      } else {
        kind = 'hold'; target = capped.map((r) => Math.max(r, cfg.min));
        text = `${n(W)} kg halten`;
        why = reps[0] < cfg.min
          ? `Der erste Satz lag unter ${cfg.min} Wiederholungen. Gleiches Gewicht, Ziel sind mindestens ${cfg.min}.`
          : `Der erste Satz passt, aber ein späterer Satz lag unter ${cfg.min} Wiederholungen. Gleiches Gewicht, bis alle Sätze im Bereich ${range} liegen.`;
      }
    }
    if (held) why += ' Eingerechnet ist, dass du nicht in jedem Satz am Limit warst.';
    why += loadNote;
    // Plan je Satz: Arbeitssätze bekommen das Ziel, leichtere Sätze bleiben wie beim letzten Mal
    let wi = 0;
    const plan = sets.map((s) => (isWork(s) ? { w: W ? weight : s.w, r: target[Math.min(wi++, target.length - 1)] } : { w: s.w, r: s.r }));
    const rest = { w: W ? weight : null, r: target[target.length - 1] };
    return { kind, weight, text, why, cfg, range, load, last, planAt: (i) => plan[i] || rest };
  };

  /* ---------- Trainingsarten und Vorschläge ---------- */
  Gym.TYPES = [
    { id: 'push', label: 'Push', muscles: ['Brust', 'Schultern', 'Trizeps'], re: /push|drück/i, starter: ['bankdruecken', 'kh-schraegbank', 'kh-schulterdruecken', 'seitheben', 'trizepsdruecken', 'dips'] },
    { id: 'pull', label: 'Pull', muscles: ['Rücken', 'Bizeps'], re: /pull|zieh/i, starter: ['klimmzuege', 'latzug', 'lh-rudern', 'kabelrudern', 'face-pulls', 'kh-curls'] },
    { id: 'legs', label: 'Beine', muscles: ['Beine', 'Gesäß', 'Waden'], re: /bein|leg|unterkörper/i, starter: ['kniebeugen', 'rum-kreuzheben', 'beinpresse', 'beinbeuger', 'beinstrecker', 'wadenheben'] },
    { id: 'upper', label: 'Oberkörper', muscles: ['Brust', 'Rücken', 'Schultern', 'Bizeps', 'Trizeps'], re: /oberkörper|upper/i, starter: ['bankdruecken', 'latzug', 'kh-schulterdruecken', 'lh-rudern', 'kh-curls', 'trizepsdruecken'] },
    { id: 'full', label: 'Ganzkörper', muscles: null, re: /ganzkörper|full/i, starter: ['kniebeugen', 'bankdruecken', 'latzug', 'kh-schulterdruecken', 'rum-kreuzheben', 'plank'] },
  ];
  Gym.type = (id) => Gym.TYPES.find((t) => t.id === id) || null;

  // Art eines Trainings: ausdrücklich gesetzt, sonst aus dem Namen oder den Muskelgruppen erschlossen
  Gym.workoutType = (w) => {
    if (w.type !== undefined) return Gym.type(w.type) ? w.type : null;
    const byName = Gym.TYPES.find((t) => t.re.test(w.name || ''));
    if (byName) return byName.id;
    const ms = w.entries.map((en) => Gym.ex(en.exId).muscle).filter((m) => m !== 'Bauch' && m !== 'Cardio');
    if (ms.length < 2) return null;
    for (const t of Gym.TYPES) {
      if (t.muscles && ms.filter((m) => t.muscles.includes(m)).length / ms.length >= 0.75) return t.id;
    }
    return 'full';
  };

  // Frühere Trainings derselben Art, neueste zuerst
  Gym.sessionsOfType = (type, skipId) =>
    Gym.S.workouts.filter((w) => w.id !== skipId && Gym.workoutType(w) === type).sort((a, b) => b.start - a.start);

  // Vorschläge für ein laufendes Training: die Übungen, die man bei dieser Art (in diesem Gym)
  // regelmäßig macht. Reihenfolge: länger nicht Gemachtes zuerst.
  Gym.suggest = (w) => {
    const t = Gym.type(Gym.workoutType(w));
    if (!t) return null;
    const have = new Set(w.entries.map((en) => en.exId));
    const gone = new Set(Gym.S.customExercises.filter((e) => e.archived).map((e) => e.id));
    const all = Gym.sessionsOfType(t.id, w.id);
    const useGym = Gym.S.gyms.length > 0 && !!Gym.gym(w.gymId);
    const here = useGym ? all.filter((x) => x.gymId === w.gymId) : all;
    // Grundlage sind die letzten 8 Trainings hier; gibt es hier noch zu wenige, zählen andere Gyms mit
    const recent = here.slice(0, 8);
    if (recent.length < 3) for (const x of all) { if (recent.length >= 8) break; if (!recent.includes(x)) recent.push(x); }
    const stat = new Map();
    recent.forEach((s, idx) => {
      for (const exId of new Set(s.entries.map((en) => en.exId))) {
        const st = stat.get(exId) || { exId, n: 0, last: 0, here: false, latest: false };
        st.n++;
        st.last = Math.max(st.last, s.start);
        if (!useGym || s.gymId === w.gymId) st.here = true;
        if (idx === 0) st.latest = true;
        stat.set(exId, st);
      }
    });
    // Regelmäßig heißt: mindestens zweimal dabei oder Teil des letzten Trainings
    let list = Array.from(stat.values()).filter((st) => (st.n >= 2 || st.latest || recent.length < 3) && !gone.has(st.exId));
    list.sort((a, b) => b.here - a.here || a.last - b.last || b.n - a.n);
    let fresh = false;
    if (!list.length) { fresh = true; list = t.starter.map((exId) => ({ exId, n: 0, last: 0, here: false })); }
    return { type: t, fresh, useGym, list: list.filter((st) => !have.has(st.exId)).slice(0, 8), last: here[0] || all[0] || null, lastHere: !!here[0] };
  };

  /* ---------- Trainingsplan (freiwillig) ---------- */
  // Der Plan legt nur die Reihenfolge der Trainingsarten und ein Wochenziel an Sätzen fest.
  // Die Übungen bleiben frei. Ohne Plan (S.plan = null) ist nirgends etwas davon zu sehen.
  Gym.MAIN_MUSCLES = ['Brust', 'Rücken', 'Schultern', 'Bizeps', 'Trizeps', 'Beine'];
  // Richtwert: Sätze je Muskelgruppe und Woche
  Gym.PLAN_LEVELS = [
    { id: 'beginner', label: 'Einsteiger', sub: 'unter 1 Jahr Training', sets: [6, 10] },
    { id: 'mid', label: 'Fortgeschritten', sub: '1 bis 3 Jahre Training', sets: [10, 16] },
    { id: 'adv', label: 'Erfahren', sub: 'über 3 Jahre Training', sets: [14, 20] },
  ];
  // Aufteilungen je Zahl der Trainingstage; die erste ist die Empfehlung
  Gym.PLAN_SPLITS = {
    2: [['full', 'full'], ['upper', 'legs']],
    3: [['full', 'full', 'full'], ['push', 'pull', 'legs']],
    4: [['upper', 'legs', 'upper', 'legs'], ['push', 'pull', 'push', 'pull']],
    5: [['push', 'pull', 'legs', 'upper', 'legs'], ['push', 'pull', 'legs', 'push', 'pull']],
    6: [['push', 'pull', 'legs', 'push', 'pull', 'legs'], ['push', 'pull', 'push', 'pull', 'push', 'pull']],
  };
  // Schwere und leichte Tage: Wiederholungsbereich für Grundübungen
  Gym.LOAD = {
    heavy: { label: 'schwer', day: 'Schwerer Tag', range: [5, 8] },
    light: { label: 'leicht', day: 'Leichter Tag', range: [10, 15] },
  };
  Gym.planLevel = (p) => Gym.PLAN_LEVELS.find((l) => l.id === p.level) || Gym.PLAN_LEVELS[1];
  // Hauptmuskelgruppen einer Trainingsart (nur für sie gibt es ein Satz-Ziel)
  Gym.planMuscles = (type) => { const t = Gym.type(type); return t ? (t.muscles || Gym.MAIN_MUSCLES).filter((m) => Gym.MAIN_MUSCLES.includes(m)) : []; };
  // Kommt eine Art mehrmals vor, wechseln sich auf Wunsch schwere und leichte Tage ab
  Gym.planSlots = (types, wave) => {
    const seen = {};
    return types.map((type) => {
      const k = (seen[type] = (seen[type] || 0) + 1);
      const many = types.filter((t) => t === type).length > 1;
      return { type, load: wave && many ? (k % 2 ? 'heavy' : 'light') : null };
    });
  };
  Gym.makePlan = ({ days, types, level, wave }) => ({ days, level, wave: !!wave, slots: Gym.planSlots(types, wave), pos: 0, created: Date.now() });

  // Ziel je Muskelgruppe: Sätze pro Woche (lo–hi), Häufigkeit pro Woche und Sätze pro Training
  Gym.planTargets = (p) => {
    const [lo, hi] = Gym.planLevel(p).sets, out = {};
    for (const m of Gym.MAIN_MUSCLES) {
      const freq = p.slots.length ? (p.slots.filter((s) => Gym.planMuscles(s.type).includes(m)).length / p.slots.length) * p.days : 0;
      if (freq > 0) out[m] = { lo, hi, freq, session: Math.min(10, Math.max(2, Math.round((lo + hi) / 2 / freq))) };
    }
    return out;
  };

  // Das Training, das laut Plan als Nächstes dran ist
  Gym.planNext = () => {
    const p = Gym.S.plan;
    if (!p || !p.slots.length) return null;
    const idx = (((p.pos | 0) % p.slots.length) + p.slots.length) % p.slots.length;
    return { idx, type: p.slots[idx].type, load: p.slots[idx].load || null };
  };
  // Platz im Plan, zu dem ein Training gehört: der nächste Platz mit derselben Trainingsart
  Gym.planSlot = (w) => {
    const next = Gym.planNext(), t = next && w ? Gym.workoutType(w) : null;
    if (!t) return null;
    const slots = Gym.S.plan.slots;
    for (let k = 0; k < slots.length; k++) {
      const idx = (next.idx + k) % slots.length;
      if (slots[idx].type === t) return { idx, type: t, load: slots[idx].load || null };
    }
    return null;
  };
  // Schwerer oder leichter Tag für diese Übung? Nur Grundübungen mit Gewicht, und nur wenn weder
  // ein eigener Bereich noch ein Ziel aus der Routine festgelegt ist.
  Gym.coachLoad = (ex, en, w) => {
    if (!Gym.S.plan || ex.kind !== 'weight' || !Gym.SECONDARY[ex.id]) return null;
    const own = Gym.S.exCoach[ex.id];
    if (own && own.min > 0 && own.max >= own.min) return null;
    if (en && en.target && TARGET_RE.test(String(en.target))) return null;
    const slot = Gym.planSlot(w);
    return slot && Gym.LOAD[slot.load] ? slot.load : null;
  };

  // Sätze je Muskelgruppe. Mitarbeitende Muskeln zählen halb, Aufwärmsätze (unter 60 % des
  // Höchstgewichts der Übung) zählen nicht.
  Gym.countSets = (entries, out, onlyDone) => {
    out = out || {};
    for (const en of entries) {
      const ex = Gym.ex(en.exId);
      if (ex.kind !== 'weight' && ex.kind !== 'body') continue;
      const sets = en.sets.filter((s) => s.r > 0 && (!onlyDone || s.done));
      const top = ex.kind === 'weight' ? Math.max(0, ...sets.map((s) => s.w || 0)) : 0;
      const n = sets.filter((s) => (s.w || 0) >= top * 0.6).length;
      if (!n) continue;
      out[ex.muscle] = (out[ex.muscle] || 0) + n;
      for (const m of Gym.SECONDARY[ex.id] || []) out[m] = (out[m] || 0) + n / 2;
    }
    return out;
  };
  Gym.muscleSets = (from, to) => {
    const out = {};
    for (const w of Gym.S.workouts) if (w.start >= from && w.start < to) Gym.countSets(w.entries, out);
    return out;
  };
  // Laufendes Training im Plan: Platz und Sätze je Muskelgruppe (abgehakt / Ziel für heute)
  Gym.planSession = (w) => {
    const slot = Gym.planSlot(w);
    if (!slot) return null;
    const tg = Gym.planTargets(Gym.S.plan), done = Gym.countSets(w.entries, {}, true);
    return { slot, muscles: Gym.planMuscles(slot.type).filter((m) => tg[m]).map((m) => ({ m, target: tg[m].session, done: done[m] || 0 })) };
  };

  /* ---------- Trainings anlegen ---------- */
  Gym.newWorkout = (name, routine) => {
    const w = { id: Gym.uid(), name: name || 'Training', start: Date.now(), end: null, notes: '', routineId: routine ? routine.id : null, gymId: Gym.currentGymId(), entries: [], prs: [] };
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
        en.sets = en.sets.filter((s) => (!onlyDone || s.done) && Gym.setValid(ex, s)).map((s) => Object.assign({ w: s.w, r: s.r, done: true }, s.rir ? { rir: s.rir } : {}));
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
