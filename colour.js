/* IntegrateAI · Signal Colour · the colour layer's script. Load after the components and the sig-* modules,
   before sig-main.js. It only (1) hands the brand palette to the 3D components, and (2) adds small colour
   touches the stylesheet cannot reach (canvas drawings, a second chart series, coloured ripples on the orb).
   Every part checks that its target exists, so it drops onto Signal 1.1 and 1.2 alike. */
(function () {
  'use strict';

  /* ---------- the palette: brand hues only ---------- */
  var HUE = {
    green: '#3E8E6B', greenText: '#357A5C', greenLight: '#6AA98C', chartGreen: '#3D8F5B',
    blue: '#4A7FC0', blueText: '#3A67A0',
    sea: '#448796', seaText: '#366C78',        // the green and the blue mixed half and half: the "Get efficient" goal
    amber: '#BA7F27', amberText: '#92641F', amberLight: '#E6B061'
  };
  // Every tool has the colour of the goal it serves: money green, sales blue, operations sea, customers amber.
  var TOOL = {
    'xero': 'green', 'stripe': 'green', 'bank': 'green', 'payroll': 'green',
    'shopify': 'blue', 'wholesale': 'blue', 'web stats': 'blue', 'social': 'blue',
    'cropster': 'sea', 'royal mail': 'sea', 'dpd': 'sea', 'basecamp': 'sea', 'stock': 'sea', 'sheets': 'sea', 'calendar': 'sea', 'inbox': 'sea',
    'skio': 'amber', 'klaviyo': 'amber', 'reviews': 'amber', 'till': 'amber'
  };

  window.IA_COLOUR = {
    hue: HUE,
    tool: TOOL,
    // tiles3d: ten of the twenty tiles take a coloured material; the rest stay chrome, pearl, porcelain and black glass
    tiles3d: {
      tiles: {
        'Xero': 'glassGreen',
        'Shopify': 'ceramicBlue',
        'Skio': 'ceramicAmber',
        'Stripe': 'ceramicGreen',
        'Cropster': { accent: '#366C78' },
        'Royal Mail': { accent: '#366C78' },
        'Klaviyo': 'frostAmber',
        'Bank': 'frostGreen',
        'Payroll': 'aluGreen',
        'Calendar': 'glassSea',
        'Wholesale': 'aluBlue',
        'Reviews': 'glassAmber',
        'Social': 'frostBlue',
        'Web stats': { accent: '#3A67A0' }
      }
    },
    // orb3d: a warm key glint and a cool sea rim, very light; ripples take the colour of the tool that sent them
    orb3d: { tint: { glint: '#FFF0D6', rim: '#9CCFD9', amount: 0.72 } }
  };

  function hexRgb(h) { h = h.replace('#', ''); return [parseInt(h.slice(0, 2), 16) / 255, parseInt(h.slice(2, 4), 16) / 255, parseInt(h.slice(4, 6), 16) / 255]; }
  window.IA_COLOUR.rgb = hexRgb;

  var S = window.SIG;
  if (!S) return;

  /* ---------- the dotted band under the mission control header: the orb's band, unrolled, in the brand hues ---------- */
  if (S.makeMatrix) {
    var stops = [hexRgb(HUE.green), hexRgb(HUE.sea), hexRgb(HUE.blue), hexRgb(HUE.amber)];
    var at = function (u) {
      u = Math.max(0, Math.min(1, u)) * (stops.length - 1);
      var i = Math.min(stops.length - 2, Math.floor(u)), f = u - i, a = stops[i], b = stops[i + 1];
      return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
    };
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
          var on = Math.max(0, Math.min(1, (reveal * 56 - s) / 8));
          if (on <= 0) continue;
          var a = 2 * Math.PI * s / 44, x = 4 + s * (W - 8) / 43;
          var depth = 0.5 + 0.5 * Math.sin(a + 0.6), c = at(s / 43);
          for (var k = 0; k < lanes.length; k++) {
            var l = lanes[k];
            var y = H / 2 + (l - 5.5) * H * 0.13 + (0.16 * Math.sin(3 * a - 1.7 * t + 0.22 * l) + 0.07 * Math.sin(5 * a + 1.1 * t)) * H * 0.9;
            ctx.fillStyle = 'rgba(' + Math.round(c[0] * 255) + ',' + Math.round(c[1] * 255) + ',' + Math.round(c[2] * 255) + ',' + ((0.3 + 0.5 * depth) * on).toFixed(3) + ')';
            ctx.beginPath(); ctx.arc(x, y, 0.75 + 0.55 * depth, 0, 6.2832); ctx.fill();
          }
        }
      }
      function loop(now) { draw((now - t0) / 1000); raf = requestAnimationFrame(loop); }
      function run() { if (!raf && visible && live && !document.hidden) raf = requestAnimationFrame(loop); }
      function halt() { if (raf) cancelAnimationFrame(raf); raf = 0; }
      size(); draw(0);
      if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) run(); else halt(); }).observe(cv);
      else visible = true;
      document.addEventListener('visibilitychange', function () { if (document.hidden) halt(); else run(); });
      window.addEventListener('resize', function () { size(); draw((performance.now() - t0) / 1000); });
      return {
        setReveal: function (v) { reveal = v; if (!raf) draw((performance.now() - t0) / 1000); },
        start: function () { live = true; run(); }
      };
    };
  }

  /* ---------- the orb: ripples take the colour of the tool that sent them ---------- */
  // The scene calls orb.pulse(strength, angle) as each tool's data reaches the orb. Find the tool on that side.
  if (window.IAOrb3D && !window.IAOrb3D.__colour) {
    var create = window.IAOrb3D.create;
    window.IAOrb3D.__colour = true;
    window.IAOrb3D.create = function (el, opts) {
      opts = opts || {};
      if (!opts.tint && window.IA_COLOUR.orb3d) opts.tint = window.IA_COLOUR.orb3d.tint;
      var api = create(el, opts);
      if (!api || !api.pulse) return api;
      var pulse = api.pulse;
      api.pulse = function (strength, angle, colour) {
        if (colour == null && angle != null) colour = toolColourAt(el, angle);
        if (window.__QA) { var qp = window.IA_COLOUR.qaPulses = window.IA_COLOUR.qaPulses || []; qp.push(colour || 'grey'); if (qp.length > 40) qp.shift(); }
        return pulse.call(api, strength, angle, colour);
      };
      return api;
    };
  }
  function toolColourAt(host, angle) {
    var orbit = host.closest ? host.closest('.scene__orbit, .scene') : null;
    var deck = orbit && orbit.querySelector('.orbit__deck');
    if (!deck) return null;
    var d = deck.getBoundingClientRect(), cx = d.left + d.width / 2, cy = d.top + d.height / 2;
    var best = null, bestD = 0.5;
    Array.prototype.forEach.call(orbit.querySelectorAll('.orbit__pill'), function (p) {
      var hue = TOOL[(p.textContent || '').trim().toLowerCase()];
      if (!hue) return;
      var r = p.getBoundingClientRect();
      if (!r.width) return;
      var a = Math.atan2(-((r.top + r.height / 2) - cy), (r.left + r.width / 2) - cx);
      var dd = Math.abs(Math.atan2(Math.sin(a - angle), Math.cos(a - angle)));
      if (dd < bestD) { bestD = dd; best = HUE[hue]; }
    });
    return best;
  }

  /* ---------- the charts: a blue "Online shop" series under the green total, moving with it ---------- */
  function onlineSeries(svg) {
    var line = svg.querySelector('.cline');
    if (!line || svg.querySelector('.cline2')) return;
    var vb = (svg.getAttribute('viewBox') || '0 0 560 118').split(/\s+/).map(Number), H = vb[3];
    var NS = 'http://www.w3.org/2000/svg';
    var l2 = document.createElementNS(NS, 'polyline');
    l2.setAttribute('class', 'cline2');
    line.parentNode.insertBefore(l2, line);
    var wig = [0, 3, -2, 2, -1, 3, -2, 1, 2, -2, 1, 2, -1, 1, 0];
    function sync() {
      var pts = (line.getAttribute('points') || '').trim().split(/\s+/).map(function (p) { return p.split(',').map(Number); });
      l2.setAttribute('points', pts.map(function (p, i) {
        var h = H - p[1];
        return p[0] + ',' + (H - (h * 0.42 + H * 0.06) + (wig[i % wig.length] || 0) * H / 118).toFixed(1);
      }).join(' '));
    }
    sync();
    if ('MutationObserver' in window) new MutationObserver(sync).observe(line, { attributes: true, attributeFilter: ['points'] });
  }
  // the script sits at the end of the page, so the markup above it already exists; wait only if it does not
  function ready(fn) { if (document.readyState === 'loading' && !document.getElementById('main')) document.addEventListener('DOMContentLoaded', fn); else fn(); }
  // the scene draws one line and one travelling dot per tool; give each the colour its tool wears (CSS --c)
  function paintOrbitLines(svg) {
    var items = Array.prototype.slice.call(document.querySelectorAll('.scene__orbit .orbit__item'));
    var lines = svg.querySelectorAll('line'), dots = svg.querySelectorAll('circle');
    items.forEach(function (it, i) {
      var c = getComputedStyle(it).getPropertyValue('--c').trim();
      if (!c) return;
      if (lines[i]) lines[i].style.stroke = c;
      if (dots[i]) dots[i].style.fill = c;
    });
  }
  // rendered stills: the coloured tiles (made with the same 3D component and palette) replace the greyscale ones
  var STILLS = [
    ['.fold__grid', 'img/grid-colour.png', 1133, 1092],
    ['.float--a', 'img/tile-glass-green.png', 639, 687],
    ['.float--b', 'img/tile-glass-amber.png', 681, 719],
    ['.float--c', 'img/tile-glass-blue.png', 652, 723],
    ['.float--d', 'img/tile-glass-sea.png', 652, 723],
    // Signal 1.2: three rendered tiles drift far behind the hero
    ['.far-w--a .far', 'img/tile-glass-green.png', 639, 687],
    ['.far-w--b .far', 'img/tile-glass-amber.png', 681, 719],
    ['.far-w--c .far', 'img/tile-glass-blue.png', 652, 723]
  ];
  ready(function () {
    STILLS.forEach(function (st) {
      var img = document.querySelector(st[0]);
      if (!img) return;
      img.setAttribute('width', st[2]); img.setAttribute('height', st[3]);
      img.src = st[1];
    });
    Array.prototype.forEach.call(document.querySelectorAll('.chart'), onlineSeries);
    // the hero's light blooms when the mission control card appears (or after a few seconds, whatever happens)
    var hero = document.querySelector('.hero'), fig = hero && hero.querySelector('.hero__figure');
    if (hero) {
      var lit = function () { hero.classList.add('c-lit'); };
      var cap = setTimeout(lit, 5200);
      if (fig && 'MutationObserver' in window) {
        var mo = new MutationObserver(function () {
          if (fig.style.visibility === 'visible' || getComputedStyle(fig).visibility === 'visible' && fig.style.visibility) { clearTimeout(cap); mo.disconnect(); setTimeout(lit, 350); }
        });
        mo.observe(fig, { attributes: true, attributeFilter: ['style'] });
      }
    }
    var lsvg = document.querySelector('.orbit__lines');
    if (lsvg && 'MutationObserver' in window) {
      var pending = false;
      new MutationObserver(function () { if (pending) return; pending = true; requestAnimationFrame(function () { pending = false; paintOrbitLines(lsvg); }); }).observe(lsvg, { childList: true });
    }
    // the full stop of the two display headlines is the brand's "running" green
    ['.hero__line:last-child .w', '.close__title'].forEach(function (sel) {
      var el = document.querySelector(sel);
      if (!el) return;
      var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null), n, last = null;
      while ((n = walker.nextNode())) if (/\.\s*$/.test(n.nodeValue)) last = n;
      if (!last) return;
      var i = last.nodeValue.lastIndexOf('.');
      var tail = last.splitText(i);
      var dot = document.createElement('span'); dot.className = 'c-stop'; dot.textContent = '.';
      tail.nodeValue = tail.nodeValue.slice(1);
      tail.parentNode.insertBefore(dot, tail);
    });
  });
})();
