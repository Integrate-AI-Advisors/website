/* IntegrateAI · Signal 1.1 · preloader and hero. Twenty becomes one. */
(function () {
  'use strict';
  var S = window.SIG;
  var $ = S.$, $$ = S.$$, clamp = S.clamp;

  /* ---------- preloader: the dark deck composes its orb, then becomes the nav tile ---------- */
  var pre = null;
  S.preloaderStart = function () {
    var QA = window.__QA || {};
    var el = $('.pre');
    if (!el) return;
    if (QA.nopre) { el.remove(); return; }
    var deck = $('.pre__deck', el);
    var orb = S.makeOrb($('.pre__orb', el), { compose: true, size: 81 });
    if (orb) orb.start();
    gsap.set($('.nav__bar'), { autoAlpha: 0 });
    var c = { v: 0 };
    gsap.fromTo(deck, { scale: 0.72, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.4, ease: 'back.out(1.7)' });
    gsap.to(c, { v: 1, duration: 0.55, ease: 'power2.out', onUpdate: function () { if (orb) orb.setCompose(c.v); } });
    pre = { el: el, deck: deck, orb: orb, t0: performance.now() };
  };
  S.preloaderEnd = function (onHero) {
    if (!pre) { onHero(); gsap.set($('.nav__bar'), { autoAlpha: 1 }); return; }
    var wait = Math.max(0, 480 - (performance.now() - pre.t0));
    setTimeout(function () {
      onHero();
      var navDeck = $('.nav__deck'), bar = $('.nav__bar');
      var dr = pre.deck.getBoundingClientRect(), nr = navDeck.getBoundingClientRect();
      gsap.to(pre.deck, {
        x: (nr.left + nr.width / 2) - (dr.left + dr.width / 2),
        y: (nr.top + nr.height / 2) - (dr.top + dr.height / 2),
        scale: nr.width / dr.width, duration: 0.5, delay: 0.08, ease: 'expo.inOut',
        onComplete: function () { gsap.set(bar, { autoAlpha: 1 }); if (pre.orb) pre.orb.stop(); pre.el.remove(); pre = null; }
      });
    }, wait);
  };

  /* ---------- hero ---------- */
  S.hero = function () {
    var QA = window.__QA || {};
    var hero = $('.hero');
    var copy = $('.hero__copy', hero);
    var stage = $('#stage');
    var tiles = $$('.tile', stage);
    var inners = tiles.map(function (t) { return $('.tile__in', t); });
    var one = $('.one', stage), ring = $('.one-ring', stage);
    var figure = $('.hero__figure', stage), caption = $('figcaption', figure);
    var mc = $('#mc'), orb = $('.mc__orb', mc), bg = $('.mc__bg', mc), sheen = $('.mc__sheen', mc);
    var head = $('.mc__head', mc);
    var headBits = $$('.mc__title, .mc__sys', mc);
    var layers = $$('.mc__layer', mc);
    var bodyLayers = layers.filter(function (l) { return l !== head && !l.classList.contains('mc__event'); });
    var event = $('.mc__event', mc);
    var chartSvg = $('.chartw svg', mc), endDot = $('.chartw__end', mc), segs = $$('.split__seg', mc);
    var l1w = $$('.hero__l1 .w', hero), l1 = $('.hero__l1', hero), l2 = $('.hero__l2', hero), l2w = $$('.hero__line .w', hero);
    var strip = $('.hero__strip', hero);
    var lede = $('.hero__lede', hero), actions = $$('.hero__actions > *', hero), status = $('.status', hero), eyebrow = $('.eyebrow', hero);
    var signals = $$('.st', hero).filter(function (el) { return !el.classList.contains('mc__event'); });
    var odoMoney = S.makeOdo($('.mc__big .odo', mc));
    var sysCount = $('.mc__sys .count', mc);
    var t3 = null; // the 3D tiles (IATiles3D) when ready; otherwise the DOM tiles play

    $$('.g-line', stage).forEach(function (p) { p.setAttribute('pathLength', '100'); });
    tiles.forEach(function (t, i) { t.style.order = i; });

    var slotH = 0;
    function measureSlot() { slotH = l2.getBoundingClientRect().height; strip.style.setProperty('--slot', slotH + 'px'); }
    measureSlot();

    gsap.set(inners, { scale: 0.6, autoAlpha: 0, rotation: function () { return gsap.utils.random(-14, 14); } });
    gsap.set(l1w, { yPercent: 118 });
    gsap.set(l2w, { yPercent: 135 });
    gsap.set(strip, { yPercent: 5 });
    gsap.set([eyebrow, lede, status], { autoAlpha: 0, y: 16 });
    gsap.set(actions, { autoAlpha: 0, y: 16 });
    gsap.set([copy, stage], { visibility: 'visible' });

    /* ---- the twenty tiles (DOM version; the 3D version can take over via IATiles3D) ---- */
    var magnetOn = false;
    var qx = inners.map(function (el) { return gsap.quickTo(el, 'x', { duration: 0.7, ease: 'power3.out' }); });
    var qy = inners.map(function (el) { return gsap.quickTo(el, 'y', { duration: 0.7, ease: 'power3.out' }); });
    window.addEventListener('pointermove', function (e) {
      if (!magnetOn) return;
      tiles.forEach(function (t, i) {
        var r = t.getBoundingClientRect();
        var dx = r.left + r.width / 2 - e.clientX, dy = r.top + r.height / 2 - e.clientY;
        var d = Math.sqrt(dx * dx + dy * dy) || 1, f = d < 230 ? Math.pow(1 - d / 230, 2) : 0;
        qx[i](dx / d * f * 16); qy[i](dy / d * f * 16);
      });
    }, { passive: true });
    function magnetReset() { tiles.forEach(function (t, i) { qx[i](0); qy[i](0); }); }
    stage.addEventListener('pointerleave', magnetReset);

    function swap(a, b) {
      var ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
      var oa = a.style.order; a.style.order = b.style.order; b.style.order = oa;
      gsap.set([a, b], { x: 0, y: 0 });
      var na = a.getBoundingClientRect(), nb = b.getBoundingClientRect();
      gsap.set([a, b], { zIndex: 2 });
      gsap.fromTo(a, { x: ra.left - na.left, y: ra.top - na.top }, { x: 0, y: 0, duration: 0.7, ease: 'back.out(1.35)', overwrite: 'auto', onComplete: function () { gsap.set(a, { zIndex: 1 }); } });
      gsap.fromTo(b, { x: rb.left - nb.left, y: rb.top - nb.top }, { x: 0, y: 0, duration: 0.7, ease: 'back.out(1.35)', overwrite: 'auto', onComplete: function () { gsap.set(b, { zIndex: 1 }); } });
    }
    var rng = S.mulberry(11);
    function beat() {
      var n = tiles.length, a = Math.floor(rng() * n), b = Math.floor(rng() * n);
      if (a === b) b = (b + 7) % n;
      swap(tiles[a], tiles[b]);
      var c = Math.floor(rng() * n), d = Math.floor(rng() * n);
      if (c !== a && c !== b && d !== a && d !== b && c !== d) swap(tiles[c], tiles[d]);
      for (var k = 0; k < 3; k++) gsap.to(inners[Math.floor(rng() * n)], { rotation: (rng() - 0.5) * 10, duration: 0.6, ease: 'power3.out', overwrite: 'auto' });
    }

    // DOM collapse: tiles fly one by one into the dark deck. Calls onImpact(i, total) per arrival and onClick when done.
    function collapseDom(cx, cy, size, onImpact, onClick) {
      magnetOn = false; magnetReset();
      gsap.killTweensOf(tiles);
      var sr = stage.getBoundingClientRect();
      gsap.set([one, ring], { x: cx - size / 2, y: cy - size / 2, transformOrigin: '50% 50%' });
      var items = tiles.map(function (t) {
        var r = t.getBoundingClientRect(), tx = r.left + r.width / 2 - sr.left, ty = r.top + r.height / 2 - sr.top;
        return { t: t, inner: $('.tile__in', t), dx: cx - tx, dy: cy - ty, d: Math.hypot(cx - tx, cy - ty) };
      }).sort(function (p, q) { return p.d - q.d; });
      var ctl = gsap.timeline();
      ctl.fromTo(one, { autoAlpha: 1, scale: 0, rotation: -18 }, { scale: 0.52, rotation: 0, duration: 0.45, ease: 'back.out(1.8)' }, 0);
      var fly = 0.36, span = 0.8, first = 0.12 + fly;
      var inv = function (y) { return y < 0.5 ? Math.sqrt(y / 2) : 1 - Math.sqrt((1 - y) / 2); };
      items.forEach(function (it, i) {
        var arrive = first + span * inv(i / (items.length - 1));
        var x0 = gsap.getProperty(it.t, 'x'), y0 = gsap.getProperty(it.t, 'y');
        ctl.to(it.t, { x: x0 + it.dx, y: y0 + it.dy, scale: 0.36, duration: fly, ease: 'power3.in' }, arrive - fly);
        ctl.to(it.inner, { rotation: (i % 2 ? 1 : -1) * (30 + i * 3), duration: fly, ease: 'power2.in' }, arrive - fly);
        ctl.set(it.t, { autoAlpha: 0 }, arrive);
        ctl.to(one, { scale: 0.52 + 0.48 * (i + 1) / items.length, duration: 0.24, ease: 'back.out(2.2)', overwrite: 'auto' }, arrive);
        ctl.add(function () { onImpact(i, items.length); }, arrive);
      });
      ctl.add(onClick, first + span);
      return { first: first, span: span };
    }

    /* ---- the countdown numeral, driven by impacts ---- */
    var cs = { p: 0 };
    var notch = function (f) { var a = f * f * f, b = (1 - f) * (1 - f) * (1 - f); return a / (a + b); };
    function renderCount() { var i = Math.floor(cs.p), f = cs.p - i; gsap.set(strip, { y: -(i + notch(f)) * slotH }); }

    function collapse() {
      var sr = stage.getBoundingClientRect(), mr = mc.getBoundingClientRect();
      var cx = mr.left + mr.width / 2 - sr.left, cy = mr.top + mr.height / 2 - sr.top;
      var size = Math.round(clamp(104, 176, mr.width * 0.3));
      stage.style.setProperty('--one', size + 'px');
      stage._one = { cx: cx, cy: cy, size: size };
      var T = collapseDom(cx, cy, size, function () {}, click);
      // numeral eases across the same span as the arrivals: 20 ... 1
      gsap.to(cs, { p: 19, duration: T.span, delay: T.first, ease: 'power2.inOut', onUpdate: renderCount });
    }

    // "1" rolls on into the headline
    function clickText() {
      hero.classList.remove('is-chaos');
      var tl = gsap.timeline();
      tl.to(strip, { yPercent: -5, duration: 0.42, ease: 'power3.in' }, 0.1)
        .to(l2w, { yPercent: 0, duration: 1.05, ease: 'expo.out', stagger: 0.09 }, 0.4)
        .to(l1, { color: '#6a6a6e', duration: 1, ease: 'power2.out' }, 0.35);
    }
    function click() {
      clickText();
      var tl = gsap.timeline();
      tl.to(one, { scale: 1.08, duration: 0.12, ease: 'power2.out', overwrite: 'auto' }, 0)
        .to(one, { scale: 1, duration: 0.8, ease: 'elastic.out(1, 0.5)' }, 0.12)
        .fromTo(ring, { autoAlpha: 1, scale: 1 }, { scale: 1.8, autoAlpha: 0, duration: 0.9, ease: 'power3.out', immediateRender: false }, 0)
        .add(unfold, 0.26);
    }

    /* ---- the 3D path: real tiles fly into a real deck; the numeral ticks on every impact ---- */
    function cardDeck() {
      var sr = stage.getBoundingClientRect(), mr = mc.getBoundingClientRect();
      return { cx: mr.left + mr.width / 2 - sr.left, cy: mr.top + mr.height / 2 - sr.top, size: Math.round(clamp(104, 176, mr.width * 0.3)) };
    }
    function collapse3d() {
      t3.chaos(false);
      t3.collapse({
        settle: 0.26,
        onImpact: function (i, n) {
          if (i < n) gsap.to(cs, { p: Math.min(19, i), duration: 0.16, ease: 'power2.out', overwrite: 'auto', onUpdate: renderCount });
          else clickText();
        },
        onDone: function () {
          var r = t3.getDeckRect(), sr = stage.getBoundingClientRect();
          stage._one = { cx: r.left + r.width / 2 - sr.left, cy: r.top + r.height / 2 - sr.top, size: r.width, radius: r.radius };
          unfold();
          // the DOM card now sits exactly under the 3D deck: let the 3D fade and free the GPU
          t3.fadeOut(340).then(function () { t3.destroy(); t3 = null; });
        }
      });
    }

    /* ---- the logo tile opens into the mission control: clip, then an exploded stack that snaps flat ---- */
    function unfold() {
      var o = stage._one;
      var sr = stage.getBoundingClientRect(), mr = mc.getBoundingClientRect();
      var mx = mr.left - sr.left, my = mr.top - sr.top;
      var left = o.cx - o.size / 2 - mx, top = o.cy - o.size / 2 - my;
      var right = mr.width - left - o.size, bottom = mr.height - top - o.size;
      var or = orb.getBoundingClientRect();
      gsap.set(figure, { visibility: 'visible' });
      gsap.set(caption, { autoAlpha: 0 });
      var clip = S.inset(mc, { t: top, r: right, b: bottom, l: left, rad: o.radius || o.size * 12.5 / 44 });
      gsap.set(orb, { x: (mx + left + o.size / 2) - (or.left - sr.left + or.width / 2), y: (my + top + o.size / 2) - (or.top - sr.top + or.height / 2), scale: o.size / or.width });
      gsap.set(headBits, { autoAlpha: 0, y: 8 });
      gsap.set(bodyLayers, { autoAlpha: 0 });
      var cclip = S.inset(chartSvg, { r: 100 }, '%');
      gsap.set(segs, { scaleX: 0 });
      gsap.set(endDot, { scale: 0 });
      gsap.set(one, { autoAlpha: 0 });

      var u = gsap.timeline();
      u.to(clip, { t: 0, r: 0, b: 0, l: 0, rad: 28, duration: 0.85, ease: 'expo.inOut', onUpdate: clip.apply }, 0)
        .to(orb, { x: 0, y: 0, scale: 1, duration: 0.85, ease: 'expo.inOut' }, 0)
        .to(headBits, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power3.out', stagger: 0.08 }, 0.55)
        .add(function () {
          clip.clear();
          // exploded view: the layers hang apart in depth, then snap flat
          gsap.set(figure, { rotationX: 24, rotationY: -20 });
          bodyLayers.forEach(function (l) { gsap.set(l, { z: (+l.getAttribute('data-z') || 0) * 1.5, y: -(+l.getAttribute('data-z') || 0) * 0.12 }); });
          gsap.set(head, { z: 30 });
          gsap.to(bodyLayers, { autoAlpha: 1, duration: 0.35, ease: 'power2.out', stagger: 0.035 });
          gsap.to(figure, { rotationX: 0, rotationY: 0, duration: 1.35, ease: 'expo.out', delay: 0.18 });
          gsap.to(bodyLayers.concat(head), { z: 0, y: 0, duration: 1.2, ease: 'expo.out', delay: 0.28, stagger: 0.03 });
        }, 0.82)
        .add(function () { odoMoney.play({ duration: 1.1, stagger: 0.06 }); S.countUp(sysCount, 1.1); }, 0.95)
        .to(cclip, { r: 0, duration: 1.1, ease: 'power2.inOut', onUpdate: cclip.apply, onComplete: function () { cclip.clear(); } }, 1.0)
        .to(segs, { scaleX: 1, duration: 0.9, ease: 'expo.out', stagger: 0.08 }, 1.05)
        .to(endDot, { scale: 1, duration: 0.6, ease: 'back.out(2.4)' }, 1.9)
        .to(caption, { autoAlpha: 1, duration: 0.6 }, 1.3)
        .add(function () { S.switchOn(signals); }, 2.0)
        .add(arrived, 2.3);
    }

    /* ---- after arrival: tilt, sheen, and small live moments ---- */
    function arrived() {
      S.tilt(stage, { target: figure, max: 5, layers: layers, sheen: sheen, light: bg, area: stage });
      // a new status switches on
      gsap.set(event, { visibility: 'visible', autoAlpha: 0, y: 8 });
      gsap.to(event, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'expo.out', delay: 0.9, onComplete: function () { S.switchOn([event]); } });
      liveChart();
    }

    function liveChart() {
      var line = $('.cline', chartSvg), area = $('.carea', chartSvg);
      var xs = [4, 44, 84, 124, 164, 204, 244, 284, 324, 364, 404, 444, 484, 516, 540];
      var ys = [90, 82, 88, 74, 79, 64, 70, 58, 63, 48, 53, 38, 42, 27, 20];
      var extra = [26, 22, 30, 21, 17, 24, 19, 14, 21, 16];
      var k = 0;
      function paint(v) {
        var pts = xs.map(function (x, i) { return x + ',' + v[i].toFixed(1); }).join(' ');
        line.setAttribute('points', pts);
        area.setAttribute('points', '4,118 ' + pts + ' 540,118');
        endDot.style.setProperty('--ey', (v[v.length - 1] / 118 * 100).toFixed(2) + '%');
      }
      function tick() {
        if (document.hidden || !inView) return;
        var from = ys.slice();
        var to = ys.slice(1).map(function (y, i) { return y + (from[i] - from[i + 1]) * 0.12; });
        to.push(extra[k++ % extra.length]);
        // keep the rising shape: re-anchor so the first point sits low
        var shift = 90 - to[0];
        to = to.map(function (y, i) { return clamp(12, 100, y + shift * (1 - i / (to.length - 1))); });
        var p = { t: 0 };
        gsap.to(p, { t: 1, duration: 0.9, ease: 'power2.inOut', onUpdate: function () { paint(from.map(function (y, i) { return S.lerp(y, to[i], p.t); })); }, onComplete: function () { ys = to; } });
        gsap.fromTo(endDot, { scale: 1.35 }, { scale: 1, duration: 0.8, ease: 'expo.out' });
      }
      var inView = true;
      if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { inView = es[0].isIntersecting; }).observe(mc);
      setInterval(tick, 3600);
    }

    /* ---- the master timeline ---- */
    function build(use3d) {
      var tl = gsap.timeline({ paused: true });
      tl.to(eyebrow, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'power3.out' }, 0)
        .to(l1w, { yPercent: 0, duration: 1, ease: 'expo.out', stagger: 0.09 }, 0.14)
        .to(strip, { yPercent: 0, duration: 1.05, ease: 'expo.out' }, 0.28)
        .add(function () { S.revealLines && S.revealLines(lede, 0); }, 0.42)
        .to(lede, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power3.out' }, 0.42)
        .to(actions, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'expo.out', stagger: 0.08 }, 0.62)
        .to(status, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'power3.out' }, 0.76);
      if (use3d) {
        hero.classList.add('t3-on');
        tl.add(function () { t3.enter(); }, 0.02)
          .add(function () { var d = cardDeck(); stage._one = d; t3.setDeck({ x: d.cx, y: d.cy, size: d.size }); }, 1.2)
          .add(collapse3d, 1.7);
      } else {
        tl.to(inners, { scale: 1, autoAlpha: 1, rotation: function () { return gsap.utils.random(-3, 3); }, duration: 0.9, ease: 'back.out(1.6)', stagger: { each: 0.026, from: 'random' } }, 0.08)
          .add(function () { hero.classList.add('is-chaos'); magnetOn = true; }, 0.55);
        [0.78, 0.97, 1.14, 1.3, 1.46].forEach(function (t) { tl.add(beat, t); });
        tl.add(collapse, 1.7);
      }
      return tl;
    }
    window.addEventListener('resize', measureSlot);

    return {
      play: function (tiles3d) {
        t3 = tiles3d || null;
        build(!!t3).play(0);
        if (QA.stopAt != null) gsap.delayedCall(QA.stopAt, function () { gsap.globalTimeline.pause(); });
      }
    };
  };
})();
