/* Ansichten: Start, Training (live und bearbeiten), Verlauf */
(function () {
  'use strict';
  const Gym = window.Gym;
  const { esc, icon, fmt } = Gym;

  /* ---------- Gemeinsame Bausteine ---------- */
  const tile = (label, value, extra) => `<div class="tile"><span class="tile-label">${esc(label)}</span><span class="tile-value">${value}</span>${extra || ''}</div>`;
  Gym.tile = tile;

  const exNames = (w, max) => {
    const names = w.entries.map((en) => Gym.ex(en.exId).name);
    return names.slice(0, max).join(', ') + (names.length > max ? ` +${names.length - max}` : '');
  };

  Gym.workoutCard = (w) => `
    <a class="card wcard" href="#/history/${esc(w.id)}">
      <div class="wcard-top"><strong>${esc(w.name)}</strong><span class="muted">${esc(fmt.rel(w.start))}</span></div>
      <div class="wcard-stats">
        <span>${icon.timer}${esc(fmt.dur(Gym.wDur(w)))}</span>
        <span>${icon.dumbbell}${esc(fmt.kg(Gym.wVolume(w)))}</span>
        <span>${icon.list}${Gym.wSets(w)} Sätze</span>
        ${Gym.gymName(w.gymId) ? `<span>${icon.pin}${esc(Gym.gymName(w.gymId))}</span>` : ''}
        ${w.prs && w.prs.length ? `<span class="pr">${icon.trophy}${w.prs.length} ${w.prs.length === 1 ? 'Rekord' : 'Rekorde'}</span>` : ''}
      </div>
      <div class="wcard-ex">${esc(exNames(w, 4))}</div>
    </a>`;

  const routineCard = (r) => `
    <div class="card rcard">
      <a class="rcard-main" href="#/routine/${esc(r.id)}">
        <strong>${esc(r.name)}</strong>
        <small>${r.items.length} Übungen${r.items.length ? ' · ' + esc(r.items.slice(0, 3).map((it) => Gym.ex(it.exId).name).join(', ')) + (r.items.length > 3 ? ' …' : '') : ''}</small>
      </a>
      <button class="btn primary sm" data-act="startWorkout" data-routine="${esc(r.id)}" aria-label="${esc(r.name)} starten">${icon.play} Start</button>
    </div>`;
  Gym.routineCard = routineCard;

  // Gym-Auswahl vor dem Start: das zuletzt genutzte Gym ist vorausgewählt
  const gymPicker = () => {
    const cur = Gym.currentGymId();
    return `<div class="gym-pick">
      <div class="gym-pick-label">${icon.pin}<span>Wo trainierst du?</span></div>
      <div class="chips scroll" role="group" aria-label="Gym">
        ${Gym.S.gyms.map((g) => `<button class="chip ${g.id === cur ? 'on' : ''}" data-act="gymSelect" data-id="${esc(g.id)}" aria-pressed="${g.id === cur}">${esc(g.name)}</button>`).join('')}
        <button class="chip dashed" data-act="gymNew">${icon.plus}${Gym.S.gyms.length ? 'Neu' : 'Gym hinzufügen'}</button>
      </div>
    </div>`;
  };
  Gym.act.gymSelect = (el) => {
    const st = Gym.S.settings;
    st.lastGymId = st.lastGymId === el.dataset.id ? null : el.dataset.id; // erneutes Antippen wählt ab
    Gym.save(); Gym.render();
  };
  Gym.act.gymNew = () => Gym.gymForm(null, (g) => { Gym.S.settings.lastGymId = g.id; Gym.save(); Gym.render(); });

  const startSection = () => `
    ${gymPicker()}
    <button class="btn primary big block" data-act="startWorkout">${icon.plus} Leeres Training starten</button>
    <div class="sec-head"><h2>Aus Routine starten</h2><a href="#/routines">Verwalten</a></div>
    ${Gym.S.routines.length ? Gym.S.routines.map(routineCard).join('') : `<p class="muted">Noch keine Routinen. <a href="#/routine/new">Routine anlegen</a></p>`}`;

  Gym.act.startWorkout = (el) => {
    const S = Gym.S;
    if (S.active) { Gym.toast('Es läuft bereits ein Training'); return Gym.go('#/workout'); }
    const r = el.dataset.routine ? S.routines.find((x) => x.id === el.dataset.routine) : null;
    const hour = new Date().getHours();
    const dflt = hour < 11 ? 'Morgentraining' : hour < 17 ? 'Training am Mittag' : 'Abendtraining';
    S.active = Gym.newWorkout(r ? r.name : dflt, r);
    Gym.unlockAudio();
    Gym.save();
    Gym.go('#/workout');
  };

  /* ---------- Start ---------- */
  Gym.route('/home', 'home', () => {
    const S = Gym.S, now = Date.now(), ws = Gym.weekStart(now);
    const thisWeek = S.workouts.filter((w) => w.start >= ws);
    const lastWeek = S.workouts.filter((w) => w.start >= Gym.addDays(ws, -7) && w.start < ws);
    const vol = (list) => list.reduce((a, w) => a + Gym.wVolume(w), 0);
    const vNow = vol(thisWeek), vLast = vol(lastWeek);
    const goal = Math.max(1, S.settings.weeklyGoal || 3);
    const streak = Gym.weekStreak();
    const recent = Gym.sorted().reverse().slice(0, 3);
    const hello = (new Date().getHours() < 11 ? 'Guten Morgen' : new Date().getHours() < 18 ? 'Hallo' : 'Guten Abend') + (S.settings.name ? ', ' + S.settings.name : '');

    let delta = '';
    if (vLast > 0 && vNow > 0) {
      const p = Math.round(((vNow - vLast) / vLast) * 100);
      delta = `<span class="delta ${p >= 0 ? 'up' : 'down'}">${p >= 0 ? '▲' : '▼'} ${Math.abs(p)} % zur Vorwoche</span>`;
    } else if (vLast > 0) delta = `<span class="delta">Vorwoche: ${esc(fmt.kg(vLast))}</span>`;

    const body = `
      <div class="hello"><h1>${esc(hello)}</h1><p class="muted">${esc(fmt.long(now))}</p></div>
      ${S.active ? `
        <a class="card active-banner" href="#/workout">
          <span class="pulse"></span>
          <span class="li-main"><strong>${esc(S.active.name)} läuft</strong><small>Dauer <span data-elapsed></span> · antippen zum Fortsetzen</small></span>
          ${icon.right}
        </a>` : ''}
      <div class="tiles">
        ${tile('Diese Woche', `${thisWeek.length} <small>/ ${goal} Trainings</small>`, `<div class="meter" role="img" aria-label="${thisWeek.length} von ${goal} Trainings"><i style="width:${Math.min(100, (thisWeek.length / goal) * 100)}%"></i></div>`)}
        ${tile('Wochen in Folge', `${streak}`, `<span class="delta">${streak ? 'Bleib dran!' : 'Starte deine Serie'}</span>`)}
        ${tile('Volumen diese Woche', esc(fmt.kg(vNow)), delta)}
        ${tile('Trainings gesamt', `${S.workouts.length}`, S.workouts.length ? `<span class="delta">seit ${esc(fmt.dayMonY(Gym.sorted()[0].start))}</span>` : '')}
      </div>
      ${S.active ? '' : startSection()}
      ${S.workouts.length ? `
        ${Gym.charts.card('cal', 'Trainingskalender', 'Sätze pro Tag in den letzten Wochen')}
        <div class="sec-head"><h2>Letzte Trainings</h2><a href="#/history">Alle ansehen</a></div>
        ${recent.map(Gym.workoutCard).join('')}` : `
        <div class="card hint">
          <h3>Willkommen bei deiner Gym App</h3>
          <p>Starte oben dein erstes Training. Jeder abgehakte Satz landet im Verlauf, und unter <strong>Fortschritt</strong> siehst du deine Entwicklung als Diagramm.</p>
          <p>Du willst erst sehen, wie das aussieht?</p>
          <button class="btn ghost" data-act="demoLoad">Beispieldaten laden</button>
        </div>`}`;

    return {
      html: `<div class="content home">${body}</div>`,
      after: (root) => {
        if (!S.workouts.length) return;
        const days = new Map();
        for (const w of S.workouts) {
          const k = Gym.dayKey(w.start), d = days.get(k) || { v: 0, names: [] };
          d.v += Gym.wSets(w); d.names.push(w.name);
          d.text = `${d.v} Sätze`; d.label = d.names.join(', ');
          days.set(k, d);
        }
        const rows = Gym.sorted().reverse().slice(0, 30).map((w) => [fmt.date(w.start), w.name, String(Gym.wSets(w))]);
        Gym.charts.fill(root, { cal: { draw: (el) => Gym.charts.heatmap(el, days, 'Sätze'), table: { head: ['Datum', 'Training', 'Sätze'], rows } } });
      },
    };
  });

  Gym.act.demoLoad = () => { Gym.loadDemo(); Gym.toast('Beispieldaten geladen'); Gym.render(); };

  /* ---------- Training: Editor (live und bearbeiten) ---------- */
  let cur = null; // { w, mode: 'live' | 'edit' }
  const persist = () => { if (cur && cur.mode === 'live') Gym.saveSoon(); };

  const hint = (en, si, last) => {
    let prev = null;
    for (let i = si - 1; i >= 0 && !prev; i--) if (en.sets[i].done || en.sets[i].r != null) prev = en.sets[i];
    const lt = last && last.length ? last[Math.min(si, last.length - 1)] : null;
    const pick = (a, b) => (a != null ? a : b != null ? b : null);
    return { w: pick(prev && prev.w, lt && lt.w), r: pick(lt && lt.r, prev && prev.r) };
  };

  const entryCard = (w, en, ei, mode) => {
    const ex = Gym.ex(en.exId);
    const fields = Gym.fields(ex.kind);
    const before = mode === 'live' ? Date.now() : w.start;
    const gf = Gym.cmpGym(ex, w);
    const last = Gym.lastSets(en.exId, before, w.id, gf);
    const firstHere = !last && gf && Gym.lastSets(en.exId, before, w.id);
    const rows = en.sets.map((s, si) => {
      const h = hint(en, si, last);
      return `<div class="set-row ${s.done && mode === 'live' ? 'done' : ''}">
        <span class="set-n">${si + 1}</span>
        <span class="set-prev">${last && last[si] ? esc(Gym.fmtSetShort(ex, last[si])) : '–'}</span>
        ${fields.map(([f, label]) => `<input class="set-in" type="text" inputmode="decimal" autocomplete="off" data-input="setField" data-e="${ei}" data-s="${si}" data-f="${f}" value="${esc(fmt.input(s[f]))}" placeholder="${esc(fmt.input(h[f]))}" aria-label="Satz ${si + 1}: ${esc(label)}">`).join('')}
        ${mode === 'live' ? `<button class="set-check" data-act="setDone" data-e="${ei}" data-s="${si}" aria-pressed="${s.done ? 'true' : 'false'}" aria-label="Satz ${si + 1} abhaken">${icon.check}</button>` : ''}
      </div>`;
    }).join('');
    return `<section class="card entry">
      <div class="entry-head">
        <div class="li-main">
          <a class="entry-name" href="#/exercise/${esc(ex.id)}">${esc(ex.name)}</a>
          <small>${esc(ex.muscle)}${en.target ? ' · Ziel: ' + esc(en.target) + (/^[\d\s–-]+$/.test(en.target) ? ' Wdh.' : '') : ''}${firstHere ? ' · erstes Mal in diesem Gym' : ''}</small>
        </div>
        <button class="icon-btn sm" data-act="entryMenu" data-e="${ei}" aria-label="Optionen für ${esc(ex.name)}">${icon.more}</button>
      </div>
      <div class="set-row set-head">
        <span class="set-n">Satz</span><span class="set-prev">Zuletzt</span>
        ${fields.map(([, label]) => `<span class="set-col">${esc(label)}</span>`).join('')}
        ${mode === 'live' ? '<span class="set-ck"></span>' : ''}
      </div>
      ${rows}
      <div class="entry-foot">
        <button class="btn sm ghost" data-act="setAdd" data-e="${ei}">${icon.plus} Satz</button>
        ${en.sets.length > 1 ? `<button class="btn sm ghost" data-act="setDel" data-e="${ei}">${icon.minus} Satz</button>` : ''}
      </div>
    </section>`;
  };

  const editorBody = (w, mode) => `
    ${w.entries.map((en, ei) => entryCard(w, en, ei, mode)).join('')}
    ${w.entries.length ? '' : `<div class="empty small">${icon.dumbbell}<p>Füge deine erste Übung hinzu.</p></div>`}
    <button class="btn block ${w.entries.length ? 'ghost' : 'primary'}" data-act="entryAdd">${icon.plus} Übung hinzufügen</button>
    <label class="notes">Notizen<textarea data-input="wkNotes" rows="2" placeholder="Wie lief es heute?">${esc(w.notes || '')}</textarea></label>`;

  Gym.act.setField = (el) => {
    const s = cur.w.entries[+el.dataset.e].sets[+el.dataset.s];
    s[el.dataset.f] = Gym.parseNum(el.value);
    persist();
  };
  Gym.act.setDone = (el) => {
    const w = cur.w, ei = +el.dataset.e, si = +el.dataset.s;
    const en = w.entries[ei], s = en.sets[si], ex = Gym.ex(en.exId);
    if (s.done) s.done = false;
    else {
      const h = hint(en, si, Gym.lastSets(en.exId, Date.now(), w.id, Gym.cmpGym(ex, w)));
      for (const [f] of Gym.fields(ex.kind)) if (s[f] == null && h[f] != null) s[f] = h[f];
      if (!Gym.setValid(ex, s)) {
        Gym.toast('Bitte erst die Werte eintragen');
        const empty = Array.from(el.closest('.set-row').querySelectorAll('input')).find((i) => !i.value);
        if (empty) empty.focus();
        return;
      }
      s.done = true;
      if (Gym.S.settings.autoRest && (ex.kind === 'weight' || ex.kind === 'body')) Gym.startRest(Gym.S.settings.restSec || 90);
    }
    Gym.save();
    Gym.render();
  };
  Gym.act.setAdd = (el) => { cur.w.entries[+el.dataset.e].sets.push({ w: null, r: null, done: false }); persist(); Gym.render(); };
  Gym.act.setDel = (el) => { cur.w.entries[+el.dataset.e].sets.pop(); persist(); Gym.render(); };
  Gym.act.wkName = (el) => { cur.w.name = el.value; persist(); };
  Gym.act.wkNotes = (el) => { cur.w.notes = el.value; persist(); };
  Gym.act.entryAdd = () => {
    const c = cur;
    Gym.pickExercise((exId) => {
      const last = Gym.lastSets(exId, Date.now(), c.w.id, Gym.cmpGym(Gym.ex(exId), c.w));
      const n = last ? Math.min(6, Math.max(1, last.length)) : 3;
      c.w.entries.push({ id: Gym.uid(), exId, sets: Array.from({ length: n }, () => ({ w: null, r: null, done: false })) });
      if (c.mode === 'live') Gym.save();
      Gym.render();
      window.scrollTo(0, document.body.scrollHeight);
    });
  };
  Gym.act.entryMenu = (el) => {
    const ei = +el.dataset.e, w = cur.w, n = w.entries.length;
    Gym.modal({
      title: Gym.ex(w.entries[ei].exId).name,
      body: `<div class="menu">
        ${ei > 0 ? `<button class="list-item" data-act="entryMove" data-e="${ei}" data-d="-1">${icon.up}<span class="li-main">Nach oben</span></button>` : ''}
        ${ei < n - 1 ? `<button class="list-item" data-act="entryMove" data-e="${ei}" data-d="1">${icon.down}<span class="li-main">Nach unten</span></button>` : ''}
        <button class="list-item" data-act="entryReplace" data-e="${ei}">${icon.repeat}<span class="li-main">Übung ersetzen</span></button>
        <a class="list-item" href="#/exercise/${esc(w.entries[ei].exId)}">${icon.chart}<span class="li-main">Verlauf der Übung ansehen</span></a>
        <button class="list-item danger" data-act="entryRemove" data-e="${ei}">${icon.trash}<span class="li-main">Übung entfernen</span></button>
      </div>`,
    });
  };
  Gym.act.entryMove = (el) => {
    const ei = +el.dataset.e, d = +el.dataset.d, list = cur.w.entries;
    [list[ei], list[ei + d]] = [list[ei + d], list[ei]];
    persist(); Gym.closeModal(); Gym.render();
  };
  Gym.act.entryRemove = (el) => { cur.w.entries.splice(+el.dataset.e, 1); persist(); Gym.closeModal(); Gym.render(); };
  Gym.act.entryReplace = (el) => {
    const c = cur, en = c.w.entries[+el.dataset.e];
    Gym.pickExercise((exId) => {
      en.exId = exId; en.target = '';
      en.sets = en.sets.map(() => ({ w: null, r: null, done: false }));
      if (c.mode === 'live') Gym.save();
      Gym.render();
    });
  };

  // Live-Training
  Gym.route('/workout', 'workout', () => {
    const w = Gym.S.active;
    if (!w) {
      cur = null;
      return { html: Gym.page({ title: 'Training starten', body: startSection() }) };
    }
    cur = { w, mode: 'live' };
    const done = w.entries.reduce((a, en) => a + en.sets.filter((s) => s.done).length, 0);
    const total = Gym.wSets(w);
    return {
      html: `
        <header class="top wk-top">
          <div class="wk-title">
            <input class="title-in" value="${esc(w.name)}" data-input="wkName" maxlength="50" aria-label="Name des Trainings">
            <span class="wk-meta">${icon.timer}<span data-elapsed></span><span>· ${done}/${total} Sätze</span></span>
          </div>
          <button class="btn primary" data-act="wkFinish">${icon.check} Beenden</button>
        </header>
        <div class="content">
          <div><button class="chip gym-chip ${w.gymId && Gym.gym(w.gymId) ? '' : 'dashed'}" data-act="wkGym">${icon.pin}${esc(Gym.gymName(w.gymId) || 'Gym wählen')}</button></div>
          ${editorBody(w, 'live')}
          <button class="btn block text danger" data-act="wkDiscard">Training verwerfen</button>
        </div>`,
    };
  });

  Gym.act.wkGym = () => {
    const c = cur;
    Gym.chooseGym(Gym.gym(c.w.gymId) ? c.w.gymId : null, (id) => {
      c.w.gymId = id;
      if (id) Gym.S.settings.lastGymId = id;
      Gym.save(); Gym.render();
    });
  };

  Gym.act.wkFinish = async () => {
    const S = Gym.S, a = S.active;
    if (!a) return;
    const clean = Gym.cleanWorkout(a, true);
    if (!clean.entries.length) {
      const ok = await Gym.confirm('Training beenden?', 'Du hast noch keinen Satz abgehakt. Das Training wird nicht gespeichert.', 'Verwerfen', true);
      if (ok) { S.active = null; S.rest = null; Gym.save(); Gym.go('#/home'); }
      return;
    }
    const open = Gym.wSets(a) - Gym.wSets(clean);
    if (open > 0) {
      const ok = await Gym.confirm('Training beenden?', `${open} ${open === 1 ? 'Satz ist' : 'Sätze sind'} noch nicht abgehakt und ${open === 1 ? 'wird' : 'werden'} nicht gespeichert.`, 'Beenden');
      if (!ok) return;
    }
    clean.end = Date.now();
    clean.name = (clean.name || '').trim() || 'Training';
    S.workouts.push(clean);
    S.active = null; S.rest = null;
    Gym.recomputePRs();
    Gym.save();
    Gym.ui.justFinished = clean.id;
    Gym.go('#/history/' + clean.id);
  };
  Gym.act.wkDiscard = async () => {
    const ok = await Gym.confirm('Training verwerfen?', 'Alle Eingaben dieses Trainings gehen verloren.', 'Verwerfen', true);
    if (!ok) return;
    Gym.S.active = null; Gym.S.rest = null; Gym.save(); Gym.go('#/home');
  };

  // Vergangenes Training bearbeiten oder nachtragen
  Gym.route('/edit/([^/]+)', 'history', (id) => {
    if (!Gym.draft || Gym.draft.id !== id) {
      const orig = Gym.S.workouts.find((w) => w.id === id);
      if (!orig) { location.replace('#/history'); return null; }
      Gym.draft = Gym.clone(orig);
    }
    const w = Gym.draft;
    cur = { w, mode: 'edit' };
    const d = new Date(w.start);
    const p = (n) => String(n).padStart(2, '0');
    return {
      html: `
        <header class="top">
          <button class="icon-btn" data-act="editCancel" aria-label="Abbrechen">${icon.x}</button>
          <h1>${w.isNew ? 'Training nachtragen' : 'Training bearbeiten'}</h1>
          <div class="top-actions"><button class="btn primary" data-act="editSave">Speichern</button></div>
        </header>
        <div class="content">
          <div class="card form grid2" id="edit-meta">
            <label class="span2">Name<input name="name" value="${esc(w.name)}" data-input="wkName" maxlength="50"></label>
            <label>Datum<input type="date" name="date" value="${Gym.dayKey(w.start)}" max="${Gym.dayKey(Date.now())}" data-input="editMeta"></label>
            <label>Beginn<input type="time" name="time" value="${p(d.getHours())}:${p(d.getMinutes())}" data-input="editMeta"></label>
            <label class="span2">Dauer in Minuten<input class="num" type="text" inputmode="numeric" name="dur" value="${Math.round(Gym.wDur(w) / 60000)}" data-input="editMeta"></label>
            ${Gym.S.gyms.length ? `<label class="span2">Gym<select data-change="editGym"><option value="">Ohne Angabe</option>${Gym.S.gyms.map((g) => `<option value="${esc(g.id)}" ${g.id === w.gymId ? 'selected' : ''}>${esc(g.name)}</option>`).join('')}</select></label>` : ''}
          </div>
          ${editorBody(w, 'edit')}
        </div>`,
    };
  });
  Gym.act.editMeta = () => {
    const box = document.getElementById('edit-meta'), w = Gym.draft;
    const get = (n) => box.querySelector(`[name=${n}]`).value;
    const start = new Date(`${get('date')}T${get('time') || '18:00'}`).getTime();
    const dur = Gym.parseNum(get('dur'));
    if (isFinite(start)) { const old = Gym.wDur(w); w.start = start; w.end = start + old; }
    if (dur != null) w.end = w.start + dur * 60000;
  };
  Gym.act.editGym = (el) => { Gym.draft.gymId = el.value || null; Gym.render(); };
  Gym.act.editSave = () => {
    const S = Gym.S, d = Gym.draft;
    const clean = Gym.cleanWorkout(d, false);
    if (!clean.entries.length) return Gym.toast('Bitte mindestens einen Satz eintragen');
    if (clean.start > Date.now()) return Gym.toast('Das Datum liegt in der Zukunft');
    delete clean.isNew;
    clean.name = (clean.name || '').trim() || 'Training';
    const i = S.workouts.findIndex((w) => w.id === clean.id);
    if (i >= 0) S.workouts[i] = clean; else S.workouts.push(clean);
    Gym.recomputePRs();
    Gym.save();
    Gym.draft = null;
    Gym.toast('Gespeichert');
    Gym.go('#/history/' + clean.id);
  };
  Gym.act.editCancel = () => {
    const d = Gym.draft; Gym.draft = null;
    Gym.go(d && !d.isNew ? '#/history/' + d.id : '#/history');
  };
  Gym.act.logPast = () => {
    const w = Gym.newWorkout('Training');
    w.start = Date.now() - 3600000; w.end = Date.now(); w.isNew = true;
    Gym.draft = w;
    Gym.go('#/edit/' + w.id);
  };

  /* ---------- Verlauf ---------- */
  Gym.route('/history', 'history', () => {
    const list = Gym.sorted().reverse();
    let body = '';
    if (!list.length) {
      body = Gym.emptyState(icon.history, 'Noch keine Trainings', 'Abgeschlossene Trainings erscheinen hier.', `<a class="btn primary" href="#/workout">Training starten</a>`);
    } else {
      let month = null;
      for (const w of list) {
        const m = Gym.monthStart(w.start);
        if (m !== month) {
          month = m;
          const n = list.filter((x) => Gym.monthStart(x.start) === m).length;
          body += `<div class="sec-head"><h2>${esc(fmt.month(m))}</h2><span class="muted">${n} ${n === 1 ? 'Training' : 'Trainings'}</span></div>`;
        }
        body += Gym.workoutCard(w);
      }
    }
    return { html: Gym.page({ title: 'Verlauf', actions: `<button class="btn ghost sm" data-act="logPast">${icon.plus} Nachtragen</button>`, body }) };
  });

  Gym.route('/history/([^/]+)', 'history', (id) => {
    const w = Gym.S.workouts.find((x) => x.id === id);
    if (!w) { location.replace('#/history'); return null; }
    const fresh = Gym.ui.justFinished === id;
    Gym.ui.justFinished = null;
    const prs = w.prs || [];
    const entries = w.entries.map((en) => {
      const ex = Gym.ex(en.exId);
      return `<section class="card entry">
        <div class="entry-head"><div class="li-main"><a class="entry-name" href="#/exercise/${esc(ex.id)}">${esc(ex.name)}</a><small>${esc(ex.muscle)}</small></div></div>
        <ol class="sets">${en.sets.map((s) => `<li><span>${esc(Gym.fmtSet(ex, s))}</span>${ex.kind === 'weight' && s.r > 1 ? `<small>1RM ≈ ${esc(fmt.num(Gym.e1rm(s.w, s.r), 1))} kg</small>` : ''}</li>`).join('')}</ol>
      </section>`;
    }).join('');
    const body = `
      ${fresh ? `<div class="card done-banner">${icon.trophy}<div><h2>Stark, Training geschafft!</h2><p>${prs.length ? `Du hast ${prs.length} ${prs.length === 1 ? 'neuen Rekord' : 'neue Rekorde'} aufgestellt.` : 'Alles ist gespeichert.'}</p></div></div>` : ''}
      <p class="muted">${esc(fmt.long(w.start))} · ${esc(fmt.time(w.start))} Uhr${Gym.gymName(w.gymId) ? ' · ' + esc(Gym.gymName(w.gymId)) : ''}</p>
      <div class="tiles">
        ${tile('Dauer', esc(fmt.dur(Gym.wDur(w))))}
        ${tile('Volumen', esc(fmt.kg(Gym.wVolume(w))))}
        ${tile('Sätze', String(Gym.wSets(w)))}
        ${tile('Rekorde', String(prs.length))}
      </div>
      ${prs.length ? `<section class="card"><h3>Neue Rekorde</h3><ul class="pr-list">${prs.map((p) => { const ex = Gym.ex(p.exId); return `<li>${icon.trophy}<span class="li-main"><strong>${esc(ex.name)}</strong><small>${esc(Gym.PR_LABEL[p.key])}</small></span><b>${esc(Gym.fmtMetric(ex, p.key, p.v))}</b></li>`; }).join('')}</ul></section>` : ''}
      ${w.notes ? `<section class="card"><h3>Notizen</h3><p class="pre">${esc(w.notes)}</p></section>` : ''}
      ${entries}
      <div class="row-btns wrap">
        <button class="btn ghost" data-act="wkRepeat" data-id="${esc(w.id)}">${icon.repeat} Wiederholen</button>
        <a class="btn ghost" href="#/edit/${esc(w.id)}">${icon.edit} Bearbeiten</a>
        <button class="btn ghost" data-act="wkToRoutine" data-id="${esc(w.id)}">${icon.list} Als Routine</button>
        <button class="btn ghost danger" data-act="wkDelete" data-id="${esc(w.id)}">${icon.trash} Löschen</button>
      </div>`;
    return { html: Gym.page({ title: w.name, back: '#/history', body }) };
  });

  Gym.act.wkRepeat = (el) => {
    const S = Gym.S;
    if (S.active) { Gym.toast('Es läuft bereits ein Training'); return Gym.go('#/workout'); }
    const src = S.workouts.find((w) => w.id === el.dataset.id);
    S.active = Gym.newWorkout(src.name, { id: src.routineId, items: src.entries.map((en) => ({ exId: en.exId, sets: en.sets.length, reps: en.target || '' })) });
    Gym.save(); Gym.go('#/workout');
  };
  Gym.act.wkToRoutine = (el) => {
    const src = Gym.S.workouts.find((w) => w.id === el.dataset.id);
    Gym.S.routines.push({ id: Gym.uid(), name: src.name, items: src.entries.map((en) => ({ exId: en.exId, sets: en.sets.length, reps: en.target || '' })) });
    Gym.save(); Gym.toast('Als Routine gespeichert');
  };
  Gym.act.wkDelete = async (el) => {
    const ok = await Gym.confirm('Training löschen?', 'Das Training wird dauerhaft aus dem Verlauf entfernt.', 'Löschen', true);
    if (!ok) return;
    Gym.S.workouts = Gym.S.workouts.filter((w) => w.id !== el.dataset.id);
    Gym.recomputePRs(); Gym.save(); Gym.toast('Training gelöscht'); Gym.go('#/history');
  };
})();
