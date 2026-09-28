/* IntegrateAI · Signal 1.2 · the rest of the page. One plain vertical flow at every size; things animate once
   as they come into view, on their own clock, never tied to the scroll position. */
(function () {
  'use strict';
  var S = window.SIG;
  var $ = S.$, $$ = S.$$, clamp = S.clamp, map = S.map;

  /* ---------- nav: the dark tile grows into a bar once you start scrolling (time-based, same at every size) ---------- */
  S.nav = function () {
    var nav = $('.nav'), bar = $('.nav__bar', nav), bg = $('.nav__bg', nav), brand = $('.nav__brand', nav);
    var deck = $('.nav__deck', nav), word = $('.nav__word', nav), links = $('.nav__links', nav), cta = $('.nav__cta', nav);
    var prog = $('.nav__progress', nav);
    var m = {};
    function measure() {
      var bw = bar.clientWidth, bh = bar.clientHeight;
      var dl = brand.offsetLeft + deck.offsetLeft, dt = brand.offsetTop + deck.offsetTop, dw = deck.offsetWidth, dh = deck.offsetHeight;
      m.dx = bw / 2 - (dl + dw / 2);
      var l = dl + m.dx;
      m.t = dt; m.r = bw - l - dw; m.b = bh - dt - dh; m.l = l; m.rad = dw * 12.5 / 44;
    }
    measure();
    var clip = S.inset(bg, { t: m.t, r: m.r, b: m.b, l: m.l, rad: m.rad });
    var tl = gsap.timeline({ paused: true });
    tl.fromTo(brand, { x: function () { return m.dx; } }, { x: 0, ease: 'power3.inOut', duration: 0.9 }, 0)
      .fromTo(clip, { t: function () { return m.t; }, r: function () { return m.r; }, b: function () { return m.b; }, l: function () { return m.l; }, rad: function () { return m.rad; } }, { t: 0, r: 0, b: 0, l: 0, rad: 20, ease: 'power3.inOut', duration: 0.9, onUpdate: clip.apply }, 0)
      .fromTo(word, { autoAlpha: 0, x: -10 }, { autoAlpha: 1, x: 0, duration: 0.35, ease: 'power2.out' }, 0.45)
      .fromTo([links, cta], { autoAlpha: 0, y: -4 }, { autoAlpha: 1, y: 0, duration: 0.35, ease: 'power2.out', stagger: 0.06 }, 0.55);
    var open = null, raf = 0;
    function check() {
      raf = 0;
      var want = window.scrollY > 24 || nav.contains(document.activeElement);
      if (want === open) return;
      open = want;
      if (want) tl.timeScale(1).play(); else tl.timeScale(1.25).reverse();
    }
    function onScroll() {
      if (!raf) raf = requestAnimationFrame(check);
      var max = document.documentElement.scrollHeight - window.innerHeight;
      prog.style.setProperty('--p', max > 0 ? (window.scrollY / max).toFixed(4) : '0');
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    nav.addEventListener('focusin', check);
    nav.addEventListener('focusout', function () { setTimeout(check, 0); });
    window.addEventListener('resize', function () { var p = tl.progress(); measure(); tl.invalidate(); tl.progress(p); });
    onScroll(); check();
    // the link for the section you are in lights up
    $$('.nav__links a').forEach(function (a) {
      var t = $(a.getAttribute('href'));
      if (!t) return;
      ScrollTrigger.create({ trigger: t, start: 'top 50%', end: 'bottom 50%', onToggle: function (self) { a.classList.toggle('is-here', self.isActive); } });
    });
  };

  /* ---------- reveals ---------- */
  S.prepLines = function () {
    $$('[data-lines]').forEach(function (el) {
      el._lines = S.splitLines(el);
      gsap.set(el._lines.words, { yPercent: 118 });
    });
  };
  S.revealLines = function (el, delay) {
    if (!el._lines || el._shown) return;
    el._shown = true;
    var idx = el._lines.lineOf();
    gsap.to(el._lines.words, { yPercent: 0, duration: 1.05, ease: 'expo.out', delay: function (i) { return (delay || 0) + idx[i] * 0.085; } });
  };
  S.reveals = function () {
    $$('[data-split]').forEach(function (h) {
      if (h.closest('.goals')) return;
      var words = S.splitWords(h);
      var box = h.closest('.close__box');
      gsap.fromTo(words, { yPercent: 125 }, { yPercent: 0, duration: 1.1, ease: 'expo.out', stagger: 0.055, delay: box ? 0.15 : 0, scrollTrigger: { trigger: box || h, start: box ? 'top 92%' : 'top 88%', once: true } });
    });
    $$('[data-lines]').forEach(function (el) {
      if (el.closest('.hero')) return;
      ScrollTrigger.create({ trigger: el, start: 'top 90%', once: true, onEnter: function () { S.revealLines(el, 0.1); } });
    });
    $$('.sec__top').forEach(function (el) {
      if (el.closest('.goals')) return;
      gsap.fromTo(el, { '--rule': 0 }, { '--rule': 1, duration: 1.3, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 92%', once: true } });
      gsap.fromTo($$('.pill', el), { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'expo.out', stagger: 0.08, scrollTrigger: { trigger: el, start: 'top 92%', once: true } });
    });
  };

  /* ---------- team: tactile tiles, a floating Slack window, a hairline to whoever speaks ---------- */
  S.team = function () {
    var grid = $('.team__grid');
    if (!grid) return;
    var execs = $$('.exec', grid), chat = $('.chat', grid);
    var wire = $('.team__wire', grid), path = $('.team__path', wire), spark = $('.team__spark', wire);
    execs.forEach(function (ex) {
      var face = $('.exec__face', ex), sh = $('.exec__sheen', ex);
      if (!S.canHover()) return;
      var rx = gsap.quickTo(face, 'rotationX', { duration: 0.8, ease: 'power3.out' });
      var ry = gsap.quickTo(face, 'rotationY', { duration: 0.8, ease: 'power3.out' });
      ex.addEventListener('pointermove', function (e) {
        var r = ex.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        ry((px - 0.5) * 18); rx(-(py - 0.5) * 16);
        sh.style.setProperty('--mx', (px * 100) + '%'); sh.style.setProperty('--my', (py * 100) + '%');
      });
      ex.addEventListener('pointerleave', function () { rx(0); ry(0); });
      var letters = $$('.exec__mono b', ex);
      ex.addEventListener('pointerenter', function () {
        gsap.fromTo(letters, { yPercent: 0 }, { keyframes: [{ yPercent: -10, duration: 0.18, ease: 'power2.out' }, { yPercent: 0, duration: 0.7, ease: 'elastic.out(1, 0.5)' }], stagger: 0.05, overwrite: 'auto' });
      });
    });
    gsap.fromTo($$('.exec__face', grid), { rotationX: -38, z: -160, y: 40, autoAlpha: 0 }, { rotationX: 0, z: 0, y: 0, autoAlpha: 1, duration: 1.2, ease: 'expo.out', stagger: 0.07, scrollTrigger: { trigger: grid, start: 'top 88%', once: true } });
    var wide = window.matchMedia('(min-width: 1100px)').matches;
    gsap.fromTo(chat, { rotationY: -14, rotationX: 8, z: -120, autoAlpha: 0, transformPerspective: 1400 }, { rotationY: wide ? -4 : 0, rotationX: wide ? 2 : 0, z: 0, autoAlpha: 1, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: wide ? grid : chat, start: wide ? 'top 85%' : 'top 96%', once: true } });
    S.tilt(chat, { target: chat, max: 3 });

    function drawWire(fromEl, toEl) {
      var g = grid.getBoundingClientRect(), a = fromEl.getBoundingClientRect(), b = toEl.getBoundingClientRect();
      var side = b.left > a.right - 4;
      if (!side) return;
      var x1 = side ? a.right - g.left - 6 : a.left + a.width / 2 - g.left, y1 = side ? a.top + a.height * 0.3 - g.top : a.bottom - g.top - 6;
      var x2 = side ? b.left - g.left : b.left + 24 - g.left, y2 = side ? b.top + 22 - g.top : b.top - g.top;
      var d = side ? 'M' + x1 + ' ' + y1 + ' C ' + (x1 + 70) + ' ' + y1 + ', ' + (x2 - 70) + ' ' + y2 + ', ' + x2 + ' ' + y2
                   : 'M' + x1 + ' ' + y1 + ' C ' + x1 + ' ' + (y1 + 60) + ', ' + x2 + ' ' + (y2 - 60) + ', ' + x2 + ' ' + y2;
      path.setAttribute('d', d);
      var len = path.getTotalLength();
      path.style.strokeDasharray = len; path.style.strokeDashoffset = len;
      var p = { t: 0 };
      gsap.killTweensOf([path, spark, p]);
      gsap.set(path, { opacity: 1 });
      gsap.to(p, { t: 1, duration: 0.75, ease: 'power2.inOut', onUpdate: function () {
        path.style.strokeDashoffset = len * (1 - p.t);
        var pt = path.getPointAtLength(len * p.t); spark.setAttribute('cx', pt.x); spark.setAttribute('cy', pt.y); spark.style.opacity = 1;
      }, onComplete: function () { gsap.to(spark, { opacity: 0, duration: 0.3 }); } });
      gsap.to(path, { opacity: 0, duration: 0.6, delay: 1.6 });
    }

    var msgs = $$('.msg', grid);
    msgs.forEach(function (m) { gsap.set($('.msg__box', m), { autoAlpha: 0, scale: 0.92, y: 12 }); });
    var ct = gsap.timeline({ paused: true }), t = 0.25;
    msgs.forEach(function (m, i) {
      var typing = $('.typing', m), box = $('.msg__box', m), ex = $('.exec[data-exec="' + m.getAttribute('data-from') + '"]', grid);
      ct.fromTo(typing, { autoAlpha: 0, scale: 0.7 }, { autoAlpha: 1, scale: 1, duration: 0.4, ease: 'back.out(2)' }, t);
      if (ex) {
        var face = $('.exec__face', ex);
        ct.add(function () { ex.classList.add('is-speaking'); gsap.to(face, { z: 46, y: -10, duration: 0.7, ease: 'expo.out' }); drawWire(face, typing); }, t);
        ct.add(function () { ex.classList.remove('is-speaking'); gsap.to(face, { z: 0, y: 0, duration: 0.9, ease: 'expo.out' }); }, t + 2.2);
      }
      ct.to(typing, { autoAlpha: 0, scale: 0.85, duration: 0.18, ease: 'power2.in' }, t + 0.8);
      ct.to(box, { autoAlpha: 1, scale: 1, y: 0, duration: 0.7, ease: 'expo.out' }, t + 0.86);
      t += i === 0 ? 1.8 : 1.4;
    });
    ScrollTrigger.create({ trigger: grid, start: 'top 78%', once: true, onEnter: function () { ct.play(); } });
  };

  /* ---------- the order-rhythm dial (built for every JS mode) ---------- */
  S.buildDial = function () {
    var svg = $('.dial__svg');
    if (!svg) return null;
    var NS = 'http://www.w3.org/2000/svg', ticks = $('.dial__ticks', svg), orders = $('.dial__orders', svg);
    ticks.textContent = ''; orders.textContent = '';
    var R = 100, cx = 120, cy = 120, DAYS = 60;
    for (var d = 0; d < DAYS; d++) {
      var a = (d / DAYS) * Math.PI * 2 - Math.PI / 2, major = d % 7 === 0;
      var r1 = major ? 90 : 94, ln = document.createElementNS(NS, 'line');
      ln.setAttribute('x1', cx + Math.cos(a) * r1); ln.setAttribute('y1', cy + Math.sin(a) * r1);
      ln.setAttribute('x2', cx + Math.cos(a) * R); ln.setAttribute('y2', cy + Math.sin(a) * R);
      if (major) ln.setAttribute('class', 'is-major');
      ticks.appendChild(ln);
    }
    function at(day, r) { var a = (day / DAYS) * Math.PI * 2 - Math.PI / 2; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; }
    [[0, ''], [21, ''], [42, 'is-due']].forEach(function (o) {
      var p = at(o[0], 86), c = document.createElementNS(NS, 'circle');
      c.setAttribute('cx', p[0]); c.setAttribute('cy', p[1]); c.setAttribute('r', o[1] ? 6 : 7);
      if (o[1]) c.setAttribute('class', o[1]);
      orders.appendChild(c);
    });
    var gap = $('.dial__gap', svg), hand = $('.dial__hand', svg), big = $('[data-quiet]');
    function setQuiet(days) {
      var a0 = 21, a1 = 21 + days;
      var p0 = at(a0, 70), p1 = at(a1, 70), large = days > 30 ? 1 : 0;
      gap.setAttribute('d', days > 0.2 ? 'M' + p0[0] + ' ' + p0[1] + ' A 70 70 0 ' + large + ' 1 ' + p1[0] + ' ' + p1[1] : '');
      hand.setAttribute('transform', 'rotate(' + (a1 / DAYS * 360) + ' 120 120)');
      if (big) big.textContent = Math.round(days);
    }
    setQuiet(30);
    return { setQuiet: setQuiet };
  };

  /* ---------- goals: four stacked panels in light materials, each with a small crafted object ---------- */
  S.goals = function (dial) {
    var section = $('.goals');
    if (!section) return;
    var track = $('.goals__track', section);
    var panels = $$('.goal', track), intro = panels[0];
    var introWords = S.splitWords($('.h2', intro));

    function playObj(panel) {
      if (panel._played) return;
      panel._played = true;
      var tl = gsap.timeline();
      if (panel.classList.contains('goal--save')) {
        var c1 = $('.fan__card--1', panel), c2 = $('.fan__card--2', panel), c3 = $('.fan__card--3', panel);
        tl.fromTo([c3, c2], { y: 0, x: 0, z: -10, rotation: 0, scale: 1 }, { y: function (i) { return i ? -136 : -190; }, x: function (i) { return i ? 15 : 30; }, z: function (i) { return i ? -40 : -80; }, rotation: function (i) { return i ? -1.2 : -2.5; }, scale: function (i) { return i ? 0.97 : 0.94; }, duration: 1.1, ease: 'expo.out', stagger: 0.08 }, 0)
          .fromTo(c1, { rotationX: 38, z: 60, y: 20 }, { rotationX: 0, z: 0, y: 0, duration: 1.2, ease: 'expo.out' }, 0.05)
          .add(function () { S.switchOn($$('.st', c1)); }, 0.9);
      } else if (panel.classList.contains('goal--grow')) {
        var bars = $$('.box', panel);
        tl.fromTo(bars, { '--k': 0.02 }, { '--k': 1, duration: 1.3, ease: 'expo.out', stagger: 0.08 }, 0)
          .fromTo($('.iso__plane', panel), { autoAlpha: 0, y: -30 }, { autoAlpha: 1, y: 0, duration: 1, ease: 'expo.out' }, 0.45);
      } else if (panel.classList.contains('goal--eff')) {
        var grid = $('.fold__grid', panel), brief = $('.fold__brief', panel);
        tl.fromTo(grid, { x: -40, rotation: -6, scale: 1.05, autoAlpha: 0 }, { x: 0, rotation: 0, scale: 1, autoAlpha: 1, duration: 0.9, ease: 'expo.out' }, 0)
          .to(grid, { x: function () { return brief.offsetLeft - grid.offsetLeft - grid.offsetWidth * 0.2; }, scale: 0.34, rotation: 12, autoAlpha: 0, duration: 0.7, ease: 'power3.in' }, 0.9)
          .fromTo(brief, { autoAlpha: 0, scale: 0.9, rotationY: -20 }, { autoAlpha: 1, scale: 1, rotationY: 0, duration: 1, ease: 'expo.out' }, 1.4)
          .to(grid, { x: 0, scale: 0.86, rotation: -4, autoAlpha: 0.3, duration: 1.2, ease: 'expo.out' }, 1.8)
          .add(function () { S.switchOn($$('.st', brief)); }, 2.0);
      } else if (panel.classList.contains('goal--keep')) {
        var q = { d: 0 }, disc = $('.dial__disc', panel);
        tl.fromTo(disc, { rotationZ: -40, rotationX: 60 }, { rotationZ: -8, rotationX: 38, duration: 1.4, ease: 'expo.out' }, 0)
          .to(q, { d: 30, duration: 1.8, ease: 'power2.inOut', onUpdate: function () { if (dial) dial.setQuiet(q.d); } }, 0.2)
          .add(function () { S.switchOn($$('.dial__label .st', panel)); }, 1.9);
      }
    }
    // starting states for the objects
    panels.slice(1).forEach(function (p) {
      if (p.classList.contains('goal--keep') && dial) dial.setQuiet(0);
      if (p.classList.contains('goal--grow')) gsap.set($$('.box', p), { '--k': 0.02 });
      if (p.classList.contains('goal--eff')) { gsap.set($('.fold__brief', p), { autoAlpha: 0 }); gsap.set($('.fold__grid', p), { autoAlpha: 0 }); }
      if (p.classList.contains('goal--save')) gsap.set($$('.fan__card--2, .fan__card--3', p), { y: 0, x: 0, z: -10, rotation: 0 });
    });

    // one panel after another; each comes up into place, then plays its object
    gsap.fromTo(introWords, { yPercent: 125 }, { yPercent: 0, duration: 1.1, ease: 'expo.out', stagger: 0.055, scrollTrigger: { trigger: intro, start: 'top 80%', once: true } });
    panels.slice(1).forEach(function (p) {
      var card = $('.goal__in', p), words = $$('.gw > span', p), bits = $$('.goal__sub, .goal__items li', p);
      gsap.fromTo(card, { rotationX: 8, y: 70, autoAlpha: 0, transformPerspective: 1600, transformOrigin: '50% 100%' }, { rotationX: 0, y: 0, autoAlpha: 1, duration: 1.3, ease: 'expo.out', scrollTrigger: { trigger: p, start: 'top 88%', once: true } });
      gsap.fromTo(words, { yPercent: 130 }, { yPercent: 0, duration: 1.1, ease: 'expo.out', stagger: 0.09, scrollTrigger: { trigger: p, start: 'top 76%', once: true } });
      gsap.fromTo(bits, { y: 26, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.9, ease: 'expo.out', stagger: 0.06, scrollTrigger: { trigger: p, start: 'top 66%', once: true } });
      ScrollTrigger.create({ trigger: $('.goal__obj', p), start: 'top 82%', once: true, onEnter: function () { playObj(p); } });
    });
  };

  /* ---------- joined up ---------- */
  S.joined = function () {
    $$('.jd').forEach(function (jd) { S.tilt(jd, { target: jd, max: 2.5 }); });
    var tl = $('.tl');
    if (tl) {
      var t = gsap.timeline({ paused: true });
      t.fromTo($$('.tl__track', tl), { '--draw': 0 }, { '--draw': 1, duration: 1.2, ease: 'power3.inOut', stagger: 0.1 }, 0)
        .fromTo($$('.tl__track i', tl), { scale: 0 }, { scale: 1, duration: 0.5, ease: 'back.out(2.2)', stagger: 0.022 }, 0.35)
        .fromTo($('.tl__gap', tl), { scaleX: 0, transformOrigin: '0% 50%' }, { scaleX: 1, duration: 1, ease: 'expo.out' }, 1.1)
        .fromTo($('.tl__note', tl), { autoAlpha: 0, y: 6 }, { autoAlpha: 1, y: 0, duration: 0.5 }, 1.2)
        .fromTo($('.jd--customer .jd__say'), { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.9, ease: 'power3.out' }, 1.3);
      ScrollTrigger.create({ trigger: tl, start: 'top 80%', once: true, onEnter: function () { t.play(); } });
    }
    var route = $('.route');
    if (route) {
      var t2 = gsap.timeline({ paused: true });
      t2.fromTo(route, { '--draw': 0, '--draw2': 0 }, { '--draw': 1, duration: 1.1, ease: 'power2.inOut' }, 0)
        .to(route, { '--draw2': 1, duration: 0.7, ease: 'power2.out' }, 1.05)
        .fromTo($$('.route__st', route), { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'expo.out', stagger: 0.3 }, 0.05)
        .fromTo($('.jd--order .jd__say'), { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power3.out' }, 1.4);
      ScrollTrigger.create({ trigger: route, start: 'top 85%', once: true, onEnter: function () { t2.play(); } });
    }
    var merge = $('.merge');
    if (merge) {
      var paths = $$('.merge__wires path', merge);
      paths.forEach(function (p) { p.setAttribute('pathLength', '100'); p.style.strokeDasharray = '100'; });
      var t3 = gsap.timeline({ paused: true });
      t3.fromTo($$('.merge__src li', merge), { x: -20, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.7, ease: 'expo.out', stagger: 0.1 }, 0)
        .fromTo(paths, { strokeDashoffset: 100 }, { strokeDashoffset: 0, duration: 0.9, ease: 'power2.inOut', stagger: 0.08 }, 0.3)
        .fromTo($('.merge__out', merge), { scale: 0.92, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.8, ease: 'expo.out' }, 1);
      ScrollTrigger.create({ trigger: merge, start: 'top 85%', once: true, onEnter: function () { t3.play(); } });
    }
  };

  /* ---------- you stay in charge: the "Your yes" illustration ---------- */
  S.charge = function (still) {
    var sec = $('.charge');
    if (!sec) return;
    var yes = $('.yes', sec), cards = $$('.yes__card', yes), tabs = $$('.yes__tab', yes), stmts = $$('.stmt', sec);
    var draft = $('.yes__card--draft', yes), key = $('.yes__key:not(.yes__key--locked)', draft), again = $('.yes__again', draft);
    var fly = $('.yes__mail-fly', draft), sent = $('.yes__sent', draft);
    var lockKey = $('.yes__key--locked', yes), lockHint = $('#lock-hint');
    var beat = -1, busy = false, stage = null;

    function setBeat(i, instant) {
      if (i === beat) return;
      beat = i;
      yes.setAttribute('data-beat', i);
      tabs.forEach(function (t, k) { t.setAttribute('aria-selected', k === i ? 'true' : 'false'); });
      if (stage) fit(instant);
      var st = cards[i] && cards[i].querySelector('.yes__hd .st');
      if (st) setTimeout(function () { st.classList.add('is-on'); }, still ? 0 : 700);
      cards.forEach(function (c, k) {
        var d = k === i ? 0 : (k < i ? i - k : k - i);
        var behind = k !== i;
        var v = { y: behind ? -16 * d : 0, z: behind ? -90 * d : 0, rotationX: behind ? 6 : 0, scale: behind ? 1 - 0.035 * d : 1, autoAlpha: behind ? Math.max(0, 0.7 - 0.3 * d) : 1, zIndex: 10 - d };
        c.setAttribute('aria-hidden', behind ? 'true' : 'false');
        S.$$('button', c).forEach(function (b) { b.tabIndex = behind ? -1 : 0; });
        if (instant || still) gsap.set(c, v);
        else gsap.to(c, Object.assign({ duration: 0.85, ease: 'expo.out', overwrite: 'auto' }, v));
      });
    }
    tabs.forEach(function (t, k) { t.addEventListener('click', function () { setBeat(k); }); });
    stage = $('.yes__stage', yes);
    function fit(instant) {
      var c = cards[Math.max(0, beat)]; if (!c) return;
      var h = c.offsetHeight + 34;
      if (instant || still) stage.style.height = h + 'px';
      else gsap.to(stage, { height: h, duration: 0.7, ease: 'expo.out', overwrite: 'auto' });
    }
    setBeat(1, true);
    fit(true); window.addEventListener('resize', function () { fit(true); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { fit(true); });

    function press(k) { k.classList.add('is-down'); setTimeout(function () { k.classList.remove('is-down'); }, 150); }
    key.addEventListener('click', function () {
      if (busy || draft.classList.contains('is-sent')) return;
      busy = true; press(key);
      if (still) { draft.classList.add('is-sent'); S.switchOn([sent]); busy = false; return; }
      var body = $$('.yes__body, .yes__mail', draft);
      var tl = gsap.timeline({ onComplete: function () { busy = false; } });
      tl.to(body, { y: -6, autoAlpha: 0.25, duration: 0.25, ease: 'power2.in' }, 0.1)
        .fromTo(fly, { autoAlpha: 0, x: 0, y: 0, scale: 0.6, rotation: 0 }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'back.out(2)' }, 0.2)
        .to(fly, { x: 300, y: -200, rotation: -14, scale: 0.35, autoAlpha: 0, duration: 0.75, ease: 'power3.in' }, 0.55)
        .to(draft, { y: -8, duration: 0.18, ease: 'power2.out', yoyo: true, repeat: 1 }, 0.5)
        .add(function () { draft.classList.add('is-sent'); gsap.set(body, { y: 0, autoAlpha: 1 }); }, 1.2)
        .fromTo(sent, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'expo.out' }, 1.2)
        .add(function () { S.switchOn([sent]); }, 1.45);
    });
    again.addEventListener('click', function () {
      draft.classList.remove('is-sent'); sent.classList.remove('is-on');
      key.focus({ preventScroll: true });
    });
    lockKey.addEventListener('click', function () {
      press(lockKey);
      if (still) return;
      gsap.fromTo(lockKey, { x: 0 }, { keyframes: [{ x: -7, duration: 0.06 }, { x: 6, duration: 0.07 }, { x: -4, duration: 0.07 }, { x: 0, duration: 0.1 }] });
      gsap.fromTo(lockHint, { color: '#191919' }, { color: '#6a6a6e', duration: 1.4, ease: 'power2.out' });
    });

    if (still) return;
    // the statements and the illustration each come up once as they enter; nothing follows the scroll
    gsap.fromTo(stmts, { y: 28, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1, ease: 'expo.out', stagger: 0.1, scrollTrigger: { trigger: stmts[0], start: 'top 88%', once: true } });
    gsap.fromTo(yes, { y: 60, autoAlpha: 0, rotationX: 10, transformPerspective: 1400 }, { y: 0, autoAlpha: 1, rotationX: 0, duration: 1.3, ease: 'expo.out', scrollTrigger: { trigger: yes, start: 'top 86%', once: true } });
  };

  /* ---------- price ---------- */
  S.price = function () {
    var num = $('.price__num');
    if (!num) return;
    var odo = S.makeOdo(num);
    var big = $('.price__big');
    S.tilt(big, { target: big, max: 3, sheen: $('.mc__sheen', big) });
    var t = gsap.timeline({ paused: true });
    t.add(function () { odo.play({ duration: 1.7, stagger: 0.12 }); }, 0)
      .fromTo('.price__unit', { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.9, ease: 'expo.out' }, 0.5)
      .fromTo('.price__deck', { autoAlpha: 0, scale: 0.8, rotation: -8, y: 20 }, { autoAlpha: 1, scale: 1, rotation: 0, y: 0, duration: 1.2, ease: 'expo.out' }, 0.3)
      .fromTo('.info__rows > div, .info__list li, .info__cta', { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.06 }, 0.5);
    ScrollTrigger.create({ trigger: '.price__grid', start: 'top 80%', once: true, onEnter: function () { t.play(); } });
  };

  /* ---------- the close: live 3D beads on the CSS deck tile, floating render tiles ---------- */
  S.closeOrb = function () {
    var sec = $('.close'), host = $('.close__orb'), cv = $('.close__canvas');
    if (!sec || !host) return;
    var two = S.makeOrb(cv);
    if (two) two.start();
    function make() {
      if (!window.IAOrb3D) return;
      var o = window.IAOrb3D.create(host, { theme: 'onDark', deck: false });
      o.ready.then(function (ok) { if (ok) { sec.classList.add('orb3d-on'); if (two) two.stop(); } });
      host.addEventListener('pointerenter', function () { o.pulse(0.7); });
    }
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { make(); io.disconnect(); } }, { rootMargin: '400px 0px' });
      io.observe(sec);
    } else make();
    var floats = $$('.float', sec), depthF = [1, 0.7, 0.85, 0.55];
    gsap.fromTo(floats, { autoAlpha: 0, scale: 0.7, y: 40, rotation: function (i) { return i % 2 ? 10 : -10; } }, { autoAlpha: 1, scale: 1, y: 0, rotation: function (i) { return i % 2 ? -3 : 3; }, duration: 1.4, ease: 'expo.out', stagger: 0.08, scrollTrigger: { trigger: sec, start: 'top 92%', once: true } });
    if (S.canHover()) {
      var qs = floats.map(function (f) { return [gsap.quickTo(f, 'x', { duration: 1.2, ease: 'power3.out' }), gsap.quickTo(f, 'yPercent', { duration: 1.2, ease: 'power3.out' })]; });
      sec.addEventListener('pointermove', function (e) {
        var r = sec.getBoundingClientRect(), px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
        qs.forEach(function (q, i) { q[0](-px * 26 * depthF[i]); q[1](-py * 10 * depthF[i]); });
      }, { passive: true });
    }
  };

  /* ---------- close and footer ---------- */
  S.close = function () {
    var box = $('.close__box');
    if (!box) return;
    gsap.fromTo($$('.close__eyebrow, .close__sub, .close__actions > *, .close__box .mail, .close__box .terms'), { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.9, ease: 'expo.out', stagger: 0.07, delay: 0.25, scrollTrigger: { trigger: box, start: 'top 92%', once: true } });
    gsap.fromTo('.close__orb', { scale: 0.8, rotation: -10, autoAlpha: 0 }, { scale: 1, rotation: 0, autoAlpha: 1, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: box, start: 'top 92%', once: true } });
  };
  S.footer = function () {
    var w = $('.foot__mask > span');
    if (!w) return;
    gsap.fromTo(w, { yPercent: 110 }, { yPercent: 0, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '.foot', start: 'top 90%', once: true } });
    gsap.fromTo('.foot__deck', { autoAlpha: 0, scale: 0.7, rotation: -12 }, { autoAlpha: 1, scale: 1, rotation: 0, duration: 1.3, ease: 'expo.out', scrollTrigger: { trigger: '.foot', start: 'top 90%', once: true } });
  };

  /* ---------- signals: switch on when seen. Never fade, never move. ---------- */
  S.signals = function () {
    var list = $$('.st, .dot').filter(function (el) {
      if (el.closest('.hero, .screen, .orbit__done, .yes, .goal__obj, .scene__orbit')) return false;
      if (el.classList.contains('dot') && el.closest('.st')) return false;
      return true;
    });
    if (!('IntersectionObserver' in window)) { S.switchOn(list); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target; io.unobserve(el);
        setTimeout(function () { el.classList.add('is-on'); }, 900);
      });
    }, { threshold: 0.9 });
    list.forEach(function (el) { io.observe(el); });
    // the "Needs you" in the constellation reports in as it floats
    var sc = $('.scene__orbit');
    if (sc) ScrollTrigger.create({ trigger: sc, start: 'top 70%', once: true, onEnter: function () { setTimeout(function () { S.switchOn($$('.orbit__card .st', sc)); }, 900); } });
  };

  /* ---------- in-page links glide (booking buttons are handled by the booking panel) ---------- */
  S.anchors = function (lenis) {
    $$('a[href^="#"]:not([data-book])').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href');
        if (id.length < 2) return;
        var t = $(id);
        if (!t) return;
        e.preventDefault();
        var top = id === '#top' ? 0 : t.getBoundingClientRect().top + window.scrollY - (id === '#goals' || id === '#one-screen' ? 0 : 84);
        if (lenis) lenis.scrollTo(top, { duration: 1.4 });
        else window.scrollTo({ top: top, behavior: 'smooth' });
        if (id === '#main') { t.setAttribute('tabindex', '-1'); t.focus({ preventScroll: true }); }
      });
    });
  };
})();
