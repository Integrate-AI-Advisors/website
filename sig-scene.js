/* IntegrateAI · Signal 1.1 · "One screen": the tools feed the orb, then we dive through it into mission control.
   Wide screens: one pinned composition, driven by scroll. The 3D orb (IAOrb3D) takes over when WebGL is ready;
   otherwise the 2D tile opens into the screen. Phones, no JS and reduced motion get a calm static layout. */
(function () {
  'use strict';
  var S = window.SIG;
  var $ = S.$, $$ = S.$$, clamp = S.clamp, lerp = S.lerp, map = S.map;

  // A faint dotted hairline under the screen header: the orb's woven band, unrolled. 44 columns, 3 fine lanes.
  S.makeMatrix = function (cv) {
    if (!cv || !cv.getContext) return null;
    var ctx = cv.getContext('2d'), dpr = Math.min(2, window.devicePixelRatio || 1), W = 0, H = 0;
    var reveal = 0, t0 = performance.now(), raf = 0, visible = false, live = false;
    function size() {
      var r = cv.getBoundingClientRect(); W = r.width || 600; H = r.height || 30;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function draw(sec) {
      var t = sec * 2.34 * 0.42;
      ctx.clearRect(0, 0, W, H);
      var lanes = [4, 5.5, 7];
      for (var s = 0; s < 44; s++) {
        var on = clamp(0, 1, (reveal * 56 - s) / 8);
        if (on <= 0) continue;
        var a = 2 * Math.PI * s / 44, x = 4 + s * (W - 8) / 43;
        var depth = 0.5 + 0.5 * Math.sin(a + 0.6);
        for (var k = 0; k < lanes.length; k++) {
          var l = lanes[k];
          var y = H / 2 + (l - 5.5) * H * 0.13 + (0.16 * Math.sin(3 * a - 1.7 * t + 0.22 * l) + 0.07 * Math.sin(5 * a + 1.1 * t)) * H * 0.9;
          var g = Math.round((0.72 - 0.3 * depth) * 255);
          ctx.fillStyle = 'rgba(' + g + ',' + g + ',' + g + ',' + ((0.22 + 0.4 * depth) * on).toFixed(3) + ')';
          ctx.beginPath(); ctx.arc(x, y, 0.7 + 0.5 * depth, 0, 6.2832); ctx.fill();
        }
      }
    }
    function loop(now) { draw((now - t0) / 1000); raf = requestAnimationFrame(loop); }
    function run() { if (!raf && visible && live && !document.hidden) raf = requestAnimationFrame(loop); }
    function halt() { if (raf) cancelAnimationFrame(raf); raf = 0; }
    size(); draw(0);
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) run(); else halt(); }).observe(cv);
    document.addEventListener('visibilitychange', function () { if (document.hidden) halt(); else run(); });
    window.addEventListener('resize', function () { size(); draw((performance.now() - t0) / 1000); });
    return {
      setReveal: function (v) { reveal = v; if (!raf) draw((performance.now() - t0) / 1000); },
      start: function () { live = true; run(); }
    };
  };

  S.scene = function () {
    var sec = $('.scene');
    if (!sec) return;
    var pin = $('.scene__pin', sec), copy = $('.scene__copy', sec), orbit = $('.scene__orbit', sec);
    var items = $$('.orbit__item', sec), svg = $('.orbit__lines', sec), deck = $('.orbit__deck', sec), gl = $('.orbit__gl', sec);
    var done = $('.orbit__done', sec), ocap = $('.orbit__cap', sec);
    var wrap = $('.screen-wrap', sec), screen = $('#screen'), sbg = $('.screen__bg', screen), scOrb = $('.screen__orb', screen);
    var scLayers = $$('.sc__layer', screen), scap = $('.screen__cap', sec), sheen = $('.mc__sheen', screen);
    var odos = $$('.odo', screen).map(S.makeOdo), sys = $('.screen__head .count', screen);
    var chart = $('.chartw svg', screen), endDot = $('.chartw__end', screen), segs = $$('.split__seg', screen), rhythm = $$('.rhythm i', screen);
    var signals = $$('.st', screen);
    var orb2d = S.makeOrb($('.orbit__orb', sec));
    if (orb2d) orb2d.start();
    var matrix = S.makeMatrix($('.screen__matrix-c', screen));
    if (matrix) matrix.start();

    /* ---- the 3D orb: created when the scene is near, used once its first frame is drawn ---- */
    var orb3d = null, use3d = false;
    function make3d() {
      if (orb3d || !window.IAOrb3D) return;
      var theme = (window.__QA && window.__QA.orbTheme) || 'onDark';
      orb3d = window.IAOrb3D.create(gl, { theme: theme, smoothing: false });
      orb3d.setDeckRect(deck);
      orb3d.ready.then(function (ok) {
        if (!ok) return;
        use3d = true;
        sec.classList.add('orb3d-on');
        if (orb2d) orb2d.stop();
        if (st.live) { measureScreen(); render(st.p); }
      });
    }
    if ('IntersectionObserver' in window) {
      var near = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { make3d(); near.disconnect(); } }, { rootMargin: '60% 0px' });
      near.observe(sec);
    } else make3d();

    var depth = [0.95, 0.6, 0.5, 1.05, 0.7, 0.85, 0.45, 0.55, 0.7, 0.35, 1.25, 1.1];
    var NS = 'http://www.w3.org/2000/svg';
    var nodes = items.map(function (el, i) {
      var ln = document.createElementNS(NS, 'line'); svg.appendChild(ln);
      var c = document.createElementNS(NS, 'circle'); c.setAttribute('r', '2.4'); svg.appendChild(c);
      return { el: el, d: depth[i] || 0.7, ln: ln, c: c, bx: 0, by: 0, hidden: false, phase: (i * 0.137) % 1, speed: 0.22 + (i % 4) * 0.05, s0: 0, absorbed: false };
    });
    var st = { p: 0, W: 0, H: 0, cx: 0, cy: 0, live: false, visible: false, fired: false, tilted: false };
    var ease = gsap.parseEase('power2.inOut'), easeOut = gsap.parseEase('expo.out');
    var chartClip = null, scale = 1, M = {};

    // Scene progress (live mode, pin = 210% of the viewport):
    //   0 to 0.34   the tools orbit, then fly into the tile; "9 systems up to date"
    //   0.34 to 0.44  the words leave
    //   0.36 to 0.86  the dive (about 105vh): the tile opens to the screen, we fly through the band, it lands as a grid
    //   0.86 to 0.95  the real mission control fades in over the landed grid and its layers snap flat
    var P = { absorb0: 0.16, absorb1: 0.3, dive0: 0.36, dive1: 0.86, fade0: 0.86, fade1: 0.93 };

    function measureOrbit() {
      gsap.set(items, { x: 0, y: 0, scale: 1, opacity: 1 });
      gsap.set(deck, { scale: 1, x: 0, y: 0, opacity: 1 });
      var r = orbit.getBoundingClientRect();
      st.W = r.width; st.H = r.height;
      var d = deck.getBoundingClientRect();
      st.cx = d.left - r.left + d.width / 2; st.cy = d.top - r.top + d.height / 2;
      svg.setAttribute('viewBox', '0 0 ' + st.W + ' ' + st.H);
      nodes.forEach(function (n) {
        var b = n.el.getBoundingClientRect();
        n.hidden = b.width === 0;
        n.bx = b.left - r.left + b.width / 2; n.by = b.top - r.top + b.height / 2;
        n.ln.style.display = n.c.style.display = n.hidden ? 'none' : '';
      });
    }

    function renderOrbit(time, p) {
      var live = st.live;
      var grow = live ? 1 + 0.12 * ease(map(p, 0, 0.26)) - 0.12 * ease(map(p, 0.28, P.dive0)) : 1;
      if (!live || p < P.dive0 + 0.02) gsap.set(deck, { scale: grow });
      var fadeAll = live ? 1 - map(p, P.dive0, P.dive0 + 0.05) : 1;
      nodes.forEach(function (n, i) {
        if (n.hidden) return;
        var par = live ? (0.2 - p) * 200 * n.d : 0;
        var drift = live ? (p - 0.2) * 26 * n.d * (n.bx < st.cx ? -1 : 1) : 0;
        var ci = live ? ease(map(p, P.absorb0 + i * 0.006, P.absorb1 + i * 0.006)) : 0;
        var x = n.bx + drift + (st.cx - n.bx - drift) * ci;
        var y = n.by + par + (st.cy - n.by - par) * ci;
        gsap.set(n.el, { x: x - n.bx, y: y - n.by, scale: (0.88 + 0.16 * n.d) * (1 - 0.65 * ci), opacity: (1 - Math.pow(ci, 1.5)) * fadeAll });
        n.ln.setAttribute('x1', x); n.ln.setAttribute('y1', y);
        n.ln.setAttribute('x2', st.cx); n.ln.setAttribute('y2', st.cy);
        n.ln.style.opacity = (0.9 * (1 - ci) * fadeAll).toFixed(3);
        var s = ((time || 0) * n.speed + n.phase) % 1;
        var on = ci < 0.9 && fadeAll > 0.5;
        n.c.setAttribute('cx', lerp(x, st.cx, s)); n.c.setAttribute('cy', lerp(y, st.cy, s));
        n.c.style.opacity = on ? (Math.sin(Math.PI * s) * 0.85).toFixed(3) : 0;
        var ang = Math.atan2(-(y - st.cy), x - st.cx);
        // a travelling dot reaches the orb: a ripple starts on that side
        if (use3d && on && n.s0 > 0.8 && s < 0.2) orb3d.pulse(0.45, ang);
        n.s0 = s;
        // the tool itself is absorbed: a stronger ripple, once
        if (use3d && !n.absorbed && ci > 0.86) { n.absorbed = true; orb3d.pulse(0.75, ang); }
        if (ci < 0.5) n.absorbed = false;
      });
      var showDone = live ? (p > P.absorb1 + 0.01 && p < P.dive0 + 0.04) : false;
      if (done._on !== showDone) { done._on = showDone; done.classList.toggle('is-shown', showDone); done.classList.toggle('is-on', showDone); }
      if (live) gsap.set(ocap, { opacity: 1 - map(p, 0.1, 0.2) });
    }

    function measureScreen() {
      gsap.set(wrap, { clearProps: 'transform' });
      sbg.style.clipPath = '';
      var avail = window.innerHeight - (wrap.getBoundingClientRect().top - pin.getBoundingClientRect().top) - 44;
      scale = Math.min(1, avail / screen.offsetHeight);
      gsap.set(wrap, { xPercent: -50, scale: scale, transformOrigin: '50% 0%' });
      var sr = screen.getBoundingClientRect(), dr = deck.getBoundingClientRect();
      gsap.set(scOrb, { clearProps: 'transform' });
      var orr = scOrb.getBoundingClientRect();
      M.dw = dr.width / scale;
      M.dcx = (dr.left + dr.width / 2 - sr.left) / scale; M.dcy = (dr.top + dr.height / 2 - sr.top) / scale;
      M.ocx = (orr.left + orr.width / 2 - sr.left) / scale; M.ocy = (orr.top + orr.height / 2 - sr.top) / scale;
      M.ow = orr.width / scale;
      M.sw = screen.offsetWidth; M.sh = screen.offsetHeight;
      if (orb3d && st.live) orb3d.setGridTarget(screen, { radius: 32 * scale, fit: 'fill' });
    }

    /* 3D path: the orb dives; the real screen fades in over the landed grid. */
    function render3d(p) {
      var cp = map(p, 0.34, 0.44);
      gsap.set(copy, { y: -60 * ease(cp), opacity: 1 - cp });
      orb3d.setDive(map(p, P.dive0, P.dive1));
      var k = map(p, P.fade0, P.fade1);
      gsap.set(wrap, { autoAlpha: k > 0 ? 1 : 0 });
      gsap.set(screen, { rotationX: 0, rotationY: 0 });
      gsap.set(sbg, { opacity: k });
      gsap.set(scOrb, { x: 0, y: 0, scale: 1, opacity: k });
      var le = easeOut(map(p, P.fade0, 0.97));
      scLayers.forEach(function (el, i) {
        var z = (+el.getAttribute('data-z') || 0);
        gsap.set(el, { z: z * 0.9 * (1 - le), y: -z * 0.08 * (1 - le), opacity: map(p, P.fade0 + i * 0.004, P.fade1 + i * 0.004) });
      });
      if (matrix) matrix.setReveal(map(p, 0.88, 0.97));
      gsap.set(scap, { opacity: map(p, 0.92, 0.98) });
      gsap.set(deck, { opacity: 1 });
      if (p > 0.9 && !st.fired) { st.fired = true; finishScreen(); }
    }

    /* 2D fallback: the tile itself opens into the screen, which swings and snaps flat. Same scroll budget. */
    function remap(p) {
      var a = [[0, 0], [0.32, 0.52], [0.36, 0.58], [0.86, 0.95], [1, 1]];
      for (var i = 1; i < a.length; i++) if (p <= a[i][0]) return lerp(a[i - 1][1], a[i][1], (p - a[i - 1][0]) / (a[i][0] - a[i - 1][0]));
      return 1;
    }
    function render2d(pn) {
      var p = remap(pn);
      var cp = map(p, 0.55, 0.68);
      gsap.set(copy, { y: -70 * ease(cp), opacity: 1 - cp });
      var m = map(p, 0.58, 0.72), em = ease(m);
      gsap.set(sbg, { opacity: 1 });
      if (m <= 0) { gsap.set(wrap, { autoAlpha: 0 }); gsap.set(deck, { opacity: 1 }); }
      else {
        gsap.set(wrap, { autoAlpha: 1 });
        gsap.set(deck, { opacity: 0 });
        var l = lerp(M.dcx - M.dw / 2, 0, em), t = lerp(M.dcy - M.dw / 2, 0, em);
        var r = lerp(M.sw - (M.dcx + M.dw / 2), 0, em), b = lerp(M.sh - (M.dcy + M.dw / 2), 0, em);
        sbg.style.clipPath = m < 1 ? 'inset(' + t + 'px ' + r + 'px ' + b + 'px ' + l + 'px round ' + lerp(M.dw * 12.5 / 44, 32, em) + 'px)' : '';
        gsap.set(scOrb, { x: lerp(M.dcx - M.ocx, 0, em), y: lerp(M.dcy - M.ocy, 0, em), scale: lerp(M.dw / M.ow, 1, em), opacity: 1 });
      }
      var up = ease(map(p, 0.6, 0.72)), down = easeOut(map(p, 0.74, 0.95)), tiltAmt = up * (1 - down);
      gsap.set(screen, { rotationX: 22 * tiltAmt, rotationY: -16 * tiltAmt });
      var le = easeOut(map(p, 0.74, 0.95));
      scLayers.forEach(function (el, i) {
        var z = (+el.getAttribute('data-z') || 0);
        gsap.set(el, { z: z * 1.7 * (1 - le), y: -z * 0.16 * (1 - le), opacity: map(p, 0.7 + i * 0.01, 0.78 + i * 0.01) });
      });
      if (matrix) matrix.setReveal(map(p, 0.7, 0.9));
      gsap.set(scap, { opacity: map(p, 0.9, 0.98) });
      if (p > 0.76 && !st.fired) { st.fired = true; finishScreen(); }
    }

    function render(p) { if (!st.live) return; if (use3d) render3d(p); else render2d(p); }

    function finishScreen() {
      odos.forEach(function (o) { o.play({ duration: 1.3 }); });
      S.countUp(sys, 1.2);
      if (!chartClip) chartClip = S.inset(chart, { r: 100 }, '%');
      gsap.to(chartClip, { r: 0, duration: 1.2, ease: 'power2.inOut', onUpdate: chartClip.apply, onComplete: function () { chartClip.clear(); } });
      gsap.fromTo(endDot, { scale: 0 }, { scale: 1, duration: 0.5, ease: 'back.out(2.4)', delay: 1.1 });
      gsap.fromTo(segs, { scaleX: 0 }, { scaleX: 1, duration: 1, ease: 'expo.out', stagger: 0.1, delay: 0.2 });
      gsap.fromTo(rhythm, { scale: 0 }, { scale: 1, duration: 0.5, ease: 'back.out(2)', stagger: 0.09, delay: 0.3 });
      gsap.delayedCall(1.2, function () { S.switchOn(signals); });
      if (!st.tilted) { st.tilted = true; S.tilt(wrap, { target: wrap, max: 3, layers: scLayers, sheen: sheen, light: sbg }); }
    }

    var mm = gsap.matchMedia();
    mm.add('(min-width: 900px) and (min-height: 620px)', function () {
      st.live = true;
      sec.classList.add('scene--live');
      gsap.set(segs, { scaleX: 0 });
      gsap.set(endDot, { scale: 0 });
      gsap.set(rhythm, { scale: 0 });
      measureOrbit(); measureScreen();
      render(0);
      var trig = ScrollTrigger.create({
        trigger: sec, start: 'top top', end: '+=210%', pin: pin, anticipatePin: 1,
        onUpdate: function (self) { st.p = self.progress; render(st.p); },
        onRefresh: function (self) { measureOrbit(); measureScreen(); st.p = self.progress; render(st.p); }
      });
      return function () {
        st.live = false; trig.kill(); sec.classList.remove('scene--live');
        gsap.set([copy, wrap, scOrb, screen, deck, sbg].concat(scLayers), { clearProps: 'all' });
        sbg.style.clipPath = '';
        if (orb3d) orb3d.setDive(0, { immediate: true });
      };
    });
    mm.add('(max-width: 899px), (max-height: 619px)', function () {
      st.live = false;
      measureOrbit();
      gsap.set(wrap, { autoAlpha: 1 });
      gsap.fromTo(items, { autoAlpha: 0, scale: 0.8 }, { autoAlpha: 1, scale: 1, duration: 0.8, ease: 'expo.out', stagger: 0.05, scrollTrigger: { trigger: orbit, start: 'top 75%', once: true } });
      gsap.fromTo(scLayers, { y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1, ease: 'expo.out', stagger: 0.07, scrollTrigger: { trigger: screen, start: 'top 80%', once: true, onEnter: function () { if (!st.fired) { st.fired = true; finishScreen(); } if (matrix) matrix.setReveal(1); } } });
      done.classList.add('is-shown');
      ScrollTrigger.create({ trigger: orbit, start: 'top 60%', once: true, onEnter: function () { done.classList.add('is-on'); } });
    });

    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { st.visible = es[0].isIntersecting; }, { rootMargin: '120px 0px' }).observe(orbit);
    else st.visible = true;
    gsap.ticker.add(function (time) { if (st.visible) renderOrbit(time, st.p); });
    window.addEventListener('resize', function () { measureOrbit(); });
  };
})();
