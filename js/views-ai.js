/* Ansicht: KI-Coach (#/coach) mit Wochenrückblick und freien Fragen. Läuft nur mit eigenem API-Schlüssel. */
(function () {
  'use strict';
  const Gym = window.Gym;
  const { esc, icon, fmt } = Gym;
  const $ = (id) => document.getElementById(id);
  icon.coach = '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 3l1.800 5.200L18 10l-5.200 1.800L11 17l-1.800-5.200L4 10l5.200-1.800z"/><path d="M19 16v4M17 18h4"/></svg>';

  /* ---------- Markdown, sicher: erst alles escapen, dann nur wenige Formen umsetzen ---------- */
  const inline = (s) => Gym.esc(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*\*/g, '') // noch offenes ** (Stream läuft): ohne Sternchen anzeigen
    .replace(/(^|[^*\w])\*(?!\s)([^*]+?)\*(?![*\w])/g, '$1<em>$2</em>');
  Gym.ai.md = (text) => {
    const out = [];
    let para = [], list = null, gap = false;
    const flushPara = () => { if (para.length) out.push('<p>' + para.map(inline).join('<br>') + '</p>'); para = []; };
    const closeList = () => {
      if (!list) return;
      out.push(`<${list.tag}${list.tag === 'ol' && list.start > 1 ? ` start="${list.start}"` : ''}>${list.items.map((i) => '<li>' + i.map(inline).join('<br>') + '</li>').join('')}</${list.tag}>`);
      list = null;
    };
    for (const line of String(text || '').replace(/\r/g, '').split('\n')) {
      let m;
      if (!line.trim()) { flushPara(); gap = true; continue; }
      if ((m = line.match(/^\s{0,3}(#{1,3})\s+(.*)$/))) {
        flushPara(); closeList(); out.push(`<h${m[1].length + 2}>${inline(m[2])}</h${m[1].length + 2}>`);
      } else if ((m = line.match(/^\s*[-*•]\s+(.*)$/)) || (m = line.match(/^\s*(\d{1,3})[.)]\s+(.*)$/))) {
        const tag = m.length === 3 ? 'ol' : 'ul';
        flushPara();
        if (list && list.tag !== tag) closeList();
        if (!list) list = { tag, items: [], start: tag === 'ol' ? +m[1] : 1 };
        list.items.push([m[m.length - 1]]);
      } else if (list && !gap && /^\s/.test(line)) {
        list.items[list.items.length - 1].push(line.trim()); // eingerückte Fortsetzung eines Listenpunkts
      } else {
        closeList(); para.push(line.trim());
      }
      gap = false;
    }
    flushPara(); closeList();
    return out.join('');
  };
  const md = (t) => `<div class="md">${Gym.ai.md(t)}</div>`;

  /* ---------- Gemeinsames ---------- */
  const NOTE = 'KI-Antworten sind Richtwerte und können Fehler enthalten.';
  const thinking = '<p class="muted">Der Coach denkt nach …</p>';
  const toAiError = (e) => (e && e.kind ? e : new Gym.ai.Error('bad', 'Unerwarteter Fehler'));
  const errBox = (e, retryAct) => `<div class="ai-err" role="alert">
      <p>${esc(e.message)}</p>
      ${e.kind === 'auth' || e.kind === 'nokey' ? '<a class="btn ghost sm" href="#/settings">Zu den Einstellungen</a>' : ''}
      <button class="btn ghost sm" data-act="${retryAct}">Erneut versuchen</button>
    </div>`;
  Gym.ai.errBox = errBox; // auch für js/ai-actions.js
  const nearBottom = () => window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 160;
  const onPage = () => location.hash === '#/coach';

  /* ---------- Wochenrückblick ---------- */
  const rv = { week: 'this', run: null }; // run: { ws, text, busy, err, aborted, ctrl, id }
  const weekStartOf = () => Gym.addDays(Gym.weekStart(Date.now()), rv.week === 'last' ? -7 : 0);
  const weekText = (ws) => `${fmt.dayMon(ws)} – ${fmt.dayMon(Gym.addDays(ws, 6))}`;
  const reviews = () => (Array.isArray(Gym.S.aiReviews) ? Gym.S.aiReviews : []);

  const rvOut = () => {
    const r = rv.run;
    if (!r) return '';
    if (r.empty) return `<p class="muted">${esc(r.empty)}</p>`;
    return (r.text ? md(r.text) : r.busy ? thinking : '')
      + (r.aborted ? '<p class="muted small">Abgebrochen, der Rückblick wurde nicht gespeichert.</p>' : '')
      + (r.err ? errBox(r.err, 'rvRun') : '');
  };
  const rvPaint = () => {
    const out = $('rv-out'), btn = $('rv-btn');
    if (btn) btn.innerHTML = rv.run && rv.run.busy ? '<button class="btn ghost" data-act="rvStop">Stopp</button>' : '<button class="btn primary" data-act="rvRun">Rückblick erstellen</button>';
    if (!out) return;
    out.innerHTML = rvOut();
  };

  Gym.act.rvWeek = (el) => {
    if (rv.run && rv.run.busy) return;
    rv.week = el.dataset.w; rv.run = null; Gym.render();
  };
  Gym.act.rvStop = () => { if (rv.run && rv.run.ctrl) rv.run.ctrl.abort(); };
  Gym.act.rvRun = async () => {
    if (rv.run && rv.run.busy) return;
    const ws = weekStartOf(), we = Gym.addDays(ws, 7), cur = rv.week === 'this';
    const week = Gym.S.workouts.filter((w) => w.start >= ws && w.start < we);
    if (!week.length) {
      rv.run = { ws, empty: cur ? 'In dieser Woche hast du noch nicht trainiert, es gibt noch nichts auszuwerten.' : 'In der letzten Woche hast du nicht trainiert, es gibt nichts auszuwerten.' };
      return rvPaint();
    }
    const run = (rv.run = { ws, text: '', busy: true, err: null, aborted: false, ctrl: new AbortController() });
    rvPaint();
    const prs = week.flatMap((w) => (w.prs || []).map((p) => { const ex = Gym.ex(p.exId); return `${ex.name} (${Gym.PR_LABEL[p.key]} ${Gym.fmtMetric(ex, p.key, p.v)})`; }));
    const last = Gym.addDays(ws, 6), year = new Date(last).getFullYear();
    const prompt = `Erstelle meinen Wochenrückblick für die Woche vom ${fmt.long(ws)} bis ${fmt.long(last)} ${year} (Montag bis Sonntag, ${Gym.dayKey(ws)} bis ${Gym.dayKey(last)}). In dieser Woche gab es ${week.length} ${week.length === 1 ? 'Training' : 'Trainings'}.`
      + (cur ? ` Die Woche läuft noch (heute ist ${fmt.long(Date.now())}): Bewerte sie als Zwischenstand und wirf mir nicht vor, was noch kommen kann.` : '')
      + (prs.length ? ` Rekorde laut App in dieser Woche: ${prs.join('; ')}.` : ' Die App hat in dieser Woche keinen neuen Rekord gezählt.')
      + `\n\nBetrachte nur diese Woche, frühere Wochen dienen dem Vergleich. Gliedere kurz:\n1. **Was gut lief**, mit konkreten Zahlen (Trainings, Sätze, Gewichte, Wiederholungen).\n2. **Sätze je Muskelgruppe**: wo lagen sie unter oder über dem Zielbereich (Zahlen aus der Tabelle)?\n3. **Rekorde und Stillstand**: neue Bestwerte, Übungen ohne Fortschritt oder mit Rückgang.\n4. **Nächste Woche**: 2 bis 3 konkrete Schritte.\nHalte den Rückblick so kurz, dass er auf ein bis zwei Handybildschirme passt (etwa 200 bis 250 Wörter). Lass Teile weg, zu denen keine Daten vorliegen.`;
    try {
      const r = await Gym.ai.ask({
        system: Gym.ai.COACH_SYSTEM + '\n\n' + Gym.ai.context({ weeks: 8 }),
        messages: prompt,
        signal: run.ctrl.signal,
        onText: (d, t) => { run.text = t; if (rv.run === run) rvPaint(); },
      });
      if (!r.text.trim()) throw new Gym.ai.Error('bad', 'Die Antwort war leer');
      run.text = r.text;
      // Erst jetzt speichern: ein Fehler oder Abbruch hinterlässt keinen halben Rückblick
      const entry = { id: Gym.uid(), created: Date.now(), weekStart: ws, text: r.text, model: r.model };
      Gym.S.aiReviews = [entry].concat(reviews().filter((x) => x.weekStart !== ws)).slice(0, 12);
      Gym.save();
      run.id = entry.id;
      if (!onPage()) Gym.toast('Wochenrückblick fertig');
    } catch (e) {
      e = toAiError(e);
      if (e.kind === 'aborted') run.aborted = true; else run.err = e;
    }
    run.busy = false; run.ctrl = null;
    if (rv.run === run && onPage()) Gym.render();
  };

  Gym.act.rvDel = async (el) => {
    const ok = await Gym.confirm('Rückblick löschen?', 'Der gespeicherte Rückblick wird entfernt.', 'Löschen', true);
    if (!ok) return;
    Gym.S.aiReviews = reviews().filter((x) => x.id !== el.dataset.id);
    if (rv.run && rv.run.id === el.dataset.id) rv.run = null;
    Gym.save(); Gym.render();
  };

  const reviewCard = () => {
    const ws = weekStartOf(), old = reviews().find((x) => x.weekStart === ws), busy = rv.run && rv.run.busy;
    return `<section class="card ai-card">
      <div><h3>Wochenrückblick</h3><p class="sub">Was lief gut, wo lagen die Sätze je Muskelgruppe neben dem Ziel, was kommt als Nächstes?</p></div>
      <div class="chips" role="group" aria-label="Woche">
        ${[['this', 'Diese Woche'], ['last', 'Letzte Woche']].map(([k, l]) => `<button class="chip ${rv.week === k ? 'on' : ''}" data-act="rvWeek" data-w="${k}" aria-pressed="${rv.week === k}" ${busy ? 'disabled' : ''}>${l}</button>`).join('')}
      </div>
      <p class="small muted">${esc(weekText(ws))}${old ? ` · Ein neuer Rückblick ersetzt den vom ${esc(fmt.dayMon(old.created))}` : ''}</p>
      <div id="rv-btn"></div>
      <div id="rv-out">${rvOut()}</div>
    </section>`;
  };

  const pastList = () => {
    const shown = Gym.ai.enabled() && rv.run && rv.run.id; // ohne Schlüssel fehlt die Karte, die ihn sonst zeigt
    const list = reviews().filter((x) => x.id !== shown);
    if (!list.length) return '';
    return `<div class="sec-head"><h2>Frühere Rückblicke</h2></div>
      <div class="card list">${list.map((x) => `<details class="ai-past">
        <summary><span class="li-main"><strong>Woche ${esc(weekText(x.weekStart))}</strong><small>erstellt am ${esc(fmt.dayMon(x.created))}</small></span>${icon.down}</summary>
        ${md(x.text)}
        <button class="btn text sm danger" data-act="rvDel" data-id="${esc(x.id)}">${icon.trash} Löschen</button>
      </details>`).join('')}</div>`;
  };

  /* ---------- Fragen an den Coach (Verlauf nur im Arbeitsspeicher) ---------- */
  const STARTERS = ['Warum komme ich beim Bankdrücken nicht weiter?', 'Was sollte ich nächste Woche anders machen?', 'Meine Schulter zwickt beim Drücken, was stattdessen?', 'Trainiere ich genug Sätze für meinen Rücken?'];
  const chat = { id: 0, msgs: [], system: '', busy: false, live: '', err: null, ctrl: null, draft: '' };

  const msgsHtml = () => {
    let h = chat.msgs.map((m) => (m.role === 'user' ? `<div class="bubble me">${esc(m.content)}</div>` : `<div class="bubble coach">${md(m.content)}</div>`)).join('');
    if (chat.busy) h += `<div class="bubble coach" id="ai-live">${chat.live ? md(chat.live) : thinking}</div>`;
    else if (chat.err) h += `<div class="bubble coach wide">${chat.err.partial ? md(chat.err.partial) : ''}${errBox(chat.err.e, 'aiRetry')}</div>`;
    return h;
  };
  const chatPaint = () => {
    const box = $('ai-msgs'), btn = $('ai-btn'), starters = $('ai-starters'), neu = $('ai-new');
    if (!box) return;
    const down = nearBottom();
    box.innerHTML = msgsHtml();
    btn.innerHTML = chat.busy ? '<button type="button" class="btn" data-act="aiStop">Stopp</button>' : '<button class="btn primary">Senden</button>';
    starters.hidden = !!(chat.msgs.length || chat.busy || chat.err);
    neu.hidden = !(chat.msgs.length || chat.busy || chat.err);
    if (down) window.scrollTo(0, document.documentElement.scrollHeight);
  };
  const livePaint = () => {
    const el = $('ai-live');
    if (!el) return;
    const down = nearBottom();
    el.innerHTML = chat.live ? md(chat.live) : thinking;
    if (down) window.scrollTo(0, document.documentElement.scrollHeight);
  };

  const run = async () => {
    const conv = chat.id;
    chat.busy = true; chat.live = ''; chat.err = null; chat.ctrl = new AbortController();
    chatPaint();
    try {
      // Rolle und Daten einmal je Gespräch bauen: gleicher System-Prompt, damit der Cache greift
      if (!chat.system) chat.system = Gym.ai.COACH_SYSTEM + '\n\n' + Gym.ai.context();
      const r = await Gym.ai.ask({
        system: chat.system,
        messages: chat.msgs.map((m) => ({ role: m.role, content: m.content })),
        signal: chat.ctrl.signal,
        onText: (d, t) => { if (chat.id === conv) { chat.live = t; livePaint(); } },
      });
      if (chat.id !== conv) return;
      if (!r.text.trim()) throw new Gym.ai.Error('bad', 'Die Antwort war leer');
      chat.msgs.push({ role: 'assistant', content: r.text });
    } catch (e) {
      if (chat.id !== conv) return;
      e = toAiError(e);
      if (e.kind === 'aborted') {
        if (chat.live.trim()) chat.msgs.push({ role: 'assistant', content: chat.live });
        else { chat.draft = chat.msgs.pop().content; const q = $('ai-q'); if (q) q.value = chat.draft; } // nichts erhalten: Frage zurück ins Eingabefeld
      } else chat.err = { e, partial: chat.live };
    }
    chat.busy = false; chat.live = ''; chat.ctrl = null;
    chatPaint();
  };
  const send = (text) => {
    text = String(text || '').trim();
    if (!text || chat.busy) return;
    chat.msgs.push({ role: 'user', content: text });
    chat.draft = '';
    const q = $('ai-q');
    if (q) { q.value = ''; q.style.height = ''; }
    run();
    window.scrollTo(0, document.documentElement.scrollHeight);
  };
  Gym.act.aiSend = () => { const q = $('ai-q'); if (q) send(q.value); };
  Gym.act.aiStarter = (el) => send(STARTERS[+el.dataset.i]);
  Gym.act.aiStop = () => { if (chat.ctrl) chat.ctrl.abort(); };
  Gym.act.aiRetry = () => { if (!chat.busy && chat.msgs.length) run(); };
  Gym.act.aiNew = () => {
    if (chat.ctrl) chat.ctrl.abort();
    Object.assign(chat, { id: chat.id + 1, msgs: [], system: '', busy: false, live: '', err: null, ctrl: null });
    chatPaint();
  };
  Gym.act.aiDraft = (el) => {
    chat.draft = el.value;
    el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight + 2, 140) + 'px';
  };
  // Strg/Cmd + Enter sendet (am Handy bleibt Enter ein Zeilenumbruch)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && e.target.id === 'ai-q') { e.preventDefault(); Gym.act.aiSend(); }
  });

  /* ---------- Seite ---------- */
  Gym.route('/coach', 'more', () => {
    if (!Gym.ai.enabled()) {
      return {
        html: Gym.page({
          title: 'KI-Coach', back: '#/more', smartBack: true,
          body: `
            <section class="card prose">
              <h3>Dein Coach auf Abruf</h3>
              <p>Der KI-Coach wertet deine Trainings aus: ein <strong>Wochenrückblick</strong> mit Zahlen, Rekorden und nächsten Schritten, und du kannst ihm <strong>Fragen</strong> zu deinem Training stellen, zum Beispiel warum eine Übung stockt.</p>
              <p><strong>Das brauchst du:</strong> einen eigenen API-Schlüssel von Anthropic und Internet. Eine Anfrage kostet je nach Modell wenige Cent.</p>
              <p><strong>Datenschutz:</strong> Bei jeder Anfrage geht eine Zusammenfassung deiner Trainings- und Körperdaten an Anthropic. Ohne Schlüssel bleibt alles auf deinem Gerät.</p>
              <a class="btn primary" href="#/settings">Schlüssel in den Einstellungen eintragen</a>
            </section>
            ${pastList()}`,
        }),
      };
    }
    const has = chat.msgs.length || chat.busy || chat.err;
    return {
      html: Gym.page({
        title: 'KI-Coach', back: '#/more', smartBack: true,
        body: `
          ${Gym.aiActions.buildCard()}
          ${reviewCard()}
          ${pastList()}
          ${Gym.aiActions.logLink()}
          <div class="sec-head"><h2>Frage an den Coach</h2><button class="btn text sm" id="ai-new" data-act="aiNew" ${has ? '' : 'hidden'}>Neues Gespräch</button></div>
          <div class="chat" id="ai-msgs">${msgsHtml()}</div>
          <div class="card list" id="ai-starters" ${has ? 'hidden' : ''}>
            ${STARTERS.map((q, i) => `<button class="list-item" data-act="aiStarter" data-i="${i}"><span class="li-main">${esc(q)}</span>${icon.right}</button>`).join('')}
          </div>
          <p class="muted small">${esc(NOTE)}</p>
          <form class="composer" data-submit="aiSend">
            <textarea id="ai-q" rows="1" maxlength="2000" placeholder="Frag deinen Coach …" aria-label="Frage an den Coach" data-input="aiDraft" autocomplete="off">${esc(chat.draft)}</textarea>
            <span id="ai-btn"></span>
          </form>`,
      }),
      after: () => { rvPaint(); chatPaint(); const q = $('ai-q'); if (q && chat.draft) Gym.act.aiDraft(q); },
    };
  });
})();
