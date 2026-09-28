/* IntegrateAI · Signal 1.2 · "One screen". A plain section at every size, played once as it comes into view:
   the tools gather round the orb and feed it (the 3D orb ripples as each travelling dot arrives), then, as the
   reader scrolls on, the mission control arrives as an exploded stack that settles flat. Nothing is tied to the
   scroll position. */
(function () {
  'use strict';
  var S = window.SIG;
  var $ = S.$, $$ = S.$$, lerp = S.lerp;

  // A faint dotted hairline under the screen header: the orb's woven band, unrolled. 44 columns, three fine lanes.
  S.makeMatrix = function (cv) {
    if (!cv || !cv.getContext) return null;
    var ctx = cv.getContext('2d'), dpr = Math.min(2, window.devicePixelRatio || 1), W = 0, H = 0;
    var reveal = 0, t0 = performance.now(), raf = 0, visible = false, live = false, last = 0;
    function size() {
      var r = cv.getBoundingClientRect(); W = r.width || 600; H = r.height || 30;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function draw(sec) {
      var t = sec * 2.34 * 0.42;
      ctx.clearRect(0, 0, W, H);
      var lanes = [4, 5.5, 7];
      for (var s = 0; s < 44; s++) {
        var on = S.clamp(0, 1, (reveal * 56 - s) / 8);
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
    function loop(now) { raf = requestAnimationFrame(loop); if (now - last < 31) return; last = now; draw((now - t0) / 1000); }
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
    var orbit = $('.scene__orbit', sec), items = $$('.orbit__item', sec), svg = $('.orbit__lines', sec);
    var deck = $('.orbit__deck', sec), gl = $('.orbit__gl', sec), done = $('.orbit__done', sec), ocap = $('.orbit__cap', sec);
    var wrap = $('.screen-wrap', sec), screen = $('#screen'), sbg = $('.screen__bg', screen), scOrb = $('.screen__orb', screen);
    var scLayers = $$('.sc__layer', screen), scap = $('.screen__cap', sec), sheen = $('.mc__sheen', screen);
    var odos = $$('.odo', screen).map(S.makeOdo), sys = $('.screen__head .count', screen);
    var chart = $('.chartw svg', screen), endDot = $('.chartw__end', screen), segs = $$('.split__seg', screen), rhythm = $$('.rhythm i', screen);
    var signals = $$('.st', screen);
    var orb2d = S.makeOrb($('.orbit__orb', sec));
    if (orb2d) orb2d.start();
    var matrix = S.makeMatrix($('.screen__matrix-c', screen));
    if (matrix) matrix.start();

    /* ---- the 3D orb: created when the section is near, used once its first frame is drawn (no dive) ---- */
    var orb3d = null, use3d = false;
    function make3d() {
      if (orb3d || !window.IAOrb3D) return;
      orb3d = window.IAOrb3D.create(gl, { theme: 'onDark' });
      orb3d.setDeckRect(deck);
      orb3d.ready.then(function (ok) {
        if (!ok) return;
        use3d = true;
        sec.classList.add('orb3d-on');
        if (orb2d) orb2d.stop();
      });
    }
    if ('IntersectionObserver' in window) {
      var near = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { make3d(); near.disconnect(); } }, { rootMargin: '60% 0px' });
      near.observe(sec);
    } else make3d();

    /* ---- the tools, their hairlines and the travelling dots ---- */
    var depth = [0.95, 0.6, 0.5, 1.05, 0.7, 0.85, 0.45, 0.55, 0.7, 0.35, 1.25, 1.1];
    var NS = 'http://www.w3.org/2000/svg';
    var nodes = items.map(function (el, i) {
      var ln = document.createElementNS(NS, 'line'); svg.appendChild(ln);
      var c = document.createElementNS(NS, 'circle'); c.setAttribute('r', '2.4'); svg.appendChild(c);
      return { el: el, d: depth[i] || 0.7, ln: ln, c: c, bx: 0, by: 0, hidden: false, k: 0, draw: 0, kDrawn: -1,
        phase: (i * 0.137) % 1, speed: 0.22 + (i % 4) * 0.05, s0: 0 };
    });
    var st = { cx: 0, cy: 0, visible: false };

    function measure() {
      nodes.forEach(function (n) { gsap.set(n.el, { x: 0, y: 0, scale: 1 }); n.kDrawn = -1; });
      var r = orbit.getBoundingClientRect(), dsc = gsap.getProperty(deck, 'scale');
      gsap.set(deck, { scale: 1 });
      var d = deck.getBoundingClientRect();
      gsap.set(deck, { scale: dsc });
      st.cx = d.left - r.left + d.width / 2; st.cy = d.top - r.top + d.height / 2;
      svg.setAttribute('viewBox', '0 0 ' + r.width + ' ' + r.height);
      nodes.forEach(function (n) {
        var b = n.el.getBoundingClientRect();
        n.hidden = b.width === 0;
        n.bx = b.left - r.left + b.width / 2; n.by = b.top - r.top + b.height / 2;
        n.ln.style.display = n.c.style.display = n.hidden ? 'none' : '';
      });
      render(0, true);
    }

    function render(time, force) {
      nodes.forEach(function (n) {
        if (n.hidden) return;
        // each tool drifts in from further out, then settles
        var e = n.k, ox = (n.bx - st.cx) * 0.55, oy = (n.by - st.cy) * 0.55;
        var x = n.bx + ox * (1 - e), y = n.by + oy * (1 - e);
        if (force || n.kDrawn !== e) {
          n.kDrawn = e;
          gsap.set(n.el, { x: x - n.bx, y: y - n.by, scale: 0.7 + 0.3 * e, opacity: Math.min(1, e * 1.4) });
        }
        n.ln.setAttribute('x1', x); n.ln.setAttribute('y1', y);
        n.ln.setAttribute('x2', lerp(x, st.cx, n.draw)); n.ln.setAttribute('y2', lerp(y, st.cy, n.draw));
        n.ln.style.opacity = n.draw > 0 ? 0.9 : 0;
        var s = ((time || 0) * n.speed + n.phase) % 1, on = n.draw >= 1;
        n.c.setAttribute('cx', lerp(x, st.cx, s)); n.c.setAttribute('cy', lerp(y, st.cy, s));
        n.c.style.opacity = on ? (Math.sin(Math.PI * s) * 0.85).toFixed(3) : 0;
        // a travelling dot reaches the orb: a ripple starts on that side of the band
        if (use3d && on && n.s0 > 0.8 && s < 0.2) orb3d.pulse(0.45, Math.atan2(-(y - st.cy), x - st.cx));
        n.s0 = s;
      });
    }

    // the gathering, played once when the orbit comes into view
    gsap.set(deck, { scale: 0.86 });
    gsap.set([done, ocap], { autoAlpha: 0 });
    var gather = gsap.timeline({ paused: true });
    gather.to(deck, { scale: 1, duration: 1.2, ease: 'expo.out' }, 0);
    nodes.forEach(function (n, i) {
      gather.to(n, { k: 1, duration: 1.1, ease: 'expo.out' }, 0.12 + i * 0.06);
      gather.to(n, { draw: 1, duration: 0.6, ease: 'power2.inOut' }, 0.55 + i * 0.06);
    });
    var tDone = 0.55 + nodes.length * 0.06 + 0.5;
    gather.fromTo(done, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'expo.out' }, tDone)
      .add(function () { done.classList.add('is-shown', 'is-on'); if (use3d) orb3d.pulse(0.9); }, tDone + 0.45)
      .fromTo(ocap, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.8 }, tDone + 0.2);
    ScrollTrigger.create({ trigger: orbit, start: 'top 72%', once: true, onEnter: function () { gather.play(); } });

    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { st.visible = es[0].isIntersecting; }, { rootMargin: '80px 0px' }).observe(orbit);
    else st.visible = true;
    gsap.ticker.add(function (time) { if (st.visible) render(time); });
    measure();
    window.addEventListener('resize', measure);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);

    /* ---- the mission control arrives: exploded in depth, then settling flat ---- */
    var chartClip = S.inset(chart, { r: 100 }, '%');
    gsap.set(screen, { rotationX: 16, rotationY: -12, transformOrigin: '50% 30%' });
    scLayers.forEach(function (el) { var z = +el.getAttribute('data-z') || 0; gsap.set(el, { z: z * 1.6, y: -z * 0.15, autoAlpha: 0 }); });
    gsap.set([sbg, scOrb, scap], { autoAlpha: 0 });
    gsap.set(segs, { scaleX: 0 });
    gsap.set(endDot, { scale: 0 });
    gsap.set(rhythm, { scale: 0 });

    function finishScreen() {
      odos.forEach(function (o) { o.play({ duration: 1.3 }); });
      S.countUp(sys, 1.2);
      gsap.to(chartClip, { r: 0, duration: 1.2, ease: 'power2.inOut', onUpdate: chartClip.apply, onComplete: chartClip.clear });
      gsap.to(endDot, { scale: 1, duration: 0.5, ease: 'back.out(2.4)', delay: 1.1 });
      gsap.to(segs, { scaleX: 1, duration: 1, ease: 'expo.out', stagger: 0.1, delay: 0.2 });
      gsap.to(rhythm, { scale: 1, duration: 0.5, ease: 'back.out(2)', stagger: 0.09, delay: 0.3 });
      var m = { v: 0 };
      if (matrix) gsap.to(m, { v: 1, duration: 1.4, ease: 'power2.out', delay: 0.2, onUpdate: function () { matrix.setReveal(m.v); } });
      gsap.delayedCall(1.2, function () { S.switchOn(signals); });
      S.tilt(wrap, { target: wrap, max: 3, layers: scLayers, sheen: sheen, light: sbg });
    }
    var arrive = gsap.timeline({ paused: true });
    arrive.to(sbg, { autoAlpha: 1, duration: 0.6, ease: 'power2.out' }, 0)
      .to(scOrb, { autoAlpha: 1, duration: 0.5 }, 0.15)
      .to(scLayers, { autoAlpha: 1, duration: 0.5, ease: 'power2.out', stagger: 0.05 }, 0.2)
      .to(screen, { rotationX: 0, rotationY: 0, duration: 1.6, ease: 'expo.out' }, 0.6)
      .to(scLayers, { z: 0, y: 0, duration: 1.4, ease: 'expo.out', stagger: 0.03 }, 0.7)
      .to(scap, { autoAlpha: 1, duration: 0.6 }, 1.4)
      .add(finishScreen, 1.0);
    ScrollTrigger.create({ trigger: wrap, start: 'top 94%', once: true, onEnter: function () { arrive.play(); } });
  };
})();
