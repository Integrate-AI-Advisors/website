/* IntegrateAI · Signal 1.2 · preloader and hero. Twenty becomes one, then the hero stays gently alive. */
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
      // 1.4: always land on "1" (the 3D scene has fewer than 20 tiles at some sizes), then clear the numeral away
      gsap.killTweensOf(cs); cs.p = 19; renderCount();
      var tl = gsap.timeline();
      tl.to(strip, { yPercent: -5, duration: 0.42, ease: 'power3.in' }, 0.1)
        .to(strip.parentNode, { autoAlpha: 0, duration: 0.2 }, 0.5)
        .to(l2w, { yPercent: 0, duration: 1.05, ease: 'expo.out', stagger: 0.09 }, 0.4)
        .to(l1, { color: '#6a6a6e', duration: 1, ease: 'power2.out' }, 0.35);
    }
    function click() {
      clickText();
      var tl = gsap.timeline();
      tl.to(one, { scale: 1.04, duration: 0.22, ease: 'sine.out', overwrite: 'auto' }, 0)
        .to(one, { scale: 1, duration: 0.6, ease: 'sine.inOut' }, 0.22)
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
          if (i < n) gsap.to(cs, { p: Math.min(19, Math.round(19 * i / n)), duration: 0.16, ease: 'power2.out', overwrite: 'auto', onUpdate: renderCount });
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

      // 1.3: the exploded tilt eases in while the tile opens (1.2 jumped to it in one frame: the jerk)
      bodyLayers.forEach(function (l) { gsap.set(l, { z: (+l.getAttribute('data-z') || 0) * 1.2, y: -(+l.getAttribute('data-z') || 0) * 0.1 }); });
      var u = gsap.timeline();
      u.to(clip, { t: 0, r: 0, b: 0, l: 0, rad: 28, duration: 1.0, ease: 'power3.inOut', onUpdate: clip.apply }, 0)
        .to(orb, { x: 0, y: 0, scale: 1, duration: 1.0, ease: 'power3.inOut' }, 0)
        .fromTo(figure, { rotationX: 0, rotationY: 0 }, { rotationX: 12, rotationY: -10, duration: 1.0, ease: 'sine.inOut' }, 0)
        .fromTo(head, { z: 0 }, { z: 24, duration: 1.0, ease: 'sine.inOut' }, 0)
        .to(headBits, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power3.out', stagger: 0.08 }, 0.55)
        .add(function () {
          clip.clear();
          // exploded view: the layers fade in apart in depth, then glide flat
          gsap.to(bodyLayers, { autoAlpha: 1, duration: 0.5, ease: 'sine.out', stagger: 0.04 });
          gsap.to(figure, { rotationX: 0, rotationY: 0, duration: 1.6, ease: 'power2.inOut', delay: 0.05 });
          gsap.to(bodyLayers.concat(head), { z: 0, y: 0, duration: 1.5, ease: 'power2.inOut', delay: 0.1, stagger: 0.03 });
        }, 1.0)
        .add(function () { odoMoney.play({ duration: 1.1, stagger: 0.06 }); S.countUp(sysCount, 1.1); }, 0.95)
        .to(cclip, { r: 0, duration: 1.1, ease: 'power2.inOut', onUpdate: cclip.apply, onComplete: function () { cclip.clear(); } }, 1.0)
        .to(segs, { scaleX: 1, duration: 0.9, ease: 'expo.out', stagger: 0.08 }, 1.05)
        .to(endDot, { scale: 1, duration: 0.6, ease: 'back.out(1.4)' }, 2.0)
        .to(caption, { autoAlpha: 1, duration: 0.6 }, 1.3)
        .add(function () { S.switchOn(signals); }, 2.0)
        .add(arrived, 2.75);
    }

    /* ---- after arrival: pointer tilt, then the hero stays gently alive ---- */
    function arrived() {
      S.tilt(stage, { target: figure, max: 5, layers: layers, sheen: sheen, light: bg, area: stage });
      // a new status switches on
      gsap.set(event, { visibility: 'visible', autoAlpha: 0, y: 8 });
      gsap.to(event, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'expo.out', delay: 0.9, onComplete: function () { S.switchOn([event]); } });
      // the small orb in the card header takes over from the still and keeps weaving
      var liveOrb = $('.mc__orb', mc);
      if (liveOrb && S.liveDeck) S.liveDeck(liveOrb);
      alive();
    }

    /* Calm, slow, low-amplitude and periodic: nothing flashes, nothing competes with the headline.
       Everything pauses while the hero is off screen (and the whole page pauses when the tab is hidden). */
    function alive() {
      var loops = [];
      function keep(t) { loops.push(t); return t; }
      // the card floats and breathes: a few px, under a degree, 9 to 11 s cycles
      keep(gsap.to(mc, { y: -5, duration: 5.2, ease: 'sine.inOut', yoyo: true, repeat: -1 }));
      keep(gsap.to(mc, { rotationX: 0.7, duration: 5.6, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 1.2 }));
      keep(gsap.to(mc, { rotationY: -0.9, duration: 4.6, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 2.4 }));
      // a soft sheen passes across it about every nine seconds
      var sw = $('.mc__sweep i', mc);
      if (sw) keep(gsap.timeline({ repeat: -1, repeatDelay: 7.2, delay: 1.6 }).fromTo(sw, { xPercent: -160 }, { xPercent: 420, duration: 2, ease: 'power2.inOut' }));
      // the chart keeps living, and the money figure ticks up now and then
      keep(liveChart());
      keep(liveMoney());
      // the "Needs you" note cycles through a few sample items
      var nl = cycleNeeds(); if (nl) keep(nl);
      // slow window light drifting across the paper
      var g1 = $('.hero__glow'), g2 = $('.hero__glow--b');
      keep(gsap.to(g1, { xPercent: -14, yPercent: 7, duration: 17, ease: 'sine.inOut', yoyo: true, repeat: -1 }));
      keep(gsap.to(g1, { opacity: 0.72, scale: 1.06, duration: 13, ease: 'sine.inOut', yoyo: true, repeat: -1 }));
      if (g2) {
        gsap.to(g2, { autoAlpha: 1, duration: 3, ease: 'power1.inOut' });
        keep(gsap.to(g2, { xPercent: 18, yPercent: -10, duration: 21, ease: 'sine.inOut', yoyo: true, repeat: -1 }));
      }
      // three rendered tiles drifting far behind, with a little pointer parallax
      var far = $$('.far', hero);
      if (far.length) {
        gsap.fromTo(far, { autoAlpha: 0, scale: 0.85 }, { autoAlpha: 1, scale: 1, duration: 2.4, ease: 'power2.out', stagger: 0.3, delay: 0.6 });
        far.forEach(function (f, i) {
          keep(gsap.to(f, { y: i % 2 ? 12 : -12, rotation: i % 2 ? -4 : 4, duration: 14 + i * 3, ease: 'sine.inOut', yoyo: true, repeat: -1 }));
        });
        if (S.canHover()) {
          var qf = far.map(function (f) { var w = f.parentNode; return gsap.quickTo(w, 'x', { duration: 1.6, ease: 'power3.out' }); });
          var qg = far.map(function (f) { var w = f.parentNode; return gsap.quickTo(w, 'y', { duration: 1.6, ease: 'power3.out' }); });
          var dep = [0.6, 1, 0.8];
          window.addEventListener('pointermove', function (e) {
            var px = e.clientX / window.innerWidth - 0.5, py = e.clientY / window.innerHeight - 0.5;
            qf.forEach(function (q, i) { q(-px * 18 * dep[i]); }); qg.forEach(function (q, i) { q(-py * 12 * dep[i]); });
          }, { passive: true });
        }
      }
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (es) {
          var on = es[0].isIntersecting;
          loops.forEach(function (t) { if (on) t.resume(); else t.pause(); });
        }).observe(hero);
      }
    }

    // A new point eases in every five seconds; the line extends and the window moves on.
    function liveChart() {
      var line = $('.cline', chartSvg), area = $('.carea', chartSvg);
      var N = 15, X0 = 4, X1 = 540, dx = (X1 - X0) / (N - 1);
      var ys = [90, 82, 88, 74, 79, 64, 70, 58, 63, 48, 53, 38, 42, 27, 20];
      var rnd = S.mulberry(24);
      function paint(v, s) {
        var pts = v.map(function (y, i) { return (X0 + (i - s) * dx).toFixed(1) + ',' + y.toFixed(1); });
        var lastX = X0 + (v.length - 1 - s) * dx;
        line.setAttribute('points', pts.join(' '));
        area.setAttribute('points', (X0 - s * dx).toFixed(1) + ',118 ' + pts.join(' ') + ' ' + lastX.toFixed(1) + ',118');
        var ey = v.length > N ? S.lerp(v[N - 1], v[N], s) : v[N - 1];
        endDot.style.setProperty('--ey', (ey / 118 * 100).toFixed(2) + '%');
      }
      function tick() {
        var last = ys[N - 1];
        var nv = clamp(12, 58, last + (rnd() - 0.56) * 18);
        var v = ys.concat([last]), p = { s: 0, y: last };
        gsap.to(p, {
          s: 1, y: nv, duration: 1.8, ease: 'power2.inOut',
          onUpdate: function () { v[N] = p.y; paint(v, p.s); },
          onComplete: function () { ys = v.slice(1); ys[N - 1] = nv; paint(ys, 0); }
        });
        gsap.fromTo(endDot, { scale: 1 }, { scale: 1.25, duration: 0.5, ease: 'power2.out', yoyo: true, repeat: 1, delay: 1.3 });
      }
      var tl = gsap.timeline({ repeat: -1 });
      tl.add(tick, 4.2).add(function () {}, 5);
      return tl;
    }

    // Now and then a little more money comes in; the figure rolls on and the split keeps adding up.
    function liveMoney() {
      var el = $('.mc__big .odo', mc), legend = $$('.legend b', mc);
      var ch = [14920, 6870, 2590], total = 24380;
      var steps = [[1, 42], [2, 24], [1, 58], [0, 186], [1, 36], [2, 24], [1, 64], [0, 120], [1, 48], [2, 24]], k = 0;
      function fmt(n) { return '£' + n.toLocaleString('en-GB'); }
      var tl = gsap.timeline({ repeat: steps.length - 1 });
      tl.add(function () {
        var s = steps[k++ % steps.length];
        total += s[1]; ch[s[0]] += s[1];
        S.odoTo(el, fmt(total), { duration: 1 });
        var b = legend[s[0]];
        if (b) { b.textContent = fmt(ch[s[0]]); gsap.fromTo(b, { opacity: 0.3 }, { opacity: 1, duration: 1.1, ease: 'power2.out' }); }
      }, 11.5);
      return tl;
    }

    // The "Needs you" note gently cycles; its status dot switches off and on again in step.
    function cycleNeeds() {
      var box = $('.mc__needs', mc), items = $$('.needs__i', box), dot = $('.st', box), cur = 0;
      if (!box || items.length < 2) return null;
      var tl = gsap.timeline({ repeat: -1 });
      tl.add(function () {
        var a = items[cur], b = items[(cur + 1) % items.length];
        cur = (cur + 1) % items.length;
        dot.classList.remove('is-on');
        gsap.to(a, { autoAlpha: 0, y: -6, duration: 0.55, ease: 'power2.in' });
        gsap.fromTo(b, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'expo.out', delay: 0.45 });
        a.setAttribute('aria-hidden', 'true'); b.removeAttribute('aria-hidden');
        gsap.delayedCall(1.15, function () { dot.classList.add('is-on'); });
      }, 8);
      return tl;
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
