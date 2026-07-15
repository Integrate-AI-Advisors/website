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
