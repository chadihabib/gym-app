/* Diagramme: eigenständige SVG-Charts ohne Bibliothek */
(function () {
  'use strict';
  const Gym = window.Gym;
  const esc = Gym.esc;
  const observers = [];

  /* ---------- Tooltip ---------- */
  const tipEl = () => document.getElementById('chart-tip');
  function showTip(x, y, value, label) {
    const t = tipEl();
    t.replaceChildren();
    const v = document.createElement('strong'); v.textContent = value;
    const l = document.createElement('span'); l.textContent = label;
    t.append(v, l);
    t.hidden = false;
    const r = t.getBoundingClientRect();
    const left = Math.max(8, Math.min(window.innerWidth - r.width - 8, x - r.width / 2));
    let top = y - r.height - 12;
    if (top < 8) top = y + 18;
    t.style.left = left + 'px';
    t.style.top = top + 'px';
  }
  function hideTip() { const t = tipEl(); if (t) t.hidden = true; }
  window.addEventListener('scroll', hideTip, { passive: true });

  /* ---------- Helfer ---------- */
  function mount(el, draw) {
    let last = 0;
    const ro = new ResizeObserver((entries) => {
      const w = Math.floor(entries[0].contentRect.width);
      // Zeichnen im nächsten Frame, damit die Größenänderung nicht in derselben Messrunde landet
      if (w > 0 && w !== last) { last = w; hideTip(); requestAnimationFrame(() => { if (el.isConnected) draw(w); }); }
    });
    ro.observe(el);
    observers.push(ro);
  }
  function clear() { while (observers.length) observers.pop().disconnect(); hideTip(); }

  function niceScale(min, max, n) {
    if (min === max) { const p = Math.abs(min) * 0.1 || 1; min -= p; max += p; }
    const raw = (max - min) / (n || 4);
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const norm = raw / mag;
    const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10) * mag;
    const lo = Math.floor(min / step + 1e-9) * step, hi = Math.ceil(max / step - 1e-9) * step;
    const ticks = [];
    for (let v = lo; v <= hi + step / 2; v += step) ticks.push(+v.toFixed(8));
    return { lo, hi, ticks };
  }

  const empty = (text) => `<div class="chart-empty">${esc(text || 'Noch keine Daten')}</div>`;

  // Tastatur: Pfeiltasten wandern durch die Datenpunkte
  function keyNav(svg, count, activate, deactivate) {
    let idx = -1;
    svg.addEventListener('focus', () => { if (svg.matches(':focus-visible')) { idx = count - 1; activate(idx); } });
    svg.addEventListener('blur', () => { idx = -1; deactivate(); });
    svg.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      if (idx < 0) idx = count - 1;
      else idx = Math.max(0, Math.min(count - 1, idx + (e.key === 'ArrowRight' ? 1 : -1)));
      activate(idx);
    });
  }

  /* ---------- Linien-/Flächendiagramm (eine Serie, Zeitachse) ---------- */
  // o: { points:[{t, v}], fmtV, fmtTick, height, label, zero }
  function lineChart(el, o) {
    el.classList.add('chart');
    const pts = o.points;
    if (!pts.length) { el.innerHTML = empty(o.empty); return; }
    const fmtTick = o.fmtTick || ((v) => Gym.fmt.num(v, 1));
    mount(el, (W) => {
      const H = o.height || 200;
      const vs = pts.map((p) => p.v);
      const sc = niceScale(o.zero ? 0 : Math.min(...vs), Math.max(...vs), 4);
      const tickLabels = sc.ticks.map(fmtTick);
      const m = { t: 24, r: 14, b: 24, l: Math.max(30, 12 + Math.max(...tickLabels.map((s) => s.length)) * 6.6) };
      const iw = W - m.l - m.r, ih = H - m.t - m.b;
      const t0 = pts[0].t, t1 = pts[pts.length - 1].t;
      const x = (t) => (t1 === t0 ? m.l + iw / 2 : m.l + ((t - t0) / (t1 - t0)) * iw);
      const y = (v) => m.t + ih - ((v - sc.lo) / (sc.hi - sc.lo)) * ih;
      const base = m.t + ih;

      let s = `<svg width="${W}" height="${H}" tabindex="0" role="img" aria-label="${esc(o.label || 'Liniendiagramm')}">`;
      sc.ticks.forEach((tk, i) => {
        s += `<line class="c-grid" x1="${m.l}" x2="${W - m.r}" y1="${y(tk)}" y2="${y(tk)}"/>`;
        s += `<text class="c-tick" x="${m.l - 8}" y="${y(tk) + 4}" text-anchor="end">${esc(tickLabels[i])}</text>`;
      });
      s += `<line class="c-axis" x1="${m.l}" x2="${W - m.r}" y1="${base}" y2="${base}"/>`;

      // X-Achse: wenige Datumsmarken
      const span = t1 - t0;
      const withYear = span > 300 * 86400000;
      const fx = withYear ? Gym.fmt.dayMonY : Gym.fmt.dayMon;
      if (span === 0) {
        s += `<text class="c-tick" x="${x(t0)}" y="${H - 6}" text-anchor="middle">${esc(fx(t0))}</text>`;
      } else {
        const n = Math.max(2, Math.min(5, Math.floor(iw / (withYear ? 96 : 78))));
        for (let i = 0; i < n; i++) {
          const t = t0 + (span * i) / (n - 1);
          const anchor = i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle';
          s += `<text class="c-tick" x="${x(t)}" y="${H - 6}" text-anchor="${anchor}">${esc(fx(t))}</text>`;
        }
      }

      const P = pts.map((p) => [x(p.t), y(p.v)]);
      const d = P.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join('');
      if (P.length > 1) {
        s += `<path class="c-area" d="${d}L${P[P.length - 1][0].toFixed(1)},${base}L${P[0][0].toFixed(1)},${base}Z"/>`;
        s += `<path class="c-line" d="${d}"/>`;
      }
      const end = P[P.length - 1];
      s += `<circle class="c-dot" cx="${end[0]}" cy="${end[1]}" r="5"/>`;
      // Endwert beschriften; über die Linie heben, damit er sie nicht überdeckt
      const endText = o.fmtV(pts[pts.length - 1].v);
      const spanX = end[0] - endText.length * 7.2 - 6;
      const topY = Math.min(...P.filter((p) => p[0] >= spanX).map((p) => p[1]));
      s += `<text class="c-label" x="${end[0] + 5}" y="${Math.max(12, topY - 11)}" text-anchor="end">${esc(endText)}</text>`;
      s += `<line class="c-cross" x1="0" x2="0" y1="${m.t}" y2="${base}" visibility="hidden"/>`;
      s += `<circle class="c-dot c-hover" r="5" visibility="hidden"/>`;
      s += `<rect class="c-hit" x="0" y="0" width="${W}" height="${H}"/></svg>`;
      el.innerHTML = s;

      const svg = el.firstElementChild;
      const cross = svg.querySelector('.c-cross'), dot = svg.querySelector('.c-hover');
      const activate = (i) => {
        const p = P[i], r = svg.getBoundingClientRect();
        cross.setAttribute('x1', p[0]); cross.setAttribute('x2', p[0]); cross.setAttribute('visibility', 'visible');
        dot.setAttribute('cx', p[0]); dot.setAttribute('cy', p[1]); dot.setAttribute('visibility', 'visible');
        showTip(r.left + p[0], r.top + p[1], o.fmtV(pts[i].v), o.fmtT ? o.fmtT(pts[i]) : Gym.fmt.date(pts[i].t));
      };
      const deactivate = () => { cross.setAttribute('visibility', 'hidden'); dot.setAttribute('visibility', 'hidden'); hideTip(); };
      svg.addEventListener('pointermove', (e) => {
        const px = e.clientX - svg.getBoundingClientRect().left;
        let bi = 0, bd = Infinity;
        P.forEach((p, i) => { const dd = Math.abs(p[0] - px); if (dd < bd) { bd = dd; bi = i; } });
        activate(bi);
      });
      svg.addEventListener('pointerdown', (e) => svg.dispatchEvent(new PointerEvent('pointermove', e)));
      svg.addEventListener('pointerleave', deactivate);
      keyNav(svg, P.length, activate, deactivate);
    });
  }

  /* ---------- Säulendiagramm ---------- */
  // o: { bars:[{label, v, tip}], fmtV, fmtTick, height, label }
  function barChart(el, o) {
    el.classList.add('chart');
    const bars = o.bars;
    if (!bars.length || !bars.some((b) => b.v > 0)) { el.innerHTML = empty(o.empty); return; }
    const fmtTick = o.fmtTick || ((v) => Gym.fmt.num(v, 1));
    mount(el, (W) => {
      const H = o.height || 200;
      const sc = niceScale(0, Math.max(...bars.map((b) => b.v)), o.ticks || 4);
      const tickLabels = sc.ticks.map(fmtTick);
      const m = { t: 22, r: 8, b: 24, l: Math.max(26, 12 + Math.max(...tickLabels.map((s) => s.length)) * 6.6) };
      const iw = W - m.l - m.r, ih = H - m.t - m.b, n = bars.length;
      const band = iw / n, bw = Math.max(2, Math.min(24, band - Math.max(2, band * 0.3)));
      const y = (v) => m.t + ih - (v / sc.hi) * ih;
      const base = m.t + ih;

      let s = `<svg width="${W}" height="${H}" tabindex="0" role="img" aria-label="${esc(o.label || 'Säulendiagramm')}">`;
      sc.ticks.forEach((tk, i) => {
        if (tk > 0) s += `<line class="c-grid" x1="${m.l}" x2="${W - m.r}" y1="${y(tk)}" y2="${y(tk)}"/>`;
        s += `<text class="c-tick" x="${m.l - 8}" y="${y(tk) + 4}" text-anchor="end">${esc(tickLabels[i])}</text>`;
      });
      const every = Math.max(1, Math.ceil(n / Math.max(1, Math.floor(iw / 46))));
      const geo = bars.map((b, i) => {
        const cx = m.l + band * i + band / 2, x0 = cx - bw / 2, top = y(b.v), h = base - top;
        const r = Math.min(4, bw / 2, h);
        if (b.v > 0) {
          s += `<path class="c-bar" data-i="${i}" d="M${x0},${base}V${top + r}Q${x0},${top} ${x0 + r},${top}H${x0 + bw - r}Q${x0 + bw},${top} ${x0 + bw},${top + r}V${base}Z"/>`;
        }
        if ((n - 1 - i) % every === 0) s += `<text class="c-tick" x="${cx}" y="${H - 6}" text-anchor="middle">${esc(b.label)}</text>`;
        return { cx, top };
      });
      s += `<line class="c-axis" x1="${m.l}" x2="${W - m.r}" y1="${base}" y2="${base}"/>`;
      // Direkte Beschriftung nur für die aktuelle Säule, und nur wenn sie keinen Nachbarn überdeckt
      const lastBar = bars[n - 1], lastText = (o.fmtLabel || o.fmtV)(lastBar.v);
      const half = lastText.length * 3.6;
      const fits = half <= band / 2 + 2 || n < 2 || geo[n - 2].top >= geo[n - 1].top - 18;
      if (lastBar.v > 0 && fits) {
        const lx = Math.min(geo[n - 1].cx, W - half - 2);
        s += `<text class="c-label" x="${lx}" y="${geo[n - 1].top - 6}" text-anchor="middle">${esc(lastText)}</text>`;
      }
      s += `<rect class="c-hit" x="0" y="0" width="${W}" height="${H}"/></svg>`;
      el.innerHTML = s;

      const svg = el.firstElementChild;
      let on = null;
      const activate = (i) => {
        if (on) on.classList.remove('on');
        on = svg.querySelector(`.c-bar[data-i="${i}"]`);
        if (on) on.classList.add('on');
        const r = svg.getBoundingClientRect();
        showTip(r.left + geo[i].cx, r.top + geo[i].top, o.fmtV(bars[i].v), bars[i].tip || bars[i].label);
      };
      const deactivate = () => { if (on) on.classList.remove('on'); on = null; hideTip(); };
      svg.addEventListener('pointermove', (e) => {
        const px = e.clientX - svg.getBoundingClientRect().left;
        activate(Math.max(0, Math.min(n - 1, Math.floor((px - m.l) / band))));
      });
      svg.addEventListener('pointerdown', (e) => svg.dispatchEvent(new PointerEvent('pointermove', e)));
      svg.addEventListener('pointerleave', deactivate);
      keyNav(svg, n, activate, deactivate);
    });
  }

  /* ---------- Rangliste als horizontale Balken ---------- */
  // rows: [{label, v, text}]
  function hbars(el, rows, emptyText) {
    el.classList.add('hbars');
    el.replaceChildren();
    if (!rows.length) { el.innerHTML = empty(emptyText); return; }
    const max = Math.max(...rows.map((r) => r.v)) || 1;
    for (const r of rows) {
      const row = document.createElement('div'); row.className = 'hbar-row';
      const name = document.createElement('span'); name.className = 'hbar-name'; name.textContent = r.label;
      const track = document.createElement('span'); track.className = 'hbar-track';
      const fill = document.createElement('span'); fill.className = 'hbar-fill'; fill.style.width = Math.max(1, (r.v / max) * 100) + '%';
      const val = document.createElement('span'); val.className = 'hbar-val'; val.textContent = r.text;
      track.append(fill); row.append(name, track, val); el.append(row);
    }
  }

  /* ---------- Trainingskalender (Heatmap) ---------- */
  // days: Map dayKey -> { v, text, label }
  function heatmap(el, days, unitLabel) {
    el.classList.add('chart');
    mount(el, (W) => {
      const cell = 14, gap = 3, step = cell + gap, left = 24, top = 18;
      const weeks = Math.max(4, Math.min(26, Math.floor((W - left) / step)));
      const today = Gym.dayStart(Date.now());
      const start = Gym.addDays(Gym.weekStart(today), -7 * (weeks - 1));
      const max = Math.max(1, ...Array.from(days.values()).map((d) => d.v));
      const H = top + 7 * step + 4;
      let s = `<svg width="${left + weeks * step}" height="${H}" role="img" aria-label="Trainingskalender">`;
      ['Mo', '', 'Mi', '', 'Fr', '', 'So'].forEach((d, i) => { if (d) s += `<text class="c-tick" x="0" y="${top + i * step + 11}">${d}</text>`; });
      let lastMonth = -1, lastLabelX = -100;
      const info = [];
      for (let wk = 0; wk < weeks; wk++) {
        const ws = Gym.addDays(start, wk * 7);
        const mo = new Date(ws).getMonth();
        const x = left + wk * step;
        if (mo !== lastMonth) {
          if (x - lastLabelX > 30 && wk < weeks - 1) { s += `<text class="c-tick" x="${x}" y="11">${esc(Gym.fmt.mon(ws))}</text>`; lastLabelX = x; }
          lastMonth = mo;
        }
        for (let d = 0; d < 7; d++) {
          const ts = Gym.addDays(ws, d);
          if (ts > today) continue;
          const rec = days.get(Gym.dayKey(ts));
          const ratio = rec ? rec.v / max : 0;
          const lvl = !rec ? 0 : ratio > 0.75 ? 4 : ratio > 0.5 ? 3 : ratio > 0.25 ? 2 : 1;
          s += `<rect class="heat heat-${lvl}" data-i="${info.length}" x="${x}" y="${top + d * step}" width="${cell}" height="${cell}" rx="3"/>`;
          info.push({ ts, rec, x: x + cell / 2, y: top + d * step });
        }
      }
      s += '</svg>';
      s += `<div class="heat-legend"><span>Weniger</span>${[0, 1, 2, 3, 4].map((l) => `<i class="heat-${l}"></i>`).join('')}<span>Mehr ${esc(unitLabel || '')}</span></div>`;
      el.innerHTML = s;
      const svg = el.firstElementChild;
      svg.addEventListener('pointermove', (e) => {
        const r = svg.getBoundingClientRect();
        const px = e.clientX - r.left, py = e.clientY - r.top;
        let best = null, bd = 144;
        for (const c of info) { const dd = (c.x - px) ** 2 + (c.y + cell / 2 - py) ** 2; if (dd < bd) { bd = dd; best = c; } }
        if (!best) return hideTip();
        showTip(r.left + best.x, r.top + best.y, best.rec ? best.rec.text : 'Kein Training', best.rec ? `${Gym.fmt.date(best.ts)} · ${best.rec.label}` : Gym.fmt.date(best.ts));
      });
      svg.addEventListener('pointerdown', (e) => svg.dispatchEvent(new PointerEvent('pointermove', e)));
      svg.addEventListener('pointerleave', hideTip);
    });
  }

  /* ---------- Karte mit Diagramm und Tabellenansicht ---------- */
  // HTML-Gerüst; gefüllt wird über fill()
  function card(id, title, sub) {
    return `<section class="card chart-card" data-chart="${id}">
      <div class="chart-head">
        <div><h3>${esc(title)}</h3>${sub ? `<p class="sub">${esc(sub)}</p>` : ''}</div>
        <button class="icon-btn sm" data-act="chartTable" aria-label="Tabelle ein-/ausblenden" title="Als Tabelle anzeigen">${Gym.icon.table}</button>
      </div>
      <div class="chart-slot"></div>
      <div class="chart-table" hidden></div>
    </section>`;
  }
  // defs: { id: { draw(el), table: { head:[], rows:[[]] } } }
  function fill(root, defs) {
    for (const id in defs) {
      const c = root.querySelector(`[data-chart="${id}"]`);
      if (!c) continue;
      const def = defs[id];
      def.draw(c.querySelector('.chart-slot'));
      const box = c.querySelector('.chart-table');
      const btn = c.querySelector('[data-act="chartTable"]');
      if (!def.table || !def.table.rows.length) { if (btn) btn.hidden = true; continue; }
      const table = document.createElement('table');
      const tr = table.createTHead().insertRow();
      def.table.head.forEach((h) => { const th = document.createElement('th'); th.textContent = h; tr.append(th); });
      const body = table.createTBody();
      def.table.rows.forEach((r) => { const row = body.insertRow(); r.forEach((v) => { row.insertCell().textContent = v; }); });
      box.append(table);
    }
  }
  Gym.act.chartTable = (btn) => {
    const c = btn.closest('.chart-card');
    const box = c.querySelector('.chart-table'), slot = c.querySelector('.chart-slot');
    box.hidden = !box.hidden;
    slot.hidden = !box.hidden;
    btn.classList.toggle('active', !box.hidden);
  };

  Gym.charts = { lineChart, barChart, hbars, heatmap, card, fill, clear, hideTip };
})();
