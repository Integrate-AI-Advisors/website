/* IntegrateAI · Signal 1.1 · core helpers shared by every module. */
(function () {
  'use strict';
  var S = window.SIG = window.SIG || {};

  S.$ = function (s, c) { return (c || document).querySelector(s); };
  S.$$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  S.clamp = function (a, b, v) { return Math.max(a, Math.min(b, v)); };
  S.lerp = function (a, b, t) { return a + (b - a) * t; };
  S.map = function (v, a, b) { return S.clamp(0, 1, (v - a) / (b - a)); };
  S.isPhone = function () { return window.matchMedia('(max-width: 759px)').matches; };
  S.canHover = function () { return window.matchMedia('(hover: hover) and (pointer: fine)').matches; };

  S.mulberry = function (a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  };

  // Words wrapped in masks. Keeps the real text in the DOM for screen readers.
  S.splitWords = function (el, masked) {
    var out = [];
    Array.prototype.slice.call(el.childNodes).forEach(function (n) {
      if (n.nodeType === 3) {
        var frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(function (p) {
          if (!p) return;
          if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(' ')); return; }
          var i = document.createElement('span'); i.className = 'wi'; i.textContent = p;
          if (masked !== false) {
            var m = document.createElement('span'); m.className = 'wm'; m.appendChild(i); frag.appendChild(m);
          } else frag.appendChild(i);
          out.push(i);
        });
        el.replaceChild(frag, n);
      } else if (n.nodeType === 1 && n.tagName !== 'BR') {
        out = out.concat(S.splitWords(n, masked));
      }
    });
    return out;
  };

  // Line-by-line masked reveal for paragraphs: every word gets its own mask, grouped by visual line.
  S.splitLines = function (el) {
    var words = [];
    Array.prototype.slice.call(el.childNodes).forEach(function (n) {
      if (n.nodeType !== 3) return;
      var frag = document.createDocumentFragment();
      n.textContent.split(/(\s+)/).forEach(function (p) {
        if (!p) return;
        if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(' ')); return; }
        var m = document.createElement('span'); m.className = 'lm';
        var i = document.createElement('span'); i.className = 'li'; i.textContent = p;
        m.appendChild(i); frag.appendChild(m); words.push(i);
      });
      el.replaceChild(frag, n);
    });
    return {
      words: words,
      lineOf: function () {
        var tops = [], idx = [];
        words.forEach(function (w) {
          var t = Math.round(w.parentNode.offsetTop);
          var k = tops.indexOf(t); if (k < 0) { tops.push(t); k = tops.length - 1; }
          idx.push(k);
        });
        return idx;
      }
    };
  };

  S.countUp = function (el, dur) {
    if (!el) return;
    var to = +el.getAttribute('data-count') || 0, st = { v: 0 };
    el.textContent = '0';
    gsap.to(st, { v: to, duration: dur || 1, ease: 'power2.out', onUpdate: function () { el.textContent = Math.round(st.v); } });
  };

  // Rolling digits. Each column rests on a plausible nearby digit and rolls up to the real one,
  // so a figure never shows zeros: £21,811 rolls to £24,380. The leading digit stays put.
  S.makeOdo = function (el) {
    if (el._odo) return el._odo;
    var text = el.getAttribute('data-odo') || el.textContent;
    el.textContent = '';
    var sr = document.createElement('span'); sr.className = 'sr'; sr.textContent = text;
    var vis = document.createElement('span'); vis.className = 'odo__v'; vis.setAttribute('aria-hidden', 'true');
    var digits = text.replace(/\D/g, '').length, cols = [], di = 0;
    var steps = [0, 3, 5, 7, 9, 11];
    for (var i = 0; i < text.length; i++) {
      var ch = text.charAt(i);
      if (/\d/.test(ch)) {
        var n = +ch, k = steps[Math.min(di, steps.length - 1)] + (digits <= 3 && di > 0 ? 1 : 0), seq = [];
        for (var s = k; s >= 0; s--) seq.push((n - s + 20) % 10);
        var col = document.createElement('span'); col.className = 'odo__c';
        var strip = document.createElement('span'); strip.className = 'odo__s';
        strip.innerHTML = seq.map(function (d) { return '<span>' + d + '</span>'; }).join('');
        var probe = document.createElement('span'); probe.className = 'odo__p'; probe.textContent = ch;
        col.appendChild(probe); col.appendChild(strip); vis.appendChild(col);
        cols.push({ strip: strip, steps: seq.length - 1 });
        di++;
      } else {
        var x = document.createElement('span'); x.className = 'odo__x'; x.textContent = ch;
        vis.appendChild(x);
      }
    }
    el.appendChild(sr); el.appendChild(vis);
    el._odo = {
      play: function (o) {
        o = o || {};
        var tl = gsap.timeline({ delay: o.delay || 0 });
        cols.forEach(function (c, i) {
          if (!c.steps) return;
          tl.fromTo(c.strip, { yPercent: 0 }, { yPercent: -100 * c.steps / (c.steps + 1), duration: (o.duration || 1.2) + i * 0.07, ease: 'expo.out' }, i * (o.stagger || 0.06));
        });
        return tl;
      },
      done: function () { cols.forEach(function (c) { gsap.set(c.strip, { yPercent: -100 * c.steps / (c.steps + 1) }); }); }
    };
    return el._odo;
  };

  S.switchOn = function (list) { (list || []).forEach(function (el) { el.classList.add('is-on'); }); };

  // Clip-path through plain numbers (inset() strings get shortened by the browser, which breaks string tweens).
  S.inset = function (el, s, unit) {
    unit = unit || 'px';
    var o = { t: s.t || 0, r: s.r || 0, b: s.b || 0, l: s.l || 0, rad: s.rad || 0 };
    o.apply = function () { el.style.clipPath = 'inset(' + o.t + unit + ' ' + o.r + unit + ' ' + o.b + unit + ' ' + o.l + unit + (o.rad ? ' round ' + o.rad + 'px' : '') + ')'; };
    o.clear = function () { el.style.clipPath = ''; };
    o.apply();
    return o;
  };

  // Pointer tilt with a moving specular sheen. Layers marked data-z separate in depth as it tilts.
  S.tilt = function (el, o) {
    o = o || {};
    if (!S.canHover() || !window.gsap) return null;
    var target = o.target || el;
    var max = o.max || 6;
    var layers = o.layers || [];
    var rx = gsap.quickTo(target, 'rotationX', { duration: 0.9, ease: 'power3.out' });
    var ry = gsap.quickTo(target, 'rotationY', { duration: 0.9, ease: 'power3.out' });
    var zs = layers.map(function (l) { return gsap.quickTo(l, 'z', { duration: 0.9, ease: 'power3.out' }); });
    var sheen = o.sheen;
    var light = o.light;
    var on = true;
    function move(e) {
      if (!on) return;
      var r = el.getBoundingClientRect();
      var px = S.clamp(-1, 1, (e.clientX - (r.left + r.width / 2)) / (r.width / 2));
      var py = S.clamp(-1, 1, (e.clientY - (r.top + r.height / 2)) / (r.height / 2));
      ry(px * max); rx(-py * max * 0.8);
      var amt = Math.min(1, Math.sqrt(px * px + py * py));
      layers.forEach(function (l, i) { zs[i]((+l.getAttribute('data-z') || 0) * 0.16 * amt); });
      if (sheen) { sheen.style.setProperty('--sp', (50 + px * 40) + '%'); sheen.style.setProperty('--so', (0.25 + amt * 0.55).toFixed(2)); }
      if (light) { light.style.setProperty('--lx', (50 + px * 45) + '%'); light.style.setProperty('--ly', (py * 40 - 10) + '%'); }
    }
    function leave() {
      rx(0); ry(0); zs.forEach(function (q) { q(0); });
      if (sheen) sheen.style.setProperty('--so', '0');
    }
    (o.area || el).addEventListener('pointermove', move, { passive: true });
    (o.area || el).addEventListener('pointerleave', leave);
    return { off: function () { on = false; leave(); }, on: function () { on = true; } };
  };

  S.magnets = function () {
    if (!S.canHover()) return;
    S.$$('.magnet').forEach(function (el) {
      if (el._mag) return; el._mag = true;
      var x = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3.out' });
      var y = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3.out' });
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        x((e.clientX - (r.left + r.width / 2)) * 0.18); y((e.clientY - (r.top + r.height / 2)) * 0.3);
      });
      el.addEventListener('pointerleave', function () { gsap.to(el, { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1, 0.45)', overwrite: 'auto' }); });
    });
  };

  // Every Copy button: clipboard inside the click handler, falling back to selecting the address.
  S.setupCopy = function () {
    var status = S.$('.mail__status');
    S.$$('.mail__copy').forEach(function (btn) {
      var addr = btn.parentNode.querySelector('.mail__addr');
      var b = btn.querySelector('.mail__copy-b'), timer;
      function show(label, msg) {
        b.textContent = label; btn.classList.add('is-done');
        if (status) status.textContent = msg;
        clearTimeout(timer); timer = setTimeout(function () { btn.classList.remove('is-done'); }, 2400);
      }
      function selectAddr() { try { var r = document.createRange(); r.selectNodeContents(addr); var s = window.getSelection(); s.removeAllRanges(); s.addRange(r); } catch (e) {} }
      btn.addEventListener('click', function () {
        var text = btn.getAttribute('data-copy') || addr.textContent;
        var fallback = function () {
          selectAddr();
          var ok = false;
          try { ok = document.execCommand && document.execCommand('copy'); } catch (e) { ok = false; }
          if (ok) show('Copied', 'Email address copied.');
          else show('Selected', 'Email address selected. Press Ctrl or Cmd and C to copy.');
        };
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(function () { show('Copied', 'Email address copied.'); }, fallback);
          else fallback();
        } catch (e) { fallback(); }
      });
    });
  };

  /* The composing orb, drawn from the logo engine on its dark deck. Greyscale only.
     opts.compose: start scattered and settle into the sphere (the preloader). */
  S.makeOrb = function (cv, opts) {
    opts = opts || {};
    if (!cv || !cv.getContext) return null;
    var ctx = cv.getContext('2d');
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var W = 0, R = 0, k = 0;
    function size() {
      var w = cv.getBoundingClientRect().width || opts.size || 120;
      W = w; cv.width = Math.round(w * dpr); cv.height = Math.round(w * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      R = W * 0.46; k = R * 0.0185;
    }
    size();
    var ct = Math.cos(0.3), st = Math.sin(0.3), ghosts = [], seeds = [];
    for (var g = 0; g < 38; g++) {
      var gy = 1 - (g + 0.5) * 2 / 38, gr = Math.sqrt(1 - gy * gy), th = g * 2.399963;
      var gx = Math.cos(th) * gr * 0.8, gz = Math.sin(th) * gr * 0.8; gy *= 0.8;
      ghosts.push([gx, gy * ct + gz * st, -gy * st + gz * ct]);
    }
    var rnd = S.mulberry(5);
    for (var q = 0; q < 44 * 12 + 38; q++) seeds.push([rnd() * Math.PI * 2, 1.4 + rnd() * 1.1, rnd()]);
    var compose = opts.compose ? 0 : 1;
    var pts = [];
    function ease(x) { x = S.clamp(0, 1, x); return 1 - Math.pow(1 - x, 3); }
    function draw(sec) {
      var t = sec * 2.34 * 0.42, n = 0;
      for (var s = 0; s < 44; s++) {
        var a = 2 * Math.PI * s / 44, ca = Math.cos(a), sa = Math.sin(a);
        for (var l = 0; l < 12; l++) {
          var y = (l - 5.5) * 0.075 + 0.16 * Math.sin(3 * a - 1.7 * t + 0.22 * l) + 0.07 * Math.sin(5 * a + 1.1 * t);
          var r = Math.sqrt(Math.max(0, 1 - y * y)), x = r * ca, z = r * sa;
          pts[n] = [x, y * ct + z * st, -y * st + z * ct, 0, n]; n++;
        }
      }
      for (var h = 0; h < ghosts.length; h++) { pts[n] = [ghosts[h][0], ghosts[h][1], ghosts[h][2], 1, n]; n++; }
      pts.length = n;
      pts.sort(function (p1, p2) { return p1[2] - p2[2]; });
      ctx.clearRect(0, 0, W, W);
      var cx = W / 2, cy = W / 2;
      for (var i = 0; i < n; i++) {
        var p = pts[i], depth = (p[2] + 1) / 2, edge = Math.min(1, Math.sqrt(p[0] * p[0] + p[1] * p[1]));
        var px = p[0], py = p[1], vis = 1;
        if (compose < 1) {
          var sd = seeds[p[4]], e = ease((compose - sd[2] * 0.45) / 0.55);
          px = S.lerp(Math.cos(sd[0]) * sd[1], px, e); py = S.lerp(Math.sin(sd[0]) * sd[1], py, e); vis = e;
        }
        var rad = k * (0.935 + 1.445 * depth) * (1 - 0.25 * edge) * (p[3] ? 0.75 : 1);
        var grey = S.clamp(0, 1, 0.24 + 0.56 * depth - 0.1 * edge);
        var alpha = (0.25 + 0.75 * depth) * (p[3] ? 0.4 : 1) * vis;
        if (alpha < 0.01) continue;
        var c = Math.round(grey * 255);
        ctx.fillStyle = 'rgba(' + c + ',' + c + ',' + c + ',' + alpha.toFixed(3) + ')';
        ctx.beginPath(); ctx.arc(cx + px * R, cy - py * R, Math.max(0.4, rad), 0, 6.2832); ctx.fill();
      }
    }
    var t0 = performance.now(), raf = 0, visible = !('IntersectionObserver' in window), running = false;
    draw(0);
    function loop(now) { draw((now - t0) / 1000); raf = requestAnimationFrame(loop); }
    function run() { if (!raf && visible && !document.hidden && running) raf = requestAnimationFrame(loop); }
    function halt() { if (raf) cancelAnimationFrame(raf); raf = 0; }
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) run(); else halt(); }).observe(cv);
    document.addEventListener('visibilitychange', function () { if (document.hidden) halt(); else run(); });
    window.addEventListener('resize', function () { size(); draw((performance.now() - t0) / 1000); });
    var api = {
      start: function () { if (opts.still) return api; running = true; run(); return api; },
      stop: function () { running = false; halt(); return api; },
      setCompose: function (v) { compose = v; if (!raf) draw((performance.now() - t0) / 1000); },
      redraw: function () { draw((performance.now() - t0) / 1000); },
      canvas: cv
    };
    return api;
  };
})();
