/* Ansichten: Fortschritt, Übungen, Übungsdetail */
(function () {
  'use strict';
  const Gym = window.Gym;
  const { esc, icon, fmt } = Gym;
  const C = Gym.charts;

  const RANGES = [['4W', '4 Wochen', 28], ['3M', '3 Monate', 91], ['6M', '6 Monate', 182], ['1J', '1 Jahr', 365], ['ALL', 'Alles', null]];
  Gym.ui.range = '3M';
  Gym.ui.progEx = null;

  const rangeFrom = () => {
    const r = RANGES.find((x) => x[0] === Gym.ui.range);
    if (r[2]) return Gym.dayStart(Gym.addDays(Date.now(), -r[2]));
    const first = Gym.sorted()[0];
    const firstBody = Gym.S.body.map((b) => Gym.keyToTs(b.date)).sort((a, b) => a - b)[0];
    const t = Math.min(first ? first.start : Infinity, firstBody || Infinity);
    return isFinite(t) ? Gym.dayStart(t) : Gym.dayStart(Gym.addDays(Date.now(), -28));
  };

  /* ---------- Gym-Filter (Fortschritt und Übungsdetail) ---------- */
  // Schlüssel: 'all' = alle Gyms, 'none' = ohne Angabe, sonst die Gym-ID
  Gym.ui.gymFilter = 'all';
  const gymVal = (k) => (k === 'none' ? null : k === 'all' ? undefined : k);
  // Nur Gyms anbieten, die in der Liste (Trainings oder Verlaufseinträge) vorkommen
  const gymOpts = (list) => {
    const opts = [['all', 'Alle Gyms']];
    for (const g of Gym.S.gyms) if (list.some((x) => x.gymId === g.id)) opts.push([g.id, g.name]);
    if (list.some((x) => !Gym.gym(x.gymId))) opts.push(['none', 'Ohne Angabe']);
    return opts;
  };
  const gymChips = (cur, act, opts, extra) => `
    <div class="chips scroll" role="group" aria-label="Gym">
      ${opts.map(([k, label]) => `<button class="chip ${cur === k ? 'on' : ''}" data-act="${act}" data-g="${esc(k)}" ${extra || ''} aria-pressed="${cur === k}">${k === 'all' || k === 'none' ? '' : icon.pin}${esc(label)}</button>`).join('')}
    </div>`;

  // Übungen nach Häufigkeit (für die Auswahl im Fortschritt)
  const exByUse = (list) => {
    const n = {};
    for (const w of list) for (const en of w.entries) n[en.exId] = (n[en.exId] || 0) + 1;
    return Object.keys(n).sort((a, b) => n[b] - n[a]).map((id) => ({ ex: Gym.ex(id), n: n[id] }));
  };

  /* ---------- Fortschritt ---------- */
  Gym.route('/progress', 'progress', () => {
    const S = Gym.S;
    if (!S.workouts.length && !S.body.length) {
      return { html: Gym.page({ title: 'Fortschritt', body: Gym.emptyState(icon.chart, 'Noch keine Daten', 'Nach deinem ersten Training siehst du hier deine Entwicklung.', `<div class="row-btns center"><a class="btn primary" href="#/workout">Training starten</a><button class="btn ghost" data-act="demoLoad">Beispieldaten laden</button></div>`) }) };
    }
    const from = rangeFrom();
    const gOpts = gymOpts(S.workouts);
    if (!gOpts.some((o) => o[0] === Gym.ui.gymFilter)) Gym.ui.gymFilter = 'all';
    const gf = gymVal(Gym.ui.gymFilter);
    const pool = S.workouts.filter((w) => Gym.inGym(w, gf)); // alle Trainings des gewählten Gyms
    const ws = pool.filter((w) => w.start >= from);
    const buckets = Gym.buckets(from, pool);
    const unit = buckets.unit;
    const vol = ws.reduce((a, w) => a + Gym.wVolume(w), 0);
    const avgDur = ws.length ? ws.reduce((a, w) => a + Gym.wDur(w), 0) / ws.length : 0;
    const prCount = ws.reduce((a, w) => a + (w.prs ? w.prs.length : 0), 0);
    const used = exByUse(pool);
    if (!Gym.ui.progEx || !used.some((u) => u.ex.id === Gym.ui.progEx)) Gym.ui.progEx = used.length ? used[0].ex.id : null;
    const pex = Gym.ui.progEx ? Gym.ex(Gym.ui.progEx) : null;
    const pdef = pex ? Gym.metricDefs(pex.kind)[0] : null;

    // Rekorde im Zeitraum
    const prs = [];
    for (const w of ws) for (const p of w.prs || []) prs.push({ ts: w.start, wid: w.id, ...p });
    prs.sort((a, b) => b.ts - a.ts);

    const body = `
      <div class="chips scroll" role="group" aria-label="Zeitraum">
        ${RANGES.map(([k, label]) => `<button class="chip ${Gym.ui.range === k ? 'on' : ''}" data-act="setRange" data-r="${k}" aria-pressed="${Gym.ui.range === k}">${label}</button>`).join('')}
      </div>
      ${S.gyms.length && gOpts.length > 1 ? gymChips(Gym.ui.gymFilter, 'setGymFilter', gOpts) : ''}
      <div class="tiles">
        ${Gym.tile('Trainings', String(ws.length))}
        ${Gym.tile('Volumen', esc(fmt.kg(vol)))}
        ${Gym.tile('Ø Dauer', ws.length ? esc(fmt.dur(avgDur)) : '–')}
        ${Gym.tile('Neue Rekorde', String(prCount))}
      </div>
      <div class="cards">
        ${C.card('freq', `Trainings pro ${unit}`, `Anzahl abgeschlossener Trainings`)}
        ${C.card('vol', `Volumen pro ${unit}`, 'Bewegtes Gewicht (Gewicht × Wiederholungen)')}
        ${C.card('muscle', 'Sätze pro Muskelgruppe', 'Verteilung im gewählten Zeitraum')}
        ${C.card('weight', 'Körpergewicht', 'Einträge aus den Körperwerten')}
      </div>
      ${pex ? `
        <div class="sec-head"><h2>Kraftentwicklung</h2></div>
        <div class="select-row">
          <label class="sr" for="prog-ex">Übung</label>
          <select id="prog-ex" data-change="setProgEx">${used.map((u) => `<option value="${esc(u.ex.id)}" ${u.ex.id === pex.id ? 'selected' : ''}>${esc(u.ex.name)} (${u.n}×)</option>`).join('')}</select>
          <a class="btn ghost sm" href="#/exercise/${esc(pex.id)}">Details ${icon.right}</a>
        </div>
        ${C.card('ex', `${pex.name}: ${pdef.label}`, 'Bester Wert je Training')}` : ''}
      ${prs.length ? `
        <section class="card">
          <h3>Rekorde im Zeitraum</h3>
          <ul class="pr-list">${prs.slice(0, 8).map((p) => { const ex = Gym.ex(p.exId); return `<li>${icon.trophy}<a class="li-main" href="#/history/${esc(p.wid)}"><strong>${esc(ex.name)}</strong><small>${esc(Gym.PR_LABEL[p.key])} · ${esc(fmt.date(p.ts))}</small></a><b>${esc(Gym.fmtMetric(ex, p.key, p.v))}</b></li>`; }).join('')}</ul>
          ${prs.length > 8 ? `<p class="muted small">und ${prs.length - 8} weitere</p>` : ''}
        </section>` : ''}`;

    return {
      html: Gym.page({ title: 'Fortschritt', body }),
      after: (root) => {
        // Muskelgruppen
        const perMuscle = {};
        for (const w of ws) for (const en of w.entries) { const m = Gym.ex(en.exId).muscle; perMuscle[m] = (perMuscle[m] || 0) + en.sets.length; }
        const mRows = Object.entries(perMuscle).sort((a, b) => b[1] - a[1]).map(([label, v]) => ({ label, v, text: `${v}` }));
        // Körpergewicht
        const bw = S.body.filter((b) => b.weight != null).map((b) => ({ t: Gym.keyToTs(b.date), v: b.weight })).filter((p) => p.t >= from).sort((a, b) => a.t - b.t);
        // Übung
        const hist = pex ? Gym.exerciseHistory(pex.id, gf).filter((h) => h.ts >= from && h.m[pdef.key] > 0) : [];

        C.fill(root, {
          freq: {
            draw: (el) => C.barChart(el, { bars: buckets.map((b) => ({ label: b.label, v: b.count, tip: b.tip })), fmtV: (v) => `${v} ${v === 1 ? 'Training' : 'Trainings'}`, fmtLabel: (v) => String(v), fmtTick: (v) => fmt.num(v, 0), ticks: Math.min(4, Math.max(1, Math.max(...buckets.map((b) => b.count)))), label: `Trainings pro ${unit}`, empty: 'Keine Trainings in diesem Zeitraum' }),
            table: { head: [unit, 'Trainings'], rows: buckets.map((b) => [b.tip, String(b.count)]) },
          },
          vol: {
            draw: (el) => C.lineChart(el, { points: ws.length ? buckets.map((b) => ({ t: b.start, v: b.volume, tip: b.tip })) : [], zero: true, fmtV: (v) => fmt.kg(v), fmtTick: (v) => (v >= 1000 ? fmt.num(v / 1000, 1) + ' t' : fmt.num(v, 0)), fmtT: (p) => p.tip, label: `Volumen pro ${unit}`, empty: 'Keine Trainings in diesem Zeitraum' }),
            table: { head: [unit, 'Volumen'], rows: buckets.map((b) => [b.tip, fmt.kg(b.volume)]) },
          },
          muscle: {
            draw: (el) => C.hbars(el, mRows, 'Keine Trainings in diesem Zeitraum'),
            table: { head: ['Muskelgruppe', 'Sätze'], rows: mRows.map((r) => [r.label, r.text]) },
          },
          weight: {
            draw: (el) => {
              C.lineChart(el, { points: bw, fmtV: (v) => fmt.num(v, 1) + ' kg', fmtTick: (v) => fmt.num(v, 1), label: 'Körpergewicht', empty: 'Noch keine Gewichtseinträge' });
              if (!bw.length) el.insertAdjacentHTML('beforeend', `<p class="center"><a class="btn ghost sm" href="#/body">Gewicht eintragen</a></p>`);
            },
            table: { head: ['Datum', 'Gewicht'], rows: bw.map((p) => [fmt.date(p.t), fmt.num(p.v, 1) + ' kg']) },
          },
          ex: pex ? {
            draw: (el) => C.lineChart(el, { points: hist.map((h) => ({ t: h.ts, v: h.m[pdef.key] })), fmtV: pdef.fmt, fmtTick: (v) => fmt.num(v, 1), label: `${pex.name}: ${pdef.label}`, empty: 'Keine Einträge in diesem Zeitraum' }),
            table: { head: ['Datum', pdef.label], rows: hist.map((h) => [fmt.date(h.ts), pdef.fmt(h.m[pdef.key])]) },
          } : { draw: () => {} },
        });
      },
    };
  });
  Gym.act.setRange = (el) => { Gym.ui.range = el.dataset.r; Gym.render(); };
  Gym.act.setGymFilter = (el) => { Gym.ui.gymFilter = el.dataset.g; Gym.render(); };
  Gym.act.setProgEx = (el) => { Gym.ui.progEx = el.value; Gym.render(); };

  /* ---------- Übungen ---------- */
  const exFilter = { q: '', muscle: '' };
  const exList = () => {
    const count = {};
    for (const w of Gym.S.workouts) for (const id of new Set(w.entries.map((en) => en.exId))) count[id] = (count[id] || 0) + 1;
    const q = exFilter.q.trim().toLowerCase();
    const list = Gym.exercises()
      .filter((e) => (!exFilter.muscle || e.muscle === exFilter.muscle) && (!q || e.name.toLowerCase().includes(q)))
      .sort((a, b) => a.name.localeCompare(b.name, 'de'));
    if (!list.length) return `<p class="muted center pad">Keine Übung gefunden.</p>`;
    return list.map((e) => `
      <a class="list-item" href="#/exercise/${esc(e.id)}">
        <span class="li-main"><strong>${esc(e.name)}${e.custom ? ' <span class="tag">Eigene</span>' : ''}</strong><small>${esc(e.muscle)} · ${esc(e.equip)}</small></span>
        ${count[e.id] ? `<span class="count">${count[e.id]}×</span>` : ''}${icon.right}
      </a>`).join('');
  };
  const exChips = () => ['', ...Gym.MUSCLES].map((m) => `<button class="chip ${exFilter.muscle === m ? 'on' : ''}" data-act="exMuscle" data-m="${esc(m)}">${esc(m || 'Alle')}</button>`).join('');

  Gym.route('/exercises', 'more', () => ({
    html: Gym.page({
      title: 'Übungen', back: '#/more',
      actions: `<button class="btn ghost sm" data-act="exNew">${icon.plus} Eigene</button>`,
      body: `
        <div class="search">${icon.search}<input type="search" placeholder="Übung suchen" value="${esc(exFilter.q)}" data-input="exSearch" aria-label="Übung suchen"></div>
        <div class="chips scroll" id="ex-chips">${exChips()}</div>
        <div class="card list" id="ex-list">${exList()}</div>`,
    }),
  }));
  Gym.act.exSearch = (el) => { exFilter.q = el.value; document.getElementById('ex-list').innerHTML = exList(); };
  Gym.act.exMuscle = (el) => { exFilter.muscle = el.dataset.m; document.getElementById('ex-chips').innerHTML = exChips(); document.getElementById('ex-list').innerHTML = exList(); };
  Gym.act.exNew = () => Gym.exerciseForm(null, (ex) => Gym.go('#/exercise/' + ex.id));

  /* ---------- Übungsdetail ---------- */
  const exMetric = {};
  const exGym = {}; // gewählter Gym-Filter je Übung
  Gym.route('/exercise/([^/]+)', 'more', (id) => {
    const ex = Gym.ex(id);
    const defs = Gym.metricDefs(ex.kind);
    const key = exMetric[id] && defs.some((d) => d.key === exMetric[id]) ? exMetric[id] : defs[0].key;
    const def = defs.find((d) => d.key === key);
    const histAll = Gym.exerciseHistory(id);
    const hasGyms = Gym.S.gyms.length > 0;
    const bound = Gym.isGymBound(ex);
    const gOpts = gymOpts(histAll);
    // Vorgabe: gymgebundene Übungen zeigen das aktuelle Gym, alle anderen alle Gyms
    let gKey = exGym[id];
    if (!gKey || !gOpts.some((o) => o[0] === gKey)) {
      const curGym = Gym.currentGymId();
      gKey = hasGyms && bound && gOpts.some((o) => o[0] === curGym) ? curGym : 'all';
    }
    const gf = gymVal(gKey);
    const hist = Gym.exerciseHistory(id, gf);
    const rec = Gym.records(id, gf);
    const showGyms = hasGyms && gOpts.length > 1;
    const custom = Gym.S.customExercises.find((e) => e.id === id);

    const body = `
      <p class="muted">${esc(ex.muscle)} · ${esc(ex.equip)} · ${esc(Gym.KINDS[ex.kind])}</p>
      ${showGyms ? gymChips(gKey, 'exGymFilter', gOpts, `data-id="${esc(id)}"`) : ''}
      ${hist.length ? `
        <div class="tiles">
          ${defs.map((d) => Gym.tile('Bestwert: ' + d.label, rec[d.key] ? esc(d.fmt(rec[d.key].v)) : '–', rec[d.key] ? `<span class="delta">${esc(fmt.date(rec[d.key].ts))}</span>` : '')).join('')}
          ${Gym.tile('Trainings', String(hist.length), `<span class="delta">zuletzt ${esc(fmt.rel(hist[hist.length - 1].ts))}</span>`)}
        </div>
        <div class="chips scroll" role="group" aria-label="Kennzahl">
          ${defs.map((d) => `<button class="chip ${d.key === key ? 'on' : ''}" data-act="exMetric" data-id="${esc(id)}" data-k="${d.key}" aria-pressed="${d.key === key}">${esc(d.label)}</button>`).join('')}
        </div>
        ${C.card('exhist', def.label, gf === undefined ? 'Verlauf über alle Trainings' : gf ? 'Verlauf in ' + Gym.gymName(gf) : 'Verlauf der Trainings ohne Gym')}
        <div class="sec-head"><h2>Verlauf</h2></div>
        ${hist.slice().reverse().slice(0, 25).map((h) => `
          <a class="card hrow" href="#/history/${esc(h.wid)}">
            <div class="wcard-top"><strong>${esc(fmt.date(h.ts))}</strong><span class="muted">${esc(h.name)}${Gym.gymName(h.gymId) ? ' · ' + esc(Gym.gymName(h.gymId)) : ''}</span></div>
            <div class="hsets">${h.sets.map((s) => `<span>${esc(Gym.fmtSetShort(ex, s))}</span>`).join('')}</div>
          </a>`).join('')}` :
        Gym.emptyState(icon.chart, 'Noch kein Verlauf', 'Sobald du diese Übung trainiert hast, siehst du hier Bestwerte und ein Diagramm.')}
      ${hasGyms ? `
        <div class="card">
          <label class="switch-row"><span class="li-main"><strong>Nur im selben Gym vergleichen</strong><small class="wrap">Vorschläge („Zuletzt“) und Rekorde zählen dann je Gym getrennt. Sinnvoll für Geräte und Kabelzüge, die sich je Studio unterscheiden.</small></span>
          <input type="checkbox" class="switch" data-change="exBound" data-id="${esc(id)}" ${bound ? 'checked' : ''}></label>
        </div>` : ''}
      ${custom ? `<div class="row-btns wrap"><button class="btn ghost" data-act="exEdit" data-id="${esc(id)}">${icon.edit} Bearbeiten</button><button class="btn ghost danger" data-act="exArchive" data-id="${esc(id)}">${icon.trash} Löschen</button></div>` : ''}`;

    return {
      html: Gym.page({ title: ex.name, back: '#/exercises', smartBack: true, body }),
      after: (root) => {
        if (!hist.length) return;
        const pts = hist.filter((h) => h.m[key] > 0);
        C.fill(root, {
          exhist: {
            draw: (el) => C.lineChart(el, { points: pts.map((h) => ({ t: h.ts, v: h.m[key] })), fmtV: def.fmt, fmtTick: (v) => (key === 'vol' && v >= 1000 ? fmt.num(v / 1000, 1) + ' t' : fmt.num(v, 1)), label: `${ex.name}: ${def.label}`, height: 220 }),
            table: { head: ['Datum', def.label], rows: pts.slice().reverse().map((h) => [fmt.date(h.ts), def.fmt(h.m[key])]) },
          },
        });
      },
    };
  });
  Gym.act.exMetric = (el) => { exMetric[el.dataset.id] = el.dataset.k; Gym.render(); };
  Gym.act.exGymFilter = (el) => { exGym[el.dataset.id] = el.dataset.g; Gym.render(); };
  Gym.act.exBound = (el) => {
    Gym.S.exBound[el.dataset.id] = el.checked;
    delete exGym[el.dataset.id];
    Gym.recomputePRs(); Gym.save(); Gym.render();
  };
  Gym.act.exEdit = (el) => Gym.exerciseForm(Gym.S.customExercises.find((e) => e.id === el.dataset.id), () => Gym.render());
  Gym.act.exArchive = async (el) => {
    const ok = await Gym.confirm('Übung löschen?', 'Die Übung verschwindet aus der Auswahl. Bereits gespeicherte Trainings bleiben erhalten.', 'Löschen', true);
    if (!ok) return;
    const ex = Gym.S.customExercises.find((e) => e.id === el.dataset.id);
    if (ex) ex.archived = true;
    for (const r of Gym.S.routines) r.items = r.items.filter((it) => it.exId !== el.dataset.id);
    Gym.save(); Gym.go('#/exercises');
  };
})();
