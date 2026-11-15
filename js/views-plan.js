/* Ansicht: Trainingsplan (freiwillig). Ohne Plan zeigt die App nirgends etwas davon. */
(function () {
  'use strict';
  const Gym = window.Gym;
  const { esc, icon, fmt } = Gym;

  const typeLabel = (id) => (Gym.type(id) || { label: 'Training' }).label;
  const loadText = (load) => { const l = Gym.LOAD[load]; return l ? `${l.day}: Grundübungen mit ${l.range[0]}–${l.range[1]} Wdh.` : ''; };
  const canWave = (types) => new Set(types).size < types.length;

  // Wie oft jede Hauptmuskelgruppe in einer Aufteilung vorkommt, als kurzer Satz
  const freqText = (types) => {
    const f = {};
    for (const m of Gym.MAIN_MUSCLES) f[m] = types.filter((t) => Gym.planMuscles(t).includes(m)).length;
    const vals = Array.from(new Set(Object.values(f))).sort((a, b) => b - a);
    if (vals.length === 1) return `Jede Muskelgruppe ${vals[0]}× pro Woche`;
    return vals.map((v) => `${Gym.MAIN_MUSCLES.filter((m) => f[m] === v).join(', ')} ${v ? v + '×' : 'nicht im Plan'}`).join(' · ');
  };

  /* ---------- Karte „als Nächstes“ (Start und Plan-Seite) ---------- */
  Gym.planCard = () => {
    const next = Gym.planNext();
    if (!next) return '';
    const last = Gym.sessionsOfType(next.type)[0];
    const info = [loadText(next.load), last ? 'zuletzt ' + fmt.ago(last.start) : ''].filter(Boolean).join(' · ');
    return `<div class="card plan-next">
      <a class="li-main" href="#/plan"><small>Laut Plan als Nächstes</small><strong>${esc(typeLabel(next.type))}</strong>${info ? `<small class="wrap">${esc(info)}</small>` : ''}</a>
      <button class="btn primary" data-act="planStart" aria-label="${esc(typeLabel(next.type))} starten">${icon.play} Start</button>
    </div>`;
  };
  Gym.act.planStart = () => {
    const S = Gym.S, next = Gym.planNext();
    if (!next) return;
    if (S.active) { Gym.toast('Es läuft bereits ein Training'); return Gym.go('#/workout'); }
    S.active = Gym.newWorkout(typeLabel(next.type));
    S.active.type = next.type;
    Gym.unlockAudio();
    Gym.save();
    Gym.go('#/workout');
  };
  Gym.act.planSkip = () => {
    const p = Gym.S.plan, next = Gym.planNext();
    if (!next) return;
    p.pos = (next.idx + 1) % p.slots.length;
    Gym.save(); Gym.render();
  };

  /* ---------- Plan erstellen ---------- */
  let pd = null; // Entwurf: { days, split, level, wave }
  const draft = () => {
    if (!pd) {
      const p = Gym.S.plan;
      pd = { days: Math.min(6, Math.max(2, p ? p.days : Gym.S.settings.weeklyGoal || 3)), split: 0, level: p ? p.level : 'mid', wave: p ? !!p.wave : false };
    }
    return pd;
  };
  const generator = () => {
    const d = draft(), splits = Gym.PLAN_SPLITS[d.days], types = splits[d.split];
    const lv = Gym.PLAN_LEVELS.find((l) => l.id === d.level) || Gym.PLAN_LEVELS[1];
    const wave = canWave(types);
    return `
      <p class="muted">Ein Plan ist freiwillig. Er legt fest, welche Trainingsart als Nächstes dran ist und wie viele Sätze jede Muskelgruppe pro Woche bekommen soll. Die Übungen wählst du weiter frei. Ohne Plan bleibt die App, wie sie ist.</p>
      <div class="card form">
        <div class="field"><span>Trainingstage pro Woche</span>
          <div class="chips" role="group" aria-label="Trainingstage pro Woche">
            ${[2, 3, 4, 5, 6].map((n) => `<button class="chip ${n === d.days ? 'on' : ''}" data-act="pgDays" data-n="${n}" aria-pressed="${n === d.days}">${n}×</button>`).join('')}
          </div>
        </div>
        <div class="field"><span>Aufteilung</span>
          <div class="menu">
            ${splits.map((ts, i) => `<button class="list-item" data-act="pgSplit" data-i="${i}" aria-pressed="${i === d.split}">
              <span class="li-main"><strong>${esc(ts.map(typeLabel).join(' · '))}${i === 0 ? ' <span class="tag">Empfohlen</span>' : ''}</strong><small class="wrap">${esc(freqText(ts))}</small></span>${i === d.split ? icon.check : ''}
            </button>`).join('')}
          </div>
        </div>
        <div class="field"><span>Erfahrung</span>
          <div class="chips" role="group" aria-label="Erfahrung">
            ${Gym.PLAN_LEVELS.map((l) => `<button class="chip ${l.id === d.level ? 'on' : ''}" data-act="pgLevel" data-id="${l.id}" aria-pressed="${l.id === d.level}">${esc(l.label)}</button>`).join('')}
          </div>
          <small class="muted">${esc(lv.sub)}: Richtwert ${lv.sets[0]}–${lv.sets[1]} Sätze pro Woche für große Muskeln, kleinere entsprechend weniger</small>
        </div>
        <label class="switch-row"><span class="li-main"><strong>Schwere und leichte Tage</strong><small class="wrap">${wave
          ? 'Grundübungen abwechselnd mit 5–8 und 10–15 Wiederholungen. Sinnvoll, wenn dir auch Kraft wichtig ist. Für reinen Muskelaufbau nicht nötig.'
          : 'Nur möglich, wenn eine Trainingsart mehrmals pro Woche vorkommt.'}</small></span>
          <input type="checkbox" class="switch" data-change="pgWave" ${wave && d.wave ? 'checked' : ''} ${wave ? '' : 'disabled'}></label>
        <button class="btn primary" data-act="pgCreate">Plan erstellen</button>
        <p class="muted small">Setzt auch dein Wochenziel auf ${d.days}× pro Woche. Die Reihenfolge kannst du danach frei ändern.</p>
      </div>`;
  };
  Gym.act.pgDays = (el) => { const d = draft(); d.days = +el.dataset.n; d.split = 0; Gym.render(); };
  Gym.act.pgSplit = (el) => { draft().split = +el.dataset.i; Gym.render(); };
  Gym.act.pgLevel = (el) => { draft().level = el.dataset.id; Gym.render(); };
  Gym.act.pgWave = (el) => { draft().wave = el.checked; };
  Gym.act.pgCreate = async () => {
    const S = Gym.S, d = draft(), types = Gym.PLAN_SPLITS[d.days][d.split];
    if (S.plan) {
      const ok = await Gym.confirm('Plan ersetzen?', 'Reihenfolge und Einstellungen des bisherigen Plans gehen verloren. Deine Trainings bleiben erhalten.', 'Ersetzen');
      if (!ok) return;
    }
    S.plan = Gym.makePlan({ days: d.days, types, level: d.level, wave: d.wave && canWave(types) });
    S.settings.weeklyGoal = d.days;
    pd = null;
    Gym.save(); Gym.toast('Plan erstellt'); Gym.go('#/plan');
  };
  Gym.route('/plan/new', 'more', () => ({
    html: Gym.page({ title: Gym.S.plan ? 'Plan neu erstellen' : 'Trainingsplan', back: Gym.S.plan ? '#/plan' : '#/more', body: generator() }),
  }));

  /* ---------- Wochenübersicht: Sätze je Muskelgruppe gegen den Zielbereich ---------- */
  const VOL = [['week', 'Diese Woche'], ['last', 'Vorwoche'], ['avg', 'Ø 4 Wochen']];
  let volRange = 'week';
  const volCard = (p) => {
    const tg = Gym.planTargets(p), ws = Gym.weekStart(Date.now()), lv = Gym.planLevel(p);
    let sets;
    if (volRange === 'week') sets = Gym.muscleSets(ws, Infinity);
    else if (volRange === 'last') sets = Gym.muscleSets(Gym.addDays(ws, -7), ws);
    else { sets = Gym.muscleSets(Gym.addDays(ws, -28), ws); for (const m in sets) sets[m] /= 4; }
    const order = Gym.COUNT_ORDER.concat(Object.keys(sets).filter((m) => !Gym.COUNT_ORDER.includes(m) && m !== 'Cardio'));
    const rows = order.filter((m) => tg[m] || sets[m] > 0);
    const max = Math.max(1, ...rows.map((m) => Math.max(sets[m] || 0, tg[m] ? tg[m].hi : 0))) * 1.06;
    const pct = (v) => Math.round((v / max) * 1000) / 10;
    const aimed = rows.filter((m) => tg[m]);
    const hit = aimed.filter((m) => (sets[m] || 0) >= tg[m].lo).length;
    const html = rows.map((m) => {
      const v = sets[m] || 0, t = tg[m];
      const state = !t ? 'ohne Ziel' : v < t.lo ? 'unter dem Ziel' : v > t.hi ? 'über dem Ziel' : 'im Ziel';
      const note = !t ? 'ohne Ziel' : v > t.hi ? `über ${t.lo}–${t.hi}` : `Ziel ${t.lo}–${t.hi}`;
      const label = `${m}: ${fmt.num(v, 1)} Sätze${t ? `, Ziel ${t.lo} bis ${t.hi}` : ''}, ${state}`;
      return `<div class="vol-row" role="listitem" aria-label="${esc(label)}" title="${esc(label)}">
        <span class="hbar-name">${esc(m)}</span>
        <span class="vol-track">${t ? `<i class="vol-zone" style="left:${pct(t.lo)}%;width:${pct(t.hi - t.lo)}%"></i>` : ''}<i class="vol-fill" style="width:${pct(v)}%"></i></span>
        <span class="vol-val"><b>${esc(fmt.num(v, 1))}${t && v >= t.lo && v <= t.hi ? icon.check : ''}</b><small>${esc(note)}</small></span>
      </div>`;
    }).join('');
    return `<section class="card vol-card">
      <div><h3>Sätze pro Muskelgruppe</h3><p class="sub">${hit} von ${aimed.length} Muskelgruppen ${volRange === 'week' ? 'haben das Wochenziel schon erreicht' : 'haben das Wochenziel erreicht'}</p></div>
      <div class="chips" role="group" aria-label="Zeitraum">
        ${VOL.map(([k, l]) => `<button class="chip ${k === volRange ? 'on' : ''}" data-act="planVol" data-k="${k}" aria-pressed="${k === volRange}">${l}</button>`).join('')}
      </div>
      <div class="vol" role="list">${html}</div>
      <div class="vol-legend"><i></i><span>Zielbereich für ${esc(lv.label)}: ${lv.sets[0]}–${lv.sets[1]} Sätze pro Woche für große Muskeln</span></div>
      <p class="muted small">Mitarbeitende Muskeln zählen halb, zum Beispiel der Trizeps und die vordere Schulter beim Bankdrücken oder die hintere Schulter beim Rudern. Kleinere Muskeln haben deshalb ein niedrigeres Ziel: Bizeps, Trizeps, seitliche Schulter und Beinbeuger drei Viertel, hintere Schulter die Hälfte. Die vordere Schulter bekommt durch das Drücken genug und hat kein eigenes Ziel. Aufwärmsätze unter 60 % des Höchstgewichts zählen nicht. Die Ziele sind Richtwerte: Mehr Sätze bringen mehr, aber mit abnehmendem Zusatznutzen.</p>
    </section>`;
  };
  Gym.act.planVol = (el) => { volRange = el.dataset.k; Gym.render(); };

  /* ---------- Plan-Seite ---------- */
  Gym.route('/plan', 'more', () => {
    const p = Gym.S.plan;
    if (!p) return { html: Gym.page({ title: 'Trainingsplan', back: '#/more', body: generator() }) };
    pd = null;
    const next = Gym.planNext(), tg = Gym.planTargets(p);
    const slotInfo = (s, i) => [
      Gym.LOAD[s.load] ? Gym.LOAD[s.load].day : '',
      Gym.planMuscles(s.type).filter((m) => tg[m]).map((m) => `${m} ${tg[m].session}`).join(' · ') + ' Sätze',
      i === next.idx ? 'als Nächstes dran' : '',
    ].filter(Boolean).join(' · ');
    const body = `
      ${Gym.planCard()}
      <div class="sec-head"><h2>Reihenfolge</h2><button class="btn text sm" data-act="planSkip">Nächstes überspringen</button></div>
      <div class="card list">
        ${p.slots.map((s, i) => `<button class="list-item" data-act="planSlotEdit" data-i="${i}" aria-label="Training ${i + 1}: ${esc(typeLabel(s.type))}. Antippen zum Ändern">
          <span class="slot-n ${i === next.idx ? 'on' : ''}">${i + 1}</span>
          <span class="li-main"><strong>${esc(typeLabel(s.type))}</strong><small class="wrap">${esc(slotInfo(s, i))}</small></span>${icon.edit}
        </button>`).join('')}
        <button class="list-item" data-act="planSlotAdd">${icon.plus}<span class="li-main">Training hinzufügen</span></button>
      </div>
      ${volCard(p)}
      <div class="sec-head"><h2>Einstellungen</h2></div>
      <div class="card form grid2">
        <label>Trainingstage pro Woche<select data-change="planSet" data-k="days">${[1, 2, 3, 4, 5, 6, 7].map((n) => `<option value="${n}" ${n === p.days ? 'selected' : ''}>${n}×</option>`).join('')}</select></label>
        <label>Erfahrung<select data-change="planSet" data-k="level">${Gym.PLAN_LEVELS.map((l) => `<option value="${l.id}" ${l.id === Gym.planLevel(p).id ? 'selected' : ''}>${esc(l.label)}</option>`).join('')}</select></label>
        <div class="span2">
          <label class="switch-row"><span class="li-main"><strong>Schwere und leichte Tage</strong><small class="wrap">Grundübungen abwechselnd mit 5–8 und 10–15 Wiederholungen, wenn eine Trainingsart mehrmals vorkommt</small></span>
            <input type="checkbox" class="switch" data-change="planWave" ${p.wave ? 'checked' : ''}></label>
        </div>
      </div>
      <div class="row-btns wrap">
        <a class="btn ghost" href="#/plan/new">Neu erstellen</a>
        <button class="btn ghost danger" data-act="planEnd">Plan beenden</button>
      </div>`;
    return { html: Gym.page({ title: 'Trainingsplan', back: '#/more', body }) };
  });

  Gym.act.planSet = (el) => {
    const p = Gym.S.plan;
    if (el.dataset.k === 'days') p.days = Math.min(7, Math.max(1, +el.value || p.days));
    else p.level = el.value;
    Gym.save(); Gym.render();
  };
  Gym.act.planWave = (el) => {
    const p = Gym.S.plan;
    p.wave = el.checked;
    p.slots = Gym.planSlots(p.slots.map((s) => s.type), p.wave);
    Gym.save(); Gym.render();
  };
  Gym.act.planEnd = async () => {
    const ok = await Gym.confirm('Plan beenden?', 'Die App verhält sich danach wieder wie ohne Plan. Deine Trainings bleiben erhalten.', 'Beenden', true);
    if (!ok) return;
    Gym.S.plan = null;
    Gym.save(); Gym.toast('Plan beendet'); Gym.go('#/more');
  };

  const typeRows = (act, now) => Gym.TYPES.map((t) => `<button class="list-item" data-act="${act}" data-id="${t.id}"><span class="li-main">${esc(t.label)}<small>${esc(t.muscles ? t.muscles.join(', ') : 'Alle Muskelgruppen')}</small></span>${now === t.id ? icon.check : ''}</button>`).join('');
  Gym.act.planSlotEdit = (el) => {
    const p = Gym.S.plan, i = +el.dataset.i, s = p.slots[i], next = Gym.planNext();
    const done = () => { Gym.save(); Gym.closeModal(); Gym.render(); };
    Gym.act.slotType = (b) => { s.type = b.dataset.id; done(); };
    Gym.act.slotLoad = (b) => { s.load = b.dataset.v || null; done(); };
    Gym.act.slotNext = () => { p.pos = i; done(); };
    Gym.act.slotDel = () => { p.slots.splice(i, 1); p.pos = (next.idx > i ? next.idx - 1 : next.idx) % p.slots.length; done(); };
    const loads = [['', 'Normal'], ['heavy', 'Schwer (5–8)'], ['light', 'Leicht (10–15)']];
    Gym.modal({
      title: `Training ${i + 1}`,
      body: `
        <div class="menu">${typeRows('slotType', s.type)}</div>
        ${p.wave ? `<div class="chips" role="group" aria-label="Schwer oder leicht">${loads.map(([v, l]) => `<button class="chip ${(s.load || '') === v ? 'on' : ''}" data-act="slotLoad" data-v="${v}" aria-pressed="${(s.load || '') === v}">${l}</button>`).join('')}</div>` : ''}
        <div class="menu">
          ${i !== next.idx ? `<button class="list-item" data-act="slotNext">${icon.play}<span class="li-main">Als Nächstes machen</span></button>` : ''}
          ${p.slots.length > 1 ? `<button class="list-item danger" data-act="slotDel">${icon.trash}<span class="li-main">Aus dem Plan entfernen</span></button>` : ''}
        </div>`,
    });
  };
  Gym.act.planSlotAdd = () => {
    const p = Gym.S.plan;
    Gym.act.slotNew = (b) => { p.slots.push({ type: b.dataset.id, load: null }); Gym.save(); Gym.closeModal(); Gym.render(); };
    Gym.modal({ title: 'Training hinzufügen', body: `<div class="menu">${typeRows('slotNew', '')}</div>` });
  };
})();
