/* Ansichten: Mehr, Routinen, Körperwerte, Tools, Einstellungen */
(function () {
  'use strict';
  const Gym = window.Gym;
  const { esc, icon, fmt } = Gym;
  const C = Gym.charts;

  /* ---------- Mehr ---------- */
  const link = (href, ic, title, sub) => `<a class="list-item" href="${href}"><span class="li-icon">${ic}</span><span class="li-main"><strong>${esc(title)}</strong><small>${esc(sub)}</small></span>${icon.right}</a>`;
  Gym.route('/more', 'more', () => ({
    html: Gym.page({
      title: 'Mehr',
      body: `
        <div class="card list">
          ${link('#/routines', icon.list, 'Routinen', 'Feste Übungslisten anlegen und starten')}
          ${link('#/plan', icon.calendar, 'Trainingsplan', Gym.S.plan ? 'Aktiv: ' + Gym.S.plan.slots.map((s) => (Gym.type(s.type) || {}).label).join(' · ') : 'Freiwillig: Reihenfolge und Sätze pro Woche')}
          ${link('#/coach', icon.coach, 'KI-Coach', Gym.ai.enabled() ? 'Wochenrückblick und Fragen an deinen Coach' : 'Freiwillig: Auswertung mit eigenem API-Schlüssel')}
          ${link('#/exercises', icon.dumbbell, 'Übungen', 'Bibliothek, Bestwerte und Verlauf je Übung')}
          ${link('#/gyms', icon.pin, 'Gyms', 'Studios anlegen und Trainings zuordnen')}
          ${link('#/body', icon.scale, 'Körperwerte', 'Gewicht, Körperfett und Maße verfolgen')}
        </div>
        <div class="sec-head"><h2>Tools</h2></div>
        <div class="card list">
          ${link('#/tools/1rm', icon.calc, '1RM-Rechner', 'Maximalkraft und Trainingsgewichte schätzen')}
          ${link('#/tools/plates', icon.plates, 'Scheibenrechner', 'Welche Scheiben kommen auf die Stange?')}
          ${link('#/tools/timer', icon.timer, 'Timer und Stoppuhr', 'Pausen und Haltezeiten stoppen')}
          ${link('#/tools/kcal', icon.flame, 'Kalorienrechner', 'Grundumsatz, Bedarf und BMI')}
        </div>
        <div class="sec-head"><h2>App</h2></div>
        <div class="card list">
          ${link('#/settings', icon.gear, 'Einstellungen', 'Ziele, Pausenzeit, Darstellung, Datensicherung')}
          ${link('#/privacy', icon.shield, 'Datenschutz', 'Deine Daten bleiben auf diesem Gerät')}
        </div>`,
    }),
  }));

  /* ---------- Datenschutz ---------- */
  Gym.route('/privacy', 'more', () => ({
    html: Gym.page({
      title: 'Datenschutz', back: '#/more', smartBack: true,
      body: `
        <section class="card prose">
          <h3>Deine Daten bleiben bei dir</h3>
          <p>Trainings, Körperwerte, Routinen und Einstellungen speichert die App <strong>nur auf diesem Gerät</strong>, im Speicher deines Browsers. Solange du den KI-Coach nicht nutzt, werden sie an keinen Server übertragen, auch nicht an den Entwickler der App. Zum KI-Coach siehe unten.</p>
          <p>Die App setzt <strong>keine Cookies</strong>, nutzt <strong>kein Tracking</strong> und keine Werbung und lädt keine Inhalte von Drittanbietern.</p>
        </section>
        <section class="card prose">
          <h3>Hosting</h3>
          <p>Die App liegt bei <strong>GitHub Pages</strong> (GitHub, Inc.). Wenn du sie aufrufst, übermittelt dein Browser wie bei jeder Webseite technische Angaben wie die IP-Adresse an GitHub. Wie GitHub damit umgeht, steht in der <a href="https://docs.github.com/de/site-policy/privacy-policies/github-general-privacy-statement" target="_blank" rel="noopener noreferrer">Datenschutzerklärung von GitHub</a>.</p>
          <p>Ist die App auf deinem Gerät installiert, startet sie aus dem Offline-Speicher. Beim Start fragt sie trotzdem bei GitHub nach einer neuen Version, sofern Internet da ist.</p>
        </section>
        <section class="card prose">
          <h3>Sichern und löschen</h3>
          <p>Weil nichts auf einem Server liegt, gibt es auch keine Kopie deiner Daten. Unter <a href="#/settings">Einstellungen</a> kannst du eine Sicherung als Datei herunterladen oder alle Daten löschen. Deinstallierst du die App oder löschst du die Browserdaten dieser Seite, sind die Daten ebenfalls weg.</p>
        </section>
        <section class="card prose">
          <h3>KI-Coach (freiwillig)</h3>
          <ul>
            <li>Der KI-Coach ist ausgeschaltet, bis du in den <a href="#/settings">Einstellungen</a> einen eigenen API-Schlüssel von Anthropic einträgst.</li>
            <li>Daten werden nur gesendet, wenn du selbst eine KI-Funktion auslöst: Wochenrückblick, Frage an den Coach, Training für heute, Nachtragen per Text oder eigene Übung mit KI ausfüllen. Nie automatisch im Hintergrund.</li>
            <li>Empfänger ist Anthropic, der Anbieter des KI-Modells Claude, unter der Adresse <code>api.anthropic.com</code>. Die Anfrage geht direkt von deinem Gerät dorthin. Es gibt keinen Server der Gym App dazwischen.</li>
            <li>Beim Wochenrückblick, bei Fragen an den Coach und bei „Training für heute“ geht eine Zusammenfassung deiner Daten der letzten Wochen an Anthropic. Dazu gehören Trainings mit Übungen, Gewichten, Wiederholungen und Notizen, die Namen deiner Gyms, Trainingsplan und Einstellungen sowie Körperwerte wie Gewicht, Körperfett und Umfänge. Dazu kommt der Text, den du eingibst. Bei „Nachtragen per Text“ und „Mit KI ausfüllen“ gehen nur dein Text, die Liste der Übungen und die Namen deiner Gyms an Anthropic.</li>
            <li>Der API-Schlüssel liegt nur im Speicher dieses Browsers auf diesem Gerät. Er ist nicht Teil der Sicherung und wird nur an Anthropic gesendet.</li>
            <li>Gespeicherte Wochenrückblicke liegen wie alle anderen Daten nur auf dem Gerät.</li>
            <li>Für die Verarbeitung bei Anthropic gelten dessen Bedingungen. Details stehen in der <a href="https://www.anthropic.com/legal/privacy" target="_blank" rel="noopener noreferrer">Datenschutzerklärung von Anthropic</a>.</li>
            <li>Abschalten: Entferne den Schlüssel unter <a href="#/settings">Einstellungen</a>. Danach wird nichts mehr gesendet.</li>
          </ul>
          <p>KI-Antworten sind Richtwerte. Sie können Fehler enthalten und ersetzen keinen ärztlichen Rat.</p>
        </section>
        <section class="card prose">
          <h3>Gesundheitswerte</h3>
          <p>Der 1RM- und der Kalorienrechner liefern Richtwerte nach gängigen Formeln. Sie ersetzen keine ärztliche oder ernährungsfachliche Beratung.</p>
        </section>`,
    }),
  }));

  /* ---------- Gyms ---------- */
  Gym.route('/gyms', 'more', () => {
    const S = Gym.S;
    const n = (id) => S.workouts.filter((w) => w.gymId === id).length;
    const none = S.workouts.filter((w) => !Gym.gym(w.gymId)).length;
    const cur = Gym.currentGymId();
    return {
      html: Gym.page({
        title: 'Gyms', back: '#/more',
        actions: `<button class="btn ghost sm" data-act="gymAdd">${icon.plus} Neu</button>`,
        body: `
          <p class="muted">Beim Start eines Trainings wählst du, wo du bist. Geräte und Kabelzüge werden dann nur innerhalb desselben Gyms verglichen, freie Gewichte weiterhin überall. Pro Übung kannst du das in ihrer Detailansicht umstellen.</p>
          ${S.gyms.length ? `
            <div class="card list">
              ${S.gyms.map((g) => `
                <div class="list-item static">
                  <span class="li-icon">${icon.pin}</span>
                  <span class="li-main"><strong>${esc(g.name)}${g.id === cur ? ' <span class="tag">Aktuell</span>' : ''}</strong><small>${n(g.id)} ${n(g.id) === 1 ? 'Training' : 'Trainings'}</small></span>
                  <button class="icon-btn sm" data-act="gymRename" data-id="${esc(g.id)}" aria-label="${esc(g.name)} umbenennen">${icon.edit}</button>
                  <button class="icon-btn sm" data-act="gymDelete" data-id="${esc(g.id)}" aria-label="${esc(g.name)} löschen">${icon.trash}</button>
                </div>`).join('')}
            </div>
            ${none ? `
              <div class="card hint">
                <h3>${none} ${none === 1 ? 'Training' : 'Trainings'} ohne Gym</h3>
                <p>Ordne sie einem Gym zu, damit deine bisherigen Werte beim Vergleich mitzählen.</p>
                <button class="btn ghost" data-act="gymAssign">Einem Gym zuordnen</button>
              </div>` : ''}` :
            Gym.emptyState(icon.pin, 'Noch kein Gym angelegt', 'Lege dein Studio an, um Trainings nach Gym zu unterscheiden.', `<button class="btn primary" data-act="gymAdd">Gym hinzufügen</button>`)}`,
      }),
    };
  });
  Gym.act.gymAdd = () => Gym.gymForm(null, (g) => {
    if (!Gym.currentGymId()) Gym.S.settings.lastGymId = g.id;
    Gym.recomputePRs(); Gym.save(); Gym.render();
  });
  Gym.act.gymRename = (el) => Gym.gymForm(Gym.gym(el.dataset.id), () => Gym.render());
  Gym.act.gymDelete = async (el) => {
    const g = Gym.gym(el.dataset.id);
    if (!g) return;
    const used = Gym.S.workouts.filter((w) => w.gymId === g.id).length;
    const text = used
      ? `${used} ${used === 1 ? 'Training bleibt' : 'Trainings bleiben'} erhalten, ${used === 1 ? 'steht' : 'stehen'} danach aber ohne Gym da.`
      : 'Diesem Gym ist noch kein Training zugeordnet.';
    const ok = await Gym.confirm(`Gym „${g.name}“ löschen?`, text, 'Löschen', true);
    if (!ok) return;
    const S = Gym.S;
    S.gyms = S.gyms.filter((x) => x.id !== g.id);
    for (const w of S.workouts) if (w.gymId === g.id) w.gymId = null;
    if (S.active && S.active.gymId === g.id) S.active.gymId = null;
    if (S.settings.lastGymId === g.id) S.settings.lastGymId = null;
    Gym.recomputePRs(); Gym.save(); Gym.toast('Gym gelöscht'); Gym.render();
  };
  Gym.act.gymAssign = () => Gym.chooseGym(null, async (id) => {
    if (!id) return;
    const list = Gym.S.workouts.filter((w) => !Gym.gym(w.gymId));
    const text = `${list.length} ${list.length === 1 ? 'Training wird' : 'Trainings werden'} „${Gym.gymName(id)}“ zugeordnet. Einzelne Trainings kannst du später im Verlauf über „Bearbeiten“ ändern.`;
    const ok = await Gym.confirm('Trainings zuordnen?', text, 'Zuordnen');
    if (!ok) return Gym.render();
    for (const w of list) w.gymId = id;
    Gym.recomputePRs(); Gym.save(); Gym.toast('Trainings zugeordnet'); Gym.render();
  }, { title: 'Welchem Gym zuordnen?', noNone: true });

  /* ---------- Routinen ---------- */
  Gym.route('/routines', 'more', () => ({
    html: Gym.page({
      title: 'Routinen', back: '#/more',
      actions: `<a class="btn ghost sm" href="#/routine/new">${icon.plus} Neu</a>`,
      body: Gym.S.routines.length
        ? Gym.S.routines.map(Gym.routineCard).join('')
        : Gym.emptyState(icon.list, 'Noch keine Routinen', 'Lege einen Trainingsplan an, um Trainings mit einem Tipp zu starten.', `<a class="btn primary" href="#/routine/new">Routine anlegen</a>`),
    }),
  }));

  let rd = null; // Entwurf der Routine im Editor
  Gym.route('/routine/([^/]+)', 'more', (id) => {
    if (!rd || rd.key !== id) {
      const orig = Gym.S.routines.find((r) => r.id === id);
      if (!orig && id !== 'new') { location.replace('#/routines'); return null; }
      rd = orig ? Object.assign(Gym.clone(orig), { key: id }) : { key: 'new', id: Gym.uid(), name: '', items: [], isNew: true };
    }
    const n = rd.items.length;
    const items = rd.items.map((it, i) => {
      const ex = Gym.ex(it.exId);
      return `<section class="card ritem">
        <div class="entry-head">
          <div class="li-main"><strong>${esc(ex.name)}</strong><small>${esc(ex.muscle)}</small></div>
          <button class="icon-btn sm" data-act="rMove" data-i="${i}" data-d="-1" ${i === 0 ? 'disabled' : ''} aria-label="Nach oben">${icon.up}</button>
          <button class="icon-btn sm" data-act="rMove" data-i="${i}" data-d="1" ${i === n - 1 ? 'disabled' : ''} aria-label="Nach unten">${icon.down}</button>
          <button class="icon-btn sm" data-act="rRemove" data-i="${i}" aria-label="Entfernen">${icon.trash}</button>
        </div>
        <div class="ritem-fields">
          <div class="field"><span>Sätze</span>
            <div class="stepper"><button data-act="rSets" data-i="${i}" data-d="-1" aria-label="Weniger Sätze">${icon.minus}</button><b>${it.sets}</b><button data-act="rSets" data-i="${i}" data-d="1" aria-label="Mehr Sätze">${icon.plus}</button></div>
          </div>
          <label class="field"><span>Ziel (z. B. 8–10)</span><input value="${esc(it.reps || '')}" data-input="rReps" data-i="${i}" maxlength="12" autocomplete="off"></label>
        </div>
      </section>`;
    }).join('');
    return {
      html: `
        <header class="top">
          <button class="icon-btn" data-act="rCancel" aria-label="Abbrechen">${icon.x}</button>
          <h1>${rd.isNew ? 'Neue Routine' : 'Routine bearbeiten'}</h1>
          <div class="top-actions"><button class="btn primary" data-act="rSave">Speichern</button></div>
        </header>
        <div class="content">
          <label class="form-solo">Name der Routine<input value="${esc(rd.name)}" data-input="rName" maxlength="50" placeholder="z. B. Oberkörper A" autocomplete="off"></label>
          ${items}
          <button class="btn block ${n ? 'ghost' : 'primary'}" data-act="rAdd">${icon.plus} Übung hinzufügen</button>
          ${rd.isNew ? '' : `<button class="btn block text danger" data-act="rDelete">Routine löschen</button>`}
        </div>`,
    };
  });
  Gym.act.rName = (el) => { rd.name = el.value; };
  Gym.act.rReps = (el) => { rd.items[+el.dataset.i].reps = el.value; };
  Gym.act.rSets = (el) => { const it = rd.items[+el.dataset.i]; it.sets = Math.max(1, Math.min(10, it.sets + +el.dataset.d)); Gym.render(); };
  Gym.act.rMove = (el) => { const i = +el.dataset.i, d = +el.dataset.d; [rd.items[i], rd.items[i + d]] = [rd.items[i + d], rd.items[i]]; Gym.render(); };
  Gym.act.rRemove = (el) => { rd.items.splice(+el.dataset.i, 1); Gym.render(); };
  Gym.act.rAdd = () => Gym.pickExercise((exId) => {
    const kind = Gym.ex(exId).kind;
    rd.items.push({ exId, sets: 3, reps: kind === 'weight' || kind === 'body' ? '8–12' : '' });
    Gym.render();
  });
  Gym.act.rSave = () => {
    const name = rd.name.trim();
    if (!name) return Gym.toast('Bitte einen Namen eingeben');
    if (!rd.items.length) return Gym.toast('Bitte mindestens eine Übung hinzufügen');
    const r = { id: rd.id, name, items: rd.items };
    const i = Gym.S.routines.findIndex((x) => x.id === r.id);
    if (i >= 0) Gym.S.routines[i] = r; else Gym.S.routines.push(r);
    Gym.save(); rd = null; Gym.toast('Routine gespeichert'); Gym.go('#/routines');
  };
  Gym.act.rCancel = () => { rd = null; Gym.go('#/routines'); };
  Gym.act.rDelete = async () => {
    const ok = await Gym.confirm('Routine löschen?', 'Die Routine wird entfernt. Deine gespeicherten Trainings bleiben erhalten.', 'Löschen', true);
    if (!ok) return;
    Gym.S.routines = Gym.S.routines.filter((x) => x.id !== rd.id);
    Gym.save(); rd = null; Gym.go('#/routines');
  };

  /* ---------- Körperwerte ---------- */
  const BODY = [['weight', 'Gewicht', 'kg'], ['fat', 'Körperfett', '%'], ['chest', 'Brust', 'cm'], ['waist', 'Taille', 'cm'], ['hip', 'Hüfte', 'cm'], ['arm', 'Oberarm', 'cm'], ['thigh', 'Oberschenkel', 'cm']];
  let bodyMetric = 'weight';
  const bmiText = (b) => (b < 18.5 ? 'Untergewicht' : b < 25 ? 'Normalgewicht' : b < 30 ? 'Übergewicht' : 'Adipositas');
  Gym.bmi = (kg, cm) => (kg && cm ? kg / Math.pow(cm / 100, 2) : null);

  Gym.route('/body', 'more', () => {
    const S = Gym.S;
    const list = S.body.slice().sort((a, b) => a.date.localeCompare(b.date));
    const have = BODY.filter(([k]) => k === 'weight' || list.some((b) => b[k] != null));
    if (!have.some(([k]) => k === bodyMetric)) bodyMetric = 'weight';
    const [key, label, unit] = BODY.find(([k]) => k === bodyMetric);
    const pts = list.filter((b) => b[key] != null).map((b) => ({ t: Gym.keyToTs(b.date), v: b[key] }));
    const cur = pts.length ? pts[pts.length - 1].v : null;
    const diff = pts.length > 1 ? cur - pts[0].v : null;
    const lastW = list.filter((b) => b.weight != null).pop();
    const bmi = Gym.bmi(lastW && lastW.weight, S.settings.heightCm);
    const input = (k, l, u) => `<label>${esc(l)} (${u})<input class="num" type="text" inputmode="decimal" name="${k}" autocomplete="off"></label>`;

    const body = `
      <form class="card form grid2" data-submit="bodyAdd">
        <label class="span2">Datum<input type="date" name="date" value="${Gym.dayKey(Date.now())}" max="${Gym.dayKey(Date.now())}" required></label>
        ${input('weight', 'Gewicht', 'kg')}${input('fat', 'Körperfett', '%')}
        <details class="span2"><summary>Weitere Maße</summary><div class="grid2 inner">${BODY.slice(2).map(([k, l, u]) => input(k, l, u)).join('')}</div></details>
        <button class="btn primary span2">Eintrag speichern</button>
      </form>
      ${list.length ? `
        <div class="tiles">
          ${Gym.tile(label + ' aktuell', cur != null ? `${esc(fmt.num(cur, 1))} <small>${unit}</small>` : '–')}
          ${Gym.tile('Veränderung', diff != null ? `${diff > 0 ? '+' : diff < 0 ? '−' : '±'}${esc(fmt.num(Math.abs(diff), 1))} <small>${unit}</small>` : '–', pts.length > 1 ? `<span class="delta">seit ${esc(fmt.dayMonY(pts[0].t))}</span>` : '')}
          ${Gym.tile('BMI', bmi ? esc(fmt.num(bmi, 1)) : '–', `<span class="delta">${bmi ? bmiText(bmi) : `<a href="#/settings">Größe eintragen</a>`}</span>`)}
          ${Gym.tile('Einträge', String(list.length))}
        </div>
        <div class="chips scroll" role="group" aria-label="Messwert">
          ${have.map(([k, l]) => `<button class="chip ${k === key ? 'on' : ''}" data-act="bodyMetric" data-k="${k}" aria-pressed="${k === key}">${esc(l)}</button>`).join('')}
        </div>
        ${C.card('body', label, `Verlauf in ${unit}`)}
        <div class="sec-head"><h2>Einträge</h2></div>
        <div class="card list">
          ${list.slice().reverse().map((b) => `
            <div class="list-item static">
              <span class="li-main"><strong>${esc(fmt.date(Gym.keyToTs(b.date)))}</strong>
                <small>${BODY.filter(([k]) => b[k] != null).map(([k, l, u]) => `${esc(l)} ${esc(fmt.num(b[k], 1))} ${u}`).join(' · ')}</small></span>
              <button class="icon-btn sm" data-act="bodyDel" data-id="${esc(b.id)}" aria-label="Eintrag löschen">${icon.trash}</button>
            </div>`).join('')}
        </div>` : Gym.emptyState(icon.scale, 'Noch keine Einträge', 'Trage oben dein Gewicht ein, um den Verlauf als Diagramm zu sehen.')}`;

    return {
      html: Gym.page({ title: 'Körperwerte', back: '#/more', body }),
      after: (root) => {
        if (!list.length) return;
        C.fill(root, {
          body: {
            draw: (el) => C.lineChart(el, { points: pts, fmtV: (v) => `${fmt.num(v, 1)} ${unit}`, fmtTick: (v) => fmt.num(v, 1), label, height: 220 }),
            table: { head: ['Datum', label], rows: pts.slice().reverse().map((p) => [fmt.date(p.t), `${fmt.num(p.v, 1)} ${unit}`]) },
          },
        });
      },
    };
  });
  Gym.act.bodyMetric = (el) => { bodyMetric = el.dataset.k; Gym.render(); };
  Gym.act.bodyAdd = (form) => {
    const date = form.elements.date.value;
    if (!date) return Gym.toast('Bitte ein Datum wählen');
    const vals = {};
    for (const [k] of BODY) { const v = Gym.parseNum(form.elements[k].value); if (v != null && v > 0) vals[k] = v; }
    if (!Object.keys(vals).length) return Gym.toast('Bitte mindestens einen Wert eintragen');
    const old = Gym.S.body.find((b) => b.date === date);
    if (old) Object.assign(old, vals); else Gym.S.body.push(Object.assign({ id: Gym.uid(), date }, vals));
    Gym.save(); Gym.toast('Eintrag gespeichert'); Gym.render();
  };
  Gym.act.bodyDel = async (el) => {
    const ok = await Gym.confirm('Eintrag löschen?', 'Der Messwert wird dauerhaft entfernt.', 'Löschen', true);
    if (!ok) return;
    Gym.S.body = Gym.S.body.filter((b) => b.id !== el.dataset.id);
    Gym.save(); Gym.render();
  };

  /* ---------- Tool: 1RM-Rechner ---------- */
  const orm = { w: 80, r: 5 };
  const ormOut = () => {
    if (!orm.w || !orm.r) return `<p class="muted">Gewicht und Wiederholungen eingeben.</p>`;
    const max = Gym.e1rm(orm.w, orm.r);
    const rows = [[100, 1], [95, 2], [90, 4], [85, 6], [80, 8], [75, 10], [70, 12], [65, 15], [60, 18], [50, 25]];
    return `
      <div class="hero"><span class="tile-label">Geschätztes 1RM</span><span class="hero-value">${esc(fmt.num(max, 1))} <small>kg</small></span></div>
      <table class="tbl"><thead><tr><th>Intensität</th><th>Gewicht</th><th>ca. Wdh.</th></tr></thead>
      <tbody>${rows.map(([p, reps]) => `<tr><td>${p} %</td><td>${esc(fmt.num(Math.round((max * p) / 100 / 0.5) * 0.5, 1))} kg</td><td>${reps}</td></tr>`).join('')}</tbody></table>
      <p class="muted small">Formel nach Epley: Gewicht × (1 + Wdh. / 30). Am genauesten bei 2 bis 10 Wiederholungen.</p>`;
  };
  Gym.route('/tools/1rm', 'more', () => ({
    html: Gym.page({
      title: '1RM-Rechner', back: '#/more',
      body: `
        <div class="card form grid2">
          <label>Gewicht (kg)<input class="num" type="text" inputmode="decimal" value="${esc(fmt.input(orm.w))}" data-input="ormIn" data-k="w"></label>
          <label>Wiederholungen<input class="num" type="text" inputmode="numeric" value="${esc(fmt.input(orm.r))}" data-input="ormIn" data-k="r"></label>
        </div>
        <div class="card" id="orm-out">${ormOut()}</div>`,
    }),
  }));
  Gym.act.ormIn = (el) => { orm[el.dataset.k] = Gym.parseNum(el.value); document.getElementById('orm-out').innerHTML = ormOut(); };

  /* ---------- Tool: Scheibenrechner ---------- */
  const PLATES = [[25, '#d03b3b', 112, 16], [20, '#2a78d6', 112, 14], [15, '#eda100', 98, 12], [10, '#199e70', 82, 11], [5, '#e1e0d9', 64, 9], [2.5, '#52514e', 50, 8], [1.25, '#898781', 40, 7]];
  const pl = { target: 100, bar: null };
  const platesOut = () => {
    const bar = pl.bar != null ? pl.bar : Gym.S.settings.barKg;
    if (!pl.target) return `<p class="muted">Zielgewicht eingeben.</p>`;
    if (pl.target < bar) return `<p class="muted">Das Zielgewicht liegt unter dem Stangengewicht (${esc(fmt.num(bar, 1))} kg).</p>`;
    let rest = (pl.target - bar) / 2;
    const side = [];
    for (const p of PLATES) while (rest >= p[0] - 1e-9) { side.push(p); rest -= p[0]; }
    const loaded = bar + 2 * side.reduce((a, p) => a + p[0], 0);
    // Grafik: Stange in der Mitte, Scheiben spiegelbildlich nach außen
    const cy = 65;
    let svg = `<rect x="4" y="${cy - 4}" width="352" height="8" rx="4" fill="var(--axis)"/><rect x="118" y="${cy - 11}" width="8" height="22" rx="2" fill="var(--muted)"/><rect x="234" y="${cy - 11}" width="8" height="22" rx="2" fill="var(--muted)"/>`;
    let xr = 244, xl = 116;
    for (const [, color, h, w] of side) {
      svg += `<rect x="${xr}" y="${cy - h / 2}" width="${w}" height="${h}" rx="3" fill="${color}"/>`;
      svg += `<rect x="${xl - w}" y="${cy - h / 2}" width="${w}" height="${h}" rx="3" fill="${color}"/>`;
      xr += w + 2; xl -= w + 2;
    }
    const counts = PLATES.map((p) => [p, side.filter((s) => s === p).length]).filter(([, n]) => n);
    return `
      <svg class="plates" viewBox="0 0 360 130" role="img" aria-label="Beladene Langhantel">${svg}</svg>
      ${counts.length ? `<h3>Pro Seite</h3><ul class="plate-list">${counts.map(([p, n]) => `<li><i style="background:${p[1]}"></i><b>${n} ×</b> ${esc(fmt.num(p[0], 2))} kg</li>`).join('')}</ul>` : `<p>Nur die Stange, keine Scheiben nötig.</p>`}
      <p class="muted small">Stange ${esc(fmt.num(bar, 1))} kg + 2 × ${esc(fmt.num((loaded - bar) / 2, 2))} kg = <strong>${esc(fmt.num(loaded, 2))} kg</strong>${Math.abs(loaded - pl.target) > 1e-6 ? `. Das Ziel von ${esc(fmt.num(pl.target, 2))} kg lässt sich mit den üblichen Scheiben nicht exakt laden.` : ''}</p>`;
  };
  Gym.route('/tools/plates', 'more', () => {
    const bar = pl.bar != null ? pl.bar : Gym.S.settings.barKg;
    return {
      html: Gym.page({
        title: 'Scheibenrechner', back: '#/more',
        body: `
          <div class="card form grid2">
            <label>Zielgewicht (kg)<input class="num" type="text" inputmode="decimal" value="${esc(fmt.input(pl.target))}" data-input="plIn" data-k="target"></label>
            <label>Stange (kg)<select data-change="plIn" data-k="bar">${[20, 15, 10, 7.5, 5].map((b) => `<option value="${b}" ${b === bar ? 'selected' : ''}>${esc(fmt.num(b, 1))} kg</option>`).join('')}</select></label>
          </div>
          <div class="card" id="pl-out">${platesOut()}</div>`,
      }),
    };
  });
  Gym.act.plIn = (el) => { pl[el.dataset.k] = Gym.parseNum(el.value); document.getElementById('pl-out').innerHTML = platesOut(); };

  /* ---------- Tool: Timer und Stoppuhr ---------- */
  const tm = { mode: 'down', total: 90, left: 90, end: 0, running: false, acc: 0, started: 0 };
  const tmValue = (now) => (tm.mode === 'down' ? (tm.running ? Math.max(0, (tm.end - now) / 1000) : tm.left) : (tm.acc + (tm.running ? now - tm.started : 0)) / 1000);
  Gym.toolTick = (now) => {
    if (tm.mode === 'down' && tm.running && now >= tm.end) { tm.running = false; tm.left = 0; Gym.beep(); if (document.getElementById('tm-time')) Gym.render(); }
    const el = document.getElementById('tm-time');
    if (!el) return;
    const v = tmValue(now);
    el.textContent = fmt.clock(tm.mode === 'down' ? Math.ceil(v) : v);
    const ring = document.getElementById('tm-ring');
    const frac = tm.mode === 'down' ? (tm.total ? v / tm.total : 0) : (v % 60) / 60;
    ring.style.strokeDashoffset = String(565.5 * (1 - Math.max(0, Math.min(1, frac))));
  };
  Gym.route('/tools/timer', 'more', () => ({
    html: Gym.page({
      title: 'Timer und Stoppuhr', back: '#/more',
      body: `
        <div class="chips center" role="group" aria-label="Modus">
          <button class="chip ${tm.mode === 'down' ? 'on' : ''}" data-act="tmMode" data-m="down">Countdown</button>
          <button class="chip ${tm.mode === 'up' ? 'on' : ''}" data-act="tmMode" data-m="up">Stoppuhr</button>
        </div>
        <div class="card timer">
          <div class="ring">
            <svg viewBox="0 0 200 200" aria-hidden="true"><circle class="ring-track" cx="100" cy="100" r="90"/><circle id="tm-ring" class="ring-fill" cx="100" cy="100" r="90" stroke-dasharray="565.5" transform="rotate(-90 100 100)"/></svg>
            <span id="tm-time" class="ring-time" role="timer"></span>
          </div>
          ${tm.mode === 'down' ? `<div class="chips center">${[30, 60, 90, 120, 180, 300].map((s) => `<button class="chip ${tm.total === s ? 'on' : ''}" data-act="tmSet" data-s="${s}">${fmt.clock(s)}</button>`).join('')}</div>` : ''}
          <div class="row-btns center">
            <button class="btn ghost" data-act="tmReset">Zurücksetzen</button>
            <button class="btn primary big" data-act="tmToggle">${tm.running ? 'Pause' : tm.mode === 'down' && tm.left === 0 ? 'Neu starten' : 'Start'}</button>
          </div>
        </div>`,
    }),
  }));
  Gym.act.tmMode = (el) => { tm.mode = el.dataset.m; tm.running = false; tm.left = tm.total; tm.acc = 0; Gym.render(); };
  Gym.act.tmSet = (el) => { tm.total = +el.dataset.s; tm.left = tm.total; tm.running = false; Gym.render(); };
  Gym.act.tmReset = () => { tm.running = false; tm.left = tm.total; tm.acc = 0; Gym.render(); };
  Gym.act.tmToggle = () => {
    const now = Date.now();
    Gym.unlockAudio();
    if (tm.mode === 'down') {
      if (tm.running) { tm.left = Math.max(0, (tm.end - now) / 1000); tm.running = false; }
      else { if (tm.left <= 0) tm.left = tm.total; tm.end = now + tm.left * 1000; tm.running = true; }
    } else if (tm.running) { tm.acc += now - tm.started; tm.running = false; }
    else { tm.started = now; tm.running = true; }
    Gym.render();
  };

  /* ---------- Tool: Kalorienrechner ---------- */
  const ACT = [[1.2, 'Kaum Bewegung (Bürojob, kein Sport)'], [1.375, 'Leicht aktiv (1–2× Sport pro Woche)'], [1.55, 'Aktiv (3–5× Sport pro Woche)'], [1.725, 'Sehr aktiv (6–7× Sport pro Woche)'], [1.9, 'Extrem aktiv (körperliche Arbeit + Sport)']];
  const kcalOut = () => {
    const st = Gym.S.settings;
    const w = st.kcalWeight, h = st.heightCm, age = st.age;
    if (!w || !h || !age) return `<p class="muted">Alter, Größe und Gewicht eingeben.</p>`;
    const bmr = 10 * w + 6.25 * h - 5 * age + (st.sex === 'w' ? -161 : 5);
    const tdee = bmr * (st.activity || 1.55);
    const bmi = Gym.bmi(w, h);
    const n = (v) => esc(fmt.num(Math.round(v / 10) * 10, 0));
    return `
      <div class="hero"><span class="tile-label">Täglicher Gesamtbedarf</span><span class="hero-value">${n(tdee)} <small>kcal</small></span></div>
      <table class="tbl"><tbody>
        <tr><td>Grundumsatz</td><td>${n(bmr)} kcal</td></tr>
        <tr><td>Abnehmen (ca. 0,5 kg pro Woche)</td><td>${n(tdee - 500)} kcal</td></tr>
        <tr><td>Gewicht halten</td><td>${n(tdee)} kcal</td></tr>
        <tr><td>Muskelaufbau</td><td>${n(tdee + 300)} kcal</td></tr>
        <tr><td>Eiweiß für Muskelaufbau</td><td>${esc(fmt.num(w * 1.6, 0))}–${esc(fmt.num(w * 2.2, 0))} g</td></tr>
        <tr><td>BMI</td><td>${esc(fmt.num(bmi, 1))} (${bmiText(bmi)})</td></tr>
      </tbody></table>
      <p class="muted small">Richtwerte nach der Mifflin-St-Jeor-Formel. Der tatsächliche Bedarf kann abweichen.</p>`;
  };
  Gym.route('/tools/kcal', 'more', () => {
    const st = Gym.S.settings;
    if (!st.kcalWeight) {
      const lastW = Gym.S.body.filter((b) => b.weight != null).sort((a, b) => a.date.localeCompare(b.date)).pop();
      if (lastW) st.kcalWeight = lastW.weight;
    }
    const numIn = (k, l, mode) => `<label>${l}<input class="num" type="text" inputmode="${mode || 'decimal'}" value="${esc(fmt.input(st[k]))}" data-input="kcalIn" data-k="${k}"></label>`;
    return {
      html: Gym.page({
        title: 'Kalorienrechner', back: '#/more',
        body: `
          <div class="card form grid2">
            <label>Geschlecht<select data-change="kcalIn" data-k="sex" data-s="1"><option value="m" ${st.sex !== 'w' ? 'selected' : ''}>Männlich</option><option value="w" ${st.sex === 'w' ? 'selected' : ''}>Weiblich</option></select></label>
            ${numIn('age', 'Alter (Jahre)', 'numeric')}${numIn('heightCm', 'Größe (cm)')}${numIn('kcalWeight', 'Gewicht (kg)')}
            <label class="span2">Aktivität<select data-change="kcalIn" data-k="activity">${ACT.map(([v, l]) => `<option value="${v}" ${(st.activity || 1.55) === v ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></label>
          </div>
          <div class="card" id="kcal-out">${kcalOut()}</div>`,
      }),
    };
  });
  Gym.act.kcalIn = (el) => {
    Gym.S.settings[el.dataset.k] = el.dataset.s ? el.value : Gym.parseNum(el.value);
    Gym.saveSoon();
    document.getElementById('kcal-out').innerHTML = kcalOut();
  };

  /* ---------- Einstellungen ---------- */
  const download = (name, text, type) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type }));
    a.download = name;
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };

  Gym.route('/settings', 'more', () => {
    const st = Gym.S.settings, S = Gym.S;
    const sel = (k, opts, t) => `<select data-change="setSetting" data-k="${k}" data-t="${t || 'num'}">${opts.map(([v, l]) => `<option value="${v}" ${String(st[k]) === String(v) ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>`;
    const toggle = (k, l, sub) => `<label class="switch-row"><span class="li-main"><strong>${esc(l)}</strong><small>${esc(sub)}</small></span><input type="checkbox" class="switch" data-change="setSetting" data-k="${k}" data-t="bool" ${st[k] ? 'checked' : ''}></label>`;
    return {
      html: Gym.page({
        title: 'Einstellungen', back: '#/more',
        body: `
          <div class="sec-head"><h2>Profil</h2></div>
          <div class="card form grid2">
            <label>Name<input value="${esc(st.name)}" data-change="setSetting" data-k="name" data-t="str" maxlength="30" autocomplete="off"></label>
            <label>Körpergröße (cm)<input class="num" type="text" inputmode="decimal" value="${esc(fmt.input(st.heightCm))}" data-change="setSetting" data-k="heightCm"></label>
          </div>
          <div class="sec-head"><h2>Training</h2></div>
          <div class="card form grid2">
            <label>Wochenziel${sel('weeklyGoal', [1, 2, 3, 4, 5, 6, 7].map((n) => [n, `${n}× pro Woche`]))}</label>
            <label>Pause Grundübungen${sel('restSecBig', [60, 90, 120, 150, 180, 210, 240, 300].map((s) => [s, fmt.clock(s) + ' min']))}</label>
            <label>Pause Isolationsübungen${sel('restSec', [30, 45, 60, 75, 90, 120, 150, 180].map((s) => [s, fmt.clock(s) + ' min']))}</label>
            <p class="muted small span2">Grundübungen (z. B. Bankdrücken, Kniebeugen, Rudern) brauchen längere Pausen, sonst fehlen im nächsten Satz Wiederholungen. Empfehlung: 2–3 min, Isolationsübungen 1–1,5 min.</p>
            <label>Phase${sel('phase', [['auto', 'Automatisch (' + (Gym.PHASES[Gym.phaseAuto().phase]) + ')'], ['bulk', 'Aufbau'], ['cut', 'Diät'], ['keep', 'Erhalt']], 'str')}</label>
            <p class="muted small span2">Die Phase steuert die Fortschritts-Hinweise: Im Aufbau meldet die App Stillstand, in Diät und Erhalt nur einen Rückgang. Automatisch heißt: Diät, wenn dein Körpergewicht laut Körperwerten seit mindestens 2 Wochen um mehr als 0,5 % pro Woche sinkt${Gym.phaseAuto().rate != null ? ` (gerade ${fmt.num(Gym.phaseAuto().rate, 1)} % pro Woche)` : ''}.</p>
            <label>Stangengewicht${sel('barKg', [20, 15, 10, 7.5, 5].map((b) => [b, fmt.num(b, 1) + ' kg']))}</label>
            <label>Darstellung${sel('theme', [['dark', 'Dunkel'], ['light', 'Hell'], ['auto', 'Wie das System']], 'str')}</label>
            <div class="span2">
              ${toggle('autoRest', 'Pausentimer automatisch starten', 'Startet, sobald du einen Satz abhakst')}
              ${toggle('sound', 'Signalton und Vibration', 'Am Ende einer Pause')}
              ${toggle('coach', 'Gewichtsvorschläge', 'Schlägt im Training Gewicht und Wiederholungen vor')}
            </div>
          </div>
          <div class="sec-head"><h2>KI-Coach</h2></div>
          <div class="card form">
            <p class="muted small">Freiwillig. Der KI-Coach braucht Internet und einen eigenen API-Schlüssel von Anthropic (<a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer">console.anthropic.com</a>). Eine Anfrage kostet dort je nach Modell wenige Cent. Bei jeder Anfrage geht eine Zusammenfassung deiner Trainings- und Körperdaten der letzten Wochen an Anthropic (<a href="#/privacy">Datenschutz</a>). Ohne Schlüssel ändert sich an der App nichts.</p>
            ${Gym.ai.enabled() ? `
              <div class="list-item static">
                <span class="li-main"><strong>Schlüssel gespeichert</strong><small>${Gym.ai.key().length > 11 ? 'endet auf …' + esc(Gym.ai.key().slice(-4)) : 'nur auf diesem Gerät'}</small></span>
                <button class="btn ghost sm" data-act="aiKeyClear">Entfernen</button>
              </div>` : `
              <form class="form" data-submit="aiKeySave">
                <label>API-Schlüssel<input type="password" name="aikey" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="sk-ant-…" required></label>
                <button class="btn primary">Schlüssel speichern</button>
              </form>`}
            <label>Modell${sel('aiModel', Gym.ai.MODELS.map((m) => [m.id, `${m.name} – ${m.hint}`]), 'str')}</label>
            <p class="muted small">Kosten sind grobe Schätzungen für eine typische Anfrage. Der Schlüssel liegt nur in diesem Browser und ist nicht Teil der Sicherung.</p>
            <button class="btn ghost" data-act="aiTest" ${Gym.ai.enabled() ? '' : 'disabled'}>Verbindung testen</button>
            <p class="small ai-out" id="ai-out" role="status" hidden></p>
          </div>
          <div class="sec-head"><h2>Daten</h2></div>
          <div class="card">
            <p class="muted small">Alle Daten liegen nur in diesem Browser auf diesem Gerät. Übertragen wird nur etwas, wenn du den KI-Coach nutzt (<a href="#/privacy">Datenschutz</a>). Sichere sie regelmäßig als Datei, vor allem bevor du Browserdaten löschst.</p>
            <div class="menu">
              <button class="list-item" data-act="exportJson">${icon.download}<span class="li-main"><strong>Sicherung herunterladen</strong><small>Alle Daten als JSON-Datei</small></span></button>
              <button class="list-item" data-act="importPick">${icon.upload}<span class="li-main"><strong>Sicherung einspielen</strong><small>Ersetzt die aktuellen Daten</small></span></button>
              <button class="list-item" data-act="exportCsv">${icon.table}<span class="li-main"><strong>Trainings als CSV exportieren</strong><small>Für Excel und Co.</small></span></button>
              ${Gym.hasDemo()
                ? `<button class="list-item" data-act="demoRemove">${icon.x}<span class="li-main"><strong>Beispieldaten entfernen</strong><small>Deine eigenen Einträge bleiben erhalten</small></span></button>`
                : `<button class="list-item" data-act="demoLoad">${icon.chart}<span class="li-main"><strong>Beispieldaten laden</strong><small>16 Wochen Training zum Ausprobieren</small></span></button>`}
              <button class="list-item danger" data-act="wipe">${icon.trash}<span class="li-main"><strong>Alle Daten löschen</strong><small>Setzt die App vollständig zurück</small></span></button>
            </div>
            <input type="file" id="import-file" accept=".json,application/json" data-change="importFile" hidden>
          </div>
          <p class="muted small center">${S.workouts.length} Trainings · ${S.gyms.length} Gyms · ${S.body.length} Körperwerte · ${S.routines.length} Routinen · ${S.customExercises.filter((e) => !e.archived).length} eigene Übungen</p>`,
      }),
    };
  });
  Gym.act.setSetting = (el) => {
    const st = Gym.S.settings, t = el.dataset.t || 'num';
    st[el.dataset.k] = t === 'bool' ? el.checked : t === 'str' ? el.value.trim() : Gym.parseNum(el.value);
    Gym.save();
    if (el.dataset.k === 'theme') Gym.applyTheme();
  };
  Gym.act.aiKeySave = (form) => {
    const k = form.elements.aikey.value.trim();
    form.elements.aikey.value = '';
    if (!k) return Gym.toast('Bitte einen Schlüssel eingeben');
    Gym.ai.setKey(k);
    Gym.toast(k.startsWith('sk-ant-') ? 'Schlüssel gespeichert' : 'Gespeichert. Schlüssel beginnen normalerweise mit sk-ant-');
    Gym.render();
  };
  Gym.act.aiKeyClear = async () => {
    const ok = await Gym.confirm('Schlüssel entfernen?', 'Der KI-Coach ist danach aus, bis du wieder einen Schlüssel einträgst.', 'Entfernen', true);
    if (!ok) return;
    Gym.ai.clearKey(); Gym.toast('Schlüssel entfernt'); Gym.render();
  };
  Gym.act.aiTest = async (el) => {
    const out = document.getElementById('ai-out');
    el.disabled = true; out.hidden = false; out.className = 'small ai-out'; out.textContent = 'Teste die Verbindung …';
    try {
      const id = await Gym.ai.test();
      const m = Gym.ai.MODELS.find((x) => id && id.startsWith(x.id));
      out.className = 'small ai-out ok'; out.textContent = `Verbindung steht: ${m ? m.name : id} antwortet.`;
    } catch (e) {
      out.className = 'small ai-out err'; out.textContent = e.kind ? e.message : 'Unerwarteter Fehler beim Testen.';
    }
    el.disabled = false;
  };
  Gym.act.exportJson = () => { download(`gymapp-sicherung-${Gym.dayKey(Date.now())}.json`, JSON.stringify(Gym.S, null, 2), 'application/json'); Gym.toast('Sicherung erstellt'); };
  Gym.act.exportCsv = () => {
    const q = (v) => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`;
    const lines = [['Datum', 'Uhrzeit', 'Training', 'Gym', 'Übung', 'Muskelgruppe', 'Satz', 'Gewicht/Distanz', 'Wdh./Zeit', 'Reserve'].map(q).join(';')];
    for (const w of Gym.sorted()) for (const en of w.entries) {
      const ex = Gym.ex(en.exId);
      en.sets.forEach((s, i) => lines.push([Gym.dayKey(w.start), fmt.time(w.start), w.name, Gym.gymName(w.gymId), ex.name, ex.muscle, i + 1, fmt.input(s.w), fmt.input(s.r), s.rir === 4 ? '3+' : s.rir === 2 ? '1-2' : ''].map(q).join(';')));
    }
    download(`gymapp-trainings-${Gym.dayKey(Date.now())}.csv`, '﻿' + lines.join('\r\n'), 'text/csv;charset=utf-8');
  };
  Gym.act.importPick = () => document.getElementById('import-file').click();
  Gym.act.importFile = async (el) => {
    const file = el.files[0];
    el.value = '';
    if (!file) return;
    let data;
    try { data = JSON.parse(await file.text()); } catch (e) { return Gym.toast('Die Datei ist keine gültige Sicherung'); }
    if (!data || !Array.isArray(data.workouts) || !data.settings) return Gym.toast('Die Datei ist keine gültige Sicherung');
    const ok = await Gym.confirm('Sicherung einspielen?', `Die Datei enthält ${data.workouts.length} Trainings. Deine aktuellen Daten werden dadurch ersetzt.`, 'Ersetzen', true);
    if (!ok) return;
    localStorage.setItem('gymapp.v1', JSON.stringify(data));
    Gym.load(); Gym.recomputePRs(); Gym.save(); Gym.applyTheme();
    Gym.toast('Sicherung eingespielt'); Gym.go('#/home');
  };
  Gym.act.demoRemove = async () => {
    const ok = await Gym.confirm('Beispieldaten entfernen?', 'Alle Beispiel-Trainings und -Körperwerte werden gelöscht.', 'Entfernen', true);
    if (!ok) return;
    Gym.removeDemo(); Gym.toast('Beispieldaten entfernt'); Gym.render();
  };
  Gym.act.wipe = async () => {
    const ok = await Gym.confirm('Wirklich alles löschen?', 'Trainings, Routinen, Körperwerte und Einstellungen werden unwiderruflich gelöscht. Ein gespeicherter KI-Schlüssel wird ebenfalls entfernt.', 'Alles löschen', true);
    if (!ok) return;
    Gym.resetAll(); Gym.ai.clearKey(); Gym.applyTheme(); Gym.toast('App zurückgesetzt'); Gym.go('#/home');
  };
})();
