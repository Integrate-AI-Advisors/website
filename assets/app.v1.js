/* IntegrateAI Dawn — behaviour layer.
   House rules: one animation loop allowed (hero canvas), paused when hidden;
   reduced-motion renders a single static frame; everything else draw-once. */
(function () {
  'use strict';

  var motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- Scroll reveal (draw-once) ---------- */
  var revealed = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealed.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    revealed.forEach(function (el) { io.observe(el); });
  } else {
    revealed.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------- Sticky nav (clone appears after hero scrolls out) ---------- */
  var nav = document.querySelector('.nav');
  var hero = document.querySelector('.hero');
  if (nav && hero) {
    var stuck = nav.cloneNode(true);
    stuck.classList.add('nav--stuck');
    stuck.removeAttribute('id');
    document.body.appendChild(stuck);
    var heroIO = new IntersectionObserver(function (entries) {
      stuck.classList.toggle('is-shown', !entries[0].isIntersecting);
    }, { rootMargin: '-80px 0px 0px 0px' });
    heroIO.observe(hero);
    wireBurger(stuck);
  }

  /* ---------- Mobile drawer ---------- */
  var drawer = document.getElementById('drawer');
  function wireBurger(scope) {
    var burger = scope.querySelector('.nav__burger');
    if (!burger || !drawer) return;
    burger.addEventListener('click', function () { openDrawer(burger); });
  }
  function openDrawer(burger) {
    drawer.classList.add('is-open');
    burger.setAttribute('aria-expanded', 'true');
    var close = drawer.querySelector('.drawer__close');
    var links = drawer.querySelectorAll('a, button');
    (close || links[0]).focus();
    function shut() {
      drawer.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
      burger.focus();
      drawer.removeEventListener('keydown', onKey);
    }
    function onKey(e) {
      if (e.key === 'Escape') shut();
      if (e.key === 'Tab') { /* simple focus trap */
        var first = links[0], last = links[links.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
    drawer.addEventListener('keydown', onKey);
    if (close) close.onclick = shut;
    drawer.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', shut, { once: true }); });
  }
  wireBurger(document);

  /* ---------- Hero canvas: drifting sparks (the one allowed loop) ---------- */
  var canvas = document.querySelector('.hero__canvas');
  var network = document.querySelector('.hero__network');
  if (canvas && network && canvas.getContext) {
    var ctx = canvas.getContext('2d');
    var DPR = Math.min(window.devicePixelRatio || 1, 2);
    var particles = [];
    var running = false;
    var rafId = null;
    var lastT = 0;
    var inView = true;

    function size() {
      var r = network.getBoundingClientRect();
      canvas.width = Math.round(r.width * DPR);
      canvas.height = Math.round(r.height * DPR);
      canvas.style.width = r.width + 'px';
      canvas.style.height = r.height + 'px';
      seed(r.width, r.height);
    }

    function seed(w, h) {
      var count = Math.round(Math.min(46, Math.max(18, (w * h) / 22000)));
      particles = [];
      for (var i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * w, y: Math.random() * h,
          r: 0.6 + Math.random() * 1.6,
          a: 0.25 + Math.random() * 0.55,
          vx: (Math.random() - 0.5) * 6,   /* px per second */
          vy: (Math.random() - 0.5) * 6,
          tw: Math.random() * Math.PI * 2  /* twinkle phase */
        });
      }
    }

    function frame(t) {
      if (!running) return;
      var dt = Math.min((t - lastT) / 1000, 0.05); /* time-delta based — Low Power safe */
      lastT = t;
      var w = canvas.width / DPR, h = canvas.height / DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#FFF4DC';
      particles.forEach(function (p) {
        p.x += p.vx * dt; p.y += p.vy * dt; p.tw += dt * 1.4;
        if (p.x < -4) p.x = w + 4; if (p.x > w + 4) p.x = -4;
        if (p.y < -4) p.y = h + 4; if (p.y > h + 4) p.y = -4;
        ctx.globalAlpha = p.a * (0.65 + 0.35 * Math.sin(p.tw));
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill();
      });
      ctx.globalAlpha = 1;
      rafId = requestAnimationFrame(frame);
    }

    function staticFrame() {
      var w = canvas.width / DPR, h = canvas.height / DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#FFF4DC';
      particles.forEach(function (p) {
        ctx.globalAlpha = p.a;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill();
      });
      ctx.globalAlpha = 1;
    }

    function start() {
      if (running || motionQuery.matches || !inView || document.hidden) return;
      running = true; lastT = performance.now();
      rafId = requestAnimationFrame(frame);
    }
    function stop() {
      running = false;
      if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    }
    function apply() {
      if (motionQuery.matches) { stop(); staticFrame(); } else { start(); }
    }

    size(); apply();

    var resizeT;
    window.addEventListener('resize', function () {
      clearTimeout(resizeT);
      resizeT = setTimeout(function () { size(); apply(); }, 180);
    }, { passive: true });
    document.addEventListener('visibilitychange', function () {
      document.hidden ? stop() : apply();
    });
    new IntersectionObserver(function (entries) {
      inView = entries[0].isIntersecting;
      inView ? apply() : stop();
    }).observe(network);
    motionQuery.addEventListener('change', apply);
  }

  /* ---------- §02 dashboard demo: count-ups, line draw, insight stagger.
     Markup carries the FINISHED state (no-JS law); this only animates it in.
     Draw-once; the sole loop (risk-dot breathe) is CSS, gated by .is-live. */
  document.querySelectorAll('.dash').forEach(function (dash) {
    var counts = dash.querySelectorAll('[data-count]');
    var line = dash.querySelector('.chart-line');
    var extras = dash.querySelectorAll('.chart-area, .chart-dots');
    var insights = dash.querySelectorAll('.insight');
    var played = false;

    function countUp(el) {
      var target = parseFloat(el.getAttribute('data-count')) || 0;
      var pre = el.getAttribute('data-prefix') || '';
      var suf = el.getAttribute('data-suffix') || '';
      var t0 = performance.now(), dur = 1100;
      (function tick(now) {
        var t = Math.min((now - t0) / dur, 1);
        var e = 1 - Math.pow(1 - t, 3);
        el.textContent = pre + Math.round(target * e) + suf;
        if (t < 1) requestAnimationFrame(tick);
      })(t0);
    }
    function play() {
      if (played) return; played = true;
      counts.forEach(function (el, i) { setTimeout(function () { countUp(el); }, i * 130); });
      if (line) {
        requestAnimationFrame(function () { requestAnimationFrame(function () {
          line.style.transition = 'stroke-dashoffset 1.2s cubic-bezier(.16,1,.3,1)';
          line.style.strokeDashoffset = '0';
          extras.forEach(function (el) { el.style.transition = 'opacity .6s ease .7s'; el.style.opacity = '1'; });
        }); });
      }
      insights.forEach(function (el, i) { setTimeout(function () { el.classList.add('is-on'); }, 450 + i * 160); });
    }
    function showFinal() { insights.forEach(function (el) { el.classList.add('is-on'); }); }

    if (motionQuery.matches || !('IntersectionObserver' in window)) { showFinal(); return; }
    /* hide chart before first view so scroll-in draws it (values stay in DOM) */
    if (line) {
      var len = line.getTotalLength();
      line.style.strokeDasharray = len;
      line.style.strokeDashoffset = len;
      extras.forEach(function (el) { el.style.opacity = '0'; });
    }
    new IntersectionObserver(function (entries) {
      dash.classList.toggle('is-live', entries[0].isIntersecting);
      if (entries[0].isIntersecting) play();
    }, { threshold: 0.3 }).observe(dash);
  });

  /* ---------- Approvals simulator: auto-cycling Slack + queue loop.
     The markup ships the FINISHED conversation (the no-JS / reduced-motion
     state); this engine rebuilds it and plays 3 sample scenarios forever.
     Strictly sequential — one pending step at a time — so pausing off-viewport
     (IO) is safe. Buttons are real; a click takes over from the autopilot.
     All content below is static + fictional (Northwind), built via textContent. */
  var sim = document.querySelector('[data-sim]');
  if (sim && !motionQuery.matches && 'IntersectionObserver' in window) {
    var simThread = sim.querySelector('.sim__thread');
    var simQueue = sim.querySelector('.sim__queue-body');
    var simLive = sim.querySelector('.sim__live');

    var SCN = [
      {
        who: 'IntegrateAI · Wholesale', origin: 'Proactive', chip: 'Send', time: '07:15',
        msg: 'The Bridge Café usually reorders every two weeks — it’s been five. That pattern normally means drift, not a lost customer. I’ve drafted a friendly check-in from you; it’s in your approvals.',
        tone: 'amber', risk: 'Needs your sign-off — it messages a customer',
        title: 'Send a check-in to The Bridge Café',
        detail: 'A short, warm note from you: it’s been a while, here’s what’s roasting this month — shall we add your usual to the next delivery round?',
        facts: ['Last order: 35 days', 'Usual: every 14', 'Nothing sends without you'],
        auto: 'changes',
        founderSays: 'Warmer, please — and mention the new seasonal espresso.',
        redraftNote: 'Rewriting — warmer tone, seasonal espresso added…',
        v2title: 'Send the warmer check-in to The Bridge Café',
        v2detail: 'Friendlier opening, a line on the new seasonal espresso, and an offer to add their usual to the next delivery round.',
        redraftMsg: 'Done — warmer tone, and a line on the new seasonal espresso. The revised draft is in your approvals.',
        doneLabel: 'Approved — sent, and posted back to the thread',
        confirm: 'Sent to The Bridge Café. I’ll flag their reply the moment it lands.'
      },
      {
        who: 'IntegrateAI · Finance', origin: 'You asked', chip: 'Pay', time: '08:02',
        founderAsk: 'Can you sort the green-coffee invoice from the importer?',
        msg: 'Found it — £1,840, due Friday. It matches the purchase order and the delivery note, so payment is staged in your approvals.',
        tone: 'red', risk: 'Needs your sign-off — money leaves the account',
        title: 'Pay the importer’s invoice — £1,840',
        detail: 'Checked against PO #4471 and the goods-received note; both line up. Paying today avoids the £92 late fee.',
        facts: ['£1,840.00', 'Matches PO #4471', 'Late fee avoided: £92'],
        auto: 'approve',
        doneLabel: 'Approved — paid, and logged in your books',
        confirm: 'Paid — £1,840 to the importer, reference logged against PO #4471.'
      },
      {
        who: 'IntegrateAI · Operations', origin: 'Proactive', chip: 'Update', time: '06:48',
        msg: 'The roaster sat idle for 90 minutes between yesterday’s batches. Grouping next week’s wholesale runs would save gas and an hour of operator time.',
        tone: 'green', risk: 'Low risk — a schedule change, nothing is sent',
        title: 'Tighten next week’s roast schedule',
        detail: 'Two wholesale runs grouped into one afternoon. Saves roughly £38 a run — and your head roaster confirms before anything moves.',
        facts: ['~90 min idle', 'Saving ≈ £38/run', 'No customer impact'],
        auto: 'approve',
        doneLabel: 'Approved — schedule updated',
        confirm: 'Schedule updated and left with your head roaster to confirm.'
      }
    ];

    var simTimer = null, nextStep = null, simRunning = false, scnIdx = 0;
    function step(fn, ms) {
      nextStep = fn;
      window.clearTimeout(simTimer);
      if (simRunning) simTimer = window.setTimeout(function () { nextStep = null; fn(); }, ms);
    }
    function halt() { simRunning = false; window.clearTimeout(simTimer); }
    function go() {
      if (simRunning) return;
      simRunning = true;
      if (nextStep) { var fn = nextStep; nextStep = null; simTimer = window.setTimeout(fn, 600); }
    }
    function cancelAuto() { window.clearTimeout(simTimer); nextStep = null; }

    function make(tag, cls, text) {
      var n = document.createElement(tag);
      if (cls) n.className = cls;
      if (text != null) n.textContent = text;
      return n;
    }
    function say(text) { if (simLive) simLive.textContent = text; }
    function bump(t, mins) {
      var p = t.split(':'), m = parseInt(p[0], 10) * 60 + parseInt(p[1], 10) + mins;
      var h = Math.floor(m / 60) % 24, mm = m % 60;
      return (h < 10 ? '0' : '') + h + ':' + (mm < 10 ? '0' : '') + mm;
    }

    function addMsg(opts) {
      var m = make('div', 'msg' + (opts.you ? ' msg--you' : '') + (opts.confirm ? ' msg--confirm' : ''));
      m.appendChild(make('span', 'msg__avatar'));
      var body = make('div', 'msg__body');
      var meta = make('p', 'msg__meta');
      meta.appendChild(make('b', null, opts.you ? 'You' : opts.who));
      if (!opts.you) meta.appendChild(make('span', 'msg__badge', 'app'));
      meta.appendChild(make('time', null, opts.time));
      body.appendChild(meta);
      if (opts.typing) {
        var ty = make('p', 'msg__typing');
        ty.appendChild(make('span')); ty.appendChild(make('span')); ty.appendChild(make('span'));
        body.appendChild(ty);
      } else {
        body.appendChild(make('p', 'msg__text', opts.text));
      }
      m.appendChild(body);
      simThread.appendChild(m);
      while (simThread.children.length > 8) simThread.removeChild(simThread.firstChild);
      requestAnimationFrame(function () { requestAnimationFrame(function () { m.classList.add('is-on'); }); });
      return m;
    }

    function buildCard(s) {
      var c = make('div', 'simcard simcard--' + s.tone);
      var strip = make('p', 'simcard__strip');
      strip.appendChild(make('span', 'simcard__chip', s.chip));
      strip.appendChild(make('span', 'simcard__origin', s.origin));
      c.appendChild(strip);
      c.appendChild(make('p', 'simcard__risk', s.risk));
      var title = make('p', 'simcard__title', s.title);
      var detail = make('p', 'simcard__detail', s.detail);
      c.appendChild(title); c.appendChild(detail);
      var facts = make('p', 'simcard__facts');
      s.facts.forEach(function (f) { facts.appendChild(make('span', null, f)); });
      c.appendChild(facts);
      var actions = make('div', 'simcard__actions');
      var btnA = make('button', 'simbtn simbtn--approve', 'Approve');
      var btnC = make('button', 'simbtn', 'Request changes');
      var btnD = make('button', 'simbtn', 'Decline');
      [btnA, btnC, btnD].forEach(function (b) { b.type = 'button'; actions.appendChild(b); });
      c.appendChild(actions);
      var note = make('p', 'simcard__note');
      c.appendChild(note);
      var exec = make('p', 'simcard__exec');
      var track = make('span', 'simcard__exec-track');
      var fill = make('span', 'simcard__exec-fill');
      track.appendChild(fill);
      exec.appendChild(track);
      exec.appendChild(document.createTextNode('Working…'));
      c.appendChild(exec);
      var done = make('p', 'simcard__done');
      var svgNS = 'http://www.w3.org/2000/svg';
      var svg = document.createElementNS(svgNS, 'svg');
      svg.setAttribute('viewBox', '0 0 16 16');
      svg.setAttribute('aria-hidden', 'true');
      var path = document.createElementNS(svgNS, 'path');
      path.setAttribute('d', 'M2.5 8.5l3.5 3.5 7.5-8');
      svg.appendChild(path);
      done.appendChild(svg);
      var doneText = make('span');
      done.appendChild(doneText);
      c.appendChild(done);
      return { root: c, title: title, detail: detail, actions: actions, note: note,
               exec: exec, fill: fill, done: done, doneText: doneText,
               btnA: btnA, btnC: btnC, btnD: btnD, finished: false, changed: false };
    }

    function doApprove(s, ui) {
      ui.finished = true;
      ui.actions.style.display = 'none';
      ui.note.classList.remove('is-on');
      ui.exec.classList.add('is-on');
      say('Approved. Working…');
      requestAnimationFrame(function () { requestAnimationFrame(function () { ui.fill.style.width = '100%'; }); });
      step(function () {
        ui.exec.classList.remove('is-on');
        ui.doneText.textContent = s.doneLabel;
        ui.done.classList.add('is-on');
        say('Done. Confirmation posted to the thread.');
        step(function () {
          addMsg({ who: s.who, time: bump(s.time, 6), text: s.confirm, confirm: true });
          step(nextScenario, 3200);
        }, 800);
      }, 1500);
    }

    function doChanges(s, ui) {
      ui.changed = true;
      ui.btnC.style.display = 'none';
      ui.actions.style.display = 'none';
      addMsg({ you: true, time: bump(s.time, 3), text: s.founderSays });
      ui.note.textContent = s.redraftNote;
      ui.note.classList.add('is-on');
      say('You asked for changes. Redrafting…');
      step(function () {
        var ty = addMsg({ who: s.who, time: bump(s.time, 4), typing: true });
        step(function () {
          if (ty.parentNode === simThread) simThread.removeChild(ty);
          addMsg({ who: s.who, time: bump(s.time, 4), text: s.redraftMsg });
          ui.note.classList.remove('is-on');
          ui.title.textContent = s.v2title;
          ui.detail.textContent = s.v2detail;
          ui.actions.style.display = '';
          say('Redrafted — the updated version is back in the queue.');
          step(function () {
            ui.btnA.classList.add('is-auto');
            step(function () {
              ui.btnA.classList.remove('is-auto');
              doApprove(s, ui);
            }, 380);
          }, 2400);
        }, 1500);
      }, 1000);
    }

    function doDecline(s, ui) {
      ui.finished = true;
      ui.actions.style.display = 'none';
      ui.note.classList.remove('is-on');
      ui.done.classList.add('is-neutral');
      ui.doneText.textContent = 'Declined — dropped. Nothing was actioned.';
      ui.done.classList.add('is-on');
      say('Declined. Nothing was actioned.');
      step(function () {
        addMsg({ who: s.who, time: bump(s.time, 3), text: 'Understood — dropped. Nothing was sent or changed.' });
        step(nextScenario, 2600);
      }, 700);
    }

    function showCard(s) {
      simQueue.textContent = '';
      var ui = buildCard(s);
      simQueue.appendChild(ui.root);
      requestAnimationFrame(function () { requestAnimationFrame(function () { ui.root.classList.add('is-on'); }); });

      function userAct(action) {
        if (ui.finished) return;
        cancelAuto();
        if (action === 'approve') doApprove(s, ui);
        else if (action === 'decline') doDecline(s, ui);
        else if (!ui.changed && s.founderSays) doChanges(s, ui);
        else doApprove(s, ui);
      }
      ui.btnA.addEventListener('click', function () { userAct('approve'); });
      ui.btnC.addEventListener('click', function () { userAct('changes'); });
      ui.btnD.addEventListener('click', function () { userAct('decline'); });
      if (!s.founderSays) ui.btnC.style.display = 'none';

      step(function () {
        var target = s.auto === 'changes' ? ui.btnC : ui.btnA;
        target.classList.add('is-auto');
        step(function () {
          target.classList.remove('is-auto');
          if (s.auto === 'changes') doChanges(s, ui); else doApprove(s, ui);
        }, 380);
      }, 2800);
    }

    function runScenario(s) {
      say('New request from ' + s.who + '.');
      if (s.founderAsk) {
        addMsg({ you: true, time: bump(s.time, -2), text: s.founderAsk });
        step(function () { showTyping(s); }, 1400);
      } else {
        showTyping(s);
      }
    }
    function showTyping(s) {
      var ty = addMsg({ who: s.who, time: s.time, typing: true });
      step(function () {
        if (ty.parentNode === simThread) simThread.removeChild(ty);
        addMsg({ who: s.who, time: s.time, text: s.msg });
        step(function () { showCard(s); }, 900);
      }, 1400);
    }
    function nextScenario() {
      var old = simQueue.firstChild;
      if (old) old.classList.add('is-leaving');
      step(function () {
        scnIdx = (scnIdx + 1) % SCN.length;
        runScenario(SCN[scnIdx]);
      }, 450);
    }

    var simStarted = false;
    new IntersectionObserver(function (entries) {
      var vis = entries[0].isIntersecting;
      sim.classList.toggle('is-paused', !vis);
      if (vis) {
        if (!simStarted) {
          simStarted = true;
          simThread.textContent = '';
          simQueue.textContent = '';
          simRunning = true;
          runScenario(SCN[0]);
        } else { go(); }
      } else { halt(); }
    }, { threshold: 0.2 }).observe(sim);
  }

  /* ---------- Soft-CTA form ---------- */
  var form = document.getElementById('sample-form');
  var status = document.getElementById('form-status');
  if (form && status) {
    var loadedAt = Date.now();
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = form.email.value.trim();
      var btn = form.querySelector('button[type=submit]');
      status.className = 'form-status';
      status.textContent = '';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
        status.textContent = "That email doesn't look right.";
        status.classList.add('is-error');
        form.email.setAttribute('aria-invalid', 'true');
        form.email.focus();
        return;
      }
      form.email.removeAttribute('aria-invalid');
      btn.disabled = true;
      status.textContent = 'Sending…';
      fetch(form.action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          company_website: form.company_website.value, /* honeypot */
          t: Date.now() - loadedAt                      /* min-time-on-page */
        })
      }).then(function (res) {
        if (!res.ok) throw new Error('http ' + res.status);
        while (form.firstChild) form.removeChild(form.firstChild);
        status.textContent = "It's on its way — check your inbox.";
        status.classList.add('is-success');
      }).catch(function () {
        btn.disabled = false;
        /* static fallback message, built with DOM methods (no innerHTML) */
        status.textContent = 'Something broke — email us at ';
        var a = document.createElement('a');
        a.href = 'mailto:hello@integrate-ai.uk';
        a.textContent = 'hello@integrate-ai.uk';
        status.appendChild(a);
        status.appendChild(document.createTextNode(' and we’ll send it by hand.'));
        status.classList.add('is-error');
      });
    });
  }
})();
