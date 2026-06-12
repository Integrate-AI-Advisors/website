/* =============================================================================
   IntegrateAI — Website v2 behaviour layer
   Vanilla JS. No libraries, no build step. Mobile-first. Draw-once, never loop.
   Animate transform/opacity only. Respect prefers-reduced-motion (render END state).
   ----------------------------------------------------------------------------
   SECURITY NOTE: every innerHTML assignment is built from esc()-escaped values
   sourced from the static, trusted demo-data.js — NEVER from user input. The
   qualification form reads user input via .value and writes it ONLY through
   textContent, URLSearchParams and encodeURIComponent — never innerHTML.
   ----------------------------------------------------------------------------
   Public API (called by page HTML):
     IAA.initApprovalLoop(rootEl, scenarios[, opts])
     IAA.initDashboard(rootEl, data)
     IAA.initQualifyForm(formEl[, opts])
   Auto-wired on DOMContentLoaded:
     scroll-reveal, count-ups, nav scroll/toggle, scroll-progress, cookie+GA4 gate
   ========================================================================== */
(function (window, document) {
  'use strict';

  var REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var GA_ID = 'G-RT7VN5KQHC';

  /* ---------- tiny helpers ---------- */
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function el(tag, cls, html) { var n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]; }); }
  function delay(fn, ms) { return REDUCED ? fn() : window.setTimeout(fn, ms); }

  /* analytics event helper — only fires if GA accepted (gtag present) */
  function track(name, params) {
    if (typeof window.gtag === 'function') { window.gtag('event', name, params || {}); }
  }
  window.IAA = window.IAA || {};
  window.IAA.track = track;

  /* =========================================================================
     (a) SCROLL-REVEAL — IntersectionObserver, threshold .08, rootMargin -40px,
         stagger children ~80ms, runs ONCE.
     ====================================================================== */
  function initReveal() {
    var els = $$('.reveal');
    if (REDUCED || !('IntersectionObserver' in window)) {
      els.forEach(function (e) { e.classList.add('is-visible'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var node = entry.target;
        var kids = $$('[data-reveal-child]', node);
        if (kids.length) {
          kids.forEach(function (k, i) { window.setTimeout(function () { k.classList.add('is-visible'); }, i * 80); });
        }
        node.classList.add('is-visible');
        io.unobserve(node);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    els.forEach(function (e) { io.observe(e); });
  }

  /* =========================================================================
     (b) COUNT-UP — IO-gated, runs once, respects reduced-motion.
         Markup: <span data-count="1200" data-prefix="£" data-suffix="" data-dec="0">
     ====================================================================== */
  function runCount(node) {
    var target = parseFloat(node.getAttribute('data-count')) || 0;
    var dec = parseInt(node.getAttribute('data-dec') || '0', 10);
    var pre = node.getAttribute('data-prefix') || '';
    var suf = node.getAttribute('data-suffix') || '';
    var dur = parseInt(node.getAttribute('data-dur') || '1200', 10);
    function fmt(v) { return pre + v.toFixed(dec).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + suf; }
    if (REDUCED) { node.textContent = fmt(target); return; }
    var start = performance.now();
    (function tick(now) {
      var t = Math.min((now - start) / dur, 1);
      var e = 1 - Math.pow(1 - t, 3);
      node.textContent = fmt(target * e);
      if (t < 1) requestAnimationFrame(tick); else node.textContent = fmt(target);
    })(start);
  }
  function initCountUps() {
    var nodes = $$('[data-count]');
    if (!nodes.length) return;
    if (REDUCED || !('IntersectionObserver' in window)) { nodes.forEach(runCount); return; }
    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        runCount(entry.target);
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.4 });
    nodes.forEach(function (n) { io.observe(n); });
  }
  window.IAA.runCount = runCount;

  /* =========================================================================
     (c) APPROVAL LOOP — parameterised, reusable, instantiable multiple times.
     scenario shape:
       {
         id, app: 'IntegrateAI', appBadge: 'APP', time: '08:14',
         risk: 'green'|'amber'|'red', riskLabel: 'Low risk — routine',
         title, detail, facts: ['£430 · supplier','Due in 3 days'],
         confirm: 'Done — paid £430 to ... reference logged.',
         redraft: { changesNote, redraftTitle, redraftDetail, redraftConfirm }  // optional
       }
     opts: { announce: true }
     State machine: idle -> approving -> executing -> done -> thread-confirm.
     reduced-motion renders the END (done + confirm) state instantly.
     ====================================================================== */
  function buildAppCard(scn) {
    var risk = scn.risk || 'green';
    var card = el('div', 'appcard appcard--' + risk);
    card.setAttribute('role', 'group');
    card.setAttribute('aria-label', 'Approval request: ' + (scn.title || ''));

    var bar = el('div', 'appcard__bar');
    bar.innerHTML =
      '<div class="appcard__app"><span class="appcard__avatar"><span></span></span>' +
      '<span class="appcard__appname"><b>' + esc(scn.app || 'IntegrateAI') + '</b></span>' +
      '<span class="appcard__appbadge">' + esc(scn.appBadge || 'APP') + '</span></div>' +
      '<span class="appcard__time">' + esc(scn.time || '') + '</span>';
    card.appendChild(bar);

    var riskStrip = el('div', 'appcard__risk');
    riskStrip.innerHTML = '<span class="appcard__risk-dot"></span>' + esc(scn.riskLabel || '');
    card.appendChild(riskStrip);

    var body = el('div', 'appcard__body');
    var facts = (scn.facts || []).map(function (f) { return '<span class="appcard__fact">' + esc(f) + '</span>'; }).join('');
    body.innerHTML =
      '<div class="appcard__title">' + esc(scn.title || '') + '</div>' +
      '<p class="appcard__detail">' + esc(scn.detail || '') + '</p>' +
      (facts ? '<div class="appcard__meta">' + facts + '</div>' : '');
    card.appendChild(body);

    var actions = el('div', 'appcard__actions');
    var approveBtn = el('button', 'appcard__btn appcard__btn--approve',
      '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 8.5l3.5 3.5 7.5-8"/></svg>Approve');
    approveBtn.type = 'button';
    var changesBtn = el('button', 'appcard__btn appcard__btn--changes', 'Request changes');
    changesBtn.type = 'button';
    var declineBtn = el('button', 'appcard__btn appcard__btn--decline', 'Decline');
    declineBtn.type = 'button';
    actions.appendChild(approveBtn);
    if (scn.redraft) actions.appendChild(changesBtn);
    actions.appendChild(declineBtn);
    card.appendChild(actions);

    var redraft = el('div', 'appcard__redraft');
    card.appendChild(redraft);

    var exec = el('div', 'appcard__exec');
    exec.innerHTML =
      '<div class="appcard__exec-label"><span class="pill__dot"></span>Executing…</div>' +
      '<div class="appcard__exec-track"><div class="appcard__exec-fill"></div></div>';
    card.appendChild(exec);

    var done = el('div', 'appcard__done');
    done.innerHTML =
      '<span class="appcard__tick"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 8.5l3.5 3.5 7.5-8"/></svg></span>' +
      '<span class="appcard__done-text">Done</span>';
    card.appendChild(done);

    var thread = el('div', 'appcard__thread');
    card.appendChild(thread);

    return {
      card: card, body: body, actions: actions, approveBtn: approveBtn,
      changesBtn: changesBtn, declineBtn: declineBtn, redraft: redraft,
      exec: exec, done: done, thread: thread, riskStrip: riskStrip
    };
  }

  function appendThreadMsg(threadEl, text) {
    var msg = el('div', 'thread-msg');
    msg.innerHTML =
      '<span class="thread-msg__avatar"><span></span></span>' +
      '<span class="thread-msg__text">' + text + '</span>';
    threadEl.appendChild(msg);
    if (REDUCED) { msg.classList.add('is-on'); }
    else { requestAnimationFrame(function () { requestAnimationFrame(function () { msg.classList.add('is-on'); }); }); }
    return msg;
  }

  function executeCard(ui, confirmText, live) {
    ui.body.style.display = 'none';
    ui.actions.style.display = 'none';
    ui.redraft.classList.remove('is-on');

    function finish() {
      ui.exec.classList.remove('is-on');
      ui.done.classList.add('is-on');
      if (live) live.textContent = 'Approved and executed. Confirmation posted to the thread.';
      delay(function () { appendThreadMsg(ui.thread, confirmText); }, 1800);
    }

    if (REDUCED) {
      ui.done.classList.add('is-on');
      if (live) live.textContent = 'Approved and executed. Confirmation posted to the thread.';
      appendThreadMsg(ui.thread, confirmText);
      return;
    }
    ui.exec.classList.add('is-on');
    var fill = $('.appcard__exec-fill', ui.exec);
    requestAnimationFrame(function () { requestAnimationFrame(function () { fill.style.width = '100%'; }); });
    if (live) live.textContent = 'Executing the approved action.';
    window.setTimeout(finish, 1500);
  }

  function initApprovalLoop(root, scenarios, opts) {
    if (!root || !scenarios || !scenarios.length) return;
    opts = opts || {};
    root.classList.add('approval');
    if (scenarios.length > 1) root.classList.add('approval--queue');

    var live = null;
    if (opts.announce !== false) {
      live = el('div', 'sr-only');
      live.setAttribute('aria-live', 'polite');
      live.setAttribute('aria-atomic', 'true');
      root.appendChild(live);
    }

    scenarios.forEach(function (scn) {
      var ui = buildAppCard(scn);
      root.appendChild(ui.card);

      ui.approveBtn.addEventListener('click', function () {
        track('demo_interact', { demo: 'approval_loop', action: 'approve', scenario: scn.id });
        executeCard(ui, esc(scn.confirm || 'Done.'), live);
      });

      ui.declineBtn.addEventListener('click', function () {
        track('demo_interact', { demo: 'approval_loop', action: 'decline', scenario: scn.id });
        ui.actions.style.display = 'none';
        ui.body.style.display = 'none';
        ui.redraft.textContent = 'Declined. Nothing was actioned — the request was dropped.';
        ui.redraft.classList.add('is-on');
        if (live) live.textContent = 'Declined. Nothing was actioned.';
      });

      if (scn.redraft) {
        ui.changesBtn.addEventListener('click', function () {
          track('demo_interact', { demo: 'approval_loop', action: 'request_changes', scenario: scn.id });
          var rd = scn.redraft;
          ui.actions.style.display = 'none';
          ui.redraft.textContent = rd.changesNote || 'Reworking…';
          ui.redraft.classList.add('is-on');
          if (live) live.textContent = 'Requested changes. The team member is redrafting.';
          delay(function () {
            $('.appcard__title', ui.body).textContent = rd.redraftTitle || scn.title;
            $('.appcard__detail', ui.body).textContent = rd.redraftDetail || scn.detail;
            ui.body.style.display = '';
            ui.redraft.classList.remove('is-on');
            if (live) live.textContent = 'Redrafted. Approving the updated version.';
            delay(function () {
              executeCard(ui, esc(rd.redraftConfirm || scn.confirm || 'Done.'), live);
            }, 1100);
          }, 1400);
        });
      }
    });
  }
  window.IAA.initApprovalLoop = initApprovalLoop;

  /* =========================================================================
     (d) DASHBOARD — count-up KPIs + SVG line chart (stroke-dasharray draw once)
         + donut (stroke-dasharray) + staggered table reveal. All illustrative.
     data shape:
       {
         title, aria,
         kpis: [{ value, prefix, suffix, dec, label, sub }],
         chart: { points:[{x:'Month 1', y:Number}...], yMax, caption, aria },
         donut: { segments:[{ label, value, colour }], caption, aria },
         table: { caption, columns:[..], rows:[[..],..], trends:['up'|'down'|'flat'] }
       }
     Time axis carries an explicit PROJECTION badge (rendered here).
     ====================================================================== */
  function drawLineChart(panel, chart) {
    var W = 460, H = 180, padL = 8, padR = 8, padT = 14, padB = 26;
    var pts = chart.points || [];
    var yMax = chart.yMax || Math.max.apply(null, pts.map(function (p) { return p.y; })) * 1.15 || 1;
    var innerW = W - padL - padR, innerH = H - padT - padB;
    var coords = pts.map(function (p, i) {
      var x = padL + (pts.length === 1 ? innerW / 2 : (i / (pts.length - 1)) * innerW);
      var y = padT + innerH - (p.y / yMax) * innerH;
      return [x, y];
    });
    var linePath = coords.map(function (c, i) { return (i ? 'L' : 'M') + c[0].toFixed(1) + ' ' + c[1].toFixed(1); }).join(' ');
    var areaPath = linePath + ' L' + coords[coords.length - 1][0].toFixed(1) + ' ' + (padT + innerH) +
      ' L' + coords[0][0].toFixed(1) + ' ' + (padT + innerH) + ' Z';
    var grids = '';
    for (var g = 0; g <= 3; g++) { var gy = padT + (innerH / 3) * g; grids += '<line class="chart-grid" x1="' + padL + '" y1="' + gy.toFixed(1) + '" x2="' + (W - padR) + '" y2="' + gy.toFixed(1) + '"/>'; }
    var axis = pts.map(function (p, i) {
      var anchor = i === 0 ? 'start' : (i === pts.length - 1 ? 'end' : 'middle');
      return '<text class="chart-axis" x="' + coords[i][0].toFixed(1) + '" y="' + (H - 8) + '" text-anchor="' + anchor + '">' + esc(p.x) + '</text>';
    }).join('');
    var dots = coords.map(function (c) { return '<circle class="chart-dot" cx="' + c[0].toFixed(1) + '" cy="' + c[1].toFixed(1) + '" r="3"/>'; }).join('');

    var svg =
      '<svg class="dash__svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' +
      esc(chart.aria || 'Illustrative projection line chart, Month 1 to Month 6') + '">' +
      '<defs><linearGradient id="chartFade" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="#D97757" stop-opacity="0.28"/>' +
      '<stop offset="100%" stop-color="#D97757" stop-opacity="0"/></linearGradient></defs>' +
      grids +
      '<path class="chart-area" d="' + areaPath + '" style="opacity:0;transition:opacity .6s ease .6s"/>' +
      '<path class="chart-line" d="' + linePath + '"/>' +
      '<g class="chart-dots" style="opacity:0;transition:opacity .5s ease .9s">' + dots + '</g>' +
      axis + '</svg>';

    var holder = el('div'); holder.innerHTML = svg;
    panel.appendChild(holder.firstChild);

    var lineEl = $('.chart-line', panel);
    var areaEl = $('.chart-area', panel);
    var dotsEl = $('.chart-dots', panel);
    var len = lineEl.getTotalLength ? lineEl.getTotalLength() : 600;

    function reveal() { areaEl.style.opacity = '0.5'; dotsEl.style.opacity = '1'; }
    if (REDUCED) {
      lineEl.style.strokeDasharray = 'none'; reveal();
    } else {
      lineEl.style.strokeDasharray = len; lineEl.style.strokeDashoffset = len;
      lineEl.style.transition = 'stroke-dashoffset 1.3s cubic-bezier(.16,1,.3,1)';
      requestAnimationFrame(function () { requestAnimationFrame(function () { lineEl.style.strokeDashoffset = '0'; }); });
      reveal();
    }
  }

  function drawDonut(panel, donut) {
    var R = 54, C = 2 * Math.PI * R, total = 0, i;
    var segs = donut.segments || [];
    for (i = 0; i < segs.length; i++) total += segs[i].value;
    total = total || 1;
    var offsetAcc = 0;
    var ring = '';
    segs.forEach(function (s) {
      var frac = s.value / total;
      var dash = frac * C;
      ring += '<circle class="donut__seg" r="' + R + '" cx="70" cy="70" stroke="' + esc(s.colour) + '" ' +
        'stroke-dasharray="0 ' + C.toFixed(2) + '" data-dash="' + dash.toFixed(2) + '" ' +
        'style="transform-origin:70px 70px;transform:rotate(' + (offsetAcc / total * 360).toFixed(2) + 'deg)"/>';
      offsetAcc += s.value;
    });
    var legend = segs.map(function (s) {
      return '<li><span class="donut-legend__dot" style="background:' + esc(s.colour) + '"></span>' +
        esc(s.label) + '<span class="donut-legend__val">' + Math.round(s.value / total * 100) + '%</span></li>';
    }).join('');

    var wrap = el('div', 'donut-wrap');
    wrap.innerHTML =
      '<svg class="donut" width="140" height="140" viewBox="0 0 140 140" role="img" aria-label="' +
      esc(donut.aria || 'Illustrative channel mix donut chart') + '">' +
      '<circle class="donut__track" r="' + R + '" cx="70" cy="70"/>' + ring + '</svg>' +
      '<ul class="donut-legend">' + legend + '</ul>';
    panel.appendChild(wrap);

    var segEls = $$('.donut__seg', wrap);
    segEls.forEach(function (segEl) {
      var dash = segEl.getAttribute('data-dash');
      if (REDUCED) { segEl.setAttribute('stroke-dasharray', dash + ' ' + (C - dash).toFixed(2)); }
      else {
        segEl.style.transition = 'stroke-dasharray 1.1s cubic-bezier(.16,1,.3,1)';
        requestAnimationFrame(function () { requestAnimationFrame(function () {
          segEl.setAttribute('stroke-dasharray', dash + ' ' + (C - dash).toFixed(2));
        }); });
      }
    });
  }

  function buildTable(t) {
    var head = '<tr>' + t.columns.map(function (c) { return '<th scope="col">' + esc(c) + '</th>'; }).join('') + '</tr>';
    var rows = t.rows.map(function (r, ri) {
      var trend = (t.trends && t.trends[ri]) || 'flat';
      var sym = trend === 'up' ? '▲' : (trend === 'down' ? '▼' : '–');
      var cells = r.map(function (cell, ci) {
        var last = ci === r.length - 1;
        if (last) return '<td><span class="num">' + esc(cell) + '</span> <span class="wh-trend wh-trend--' + trend + '">' + sym + '</span></td>';
        return '<td>' + (ci === 0 ? esc(cell) : '<span class="num">' + esc(cell) + '</span>') + '</td>';
      }).join('');
      return '<tr>' + cells + '</tr>';
    }).join('');
    var tableEl = el('table', 'whtable');
    tableEl.innerHTML = (t.caption ? '<caption>' + esc(t.caption) + '</caption>' : '') +
      '<thead>' + head + '</thead><tbody>' + rows + '</tbody>';
    return tableEl;
  }

  function initDashboard(root, data) {
    if (!root || !data) return;
    root.classList.add('dash');
    root.setAttribute('role', 'group');
    root.setAttribute('aria-label', data.aria || 'Illustrative dashboard — sample data, not a real client');

    var bar = el('div', 'dash__bar');
    bar.innerHTML = '<span class="dash__bar-dot"></span><span class="dash__bar-title">' + esc(data.title || 'Dashboard — sample') + '</span>';
    root.appendChild(bar);

    if (data.kpis) {
      var kgrid = el('div', 'dash__kpis');
      data.kpis.forEach(function (k) {
        var kpi = el('div', 'kpi');
        kpi.innerHTML =
          '<div class="kpi__num"><span data-count="' + esc(k.value) + '" data-prefix="' + esc(k.prefix || '') + '" ' +
          'data-dec="' + (k.dec || 0) + '">' + esc(k.prefix || '') + '0</span>' +
          (k.suffix ? '<span class="unit">' + esc(k.suffix) + '</span>' : '') + '</div>' +
          '<div class="kpi__label">' + esc(k.label) + '</div>' +
          (k.sub ? '<div class="kpi__sub">' + esc(k.sub) + '</div>' : '');
        kgrid.appendChild(kpi);
      });
      root.appendChild(kgrid);
    }

    var charts = el('div', 'dash__charts');
    var chartPanel = el('div', 'dash__panel');
    chartPanel.innerHTML =
      '<div class="dash__panel-head"><span class="dash__panel-title">' + esc((data.chart && data.chart.caption) || 'Projection') + '</span>' +
      '<span class="dash__projection">Projection · not real history</span></div>';
    charts.appendChild(chartPanel);
    var donutPanel = el('div', 'dash__panel');
    donutPanel.innerHTML = '<div class="dash__panel-head"><span class="dash__panel-title">' + esc((data.donut && data.donut.caption) || 'Channel mix') + '</span></div>';
    charts.appendChild(donutPanel);
    root.appendChild(charts);

    var tableWrap = null;
    if (data.table) { tableWrap = el('div', 'dash__table-wrap'); tableWrap.appendChild(buildTable(data.table)); root.appendChild(tableWrap); }

    function activate() {
      $$('[data-count]', root).forEach(function (n, i) { delay(function () { runCount(n); }, i * 120); });
      if (data.chart) drawLineChart(chartPanel, data.chart);
      if (data.donut) drawDonut(donutPanel, data.donut);
      if (tableWrap) {
        var rows = $$('.whtable tbody tr', tableWrap);
        rows.forEach(function (r, i) { delay(function () { r.classList.add('is-on'); }, 400 + i * 90); });
      }
      track('demo_interact', { demo: 'dashboard', action: 'view' });
    }
    if (REDUCED || !('IntersectionObserver' in window)) { activate(); return; }
    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (e) { if (e.isIntersecting) { activate(); obs.unobserve(root); } });
    }, { threshold: 0.25 });
    io.observe(root);
  }
  window.IAA.initDashboard = initDashboard;

  /* =========================================================================
     (e) QUALIFY FORM — pure client-side gate. PASS -> Cal.com prefill redirect.
         FAIL -> gracious non-numeric soft-decline (no thresholds, no calendar).
         Honeypot + mailto fallback. Decline logic is a COURTESY filter, not security.
     Expected field names: company, website, revenue (select), tools (checkbox
     group name="tools"), role (select), honeypot name="company_url" in .qpot.
     opts: { calBase, mailto, passRevenue:['band-a',...], minTools:1, softSelector }
     ====================================================================== */
  function initQualifyForm(form, opts) {
    if (!form) return;
    opts = opts || {};
    var CAL = opts.calBase || 'https://cal.com/chad-pickard-integrateai';
    var MAILTO = opts.mailto || 'hello@integrate-ai.uk';
    var passRevenue = opts.passRevenue || ['band-a', 'band-b', 'band-c'];
    var minTools = opts.minTools == null ? 1 : opts.minTools;
    var soft = (opts.softSelector && $(opts.softSelector)) || $('#soft-decline') || (form.parentNode && form.parentNode.querySelector('.soft-decline'));

    function fieldEl(name) { return form.querySelector('[name="' + name + '"]'); }
    function setError(name, msg) {
      var input = fieldEl(name);
      if (!input) return;
      var field = input.closest('.qfield') || input.parentNode;
      field.classList.add('has-error');
      input.setAttribute('aria-invalid', 'true');
      var errEl = field.querySelector('.qfield__error');
      if (errEl) errEl.textContent = msg;
    }
    function clearError(name) {
      var input = fieldEl(name);
      if (!input) return;
      var field = input.closest('.qfield') || input.parentNode;
      field.classList.remove('has-error');
      input.removeAttribute('aria-invalid');
    }
    function getTools() {
      return $$('input[name="tools"]:checked', form).map(function (c) { return c.value; });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var pot = fieldEl('company_url');
      if (pot && pot.value) return; // honeypot — silent drop

      var data = {
        company: (fieldEl('company') && fieldEl('company').value || '').trim(),
        website: (fieldEl('website') && fieldEl('website').value || '').trim(),
        revenue: (fieldEl('revenue') && fieldEl('revenue').value || ''),
        role: (fieldEl('role') && fieldEl('role').value || ''),
        tools: getTools()
      };

      var ok = true;
      ['company', 'website', 'revenue', 'role'].forEach(function (n) { clearError(n); });
      if (!data.company) { setError('company', 'Please tell us your company name.'); ok = false; }
      if (!data.website) { setError('website', 'Please add your website.'); ok = false; }
      if (!data.revenue) { setError('revenue', 'Please choose a range.'); ok = false; }
      if (!data.role) { setError('role', 'Please choose your role.'); ok = false; }
      if (!ok) {
        var firstErr = form.querySelector('.qfield.has-error [name]');
        if (firstErr) firstErr.focus();
        return;
      }

      track('lead_form_submit', { revenue_band: data.revenue, tools_count: data.tools.length });

      var passes = passRevenue.indexOf(data.revenue) !== -1 && data.tools.length >= minTools;
      if (!passes) {
        if (soft) {
          soft.classList.add('is-on');
          soft.setAttribute('tabindex', '-1');
          soft.focus();
          soft.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block: 'center' });
        }
        return;
      }

      var params = new URLSearchParams();
      params.set('name', data.company);
      params.set('company', data.company);
      params.set('website', data.website);
      params.set('revenue', data.revenue);
      params.set('role', data.role);
      params.set('tools', data.tools.join(', '));
      var calUrl = CAL + '?' + params.toString();

      var subject = 'Diagnostic enquiry — ' + data.company;
      var bodyLines = [
        'Company: ' + data.company,
        'Website: ' + data.website,
        'Monthly revenue band: ' + data.revenue,
        'Role: ' + data.role,
        'Tools used: ' + (data.tools.join(', ') || '—')
      ];
      var mailtoUrl = 'mailto:' + MAILTO + '?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(bodyLines.join('\n'));

      track('cta_book_click', { source: 'qualify_form' });
      try {
        window.location.href = calUrl;
        window.setTimeout(function () {
          var fb = $('#cal-fallback');
          if (fb) { fb.href = mailtoUrl; fb.style.display = 'inline-flex'; }
        }, 2500);
      } catch (err) {
        window.location.href = mailtoUrl;
      }
    });

    $$('[name]', form).forEach(function (input) {
      input.addEventListener('input', function () { clearError(input.getAttribute('name')); });
      input.addEventListener('change', function () { clearError(input.getAttribute('name')); });
    });
  }
  window.IAA.initQualifyForm = initQualifyForm;

  /* =========================================================================
     (f) COOKIE CONSENT -> GA4 gate (default analytics OFF)
     Markup: #cookie with [data-cookie-accept] and [data-cookie-decline].
     ====================================================================== */
  function loadGA() {
    if (window.__gaLoaded) return; window.__gaLoaded = true;
    var s = document.createElement('script');
    s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA_ID, { anonymize_ip: true });
  }
  function initCookie() {
    var banner = $('#cookie');
    var KEY = 'iaa_consent';
    var stored = null;
    try { stored = localStorage.getItem(KEY); } catch (e) {}
    if (stored === 'granted') { loadGA(); return; }
    if (stored === 'denied') { return; }
    if (!banner) return;
    delay(function () { banner.classList.add('is-shown'); }, 900);
    var accept = $('[data-cookie-accept]', banner);
    var decline = $('[data-cookie-decline]', banner);
    function close() { banner.classList.remove('is-shown'); }
    if (accept) accept.addEventListener('click', function () { try { localStorage.setItem(KEY, 'granted'); } catch (e) {} loadGA(); close(); });
    if (decline) decline.addEventListener('click', function () { try { localStorage.setItem(KEY, 'denied'); } catch (e) {} close(); });
  }

  /* =========================================================================
     (g) NAV scroll state + mobile toggle + scroll-progress bar
     ====================================================================== */
  function initNav() {
    var nav = $('#nav'), toggle = $('#nav-toggle'), mobile = $('#nav-mobile'), progress = $('#scroll-progress');
    var ticking = false;
    function onScroll() {
      if (ticking) return; ticking = true;
      requestAnimationFrame(function () {
        var y = window.scrollY || window.pageYOffset;
        if (nav) nav.classList.toggle('is-scrolled', y > 20);
        if (progress) {
          var d = document.documentElement.scrollHeight - window.innerHeight;
          progress.style.width = (d > 0 ? (y / d) * 100 : 0) + '%';
        }
        ticking = false;
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    if (toggle && mobile) {
      function setOpen(open) {
        toggle.classList.toggle('is-open', open);
        mobile.classList.toggle('is-open', open);
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        document.body.style.overflow = open ? 'hidden' : '';
      }
      toggle.addEventListener('click', function () { setOpen(!mobile.classList.contains('is-open')); });
      $$('a', mobile).forEach(function (a) { a.addEventListener('click', function () { setOpen(false); }); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && mobile.classList.contains('is-open')) setOpen(false); });
    }

    $$('[data-track="cta_book_click"]').forEach(function (b) {
      b.addEventListener('click', function () { track('cta_book_click', { source: b.getAttribute('data-cta-source') || 'nav' }); });
    });
  }

  /* =========================================================================
     (h) HERO SHIMMER — one pass when hero enters (draw-once)
     ====================================================================== */
  function initHeroShimmer() {
    var h = $('[data-hero-shimmer]');
    if (!h || REDUCED) return;
    delay(function () {
      h.classList.add('is-animating');
      h.addEventListener('animationend', function () { h.classList.remove('hero-shimmer', 'is-animating'); });
    }, 500);
  }

  /* =========================================================================
     BOOT
     ====================================================================== */
  function boot() {
    initNav();
    initReveal();
    initCountUps();
    initCookie();
    initHeroShimmer();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

})(window, document);
