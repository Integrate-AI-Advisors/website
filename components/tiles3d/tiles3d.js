/* IntegrateAI · tiles3d · "Twenty dashboards become one" as a real 3D scene.
   Global: IATiles3D. Needs three@0.149.0 (UMD, global THREE) and loads it itself when absent.
   One canvas, 20 tiles + 1 deck + 566 orb dots. See README.md for the API.
   Signal Colour edition (1.1-c): adds an optional `palette` (per-tile finish and accent ink, extra finishes,
   including tinted ceramics, coloured glass and anodised metals). With no palette it renders exactly as 1.0:
   greyscale. The palette comes from opts.palette, or from window.IA_COLOUR.tiles3d when the page sets one.
   The deck and its orb always stay greyscale (the logo). */
(function (root) {
  'use strict';

  var THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.149.0/build/three.min.js';
  var FONT_URL = 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500&display=swap';
  var MONO = '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace';
  var FOV = 30;                 // telephoto product lens: calm perspective
  var WORLD_H = 10;             // world units spanned by the container height on the paper plane (z = 0)
  var DECK_FACE_Z = 1.55;       // the deck floats above the tiles
  var H = 1 / 120;              // fixed physics step

  /* ------------------------------------------------------------------ loaders */
  var threeP = null;
  function loadThree() {
    if (root.THREE && root.THREE.WebGLRenderer) return Promise.resolve(root.THREE);
    if (threeP) return threeP;
    threeP = new Promise(function (res, rej) {
      var s = document.createElement('script');
      s.src = THREE_URL; s.async = true;
      s.onload = function () { if (root.THREE) res(root.THREE); else rej(new Error('three.js missing')); };
      s.onerror = function () { rej(new Error('three.js failed to load')); };
      document.head.appendChild(s);
    });
    return threeP;
  }

  function loadFonts() {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    var spec = '500 32px "JetBrains Mono"';
    function tryLoad() { return document.fonts.load(spec).then(function (f) { return !!(f && f.length); }, function () { return false; }); }
    var p = tryLoad().then(function (ok) {
      if (ok) return;
      if (!document.querySelector('link[data-ia-mono]')) {
        var l = document.createElement('link');
        l.rel = 'stylesheet'; l.href = FONT_URL; l.setAttribute('data-ia-mono', '');
        document.head.appendChild(l);
      }
      return new Promise(function (res) {
        var done = false;
        var cap = setTimeout(function () { done = true; res(); }, 2000);
        (function poll() {
          tryLoad().then(function (ok2) {
            if (done) return;
            if (ok2) { done = true; clearTimeout(cap); res(); } else setTimeout(poll, 120);
          });
        })();
      });
    });
    return Promise.race([p, new Promise(function (r) { setTimeout(r, 2600); })]);
  }

  /* ------------------------------------------------------------------ helpers */
  function clamp(a, b, v) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function smooth(a, b, v) { var t = clamp(0, 1, (v - a) / (b - a)); return t * t * (3 - 2 * t); }
  function mulberry(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function sgn(v) { return v < 0 ? -1 : 1; }
  // inverse of power2.inOut, so arrivals line up with a power2.inOut countdown
  function invIO(y) { return y < 0.5 ? Math.sqrt(y / 2) : 1 - Math.sqrt((1 - y) / 2); }

  /* ------------------------------------------------------------------ content */
  var TILES = [
    { name: 'Xero', finish: 'ink', glyph: 'xero' },
    { name: 'Shopify', finish: 'pearl', glyph: 'bars1' },
    { name: 'Skio', finish: 'graphite', glyph: 'skio' },
    { name: 'Stripe', finish: 'porcelain', glyph: 'line1' },
    { name: 'Cropster', finish: 'chrome', glyph: 'curve' },
    { name: 'Royal Mail', finish: 'dots', glyph: 'track' },
    { name: 'DPD', finish: 'ink', glyph: 'dpd' },
    { name: 'Klaviyo', finish: 'porcelain', glyph: 'mail' },
    { name: 'Basecamp', finish: 'graphite', glyph: 'checks' },
    { name: 'Bank', finish: 'frost', glyph: 'ledger' },
    { name: 'Payroll', finish: 'alu', glyph: 'bars2' },
    { name: 'Inbox', finish: 'pearl', glyph: 'inbox' },
    { name: 'Calendar', finish: 'ink', glyph: 'cal' },
    { name: 'Sheets', finish: 'hatch', glyph: 'sheet' },
    { name: 'Stock', finish: 'chrome', glyph: 'hbars' },
    { name: 'Wholesale', finish: 'porcelain', glyph: 'line2' },
    { name: 'Reviews', finish: 'graphite', glyph: 'stars' },
    { name: 'Social', finish: 'frost', glyph: 'social' },
    { name: 'Web stats', finish: 'pearl', glyph: 'area' },
    { name: 'Till', finish: 'ink', glyph: 'bars3' }
  ];

  // Physically based finishes (sRGB hex; converted to linear at build time).
  var FIN = {
    chrome:    { color: '#f3f3f5', metal: 1, rough: 0.03, env: 'chrome', dome: 1, envI: 1.0, ink: '#141416', inkR: 0.62 },
    alu:       { color: '#dadade', metal: 1, rough: 0.22, env: 'chrome', dome: 1, envI: 1.0, ink: '#141416', inkR: 0.62 },
    graphite:  { color: '#505056', metal: 0.92, rough: 0.34, env: 'bright', envI: 0.6, ink: '#e8e8ea', inkR: 0.5, emit: 0.32, pat: '#76767d', patR: 0.16, patAmt: 1 },
    ink:       { color: '#0c0c0e', metal: 0, rough: 0.14, cc: 1, ccr: 0.03, env: 'dark', envI: 1.0, ink: '#efefed', inkR: 0.5, emit: 0.78 },
    pearl:     { color: '#f7f7f5', metal: 0, rough: 0.32, cc: 1, ccr: 0.08, sheen: 0.4, env: 'bright', envI: 1.0, ink: '#18181a', inkR: 0.6 },
    porcelain: { color: '#fbfbfa', metal: 0, rough: 0.6, cc: 0.25, ccr: 0.35, env: 'bright', envI: 1.0, ink: '#18181a', inkR: 0.75 },
    dots:      { color: '#f7f7f5', metal: 0, rough: 0.32, cc: 1, ccr: 0.08, sheen: 0.4, env: 'bright', envI: 1.0, ink: '#18181a', inkR: 0.6, pat: '#8c8c8a', patR: 0.95, patAmt: 1 },
    hatch:     { color: '#f6f6f4', metal: 0, rough: 0.55, cc: 0.25, ccr: 0.35, env: 'bright', envI: 1.0, ink: '#18181a', inkR: 0.75, pat: '#c9c9c6', patR: 0.85, patAmt: 1 },
    frost:     { color: '#ffffff', metal: 0, rough: 0.3, cc: 1, ccr: 0.12, env: 'bright', envI: 1.0, ink: '#18181a', inkR: 0.62, opacity: 0.58, edge: 1, shadow: 0.5 }
  };
  // Signal Colour: finishes a palette can use by name (never used unless a palette asks for them).
  // `accent` inks the live glyph (bars, lines, dots) in its own colour; `glow` lets a glass body light itself a
  // little, as coloured glass does. Colours are sRGB hex, brand hues only (green #3E8E6B, blue #4A7FC0,
  // amber #BA7F27, and their tints and shades).
  var FIN_COLOUR = {
    // tinted ceramic: soft pastel glaze, the glyph in the hue, the label a deep shade of it
    ceramicGreen: { color: '#c0e2d0', metal: 0, rough: 0.34, cc: 1, ccr: 0.08, sheen: 0.3, glow: 0.05, env: 'bright', envI: 1.0, ink: '#1c4d39', inkR: 0.6, accent: '#2c7a58' },
    ceramicBlue:  { color: '#c5d9f3', metal: 0, rough: 0.34, cc: 1, ccr: 0.08, sheen: 0.3, glow: 0.05, env: 'bright', envI: 1.0, ink: '#1f3b62', inkR: 0.6, accent: '#3a67a0' },
    ceramicSea:   { color: '#c3dde3', metal: 0, rough: 0.34, cc: 1, ccr: 0.08, sheen: 0.3, glow: 0.05, env: 'bright', envI: 1.0, ink: '#1d4049', inkR: 0.6, accent: '#366c78' },
    ceramicAmber: { color: '#f6d7a0', metal: 0, rough: 0.34, cc: 1, ccr: 0.08, sheen: 0.3, glow: 0.05, env: 'bright', envI: 1.0, ink: '#553a10', inkR: 0.6, accent: '#a86f1c' },
    // coloured glass: a jewel body lit from within (not tone mapped, so the face is the brand hue itself),
    // dark studio reflections for crisp strip highlights, pale self-lit ink
    glassGreen:   { color: '#3e8e6b', metal: 0, rough: 0.08, cc: 1, ccr: 0.03, env: 'dark', envI: 1.0, glow: 0.66, tm: false, ink: '#f3fbf7', inkR: 0.5, emit: 0.62, grad: 0.2 },
    glassBlue:    { color: '#4a7fc0', metal: 0, rough: 0.08, cc: 1, ccr: 0.03, env: 'dark', envI: 1.0, glow: 0.66, tm: false, ink: '#f4f8fd', inkR: 0.5, emit: 0.62, grad: 0.2 },
    glassSea:     { color: '#448796', metal: 0, rough: 0.08, cc: 1, ccr: 0.03, env: 'dark', envI: 1.0, glow: 0.66, tm: false, ink: '#f3f9fb', inkR: 0.5, emit: 0.62, grad: 0.2 },
    glassAmber:   { color: '#ba7f27', metal: 0, rough: 0.08, cc: 1, ccr: 0.03, env: 'dark', envI: 1.0, glow: 0.7, tm: false, ink: '#fffaf0', inkR: 0.5, emit: 0.62, grad: 0.2 },
    // frosted tinted glass: translucent, the paper shows through
    frostGreen:   { color: '#9fd0b8', metal: 0, rough: 0.28, cc: 1, ccr: 0.12, env: 'bright', envI: 1.0, ink: '#163f2e', inkR: 0.62, opacity: 0.74, edge: 1, shadow: 0.55, accent: '#2c7a58' },
    frostBlue:    { color: '#a8c6ec', metal: 0, rough: 0.28, cc: 1, ccr: 0.12, env: 'bright', envI: 1.0, ink: '#1a3458', inkR: 0.62, opacity: 0.74, edge: 1, shadow: 0.55, accent: '#3a67a0' },
    frostSea:     { color: '#a3cbd4', metal: 0, rough: 0.28, cc: 1, ccr: 0.12, env: 'bright', envI: 1.0, ink: '#183a42', inkR: 0.62, opacity: 0.74, edge: 1, shadow: 0.55, accent: '#366c78' },
    frostAmber:   { color: '#f5c266', metal: 0, rough: 0.28, cc: 1, ccr: 0.12, env: 'bright', envI: 1.0, glow: 0.06, ink: '#4a300a', inkR: 0.62, opacity: 0.8, edge: 1, shadow: 0.55, accent: '#9a6418' },
    // anodised aluminium: tinted metal, the chrome studio
    aluGreen:     { color: '#b3dac7', metal: 1, rough: 0.22, env: 'chrome', dome: 1, envI: 1.0, ink: '#12321f', inkR: 0.62 },
    aluBlue:      { color: '#bcd2f0', metal: 1, rough: 0.22, env: 'chrome', dome: 1, envI: 1.0, ink: '#14284a', inkR: 0.62 },
    aluSea:       { color: '#b6d4dc', metal: 1, rough: 0.22, env: 'chrome', dome: 1, envI: 1.0, ink: '#13303a', inkR: 0.62 },
    aluAmber:     { color: '#eed2a0', metal: 1, rough: 0.22, env: 'chrome', dome: 1, envI: 1.0, ink: '#3b2606', inkR: 0.62 }
  };

  var MODE = { STATIC: 0, VBARS: 1, HBARS: 2, HGROW: 3, DRAW: 4, BLINK_DPD: 5, BLINK_CAL: 6, SPIN: 7 };

  /* ------------------------------------------------------------------ glyph drawing (64 x vb viewBox, ported from the DOM tiles) */
  function grey(v) { var c = Math.round(clamp(0, 1, v) * 255); return 'rgb(' + c + ',' + c + ',' + c + ')'; }
  function rr(g, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    g.beginPath();
    g.moveTo(x + r, y); g.lineTo(x + w - r, y); g.arcTo(x + w, y, x + w, y + r, r);
    g.lineTo(x + w, y + h - r); g.arcTo(x + w, y + h, x + w - r, y + h, r);
    g.lineTo(x + r, y + h); g.arcTo(x, y + h, x, y + h - r, r);
    g.lineTo(x, y + r); g.arcTo(x, y, x + r, y, r); g.closePath();
  }
  function fillRR(g, x, y, w, h, r, v) { rr(g, x, y, w, h, r); g.fillStyle = grey(v); g.fill(); }
  function circ(g, x, y, r) { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); }
  function fillC(g, x, y, r, v) { circ(g, x, y, r); g.fillStyle = grey(v); g.fill(); }
  function strokeP(g, d, lw, v) { g.lineWidth = lw; g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = grey(v); if (d == null) g.stroke(); else g.stroke(typeof d === 'string' ? new Path2D(d) : d); }
  function poly(pts) { var p = pts.split(' ').map(function (s) { return s.split(',').map(Number); }); var d = 'M' + p[0][0] + ' ' + p[0][1]; for (var i = 1; i < p.length; i++) d += ' L' + p[i][0] + ' ' + p[i][1]; return d; }
  function vRamp(g, x, y, w, h) { var gr = g.createLinearGradient(0, y + h, 0, y); gr.addColorStop(0, '#000'); gr.addColorStop(1, '#fff'); g.fillStyle = gr; g.fillRect(x - 2.5, y - 2, w + 5, h + 2); }
  function hRamp(g, x, y, w, h) { var gr = g.createLinearGradient(x, 0, x + w, 0); gr.addColorStop(0, '#000'); gr.addColorStop(1, '#fff'); g.fillStyle = gr; g.fillRect(x, y - 2.5, w + 2, h + 5); }
  function bars(L, list) { list.forEach(function (b) { fillRR(L.G, b[0], b[1], b[2], b[3], 2, 1); vRamp(L.B, b[0], b[1], b[2], b[3]); }); }

  var GLYPHS = {
    xero: { vb: 12, mode: MODE.HGROW, num: '£840', draw: function (L) { fillRR(L.R, 0, 4, 64, 4, 2, 0.28); fillRR(L.G, 0, 4, 46, 4, 2, 1); hRamp(L.B, 0, 4, 46, 4); } },
    bars1: { mode: MODE.VBARS, draw: function (L) { bars(L, [[1, 18, 9, 14], [14, 8, 9, 24], [27, 14, 9, 18], [40, 4, 9, 28], [53, 11, 9, 21]]); } },
    bars2: { mode: MODE.VBARS, draw: function (L) { bars(L, [[1, 10, 9, 22], [14, 16, 9, 16], [27, 6, 9, 26], [40, 12, 9, 20], [53, 20, 9, 12]]); } },
    bars3: { mode: MODE.VBARS, draw: function (L) { bars(L, [[1, 14, 9, 18], [14, 20, 9, 12], [27, 9, 9, 23], [40, 16, 9, 16], [53, 4, 9, 28]]); } },
    skio: { mode: MODE.SPIN, draw: function (L) {
      circ(L.R, 15, 16, 11); L.R.lineWidth = 4.5; L.R.strokeStyle = grey(0.25); L.R.stroke();
      circ(L.G, 15, 16, 11); L.G.lineWidth = 4.5; L.G.strokeStyle = grey(1); L.G.stroke();
      fillRR(L.R, 34, 10, 28, 4, 2, 1); fillRR(L.R, 34, 19, 18, 4, 2, 0.45);
    } },
    line1: { mode: MODE.DRAW, draw: function (L) { strokeP(L.G, poly('2,26 12,19 22,22 32,11 42,15 52,5 62,8'), 3, 1); } },
    line2: { mode: MODE.DRAW, draw: function (L) { strokeP(L.G, poly('2,10 12,14 22,8 32,18 42,14 52,22 62,20'), 3, 1); } },
    curve: { mode: MODE.DRAW, draw: function (L) { strokeP(L.G, 'M2 29 C10 29 13 5 24 5 S40 15 48 16 S58 13 62 13', 3, 1); fillC(L.R, 62, 13, 3, 1); } },
    track: { mode: MODE.HGROW, draw: function (L) { fillRR(L.R, 2, 14, 60, 5, 2.5, 0.25); fillRR(L.G, 2, 14, 40, 5, 2.5, 1); hRamp(L.B, 2, 14, 40, 5); fillC(L.R, 42, 16.5, 6, 1); } },
    dpd: { mode: MODE.BLINK_DPD, draw: function (L) {
      var op = [[1, 1, 0.3, 1, 0.3, 1], [0.3, 1, 1, 0.3, 1, 1], [1, 0.3, 1, 1, 1, 0.3]];
      for (var r = 0; r < 3; r++) for (var c = 0; c < 6; c++) fillC(L.G, 4 + c * 10, 6 + r * 10, 2.6, op[r][c]);
    } },
    mail: { draw: function (L) { rr(L.R, 2, 5, 34, 23, 4); strokeP(L.R, null, 2.6, 1); strokeP(L.R, 'M3 7 L19 18 L35 7', 2.6, 1); fillC(L.R, 50, 10, 5, 1); } },
    inbox: { draw: function (L) { rr(L.R, 2, 5, 34, 23, 4); strokeP(L.R, null, 2.6, 1); strokeP(L.R, 'M3 18 H13 L16 22 H22 L25 18 H35', 2.6, 1); fillC(L.R, 50, 10, 5, 1); } },
    checks: { draw: function (L) { strokeP(L.R, 'M2 5.5l3 3 5-6M2 16.5l3 3 5-6M2 27l3 3 5-6', 2.6, 1); fillRR(L.R, 16, 4, 40, 4, 2, 1); fillRR(L.R, 16, 15, 30, 4, 2, 1); fillRR(L.R, 16, 26, 44, 4, 2, 0.4); } },
    ledger: { draw: function (L) { fillRR(L.R, 0, 2, 64, 4, 2, 1); fillRR(L.R, 0, 12, 44, 4, 2, 0.4); fillRR(L.R, 0, 20, 54, 4, 2, 0.4); fillRR(L.R, 0, 28, 30, 4, 2, 0.4); } },
    cal: { mode: MODE.BLINK_CAL, draw: function (L) {
      var op = [[1, 0.3, 1, 1, 0.3, 1, 0.3], [0.3, 1, 1, 0.3, 1, 1, 1], [1, 1, 0.3, 1, 0.3, 1, 1]];
      for (var r = 0; r < 3; r++) for (var c = 0; c < 7; c++) { var n = r * 7 + c + 1; fillRR(n % 4 === 0 ? L.G : L.R, c * 9.5, r * 12, 7, 7, 2, op[r][c]); }
    } },
    sheet: { draw: function (L) { rr(L.R, 1.5, 1.5, 61, 29, 3); strokeP(L.R, null, 2.6, 1); strokeP(L.R, 'M1.5 11 H62.5 M1.5 21 H62.5 M22 1.5 V30.5 M42 1.5 V30.5', 2.6, 1); } },
    hbars: { mode: MODE.HBARS, draw: function (L) { [[0, 2, 58, 5], [0, 13, 36, 5], [0, 24, 47, 5]].forEach(function (b) { fillRR(L.G, b[0], b[1], b[2], b[3], 2.5, 1); hRamp(L.B, b[0], b[1], b[2], b[3]); }); } },
    stars: { draw: function (L) {
      [6, 19, 32, 45, 58].forEach(function (x, i) {
        var d = 'M' + x + ' 8l1.9 3.9 4.3.6-3.1 3 .7 4.3L' + x + ' 17.8l-3.8 2 .7-4.3-3.1-3 4.3-.6z';
        L.R.fillStyle = grey(i === 4 ? 0.3 : 1); L.R.fill(new Path2D(d));
      });
    } },
    social: { draw: function (L) { circ(L.R, 14, 16, 11); strokeP(L.R, null, 2.6, 1); fillC(L.R, 14, 16, 4.5, 1); fillRR(L.R, 32, 9, 30, 4, 2, 1); fillRR(L.R, 32, 19, 22, 4, 2, 0.45); } },
    area: { mode: MODE.DRAW, draw: function (L) { L.R.fillStyle = grey(0.12); L.R.fill(new Path2D('M2 30 L2 22 L12 18 L22 21 L32 12 L42 14 L52 6 L62 9 L62 30 Z')); strokeP(L.G, poly('2,22 12,18 22,21 32,12 42,14 52,6 62,9'), 3, 1); } }
  };

  function drawTracked(g, text, x, y, track) {
    for (var i = 0; i < text.length; i++) { var ch = text[i]; g.fillText(ch, x, y); x += g.measureText(ch).width + track; }
  }
  function trackedWidth(g, text, track) { var w = 0; for (var i = 0; i < text.length; i++) w += g.measureText(text[i]).width + (i < text.length - 1 ? track : 0); return w; }

  // One atlas cell: R static ink, G animated ink, B animation ramp, A surface pattern.
  function drawCell(L, tile, C, fs, rng, finDefs) {
    var R = L.R, A = L.A;
    var pad = Math.round(C * 0.145);
    var fd = finDefs && finDefs[tile.finish];
    var fin = (fd && fd.pattern) || tile.finish;
    // surface pattern, clipped to the flat face
    A.save();
    rr(A, C * 0.085, C * 0.085, C * 0.83, C * 0.83, C * 0.2); A.clip();
    if (fin === 'dots') {
      var sp = C / 15, rad = C * 0.0115;
      for (var yy = sp * 0.5; yy < C; yy += sp) for (var xx = sp * 0.5; xx < C; xx += sp) fillC(A, xx, yy, rad, 1);
    } else if (fin === 'graphite') {
      for (var s = 0; s < 260; s++) {
        var y = rng() * C, a = 0.1 + rng() * 0.55, len = C * (0.25 + rng() * 0.9), x0 = rng() * C - len * 0.3;
        A.fillStyle = 'rgba(255,255,255,' + a.toFixed(3) + ')';
        A.fillRect(x0, y, len, Math.max(1, C * 0.0028));
      }
    } else if (fin === 'hatch') {
      A.strokeStyle = '#fff'; A.lineWidth = Math.max(1, C * 0.0075);
      var step = C * 0.057;
      for (var k = -C; k < C * 2; k += step) { A.beginPath(); A.moveTo(k, 0); A.lineTo(k - C, C); A.stroke(); }
    }
    A.restore();

    // label: JetBrains Mono 500, uppercase, 0.08em tracking, wraps to two lines when narrow
    var fpx = C * fs, track = fpx * 0.08, maxW = C - pad * 2;
    R.font = '500 ' + fpx.toFixed(2) + 'px ' + MONO;
    R.fillStyle = '#fff'; R.textBaseline = 'alphabetic';
    var name = tile.name.toUpperCase(), lines = [name];
    if (trackedWidth(R, name, track) > maxW && name.indexOf(' ') > 0) lines = name.split(' ');
    var lh = fpx * 1.14, y0 = pad + fpx * 0.74;
    lines.forEach(function (ln, i) {
      var w = trackedWidth(R, ln, track), sc = w > maxW ? maxW / w : 1;
      R.save(); R.translate(pad, y0 + i * lh); R.scale(sc, 1); drawTracked(R, ln, 0, 0, track); R.restore();
    });

    // glyph box at the bottom
    var gdef = GLYPHS[tile.glyph], vb = gdef.vb || 32;
    var gw = C - pad * 2, gh = gw * vb / 64, gx = pad, gy = C - pad - gh;
    if (gdef.num) {
      var npx = C * 0.19;
      R.font = '500 ' + npx.toFixed(2) + 'px ' + MONO;
      R.save(); R.translate(gx, gy - C * 0.035); drawTracked(R, gdef.num, 0, 0, -npx * 0.03); R.restore();
    }
    var sc = gw / 64;
    [L.R, L.G, L.B].forEach(function (g) { g.save(); g.setTransform(sc, 0, 0, sc, gx, gy); });
    gdef.draw(L);
    [L.R, L.G, L.B].forEach(function (g) { g.restore(); });
    return { gx: gx / C, gyTop: 1 - gy / C, gw: gw / C, gh: gh / C, vb: vb, mode: gdef.mode || 0 };
  }

  function buildAtlas(THREE, C, fs, defs, finDefs) {
    var cols = 5, rows = 4, W = cols * C, Ht = rows * C;
    var data = new Uint8Array(W * Ht * 4);
    var rng = mulberry(7);
    var names = ['R', 'G', 'B', 'A'], L = {};
    names.forEach(function (n) {
      var c = document.createElement('canvas'); c.width = c.height = C;
      L[n] = c.getContext('2d', { willReadFrequently: true });
    });
    var meta = [];
    (defs || TILES).forEach(function (tile, i) {
      names.forEach(function (n) { var g = L[n]; g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#000'; g.fillRect(0, 0, C, C); });
      var info = drawCell(L, tile, C, fs, rng, finDefs);
      var col = i % cols, row = Math.floor(i / cols);
      var ch = names.map(function (n) { return L[n].getImageData(0, 0, C, C).data; });
      for (var y = 0; y < C; y++) {
        var drow = (Ht - 1 - (row * C + y)) * W + col * C;
        for (var x = 0; x < C; x++) {
          var si = (y * C + x) * 4, di = (drow + x) * 4;
          data[di] = ch[0][si]; data[di + 1] = ch[1][si]; data[di + 2] = ch[2][si]; data[di + 3] = ch[3][si];
        }
      }
      info.cell = [col * C / W, (Ht - (row + 1) * C) / Ht, C / W, C / Ht];
      meta.push(info);
    });
    var tex = new THREE.DataTexture(data, W, Ht, THREE.RGBAFormat, THREE.UnsignedByteType);
    tex.generateMipmaps = true;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.flipY = false;
    tex.needsUpdate = true;
    return { tex: tex, meta: meta };
  }

  /* ------------------------------------------------------------------ geometry: machined squircle slab with a quarter-round bevel */
  function outline(cr, n, ns) {
    var pts = [], e = 2 / n, q = [[1, 1], [-1, 1], [-1, -1], [1, -1]];
    for (var c = 0; c < 4; c++) {
      var ccx = q[c][0] * (0.5 - cr), ccy = q[c][1] * (0.5 - cr);
      for (var k = 0; k <= ns; k++) {
        var phi = c * Math.PI / 2 + (k / ns) * Math.PI / 2, co = Math.cos(phi), si = Math.sin(phi);
        if (Math.abs(co) < 1e-9) co = 0; if (Math.abs(si) < 1e-9) si = 0;
        var ux = sgn(co) * Math.pow(Math.abs(co), e), uy = sgn(si) * Math.pow(Math.abs(si), e);
        var gx = sgn(ux) * Math.pow(Math.abs(ux), n - 1), gy = sgn(uy) * Math.pow(Math.abs(uy), n - 1), gl = Math.hypot(gx, gy) || 1;
        pts.push({ x: ccx + cr * ux, y: ccy + cr * uy, nx: gx / gl, ny: gy / gl });
      }
    }
    return pts;
  }

  function slabGeometry(THREE, o) {
    var pts = outline(o.r, o.n, o.ns || 14), M = pts.length;
    var br = o.bevel, th = o.depth, dome = o.dome || 0, bs = o.bs || 7, J = o.cap || 6;
    var pos = [], nor = [], uv = [], idx = [];
    function v(x, y, z, nx, ny, nz) { pos.push(x, y, z); nor.push(nx, ny, nz); uv.push(x + 0.5, y + 0.5); return pos.length / 3 - 1; }
    var face = pts.map(function (p) { return { x: p.x - p.nx * br, y: p.y - p.ny * br, nx: p.nx, ny: p.ny }; });
    // front cap: concentric rings on a gentle pillow dome. Height comes from a smooth superellipse field
    // (iso-lines are superellipses of exponent m, circles by default) so the normals never crease.
    var fa = 0.5 - br, m4 = o.domeM || 2, ex = 2 / m4;
    function dh(x, y) {
      var ax = Math.abs(x) / fa, ay = Math.abs(y) / fa, S = Math.pow(ax, m4) + Math.pow(ay, m4), q = Math.pow(S, ex);
      if (q >= 1 || dome === 0) return [0, 0, 0];
      var k = 1 - q, dqdS = S > 1e-12 ? ex * Math.pow(S, ex - 1) : 0;
      var dSx = m4 * Math.pow(ax, m4 - 1) / fa * sgn(x), dSy = m4 * Math.pow(ay, m4 - 1) / fa * sgn(y);
      return [dome * k * k, -2 * dome * k * dqdS * dSx, -2 * dome * k * dqdS * dSy];
    }
    var center = v(0, 0, th / 2 + dome, 0, 0, 1), prev = null;
    for (var j = 1; j <= J; j++) {
      var s = 0.5 * (j / J) + 0.5 * Math.sin((j / J) * Math.PI / 2), ring = [];
      if (j === J) s = 1;
      for (var i = 0; i < M; i++) {
        var f = face[i], x = f.x * s, y = f.y * s;
        var H3 = j === J ? [0, 0, 0] : dh(x, y), nl = Math.hypot(H3[1], H3[2], 1);
        ring.push(v(x, y, th / 2 + H3[0], -H3[1] / nl, -H3[2] / nl, 1 / nl));
      }
      if (!prev) { for (var a = 0; a < M; a++) idx.push(center, ring[a], ring[(a + 1) % M]); }
      else { for (var b = 0; b < M; b++) { var b1 = (b + 1) % M; idx.push(prev[b], ring[b], ring[b1], prev[b], ring[b1], prev[b1]); } }
      prev = ring;
    }
    function loop(d, z, nf, nz) { var r = []; for (var i = 0; i < M; i++) { var p = pts[i]; r.push(v(p.x - p.nx * d, p.y - p.ny * d, z, p.nx * nf, p.ny * nf, nz)); } return r; }
    function join(a, b) { for (var i = 0; i < M; i++) { var i1 = (i + 1) % M; idx.push(a[i], b[i], b[i1], a[i], b[i1], a[i1]); } }
    var loops = [prev];
    for (var k = 1; k <= bs; k++) { var t = (k / bs) * Math.PI / 2; loops.push(loop(br * (1 - Math.sin(t)), th / 2 - br * (1 - Math.cos(t)), Math.sin(t), Math.cos(t))); }
    for (var k2 = 0; k2 <= bs; k2++) { var t2 = (k2 / bs) * Math.PI / 2; loops.push(loop(br * (1 - Math.cos(t2)), -th / 2 + br * (1 - Math.sin(t2)), Math.cos(t2), -Math.sin(t2))); }
    for (var L = 0; L < loops.length - 1; L++) join(loops[L], loops[L + 1]);
    var last = loops[loops.length - 1], bc = v(0, 0, -th / 2, 0, 0, -1);
    var back = []; for (var m = 0; m < M; m++) { var q = pos.slice(last[m] * 3, last[m] * 3 + 3); back.push(v(q[0], q[1], q[2], 0, 0, -1)); }
    for (var c2 = 0; c2 < M; c2++) idx.push(bc, back[(c2 + 1) % M], back[c2]);
    var g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeBoundingSphere();
    return g;
  }

  function ringGeometry(THREE, cr, tube) {
    var pts = outline(cr, 2, 28), M = pts.length, R = 10, pos = [], nor = [], idx = [];
    for (var i = 0; i < M; i++) {
      var p = pts[i];
      for (var j = 0; j < R; j++) {
        var a = j / R * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
        pos.push(p.x + p.nx * tube * ca, p.y + p.ny * tube * ca, tube * sa);
        nor.push(p.nx * ca, p.ny * ca, sa);
      }
    }
    for (var i2 = 0; i2 < M; i2++) for (var j2 = 0; j2 < R; j2++) {
      var a0 = i2 * R + j2, a1 = i2 * R + (j2 + 1) % R, b0 = ((i2 + 1) % M) * R + j2, b1 = ((i2 + 1) % M) * R + (j2 + 1) % R;
      idx.push(a0, b0, b1, a0, b1, a1);
    }
    var g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    g.setIndex(idx);
    return g;
  }

  /* ------------------------------------------------------------------ studio environments (hand-built rooms, PMREM filtered) */
  function envScene(THREE, kind) {
    var s = new THREE.Scene();
    var geo = new THREE.SphereGeometry(50, 96, 48), P = geo.attributes.position, col = new Float32Array(P.count * 3);
    for (var i = 0; i < P.count; i++) {
      var x = P.getX(i) / 50, y = P.getY(i) / 50, z = P.getZ(i) / 50, v;
      var up = smooth(-0.2, 0.25, z);
      if (kind === 'bright') v = lerp(0.82 + 0.04 * y, 0.72 + 0.24 * z + 0.16 * y, up);
      else if (kind === 'chrome') {
        // what resting faces reflect (within ~50 deg of the lens) is a smooth gradient; the crisp
        // structure lives outside that zone, so it shows on bevels and sweeps across faces as tiles turn
        var grad = 0.5 + 0.85 * smooth(-0.75, 0.85, y) + 0.08 * x;
        var band = 1 - smooth(-0.93, -0.9, y) * (1 - smooth(-0.8, -0.77, y));
        var side = 1 - 0.86 * smooth(0.8, 0.9, Math.abs(x));
        v = lerp(0.82, grad * side * lerp(1, 0.06, 1 - band), up);
      }
      else v = lerp(0.03, 0.008 + 0.02 * Math.max(0, y), up);
      col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = Math.max(0, v);
    }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    s.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));
    // softboxes with feathered edges: no stair-stepping in sharp reflections, and a real studio falloff
    var fc = document.createElement('canvas'); fc.width = fc.height = 128;
    var fg = fc.getContext('2d'), fd = fg.createImageData(128, 128);
    for (var py = 0; py < 128; py++) for (var px = 0; px < 128; px++) {
      var ex = Math.min(px + 0.5, 127.5 - px) / 128, ey = Math.min(py + 0.5, 127.5 - py) / 128;
      var fa = smooth(0, 0.16, ex) * smooth(0, 0.16, ey), o = (py * 128 + px) * 4;
      fd.data[o] = fd.data[o + 1] = fd.data[o + 2] = Math.round(fa * 255); fd.data[o + 3] = 255;
    }
    fg.putImageData(fd, 0, 0);
    var feather = new THREE.CanvasTexture(fc);
    function panel(d, w, h, v) {
      var m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(v, v, v), side: THREE.DoubleSide, alphaMap: feather, transparent: true, depthWrite: false }));
      var p = new THREE.Vector3(d[0], d[1], d[2]).normalize().multiplyScalar(30);
      m.position.copy(p); m.lookAt(0, 0, 0); s.add(m);
    }
    if (kind === 'bright') {
      panel([-0.42, 0.52, 0.74], 19, 11, 3.2);     // key softbox, upper left
      panel([0.05, 0.93, 0.36], 28, 2.6, 2.6);     // top strip
      panel([0.86, 0.14, 0.5], 2.4, 26, 2.0);      // right strip
      panel([0.52, 0.58, 0.64], 4.2, 4.2, 4.5);    // small sparkle
      panel([0.26, -0.5, 0.82], 22, 5.2, 0.035);   // black flag, a band below centre
      panel([-0.9, -0.12, 0.44], 3.4, 22, 0.05);   // black flag, left
    } else if (kind === 'chrome') {
      panel([-0.64, 0.68, 0.36], 16, 9, 4.2);      // key softbox, high and wide of the lens
      panel([0.9, 0.12, 0.42], 2.2, 26, 3.2);      // right strip
      panel([-0.9, 0.04, 0.43], 1.6, 26, 2.4);     // left strip
      panel([0.05, 0.88, 0.47], 30, 1.3, 3.4);     // thin top line
    } else {
      panel([-0.5, 0.55, 0.67], 17, 10, 2.4);
      panel([0.0, 0.9, 0.43], 26, 1.7, 2.2);
      panel([0.8, 0.2, 0.56], 1.7, 22, 1.3);
      panel([-0.76, -0.36, 0.54], 1.5, 15, 0.55);
    }
    s.userData.feather = feather;
    return s;
  }

  /* ------------------------------------------------------------------ shaders */
  var SHADOW_VS = [
    'uniform mat4 uToLocal; uniform vec2 uShear; uniform vec4 uFloor; uniform float uHmax; uniform float uStrength;',
    'varying float vH;',
    'void main(){',
    '  vec4 wp = modelMatrix * vec4(position, 1.0);',
    '  vec3 lp = (uToLocal * wp).xyz;',
    '  float h = max(lp.z, 0.0);',
    '  vec2 q = lp.xy - uShear * h;',
    '  vH = clamp(h / uHmax, 0.0, 1.0);',
    '  gl_Position = vec4((q - uFloor.xy) / uFloor.zw, vH * 2.0 - 1.0, 1.0);',
    '}'].join('\n');
  var SHADOW_FS = [
    'uniform float uStrength; varying float vH;',
    'void main(){ gl_FragColor = vec4(uStrength, uStrength * vH, 0.0, 1.0); }'].join('\n');
  var QUAD_VS = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
  var BLUR_FS = [
    'uniform sampler2D tMap; uniform vec2 uDir; varying vec2 vUv;',
    'void main(){',
    '  vec4 c = texture2D(tMap, vUv) * 0.2270270270;',
    '  c += texture2D(tMap, vUv + uDir * 1.3846153846) * 0.3162162162;',
    '  c += texture2D(tMap, vUv - uDir * 1.3846153846) * 0.3162162162;',
    '  c += texture2D(tMap, vUv + uDir * 3.2307692308) * 0.0702702703;',
    '  c += texture2D(tMap, vUv - uDir * 3.2307692308) * 0.0702702703;',
    '  gl_FragColor = c;',
    '}'].join('\n');
  var FLOOR_VS = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';
  var FLOOR_FS = [
    'uniform sampler2D tM; uniform sampler2D tW; uniform float uAmp; uniform float uOpacity; uniform float uDither; varying vec2 vUv;',
    'float rnd(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }',
    'void main(){',
    '  vec4 M = texture2D(tM, vUv); vec4 W = texture2D(tW, vUv);',
    '  float h = clamp(W.g / max(W.r, 0.003), 0.0, 1.0);',
    '  float cov = mix(M.r, W.r, smoothstep(0.02, 0.4, h));',
    '  float a = cov * uAmp * mix(1.0, 0.22, smoothstep(0.08, 1.0, h));',
    '  a += (rnd(gl_FragCoord.xy) - 0.5) / 255.0 * uDither;',
    '  vec2 e = smoothstep(0.0, 0.06, vUv) * smoothstep(0.0, 0.06, 1.0 - vUv);',
    '  gl_FragColor = vec4(0.0, 0.0, 0.0, clamp(a, 0.0, 1.0) * uOpacity * e.x * e.y);',
    '}'].join('\n');
  var DOTS_VS = [
    'attribute float aSize; attribute float aGrey; attribute float aAlpha;',
    'uniform float uHalfH; uniform float uFlash; uniform float uOpacity;',
    'varying float vGrey; varying float vAlpha; varying float vPx;',
    'void main(){',
    '  vec4 mv = modelViewMatrix * vec4(position, 1.0);',
    '  gl_Position = projectionMatrix * mv;',
    '  float sc = length((modelMatrix * vec4(1.0, 0.0, 0.0, 0.0)).xyz);',
    '  float px = 2.0 * aSize * sc * (1.0 + 0.18 * uFlash) * uHalfH * projectionMatrix[1][1] / -mv.z;',
    '  vPx = max(px, 1.6);',
    '  gl_PointSize = vPx;',
    '  vGrey = clamp(aGrey + uFlash * 0.16, 0.0, 1.0);',
    '  vAlpha = aAlpha * uOpacity * min(1.0, (px * px) / (1.6 * 1.6));',
    '}'].join('\n');
  var DOTS_FS = [
    'varying float vGrey; varying float vAlpha; varying float vPx;',
    'void main(){',
    '  float d = length(gl_PointCoord * 2.0 - 1.0);',
    '  float aa = 2.0 / vPx;',
    '  float a = 1.0 - smoothstep(1.0 - aa, 1.0, d);',
    '  if (a <= 0.0) discard;',
    '  gl_FragColor = vec4(vec3(vGrey), a * vAlpha);',
    '}'].join('\n');

  var TILE_HEAD = [
    'uniform sampler2D uAtlas; uniform vec4 uCell; uniform vec4 uGBox; uniform float uVb;',
    'uniform vec3 uInk; uniform vec3 uPat; uniform vec3 uInkEmit; uniform vec4 uMat; uniform float uEdge;',
    'uniform vec3 uInk2; uniform vec3 uInkEmit2; uniform float uGrad;',
    'uniform float uTime; uniform float uMode; uniform float uLive; uniform float uPhase;',
    'varying vec2 vFaceUv; varying float vFrontN;',
    'float iaOut(float x){ return 1.0 - pow(1.0 - x, 3.0); }',
    'float iaIO(float x){ return x < 0.5 ? 4.0 * x * x * x : 1.0 - pow(-2.0 * x + 2.0, 3.0) * 0.5; }',
    'float iaPing(float t, float per){ float c = fract(t / (2.0 * per)); return iaOut(c < 0.5 ? c * 2.0 : 2.0 - 2.0 * c); }',
    'float iaAnim(vec4 T, vec2 g){',
    '  float a = T.g;',
    '  if (uMode < 0.5 || a < 0.002) return a;',
    '  float t = uTime; float L = uLive;',
    '  if (uMode < 1.5) { float i = floor(g.x / 12.8); float d = i < 0.5 ? 0.0 : i < 1.5 ? 0.3 : i < 2.5 ? 0.55 : i < 3.5 ? 0.15 : 0.42;',
    '    float s = mix(1.0, mix(0.42, 1.0, iaPing(t + d, 0.8)), L); return a * (1.0 - smoothstep(s - 0.02, s + 0.004, T.b)); }',
    '  if (uMode < 2.5) { float i = floor(g.y / 10.667); float d = i < 0.5 ? 0.0 : i < 1.5 ? 0.3 : 0.55;',
    '    float s = mix(1.0, mix(0.35, 1.0, iaPing(t + d, 0.8)), L); return a * (1.0 - smoothstep(s - 0.02, s + 0.004, T.b)); }',
    '  if (uMode < 3.5) { float s = mix(1.0, mix(0.3, 1.0, iaPing(t, 1.0)), L); return a * (1.0 - smoothstep(s - 0.02, s + 0.004, T.b)); }',
    '  if (uMode < 4.5) { float c = fract(t / 1.6 + uPhase); float p = iaIO(clamp(c / 0.6, 0.0, 1.0));',
    '    float dr = (1.0 - smoothstep(p - 0.015, p + 0.004, g.x / 64.0)) * step(0.002, p); return a * mix(1.0, max(0.22, dr), L); }',
    '  if (uMode < 5.5) { float col = floor(g.x / 10.0); float row = floor(g.y / 10.0); float m = mod(row * 6.0 + col + 1.0, 3.0);',
    '    float d = m < 0.5 ? 0.4 : (m < 1.5 ? 0.8 : 0.0); float c = fract((t + d) / 1.2); float o = (c >= 0.25 && c < 0.75) ? 0.2 : 1.0; return a * mix(1.0, o, L); }',
    '  if (uMode < 6.5) { float c = fract(t / 0.9); float o = (c >= 0.25 && c < 0.75) ? 0.2 : 1.0; return a * mix(1.0, o, L); }',
    '  vec2 q = g - vec2(15.0, 16.0); float ang = fract(atan(q.x, -q.y) / 6.2831853);',
    '  float k = fract(ang - L * 0.75 * fract(t / 1.6)); return a * (1.0 - smoothstep(0.628, 0.642, k));',
    '}'].join('\n');
  var TILE_MAP = [
    '#include <map_fragment>',
    'vec2 iaUv = clamp(vFaceUv, 0.0, 1.0);',
    'vec4 iaT = texture2D(uAtlas, uCell.xy + iaUv * uCell.zw);',
    'float iaFront = smoothstep(0.55, 0.9, vFrontN);',
    'vec2 iaG = vec2((iaUv.x - uGBox.x) / uGBox.z * 64.0, (uGBox.y - iaUv.y) / uGBox.w * uVb);',
    'float iaA = iaAnim(iaT, iaG);',
    'float iaInk = clamp(max(iaT.r, iaA), 0.0, 1.0) * iaFront * uMat.z;',
    // the live glyph (G channel) may carry its own accent ink; labels and static marks (R) keep the tile ink
    'float iaW2 = clamp(iaA / max(iaT.r + iaA, 0.001), 0.0, 1.0);',
    'float iaPat = iaT.a * iaFront * uMat.w;',
    'diffuseColor.rgb = mix(diffuseColor.rgb, uPat, iaPat);',
    'diffuseColor.rgb = mix(diffuseColor.rgb, mix(uInk, uInk2, iaW2), iaInk);',
    'diffuseColor.a = mix(diffuseColor.a, 1.0, max(iaInk, uEdge * (1.0 - smoothstep(0.3, 0.97, vFrontN)) * 0.85));'].join('\n');

  function patchTile(THREE, m, u) {
    m.defines = m.defines || {};
    m.defines.USE_UV = '';
    m.onBeforeCompile = function (sh) {
      for (var k in u) sh.uniforms[k] = u[k];
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec2 vFaceUv;\nvarying float vFrontN;')
        .replace('#include <uv_vertex>', '#include <uv_vertex>\nvFaceUv = uv;\nvFrontN = normal.z;');
      var f = sh.fragmentShader.replace('#include <common>', '#include <common>\n' + TILE_HEAD)
        .replace('#include <map_fragment>', TILE_MAP)
        .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor, uMat.y, iaPat);\nroughnessFactor = mix(roughnessFactor, uMat.x, iaInk);')
        .replace('#include <metalnessmap_fragment>', '#include <metalnessmap_fragment>\nmetalnessFactor *= (1.0 - iaInk);')
        .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance *= 1.0 + uGrad * (1.0 - 2.0 * clamp(vFaceUv.y, 0.0, 1.0));\ntotalEmissiveRadiance += mix(uInkEmit, uInkEmit2, iaW2) * iaInk;')
        .replace('#include <lights_physical_fragment>', '#include <lights_physical_fragment>\nmaterial.specularColor = mix(material.specularColor, material.specularColor * 0.1, iaInk);\nmaterial.specularF90 = mix(material.specularF90, 0.12, iaInk);\n#ifdef USE_CLEARCOAT\nmaterial.clearcoat *= (1.0 - 0.9 * iaInk);\n#endif');
      sh.fragmentShader = f;
    };
    m.customProgramCacheKey = function () { return 'ia-tile-c1'; };
  }

  /* ------------------------------------------------------------------ palette (Signal Colour) */
  // palette = { finishes: { key: finishDef }, tiles: { 'Xero': 'glassGreen' | { finish, accent } } }
  // opts.palette wins; otherwise window.IA_COLOUR.tiles3d; null or absent = the greyscale 1.0 look.
  function resolvePalette(opts) {
    if (opts.palette !== undefined) return opts.palette || null;
    var g = root.IA_COLOUR;
    return (g && g.tiles3d) || null;
  }
  function tileDefs(pal) {
    var fin = {}, k;
    for (k in FIN) fin[k] = FIN[k];
    for (k in FIN_COLOUR) fin[k] = FIN_COLOUR[k];
    if (pal && pal.finishes) for (k in pal.finishes) fin[k] = pal.finishes[k];
    var defs = TILES.map(function (t) {
      var d = { name: t.name, finish: t.finish, glyph: t.glyph, accent: null };
      var o = pal && pal.tiles ? pal.tiles[t.name] : null;
      if (typeof o === 'string') d.finish = o;
      else if (o) { if (o.finish) d.finish = o.finish; if (o.accent) d.accent = o.accent; }
      if (!fin[d.finish]) d.finish = t.finish;
      return d;
    });
    return { fin: fin, defs: defs };
  }

  /* ------------------------------------------------------------------ the component */
  function Tiles3D(el, opts) {
    this.el = el;
    this.opts = opts || {};
    this.rm = this.opts.reducedMotion != null ? !!this.opts.reducedMotion : !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
    this.manual = !!this.opts.manual;
    this.seed = this.opts.seed || 20;
    this.rng = mulberry(this.seed);
    this.t = 0; this.acc = 0;
    this.ev = [];
    this.alive = true;
    this.userPaused = false; this.hidden = false; this.visible = true;
    this.phase = 'idle';           // idle | enter | chaos | collapse | done | still
    this.ptr = { x: 0, y: 0, sx: 0, sy: 0, active: false, manual: false, w: 0 };
    this.deckOpt = this.opts.deck || null;
    var self = this;
    this.ready = Promise.all([loadThree(), loadFonts()]).then(function (r) {
      if (!self.alive) throw new Error('destroyed');
      self._build(r[0]);
      return self;
    });
    this.ready.catch(function () {});
  }

  var P = Tiles3D.prototype;

  P._build = function (THREE) {
    this.THREE = THREE;
    var el = this.el, self = this;
    if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
    var canvas = document.createElement('canvas');
    canvas.className = 'ia-tiles3d';
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText = 'position:absolute;left:0;top:0;display:block;pointer-events:none';
    el.appendChild(canvas);
    this.canvas = canvas;

    var r = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, premultipliedAlpha: true, powerPreference: 'high-performance', preserveDrawingBuffer: !!this.opts.preserveDrawingBuffer });
    r.setClearColor(0x000000, 0);
    if ('outputColorSpace' in r) r.outputColorSpace = 'srgb'; else r.outputEncoding = THREE.sRGBEncoding;
    if ('useLegacyLights' in r) r.useLegacyLights = false; else r.physicallyCorrectLights = true;
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = this.opts.exposure || 1.12;
    this.r = r;
    var dprMax = this.opts.allowHighDpr ? 4 : 2;
    this.dpr = Math.min(dprMax, this.opts.dpr || window.devicePixelRatio || 1);
    r.setPixelRatio(this.dpr);

    var legacy = !(THREE.ColorManagement && (THREE.ColorManagement.enabled === true || THREE.ColorManagement.legacyMode === false));
    this.lin = function (hex) { var c = new THREE.Color(hex); return legacy ? c.convertSRGBToLinear() : c; };

    var scene = new THREE.Scene();
    this.scene = scene;
    scene.fog = new THREE.Fog(new THREE.Color(this.opts.paper || '#f1f1ef'), 17.5, 27);
    this.camera = new THREE.PerspectiveCamera(FOV, 1, 1, 80);
    this.tanF = Math.tan(FOV * Math.PI / 360);
    this.camDist = (WORLD_H / 2) / this.tanF;

    var pm = new THREE.PMREMGenerator(r);
    var eb = envScene(THREE, 'bright'), ed = envScene(THREE, 'dark');
    this.envBright = pm.fromScene(eb, 0.018).texture;
    this.envDark = pm.fromScene(ed, 0.018).texture;
    var ec = envScene(THREE, 'chrome');
    this.envChrome = pm.fromScene(ec, 0.007).texture;
    [eb, ed, ec].forEach(function (s) { s.traverse(function (o) { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); }); s.userData.feather.dispose(); });
    pm.dispose();
    scene.environment = this.envBright;

    var key = new THREE.DirectionalLight(0xffffff, 1.1);
    key.position.set(-0.3, 0.55, 1).multiplyScalar(10);
    scene.add(key);
    this.lightDir = new THREE.Vector3(-0.08, 0.3, 1).normalize();

    this.rig = new THREE.Group();
    scene.add(this.rig);

    // measure first so textures match the tile's real size on screen
    this._measure();
    this._layout();
    var tilePx = this.tileWorld / this._upp(0.8);
    var cellPx = clamp(192, 384, Math.round(tilePx * this.dpr * 1.25 / 32) * 32);
    var fs = clamp(0.1, 0.135, 11.5 / Math.max(40, tilePx));
    var td = tileDefs(resolvePalette(this.opts));
    this.fin = td.fin; this.defs = td.defs;
    this.atlas = buildAtlas(THREE, cellPx, fs, this.defs, this.fin);
    this.atlas.tex.anisotropy = Math.min(8, r.capabilities.getMaxAnisotropy());

    // shared uniforms
    this.uTime = { value: 0 };
    this.uLive = { value: this.rm ? 0 : 1 };
    this.uLabels = 1;

    this.tileGeo = slabGeometry(THREE, { r: 0.27, n: 2.7, bevel: 0.062, depth: 0.17, dome: 0.014, ns: 14, bs: 7, cap: 6 });
    this.tileGeoDome = slabGeometry(THREE, { r: 0.27, n: 2.7, bevel: 0.062, depth: 0.17, dome: 0.036, ns: 30, bs: 9, cap: 72 });
    this.deckGeo = slabGeometry(THREE, { r: 0.3, n: 2, bevel: 0.06, depth: 0.14, dome: 0, ns: 16, bs: 7, cap: 2 });

    // tiles
    this.tiles = this.defs.map(function (def, i) { return self._makeTile(def, i); });

    // deck: black glass with the brand radial as its own light (tone mapping off so it matches the DOM deck)
    var dc = document.createElement('canvas'); dc.width = dc.height = 256;
    var dg = dc.getContext('2d');
    var u44 = 256 / 44;
    dg.translate(22 * u44, -6.16 * u44); dg.scale(1, 0.76);
    var grd = dg.createRadialGradient(0, 0, 0, 0, 0, 55 * u44);
    grd.addColorStop(0, '#1e1e21'); grd.addColorStop(0.64, '#0d0d0f'); grd.addColorStop(1, '#080809');
    dg.fillStyle = grd; dg.fillRect(-400, -100, 800, 800);
    var dtex = new THREE.CanvasTexture(dc);
    if ('colorSpace' in dtex) dtex.colorSpace = 'srgb'; else dtex.encoding = THREE.sRGBEncoding;
    this.deckTex = dtex;
    var dm = new THREE.MeshPhysicalMaterial({ color: 0x000000, emissive: 0xffffff, emissiveMap: dtex, metalness: 0, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.05, envMap: this.envDark, envMapIntensity: 1.0 });
    dm.toneMapped = false; dm.fog = false;
    this.deck = new THREE.Mesh(this.deckGeo, dm);
    this.deck.visible = false;
    this.deck.frustumCulled = false;
    this.deck.userData.shadow = 1;
    this.rig.add(this.deck);
    this.D = { p: new THREE.Vector3(), v: new THREE.Vector3(), r: new THREE.Vector3(), w: new THREE.Vector3(), s: 0, sv: 0, base: 0.52, flash: 0, mode: 'hidden', blend0: 0, blend1: 0 };
    this._makeDots();

    // ripple ring
    this.ringMat = new THREE.MeshPhysicalMaterial({ color: 0xdedee2, metalness: 1, roughness: 0.1, transparent: true, opacity: 0, depthWrite: false, envMap: this.envChrome });
    this.ringMat.fog = false;
    this.ring = new THREE.Mesh(ringGeometry(THREE, 0.3, 0.0085), this.ringMat);
    this.ring.frustumCulled = false; this.ring.userData.shadow = 0;
    this.ring.visible = false; this.ring.renderOrder = 3;
    this.rig.add(this.ring);
    this.ringT0 = -1;

    this._makeShadows();
    this._resize(true);

    if (this.rm) this._still();
    this._warm();

    // listeners
    this.hidden = !!document.hidden;
    this._onVis = function () { self.hidden = document.hidden; self._kick(); };
    canvas.addEventListener('webglcontextlost', function (e) { e.preventDefault(); self.lost = true; self._kick(); });
    canvas.addEventListener('webglcontextrestored', function () { self.lost = false; self._kick(); });
    document.addEventListener('visibilitychange', this._onVis);
    if ('IntersectionObserver' in window) {
      this._io = new IntersectionObserver(function (es) { self.visible = es[0].isIntersecting; self._kick(); }, { rootMargin: '80px' });
      this._io.observe(el);
    }
    if ('ResizeObserver' in window) {
      this._ro = new ResizeObserver(function () { self._resize(); });
      this._ro.observe(el);
    } else {
      this._onResize = function () { self._resize(); };
      window.addEventListener('resize', this._onResize);
    }
    if (this.opts.pointer !== 'manual') {
      this._onMove = function (e) {
        if (self.ptr.manual) return;
        var b = el.getBoundingClientRect();
        var nx = (e.clientX - b.left) / b.width * 2 - 1, ny = -((e.clientY - b.top) / b.height * 2 - 1);
        self.ptr.x = clamp(-1.2, 1.2, nx); self.ptr.y = clamp(-1.2, 1.2, ny);
        self.ptr.active = Math.abs(nx) < 1.25 && Math.abs(ny) < 1.25;
      };
      this._onLeave = function () { if (!self.ptr.manual) self.ptr.active = false; };
      window.addEventListener('pointermove', this._onMove, { passive: true });
      document.addEventListener('pointerleave', this._onLeave);
    }
    this._last = 0;
    this._kick();
  };

  P._makeTile = function (def, i) {
    var THREE = this.THREE, F = this.fin[def.finish] || FIN[def.finish], meta = this.atlas.meta[i];
    var m = new THREE.MeshPhysicalMaterial({
      color: this.lin(F.color), metalness: F.metal, roughness: F.rough,
      clearcoat: F.cc || 0, clearcoatRoughness: F.ccr || 0,
      envMap: F.env === 'dark' ? this.envDark : F.env === 'chrome' ? this.envChrome : this.envBright, envMapIntensity: F.envI || 1
    });
    if (F.sheen) { m.sheen = F.sheen; m.sheenColor = new THREE.Color(1, 1, 1); m.sheenRoughness = 0.6; }
    if (F.opacity) { m.transparent = true; m.opacity = F.opacity; m.depthWrite = true; }
    if (F.glow) m.emissive.copy(this.lin(F.color)).multiplyScalar(F.glow);   // coloured glass lights itself
    if (F.tm === false) m.toneMapped = false;                                // its face is the brand hue, exactly
    var mf = m.clone();                     // transparent twin, used only while a tile fades in
    mf.transparent = true; mf.depthWrite = true; mf.opacity = 0;
    var emit = this.lin(F.ink).multiplyScalar(F.emit || 0);
    var acc = this.lin(def.accent || F.accent || F.ink), emit2 = acc.clone().multiplyScalar(F.emit || 0);
    var u = {
      uAtlas: { value: this.atlas.tex },
      uCell: { value: new THREE.Vector4(meta.cell[0], meta.cell[1], meta.cell[2], meta.cell[3]) },
      uGBox: { value: new THREE.Vector4(meta.gx, meta.gyTop, meta.gw, meta.gh) },
      uVb: { value: meta.vb },
      uInk: { value: this.lin(F.ink) },
      uPat: { value: this.lin(F.pat || F.color) },
      uInkEmit: { value: new THREE.Vector3(emit.r, emit.g, emit.b) },
      uInk2: { value: acc },
      uInkEmit2: { value: new THREE.Vector3(emit2.r, emit2.g, emit2.b) },
      uGrad: { value: F.grad || 0 },
      uMat: { value: new THREE.Vector4(F.inkR, F.patR || F.rough, 1, F.patAmt || 0) },
      uEdge: { value: F.edge || 0 },
      uTime: this.uTime, uLive: this.uLive,
      uMode: { value: meta.mode },
      uPhase: { value: (i * 0.382) % 1 }
    };
    patchTile(THREE, m, u);
    patchTile(THREE, mf, u);
    var mesh = new THREE.Mesh(F.dome ? this.tileGeoDome : this.tileGeo, m);
    mesh.visible = false;
    mesh.frustumCulled = false;
    mesh.userData.shadow = F.shadow || 1;
    if (F.opacity) mesh.renderOrder = 1;
    this.rig.add(mesh);
    var rng = this.rng;
    return {
      i: i, def: def, mesh: mesh, u: u, slot: i, mode: 'hidden',
      p: new THREE.Vector3(), v: new THREE.Vector3(), r: new THREE.Vector3(), w: new THREE.Vector3(), s: 0, sv: 0,
      ph: [rng() * 6.28, rng() * 6.28, rng() * 6.28, rng() * 6.28, rng() * 6.28, rng() * 6.28],
      rest: new THREE.Vector3((rng() - 0.5) * 0.16, (rng() - 0.5) * 0.16, (rng() - 0.5) * 0.1),
      zj: rng(), t0: -9, swapT: -9, swapLift: 0, fly: null, fade: 1, mat: m, matF: mf, alpha: F.opacity || 1
    };
  };

  P._makeDots = function () {
    var THREE = this.THREE, N = 12 * 44 + 38;
    this.dotN = N;
    var g = new THREE.BufferGeometry();
    this.dotPos = new Float32Array(N * 3); this.dotSize = new Float32Array(N); this.dotGrey = new Float32Array(N); this.dotAlpha = new Float32Array(N);
    g.setAttribute('position', new THREE.BufferAttribute(this.dotPos, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('aSize', new THREE.BufferAttribute(this.dotSize, 1).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('aGrey', new THREE.BufferAttribute(this.dotGrey, 1).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('aAlpha', new THREE.BufferAttribute(this.dotAlpha, 1).setUsage(THREE.DynamicDrawUsage));
    this.dotsUni = { uHalfH: { value: 300 }, uFlash: { value: 0 }, uOpacity: { value: 1 } };
    var m = new THREE.ShaderMaterial({ uniforms: this.dotsUni, vertexShader: DOTS_VS, fragmentShader: DOTS_FS, transparent: true, depthWrite: false });
    this.dots = new THREE.Points(g, m);
    this.dots.frustumCulled = false;
    this.dots.renderOrder = 2;
    this.deck.add(this.dots);
    var ct = Math.cos(0.3), st = Math.sin(0.3), gh = [];
    for (var k = 0; k < 38; k++) {
      var gy = 1 - (k + 0.5) * 2 / 38, gr = Math.sqrt(1 - gy * gy), th = k * 2.399963;
      var gx = Math.cos(th) * gr * 0.8, gz = Math.sin(th) * gr * 0.8; gy *= 0.8;
      gh.push([gx, gy * ct + gz * st, -gy * st + gz * ct]);
    }
    this.ghosts = gh;
    this.dotTmp = []; for (var i = 0; i < N; i++) this.dotTmp.push([0, 0, 0, 0]);
    this._orb(0);
  };

  // The composing orb, per the brand engine: 12 lanes x 44 + 38 ghosts, greyscale, front dots brighter and bigger.
  P._orb = function (sec) {
    var t = sec * 2.34 * 0.42, ct = Math.cos(0.3), st = Math.sin(0.3), pts = this.dotTmp, n = 0;
    for (var s = 0; s < 44; s++) {
      var a = 2 * Math.PI * s / 44, ca = Math.cos(a), sa = Math.sin(a);
      for (var l = 0; l < 12; l++) {
        var y = (l - 5.5) * 0.075 + 0.16 * Math.sin(3 * a - 1.7 * t + 0.22 * l) + 0.07 * Math.sin(5 * a + 1.1 * t);
        var rr_ = Math.sqrt(Math.max(0, 1 - y * y)), x = rr_ * ca, z = rr_ * sa, p = pts[n++];
        p[0] = x; p[1] = y * ct + z * st; p[2] = -y * st + z * ct; p[3] = 0;
      }
    }
    for (var q = 0; q < 38; q++) { var p2 = pts[n++], g = this.ghosts[q]; p2[0] = g[0]; p2[1] = g[1]; p2[2] = g[2]; p2[3] = 1; }
    pts.sort(function (p1, p3) { return p1[2] - p3[2]; });
    var R = 0.3, face = 0.07 + 0.006, relief = 0.03;   // deck-local units (deck size = 1)
    for (var i = 0; i < n; i++) {
      var d = pts[i], depth = (d[2] + 1) / 2, edge = Math.min(1, Math.sqrt(d[0] * d[0] + d[1] * d[1]));
      this.dotPos[i * 3] = d[0] * R; this.dotPos[i * 3 + 1] = d[1] * R; this.dotPos[i * 3 + 2] = face + depth * relief;
      var rad = R * 0.0185 * (0.935 + 1.445 * depth) * (1 - 0.25 * edge) * (d[3] ? 0.75 : 1);
      this.dotSize[i] = Math.max(0.3 / 44, rad);
      this.dotGrey[i] = clamp(0, 1, 0.24 + 0.56 * depth - 0.1 * edge);
      this.dotAlpha[i] = (0.25 + 0.75 * depth) * (d[3] ? 0.4 : 1);
    }
    var at = this.dots.geometry.attributes;
    at.position.needsUpdate = at.aSize.needsUpdate = at.aGrey.needsUpdate = at.aAlpha.needsUpdate = true;
  };

  P._makeShadows = function () {
    var THREE = this.THREE;
    var o = { depthBuffer: false, stencilBuffer: false };
    this.rtS = new THREE.WebGLRenderTarget(4, 4, { depthBuffer: true, stencilBuffer: false });
    this.rtA = new THREE.WebGLRenderTarget(4, 4, o);
    this.rtM = new THREE.WebGLRenderTarget(4, 4, o);
    this.rtB = new THREE.WebGLRenderTarget(4, 4, o);
    this.rtW = new THREE.WebGLRenderTarget(4, 4, o);
    this.shadowUni = { uToLocal: { value: new THREE.Matrix4() }, uShear: { value: new THREE.Vector2() }, uFloor: { value: new THREE.Vector4() }, uHmax: { value: 3.2 }, uStrength: { value: 1 } };
    this.shadowMat = new THREE.ShaderMaterial({ uniforms: this.shadowUni, vertexShader: SHADOW_VS, fragmentShader: SHADOW_FS, side: THREE.DoubleSide });
    this.blurMat = new THREE.ShaderMaterial({ uniforms: { tMap: { value: null }, uDir: { value: new THREE.Vector2() } }, vertexShader: QUAD_VS, fragmentShader: BLUR_FS, depthTest: false, depthWrite: false });
    this.quadScene = new THREE.Scene();
    this.quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.blurMat);
    this.quad.frustumCulled = false;
    this.quadScene.add(this.quad);
    this.floorUni = { tM: { value: this.rtM.texture }, tW: { value: this.rtW.texture }, uAmp: { value: 0.24 }, uOpacity: { value: 1 }, uDither: { value: 1 } };
    this.floor = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShaderMaterial({ uniforms: this.floorUni, vertexShader: FLOOR_VS, fragmentShader: FLOOR_FS, transparent: true, depthWrite: false }));
    this.floor.renderOrder = -1;
    this.floor.frustumCulled = false;
    this.rig.add(this.floor);
    var su = this.shadowUni;
    var setStrength = function (renderer, scene, camera, geometry, material) {
      if (material === this.__iaShadowMat) { su.uStrength.value = (this.userData.shadow || 1) * (this.userData.fade == null ? 1 : this.userData.fade); material.uniformsNeedUpdate = true; }
    };
    var self = this;
    this.tiles.forEach(function (T) { T.mesh.__iaShadowMat = self.shadowMat; T.mesh.onBeforeRender = setStrength; });
    this.deck.__iaShadowMat = this.shadowMat; this.deck.onBeforeRender = setStrength;
    this.ring.__iaShadowMat = this.shadowMat; this.ring.onBeforeRender = setStrength;
  };

  /* ------------------------------------------------------------------ layout */
  // The canvas bleeds past the container on every side so shadows, the pointer push and the entry never clip.
  // W x Hpx is the canvas; cW x cH is the container the tiles are laid out in (both CSS px).
  P._measure = function () {
    var cW = Math.max(1, this.el.clientWidth), cH = Math.max(1, this.el.clientHeight);
    var b = this.opts.bleed != null ? this.opts.bleed : Math.round(clamp(32, 160, Math.min(cW, cH) * 0.16));
    var ch = cW !== this.cW || cH !== this.cH || b !== this.bl;
    this.cW = cW; this.cH = cH; this.bl = b; this.W = cW + 2 * b; this.Hpx = cH + 2 * b;
    return ch;
  };
  P._upp = function (z) { return 2 * (this.camDist - z) * this.tanF / this.Hpx; };   // world units per CSS px at height z
  P._halfAt = function (z) { var h = (this.camDist - z) * this.tanF; return { w: h * this.W / this.Hpx, h: h }; };

  P._layout = function () {
    var a = this.cW / this.cH, cols = a >= 0.8 ? 5 : 4, rows = 20 / cols;
    var zl = 0.8, half = this._halfAt(zl), ins = this.opts.inset != null ? this.opts.inset : 0.04;
    var aw = 2 * half.w * (this.cW / this.W) * (1 - 2 * ins), ah = 2 * half.h * (this.cH / this.Hpx) * (1 - 2 * ins);
    var cell = Math.min(aw / cols, ah / rows);
    this.cell = cell;
    this.tileWorld = cell * 0.8;
    var rng = mulberry(this.seed * 3 + 1), slots = [];
    for (var k = 0; k < 20; k++) {
      var c = k % cols, r = Math.floor(k / cols);
      slots.push({
        x: (c - (cols - 1) / 2) * cell + (rng() - 0.5) * cell * 0.14,
        y: ((rows - 1) / 2 - r) * cell + (rng() - 0.5) * cell * 0.14,
        z: 0.34 + rng() * 0.86
      });
    }
    this.slots = slots;
    this.cols = cols; this.rows = rows;
  };

  P._deckSpec = function () {
    var d = this.deckOpt || {};
    var size = d.size || clamp(104, 176, this.cW * 0.3);
    return { x: d.x != null ? d.x : this.cW / 2, y: d.y != null ? d.y : this.cH / 2, size: size };
  };

  P._deckWorld = function () {
    var s = this._deckSpec(), k = 2 * this.tanF / this.Hpx, br = 0.06, th = 0.14;
    var ws = s.size * k * (this.camDist - DECK_FACE_Z) / (1 - s.size * k * br);
    var zOut = DECK_FACE_Z - br * ws, half = this._halfAt(zOut);
    var cx = s.x + this.bl, cy = s.y + this.bl;
    return { x: (cx / this.W * 2 - 1) * half.w, y: (1 - cy / this.Hpx * 2) * half.h, zc: DECK_FACE_Z - th * ws / 2, size: ws, spec: s };
  };

  P._resize = function (first) {
    var changed = this._measure();
    if (!first && !changed) return;
    var W = this.W, Hh = this.Hpx;
    this.r.setSize(W, Hh, false);
    var cs = this.canvas.style;
    cs.left = cs.top = (-this.bl) + 'px'; cs.width = W + 'px'; cs.height = Hh + 'px';
    this.camera.aspect = W / Hh;
    this.camera.position.set(0, 0, this.camDist);
    this.camera.lookAt(0, 0, 0);
    this.camera.near = 2; this.camera.far = this.camDist + 20;
    this.camera.updateProjectionMatrix();
    this._layout();
    var self = this;
    this.tiles.forEach(function (T) { T.mesh.scale.setScalar(self.tileWorld * T.s); });
    var half = this._halfAt(0), fw = half.w * 2 * 1.3, fh = half.h * 2 * 1.3;
    this.floor.scale.set(fw, fh, 1);
    this.floor.position.set(0, 0, 0);
    this.shadowUni.uFloor.value.set(0, 0, fw / 2, fh / 2);
    var base = 512, sw = Math.round(base * Math.min(2, Math.max(0.5, fw / fh))), sh = base;
    if (fw < fh) { sw = base; sh = Math.round(base * Math.min(2, fh / fw)); }
    this.rtS.setSize(sw, sh); this.rtA.setSize(sw, sh); this.rtM.setSize(sw, sh);
    this.rtB.setSize(Math.round(sw / 2), Math.round(sh / 2)); this.rtW.setSize(Math.round(sw / 2), Math.round(sh / 2));
    this.texPerUnit = sw / fw;
    this.dotsUni.uHalfH.value = Hh * this.dpr / 2;
    this.deckW = this._deckWorld();
    if (this.D && (this.D.mode === 'done' || this.D.mode === 'still')) this._placeDeckExact();
    if (this.phase === 'still') this._still();
    if (this.manual || this.phase === 'still' || this.phase === 'done' || !this._raf) this.render();
  };

  /* ------------------------------------------------------------------ public API */
  P.enter = function (o) {
    var self = this; o = o || {};
    if (!this.r) return this.ready.then(function () { return self.enter(o); });
    return (function () {
      if (self.rm) { self._still(); return Promise.resolve(); }
      self.phase = 'enter';
      var order = self.tiles.map(function (T) { return T.i; });
      var rng = mulberry(self.seed + 5);
      for (var k = order.length - 1; k > 0; k--) { var j = Math.floor(rng() * (k + 1)); var tmp = order[k]; order[k] = order[j]; order[j] = tmp; }
      var t0 = self.t + (o.delay || 0.08), stagger = o.stagger != null ? o.stagger : 0.028;
      order.forEach(function (i, rank) {
        var T = self.tiles[i];
        self._at(t0 + rank * stagger, function () { if (T.mode === 'hidden') self._spawn(T, rng); });
      });
      if (o.chaos !== false) {
        self._at(t0 + 0.45, function () { if (self.phase === 'enter') self.phase = 'chaos'; });
        self.nextSwap = t0 + (o.firstSwap || 0.72);
      }
      self._kick();
      return new Promise(function (res) { self._at(t0 + order.length * stagger + 0.9, res); });
    })();
  };

  P.chaos = function (on) { if (this.phase === 'chaos' || this.phase === 'enter') this.chaosOff = on === false; };

  P.collapse = function (o) {
    var self = this; o = o || {};
    if (!this.r) return this.ready.then(function () { return self.collapse(o); });
    return (function () {
      return new Promise(function (res) {
        var total = self.tiles.length;
        if (self.rm) {
          self.tiles.forEach(function (T) { T.mode = 'gone'; T.mesh.visible = false; });
          self.phase = 'done'; self.D.mode = 'done'; self.deck.visible = true; self._placeDeckExact(); self.render();
          if (o.onImpact) o.onImpact(total, total);
          if (o.onDone) o.onDone();
          res(); return;
        }
        self.phase = 'collapse';
        self.cb = o;
        self.impacts = 0;
        self.collapseT = self.t;
        self.deckW = self._deckWorld();
        var DW = self.deckW, D = self.D;
        // deck pops in
        D.mode = 'spring'; D.base = 0.52; D.s = 0; D.sv = 0; D.flash = 0; D.blend0 = D.blend1 = 0;
        D.p.set(DW.x, DW.y, DW.zc + 0.7); D.v.set(0, 0, 0);
        D.r.set(0.25, -0.2, -0.32); D.w.set(0, 0, 0);
        self.deck.visible = true;
        // tiles still waiting to enter are placed at home at once
        self.tiles.forEach(function (T) { if (T.mode === 'hidden') { self._spawn(T, self.rng, true); } });
        var first = o.first != null ? o.first : 0.48, span = o.span != null ? o.span : 0.8, dur = o.fly != null ? o.fly : 0.46;
        var list = self.tiles.map(function (T) { return { T: T, d: Math.hypot(T.p.x - DW.x, T.p.y - DW.y) }; }).sort(function (a, b) { return a.d - b.d; });
        var rng = mulberry(self.seed + 9);
        list.forEach(function (it, k) {
          var arrive = self.t + first + span * invIO(k / (list.length - 1));
          var start = Math.max(self.t + 0.02, arrive - dur);
          self._at(start, function () { self._launch(it.T, arrive, rng); });
        });
        self.resolveCollapse = res;
        self._kick();
      });
    })();
  };

  P.getDeckRect = function (o) {
    if (!this.r) return null;
    var b = this.el.getBoundingClientRect();
    if (o && o.live && this.deck.visible) {
      var THREE = this.THREE, v = new THREE.Vector3(), minx = 1e9, miny = 1e9, maxx = -1e9, maxy = -1e9, self = this;
      this.scene.updateMatrixWorld();
      [[-0.5, -0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, 0.5]].forEach(function (c) {
        v.set(c[0], c[1], 0.07 - 0.06).applyMatrix4(self.deck.matrixWorld).project(self.camera);
        var x = (v.x + 1) / 2 * self.W - self.bl, y = (1 - v.y) / 2 * self.Hpx - self.bl;
        minx = Math.min(minx, x); maxx = Math.max(maxx, x); miny = Math.min(miny, y); maxy = Math.max(maxy, y);
      });
      return { left: b.left + minx, top: b.top + miny, width: maxx - minx, height: maxy - miny, x: b.left + minx, y: b.top + miny, radius: (maxx - minx) * 0.3, local: { x: minx, y: miny } };
    }
    var s = this._deckSpec();
    var l = s.x - s.size / 2, t = s.y - s.size / 2;
    return { left: b.left + l, top: b.top + t, width: s.size, height: s.size, x: b.left + l, y: b.top + t, radius: s.size * 0.3, local: { x: l, y: t } };
  };

  P.setDeck = function (o) { this.deckOpt = o || null; if (this.r) { this.deckW = this._deckWorld(); if (this.D.mode === 'done' || this.D.mode === 'still') { this._placeDeckExact(); this.render(); } } };

  P.setPointer = function (nx, ny) {
    if (nx == null) { this.ptr.manual = false; this.ptr.active = false; return; }
    this.ptr.manual = true; this.ptr.active = true; this.ptr.x = nx; this.ptr.y = ny;
  };

  P.fadeOut = function (ms) {
    var self = this; ms = ms == null ? 400 : ms;
    return this.ready.then(function () {
      return new Promise(function (res) {
        var c = self.canvas;
        c.style.transition = 'opacity ' + ms + 'ms cubic-bezier(.4,0,.2,1)';
        requestAnimationFrame(function () { c.style.opacity = '0'; });
        setTimeout(function () { c.style.visibility = 'hidden'; self.faded = true; self._kick(); res(); }, ms + 20);
      });
    });
  };

  P.pause = function () { this.userPaused = true; this._kick(); };
  P.resume = function () { this.userPaused = false; this._kick(); };

  P.reset = function () {
    if (!this.r) return;
    var self = this;
    this.ev = []; this.phase = 'idle'; this.faded = false; this.chaosOff = false;
    this.canvas.style.transition = ''; this.canvas.style.opacity = '1'; this.canvas.style.visibility = '';
    this.tiles.forEach(function (T) { T.mode = 'hidden'; T.mesh.visible = false; T.s = 0; T.slot = T.i; T.fly = null; T.fade = 1; T.mesh.material = T.mat; T.mesh.userData.fade = 1; T.t0 = -9; });
    this.D.mode = 'hidden'; this.deck.visible = false; this.ring.visible = false; this.ringT0 = -1;
    if (this.rm) this._still();
    this.render();
    this._kick();
  };

  P.destroy = function () {
    this.alive = false;
    if (this._raf) cancelAnimationFrame(this._raf);
    this._raf = 0;
    if (!this.r) return;
    document.removeEventListener('visibilitychange', this._onVis);
    if (this._io) this._io.disconnect();
    if (this._ro) this._ro.disconnect();
    if (this._onResize) window.removeEventListener('resize', this._onResize);
    if (this._onMove) window.removeEventListener('pointermove', this._onMove);
    if (this._onLeave) document.removeEventListener('pointerleave', this._onLeave);
    var dispose = function (o) { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); };
    this.scene.traverse(dispose);
    this.tiles.forEach(function (T) { T.mat.dispose(); T.matF.dispose(); });
    this.quad.geometry.dispose(); this.blurMat.dispose(); this.shadowMat.dispose();
    [this.rtS, this.rtA, this.rtM, this.rtB, this.rtW].forEach(function (t) { t.dispose(); });
    this.atlas.tex.dispose(); this.deckTex.dispose(); this.envBright.dispose(); this.envDark.dispose(); this.envChrome.dispose();
    this.r.dispose();
    if (this.r.forceContextLoss) this.r.forceContextLoss();
    if (this.canvas.parentNode) this.canvas.parentNode.removeChild(this.canvas);
  };

  // QA: step the simulation by dt seconds (fixed 1/120 steps) and draw one frame.
  P.advance = function (dt) { var n = Math.round(dt / H); for (var i = 0; i < n; i++) this._step(H); this.render(); };

  /* ------------------------------------------------------------------ internals: scheduling and loop */
  P._at = function (t, fn) { this.ev.push({ t: t, fn: fn }); this.ev.sort(function (a, b) { return a.t - b.t; }); };

  P._kick = function () {
    if (this.manual || !this.r) return;
    var run = this.alive && !this.lost && !this.userPaused && !this.hidden && this.visible && !this.faded && this.phase !== 'still';
    var self = this;
    if (run && !this._raf) {
      this._last = 0;
      this._raf = requestAnimationFrame(function loop(now) {
        if (!self._raf) return;
        var dt = self._last ? Math.min(0.05, (now - self._last) / 1000) : 1 / 60;
        self._last = now;
        self.acc += dt;
        while (self.acc >= H) { self._step(H); self.acc -= H; }
        self.render();
        self._raf = requestAnimationFrame(loop);
      });
    } else if (!run && this._raf) {
      cancelAnimationFrame(this._raf); this._raf = 0;
    }
  };

  P._spawn = function (T, rng, instant) {
    var h = this.slots[T.slot];
    T.mode = 'spring'; T.mesh.visible = true;
    if (instant) { T.p.set(h.x, h.y, h.z); T.v.set(0, 0, 0); T.r.copy(T.rest); T.w.set(0, 0, 0); T.s = 1; T.sv = 0; T.fade = 1; T.mesh.material = T.mat; T.mesh.userData.fade = 1; return; }
    T.p.set(h.x * 1.16, h.y * 1.16, h.z + 3.0); T.v.set(0, 0, -3);
    T.r.set((rng() - 0.5) * 1.3, (rng() - 0.5) * 1.3, (rng() - 0.5) * 0.8); T.w.set(0, 0, 0);
    T.s = 0.42; T.sv = 0;
    T.t0 = this.t; T.fade = 0; T.mesh.userData.fade = 0; T.mesh.material = T.matF; T.matF.opacity = 0;
  };

  P._launch = function (T, arrive, rng) {
    var THREE = this.THREE, DW = this.deckW;
    if (T.mode === 'gone') return;
    var dx = DW.x - T.p.x, dy = DW.y - T.p.y, dist = Math.hypot(dx, dy) || 1e-3, ux = dx / dist, uy = dy / dist;
    T.mode = 'fly'; T.fade = 1; T.mesh.material = T.mat; T.mesh.userData.fade = 1;
    T.fly = {
      t0: this.t, t1: arrive,
      p0: T.p.clone(), r0: T.r.clone(), s0: T.s,
      perp: new THREE.Vector2(-uy, ux),
      dist: dist, spin: (1.1 + rng() * 0.7) * (rng() < 0.5 ? -1 : 1),
      lift: 0.85 + 0.12 * dist
    };
  };

  P._impact = function (T) {
    var D = this.D, n = this.tiles.length, f = T.fly;
    this.impacts++;
    var i = this.impacts;
    D.base = 0.52 + 0.48 * i / n;
    D.sv += i === n ? 2.6 : 0.85;
    D.v.z -= i === n ? 1.1 : 0.45;
    var ux = f ? f.perp.y : 0, uy = f ? -f.perp.x : 0;   // incoming direction
    D.w.x += -uy * 0.9; D.w.y += ux * 0.9; D.w.z += (f ? Math.sign(f.spin) : 1) * 0.35;
    D.flash = Math.min(1, D.flash + (i === n ? 1 : 0.35));
    if (this.cb && this.cb.onImpact) { try { this.cb.onImpact(i, n); } catch (e) { setTimeout(function () { throw e; }); } }
    if (i === n) {
      var self = this;
      this.ringT0 = this.t;
      var st = Math.max(0.12, this.cb && this.cb.settle != null ? this.cb.settle : 0.62);
      D.blend0 = this.t + Math.min(0.3, st * 0.45); D.blend1 = this.t + st;
      this._at(D.blend1, function () {
        self.phase = 'done'; D.mode = 'done'; self._placeDeckExact();
        var cb = self.cb; self.cb = null;
        if (cb && cb.onDone) { try { cb.onDone(); } catch (e) { setTimeout(function () { throw e; }); } }
        if (self.resolveCollapse) { self.resolveCollapse(); self.resolveCollapse = null; }
      });
    }
  };

  P._placeDeckExact = function () {
    var DW = this.deckW = this._deckWorld(), D = this.D;
    D.p.set(DW.x, DW.y, DW.zc); D.v.set(0, 0, 0); D.r.set(0, 0, 0); D.w.set(0, 0, 0); D.s = 1; D.sv = 0; D.base = 1;
    this.deck.position.copy(D.p); this.deck.rotation.set(0, 0, 0); this.deck.scale.setScalar(DW.size);
  };

  P._still = function () {
    // one calm composed frame: the twenty framing the one (perimeter of a 6x6 or 7x5 grid, deck in the middle)
    this.phase = 'still';
    var a = this.cW / this.cH, cols = a > 1.15 ? 7 : 6, rows = a > 1.15 ? 5 : 6;
    var zl = 0.7, half = this._halfAt(zl), ins = 0.03;
    var cell = Math.min(2 * half.w * (this.cW / this.W) * (1 - 2 * ins) / cols, 2 * half.h * (this.cH / this.Hpx) * (1 - 2 * ins) / rows);
    var ring = [];
    for (var c = 0; c < cols; c++) ring.push([c, 0]);
    for (var r = 1; r < rows - 1; r++) ring.push([cols - 1, r]);
    for (var c2 = cols - 1; c2 >= 0; c2--) ring.push([c2, rows - 1]);
    for (var r2 = rows - 2; r2 >= 1; r2--) ring.push([0, r2]);
    var self = this, rng = mulberry(this.seed + 17);
    this.tiles.forEach(function (T, i) {
      var g = ring[i % ring.length];
      T.mode = 'posed'; T.mesh.visible = true;
      T.p.set((g[0] - (cols - 1) / 2) * cell, ((rows - 1) / 2 - g[1]) * cell, zl + (rng() - 0.5) * 0.12);
      T.r.set((rng() - 0.5) * 0.05, (rng() - 0.5) * 0.05, (rng() - 0.5) * 0.03); T.s = 1;
      T.mesh.position.copy(T.p); T.mesh.rotation.set(T.r.x, T.r.y, T.r.z); T.mesh.scale.setScalar(cell * 0.8);
    });
    var sz = Math.min(this._deckSpec().size, cell * (cols - 2) * 0.62 / this._upp(DECK_FACE_Z));
    if (!this.deckOpt) this.deckOpt = { size: sz };
    this.D.mode = 'still'; this.deck.visible = true; this._placeDeckExact();
    this.rig.rotation.set(0, 0, 0);
    this.uLive.value = 0;
  };

  /* ------------------------------------------------------------------ physics */
  P._step = function (h) {
    this.t += h;
    var t = this.t;
    while (this.ev.length && this.ev[0].t <= t) this.ev.shift().fn();
    this.uTime.value = t;
    var self = this, ptr = this.ptr;

    // pointer: smoothed, and only while the tiles float
    var want = ptr.active && (this.phase === 'chaos' || this.phase === 'enter') ? 1 : 0;
    ptr.w += (want - ptr.w) * (1 - Math.exp(-h * (want ? 5 : 3)));
    var kf = 1 - Math.exp(-h * 9);
    ptr.sx += (ptr.x - ptr.sx) * kf; ptr.sy += (ptr.y - ptr.sy) * kf;

    // whole group tilts toward the pointer; reflections travel across the faces
    var tiltOn = this.phase === 'chaos' || this.phase === 'enter' || (this.phase === 'collapse' && (this.impacts || 0) < 12);
    var tw = tiltOn ? ptr.w : 0;
    var rig = this.rig, rs = this.rigS || (this.rigS = { x: 0, y: 0, vx: 0, vy: 0 });
    var tx = -clamp(-1, 1, ptr.sy) * 0.11 * tw, ty = clamp(-1, 1, ptr.sx) * 0.15 * tw;
    rs.vx += (40 * (tx - rs.x) - 12 * rs.vx) * h; rs.x += rs.vx * h;
    rs.vy += (40 * (ty - rs.y) - 12 * rs.vy) * h; rs.y += rs.vy * h;
    if (this.phase === 'done' || this.phase === 'still') { rs.x = rs.y = rs.vx = rs.vy = 0; }
    rig.rotation.set(rs.x, rs.y, 0);

    // chaos beats: gentle neighbour swaps with a lift, and a few nudges
    if ((this.phase === 'chaos') && !this.chaosOff && this.nextSwap != null && t >= this.nextSwap) {
      this._beat();
      this.nextSwap = t + 0.3 + this.rng() * 0.16;
    }

    var half = this._halfAt(0.8);
    var px = ptr.sx * half.w * this.cW / this.W, py = ptr.sy * half.h * this.cH / this.Hpx, R = this.cell * 1.55;
    var DW = this.deckW, cp = this.phase === 'collapse' ? clamp(0, 1, (t - this.collapseT) / 1.2) : 0;
    var ts = this.tileWorld;

    for (var i = 0; i < this.tiles.length; i++) {
      var T = this.tiles[i];
      if (T.mode === 'spring') {
        var sl = this.slots[T.slot], ph = T.ph;
        var gx = sl.x + 0.035 * Math.sin(t * 1.53 + ph[0]), gy = sl.y + 0.035 * Math.sin(t * 1.21 + ph[1]);
        var gz = sl.z + 0.065 * Math.sin(t * 1.85 + ph[2]);
        var rx = T.rest.x + 0.035 * Math.sin(t * 1.37 + ph[3]), ry = T.rest.y + 0.035 * Math.sin(t * 1.11 + ph[4]), rz = T.rest.z + 0.02 * Math.sin(t * 0.93 + ph[5]);
        // swap lift
        var su = (t - T.swapT) / 0.72;
        if (su > 0 && su < 1) gz += T.swapLift * Math.sin(Math.PI * su);
        // magnetic push away from the pointer, faces turning toward it
        if (ptr.w > 0.001) {
          var dx = T.p.x - px, dy = T.p.y - py, d = Math.hypot(dx, dy) || 1e-3;
          if (d < R) {
            var f = Math.pow(1 - d / R, 2) * ptr.w, ux = dx / d, uy = dy / d;
            gx += ux * f * this.cell * 0.34; gy += uy * f * this.cell * 0.34; gz += f * 0.28;
            rx += uy * f * 0.55; ry += -ux * f * 0.55;
          }
        }
        // gravity toward the deck builds while the collapse runs
        if (cp > 0) {
          var ddx = DW.x - T.p.x, ddy = DW.y - T.p.y, dd = Math.hypot(ddx, ddy) || 1;
          gx += ddx / dd * cp * 0.22; gy += ddy / dd * cp * 0.22;
          rz += cp * 0.12 * (i % 2 ? 1 : -1);
        }
        var enter = t - T.t0 < 1.1, k = enter ? 58 : 62, c = enter ? 10.5 : 9.6;
        T.v.x += (k * (gx - T.p.x) - c * T.v.x) * h; T.p.x += T.v.x * h;
        T.v.y += (k * (gy - T.p.y) - c * T.v.y) * h; T.p.y += T.v.y * h;
        T.v.z += (k * (gz - T.p.z) - c * T.v.z) * h; T.p.z += T.v.z * h;
        var kr = 78, cr = 8.4;
        T.w.x += (kr * (rx - T.r.x) - cr * T.w.x) * h; T.r.x += T.w.x * h;
        T.w.y += (kr * (ry - T.r.y) - cr * T.w.y) * h; T.r.y += T.w.y * h;
        T.w.z += (kr * (rz - T.r.z) - cr * T.w.z) * h; T.r.z += T.w.z * h;
        T.sv += (120 * (1 - T.s) - 11.5 * T.sv) * h; T.s += T.sv * h;
        if (T.fade < 1) {
          T.fade = Math.min(1, (t - T.t0) / 0.3); var fe = T.fade * T.fade * (3 - 2 * T.fade);
          T.mesh.userData.fade = fe;
          if (T.fade < 1) { T.mesh.material = T.matF; T.matF.opacity = T.alpha * fe; } else T.mesh.material = T.mat;
        }
        T.mesh.position.copy(T.p); T.mesh.rotation.set(T.r.x, T.r.y, T.r.z); T.mesh.scale.setScalar(ts * Math.max(0.0001, T.s));
      } else if (T.mode === 'fly') {
        var F = T.fly, tau = clamp(0, 1, (t - F.t0) / (F.t1 - F.t0));
        if (tau >= 1) {
          T.mode = 'gone'; T.mesh.visible = false; this._impact(T);
          continue;
        }
        var u = tau * tau * (1.35 - 0.35 * tau);            // accelerate into the deck
        var D = this.D, ex = D.p.x, ey = D.p.y, ez = D.p.z;
        var p0 = F.p0, pr = F.perp, dist = F.dist;
        var c1x = p0.x + pr.x * dist * 0.34, c1y = p0.y + pr.y * dist * 0.34, c1z = p0.z + F.lift;
        var c2x = ex + pr.x * dist * 0.16, c2y = ey + pr.y * dist * 0.16, c2z = ez + 1.05;
        var m1 = 1 - u, b0 = m1 * m1 * m1, b1 = 3 * m1 * m1 * u, b2 = 3 * m1 * u * u, b3 = u * u * u;
        T.p.set(b0 * p0.x + b1 * c1x + b2 * c2x + b3 * ex, b0 * p0.y + b1 * c1y + b2 * c2y + b3 * ey, b0 * p0.z + b1 * c1z + b2 * c2z + b3 * ez);
        var bank = Math.sin(Math.PI * tau) * 0.55;
        T.r.set(F.r0.x * (1 - u) + pr.y * bank, F.r0.y * (1 - u) - pr.x * bank, F.r0.z + F.spin * u);
        T.s = F.s0 * lerp(1, 0.3, Math.pow(tau, 1.6));
        T.mesh.position.copy(T.p); T.mesh.rotation.set(T.r.x, T.r.y, T.r.z); T.mesh.scale.setScalar(ts * T.s);
      }
    }

    // the deck
    var D2 = this.D;
    if (D2.mode === 'spring') {
      var tgt = this.deckW;
      var k1 = 190, c1 = 13.5, k2 = 150, c2 = 10.5, k3 = 260, c3 = 13;
      D2.v.x += (k1 * (tgt.x - D2.p.x) - c1 * D2.v.x) * h; D2.p.x += D2.v.x * h;
      D2.v.y += (k1 * (tgt.y - D2.p.y) - c1 * D2.v.y) * h; D2.p.y += D2.v.y * h;
      D2.v.z += (k1 * (tgt.zc - D2.p.z) - c1 * D2.v.z) * h; D2.p.z += D2.v.z * h;
      D2.w.x += (k2 * (0 - D2.r.x) - c2 * D2.w.x) * h; D2.r.x += D2.w.x * h;
      D2.w.y += (k2 * (0 - D2.r.y) - c2 * D2.w.y) * h; D2.r.y += D2.w.y * h;
      D2.w.z += (k2 * (0 - D2.r.z) - c2 * D2.w.z) * h; D2.r.z += D2.w.z * h;
      D2.sv += (k3 * (D2.base - D2.s) - c3 * D2.sv) * h; D2.s += D2.sv * h;
      var g = D2.blend1 > 0 ? smooth(D2.blend0, D2.blend1, t) : 0;
      this.deck.position.set(lerp(D2.p.x, tgt.x, g), lerp(D2.p.y, tgt.y, g), lerp(D2.p.z, tgt.zc, g));
      this.deck.rotation.set(D2.r.x * (1 - g), D2.r.y * (1 - g), D2.r.z * (1 - g));
      this.deck.scale.setScalar(tgt.size * Math.max(0.0001, lerp(D2.s, 1, g)));
    }
    D2.flash *= Math.exp(-h * 4.5);
    this.dotsUni.uFlash.value = D2.flash;

    // ripple ring on the final impact
    if (this.ringT0 >= 0) {
      var ru = (t - this.ringT0) / 0.95;
      if (ru >= 1) { this.ring.visible = false; this.ringT0 = -1; }
      else {
        var e = 1 - Math.pow(1 - ru, 3), sz = this.deckW.size * (1.0 + 0.85 * e);
        this.ring.visible = true;
        this.ring.position.copy(this.deck.position); this.ring.position.z += 0.01;
        this.ring.scale.set(sz, sz, this.deckW.size);
        this.ringMat.opacity = Math.pow(1 - ru, 1.6) * 0.95;
        this.ring.userData.shadow = 0.7 * Math.pow(1 - ru, 2);
      }
    }
  };

  P._beat = function () {
    var rng = this.rng, n = this.tiles.length, cols = this.cols;
    var a = Math.floor(rng() * n), T = this.tiles, tries = 0;
    while ((T[a].mode !== 'spring' || this.t - T[a].swapT < 0.8) && tries++ < 20) a = Math.floor(rng() * n);
    if (T[a].mode !== 'spring') return;
    var sa = T[a].slot, ca = sa % cols, ra = Math.floor(sa / cols), cand = [];
    for (var j = 0; j < n; j++) {
      if (j === a || T[j].mode !== 'spring' || this.t - T[j].swapT < 0.8) continue;
      var sb = T[j].slot, cb = sb % cols, rb = Math.floor(sb / cols);
      if (Math.abs(cb - ca) <= 1 && Math.abs(rb - ra) <= 1) cand.push(j);
    }
    if (cand.length) {
      var b = cand[Math.floor(rng() * cand.length)];
      T[a].slot = T[b].slot; T[b].slot = sa;
      T[a].swapT = T[b].swapT = this.t; T[a].swapLift = 0.95; T[b].swapLift = 0.3;
      T[a].w.z += (rng() - 0.5) * 3; T[b].w.z += (rng() - 0.5) * 2;
    }
    for (var k = 0; k < 2; k++) { var q = T[Math.floor(rng() * n)]; if (q.mode === 'spring') { q.w.x += (rng() - 0.5) * 1.6; q.w.y += (rng() - 0.5) * 1.6; } }
  };

  /* ------------------------------------------------------------------ render */
  P.render = function () {
    if (!this.r) return;
    var r = this.r, THREE = this.THREE;
    if (this.deck.visible) this._orb(this.t);
    this.scene.updateMatrixWorld();

    // 1. silhouettes projected along the key light onto the paper (rig-local), lowest point wins
    var su = this.shadowUni;
    su.uToLocal.value.copy(this.rig.matrixWorld).invert();
    su.uShear.value.set(this.lightDir.x / this.lightDir.z, this.lightDir.y / this.lightDir.z);
    var fv = this.floor.visible, dv = this.dots.visible;
    this.floor.visible = false; this.dots.visible = false;
    this.scene.overrideMaterial = this.shadowMat;
    var env = this.scene.environment, fog = this.scene.fog;
    this.scene.environment = null; this.scene.fog = null;
    r.setRenderTarget(this.rtS); r.clear(true, true, false);
    r.render(this.scene, this.camera);
    this.scene.overrideMaterial = null; this.scene.environment = env; this.scene.fog = fog;
    this.floor.visible = fv; this.dots.visible = dv;

    // 2. two blur widths: a close, crisper one and a wide, soft one; the floor mixes them by height
    var tpu = this.texPerUnit, rm = 0.11 * tpu, rw = 0.3 * tpu;
    this._blur(this.rtS, this.rtA, rm, 0); this._blur(this.rtA, this.rtM, 0, rm);
    this._blur(this.rtS, this.rtB, rw, 0); this._blur(this.rtB, this.rtW, 0, rw);
    this._blur(this.rtW, this.rtB, rw * 0.7, 0); this._blur(this.rtB, this.rtW, 0, rw * 0.7);

    // 3. the scene
    r.setRenderTarget(null);
    r.render(this.scene, this.camera);
  };

  P._blur = function (src, dst, rx, ry) {
    this.blurMat.uniforms.tMap.value = src.texture;
    // radius is in source texels of the full-res map; half-res targets see it halved
    var sw = src.width, sh = src.height, scale = sw / this.rtS.width;
    this.blurMat.uniforms.uDir.value.set(rx * scale / sw / 2.2, ry * scale / sh / 2.2);
    this.r.setRenderTarget(dst);
    this.r.render(this.quadScene, this.quadCam);
  };

  P._warm = function () {
    // compile every program and upload the atlas before the first real frame
    var self = this, vis = [];
    this.tiles.forEach(function (T) { vis.push(T.mesh.visible); T.mesh.visible = true; if (!T.s) T.mesh.scale.setScalar(1e-4); });
    var dv = this.deck.visible; this.deck.visible = true; this.ring.visible = true;
    try { this.r.compile(this.scene, this.camera); } catch (e) {}
    this.render();
    this.tiles.forEach(function (T) { T.mesh.material = T.matF; });
    try { this.r.compile(this.scene, this.camera); } catch (e) {}
    this.render();
    this.tiles.forEach(function (T) { T.mesh.material = T.mat; });
    this.tiles.forEach(function (T, i) { T.mesh.visible = vis[i]; });
    this.deck.visible = dv; this.ring.visible = false;
    this.render();
  };

  /* ------------------------------------------------------------------ QA / stills: pose objects directly (used by renders.html) */
  P.studio = function (spec) {
    var self = this;
    this.phase = 'still';
    this.ev = [];
    if (spec.worldHeight) {
      this.camDist = (spec.worldHeight / 2) / this.tanF;
      this.camera.far = this.camDist + 20; this.camera.near = Math.max(0.1, this.camDist * 0.1);
      this.camera.position.set(0, 0, this.camDist); this.camera.updateProjectionMatrix();
      var half = this._halfAt(0), fw = half.w * 2 * 1.3, fh = half.h * 2 * 1.3;
      this.floor.scale.set(fw, fh, 1); this.shadowUni.uFloor.value.set(0, 0, fw / 2, fh / 2);
      this.texPerUnit = this.rtS.width / fw;
      this.scene.fog = null;
    }
    if (spec.shadowHmax) this.shadowUni.uHmax.value = spec.shadowHmax;
    if (spec.shadowAmp != null) this.floorUni.uAmp.value = spec.shadowAmp;
    this.floorUni.uDither.value = spec.dither ? 1 : 0;
    this.uLive.value = spec.live ? 1 : 0;
    if (spec.time != null) this.t = spec.time;
    this.uTime.value = this.t;
    var lab = spec.labels === false ? 0 : 1;
    this.tiles.forEach(function (T) { T.mode = 'posed'; T.mesh.visible = false; T.u.uMat.value.z = lab; });
    (spec.tiles || []).forEach(function (o) {
      var T = self.tiles[o.i];
      T.mesh.visible = true;
      T.mesh.position.set(o.x || 0, o.y || 0, o.z || 0.6);
      T.mesh.rotation.set(o.rx || 0, o.ry || 0, o.rz || 0);
      T.mesh.scale.setScalar(o.s || 1);
    });
    if (spec.deck) {
      var d = spec.deck;
      this.D.mode = 'posed'; this.deck.visible = true;
      this.deck.position.set(d.x || 0, d.y || 0, d.z || 0.6);
      this.deck.rotation.set(d.rx || 0, d.ry || 0, d.rz || 0);
      this.deck.scale.setScalar(d.s || 1);
    } else { this.deck.visible = false; this.D.mode = 'hidden'; }
    this.ring.visible = false;
    this.rig.rotation.set(spec.tiltX || 0, spec.tiltY || 0, 0);
    this.render();
  };

  /* ------------------------------------------------------------------ export */
  function supported() {
    try { var c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl'))); } catch (e) { return false; }
  }

  root.IATiles3D = {
    version: '1.1.0-colour',
    FINISHES: Object.keys(FIN).concat(Object.keys(FIN_COLOUR)),
    supported: supported,
    TILES: TILES.map(function (t) { return t.name; }),
    create: function (el, opts) { return new Tiles3D(el, opts); }
  };
})(window);
