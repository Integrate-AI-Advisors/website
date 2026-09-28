/* IAOrb3D v1.0 · the IntegrateAI composing orb as a real 3D object, plus the "dive into mission control" moment.
   Zero dependencies: raw WebGL (2, falling back to 1 + instancing). Greyscale only. The sphere never spins;
   only the woven band moves, at the brand speed. Orientation, sizes and clock match the official orb.svg still
   (tilt 0.729 rad, band clock 2.4 s), fitted dot by dot against the file.

   API (see README.md):
     var orb = IAOrb3D.create(el, { theme: 'onDark' | 'onPaper', reducedMotion, dpr });
     orb.setDive(p)            0..1, driven by scroll; reversible
     orb.setGridTarget(rectOrEl, { radius, fit, dot })
     orb.setDeckRect(rectOrEl) where the dark tile (and the orb) sits
     orb.pulse(strength, angle)
     orb.setPointer(nx, ny)    only needed with { pointer: 'manual' }
     orb.pause(); orb.resume(); orb.destroy(); orb.ready (Promise<boolean>)
*/
(function (G) {
  'use strict';

  var TAU = Math.PI * 2, PI = Math.PI;
  var SEG = 44, LANES = 12, NB = SEG * LANES, GH = 38, N = NB + GH;
  var TILT = -0.729;              // official still: tilt about X, screen y pointing down
  var CLOCK = 2.34 * 0.42;        // band time per second (brand speed)
  var STILL = 2.4;                // brand still clock, seconds
  var D0 = 14;                    // rest camera distance (orb radius = 1): long lens, logo-faithful
  var K_SIZE = 0.0229, K_MIN = 0.0227; // dot radius per orb radius (fitted to orb.svg)
  var FLOATS = 12;

  function c01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function seg(p, a, b) { return c01((p - a) / (b - a)); }
  function ss(t) { t = c01(t); return t * t * (3 - 2 * t); }
  function sss(t) { t = c01(t); return t * t * t * (t * (t * 6 - 15) + 10); }
  function inOutCubic(t) { t = c01(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function inOutQuart(t) { t = c01(t); return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2; }
  function outCubic(t) { t = c01(t); return 1 - Math.pow(1 - t, 3); }

  /* ------------------------------------------------------------------ shaders (GLSL ES 1.00) */
  var SDF = 'float sdRR(vec2 p, vec2 hs, float r){ vec2 q = abs(p) - hs + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }\n';

  var VS_QUAD = [
    'attribute vec2 aPos;',
    'uniform vec4 uQuad;',
    'uniform vec2 uRes;',
    'varying vec2 vP;',
    'void main(){',
    '  vec2 p = uQuad.xy + aPos * uQuad.zw; vP = p;',
    '  gl_Position = vec4(p.x / uRes.x * 2.0 - 1.0, 1.0 - p.y / uRes.y * 2.0, 0.0, 1.0);',
    '}'
  ].join('\n');

  // The dark deck tile (and, at the end of the dive, the light card it powers on into), with its shadow.
  var FS_DECK = [
    'precision highp float;',
    'varying vec2 vP;',
    'uniform vec4 uRect; uniform float uRad; uniform float uCard;',
    'uniform vec3 uWipe; uniform float uWipeSoft;',
    'uniform vec4 uGlow; uniform float uOpacity; uniform float uSheen;',
    SDF,
    'void main(){',
    '  vec2 hs = uRect.zw * 0.5, c = uRect.xy + hs;',
    '  float r = min(uRad, min(hs.x, hs.y));',
    '  vec2 p = vP - c;',
    '  float d = sdRR(p, hs, r);',
    '  float body = 1.0 - smoothstep(-0.6, 0.6, d);',
    '  float side = min(uRect.z, uRect.w);',
    // deck: 0 50px 90px -40px rgba(0,0,0,.55) at 250px; card: 0 12px 32px -12px rgba(0,0,0,.14)
    '  float k = side / 250.0;',
    '  float off = mix(50.0 * k, 12.0, uCard), blur = mix(90.0 * k, 32.0, uCard), spread = mix(-40.0 * k, -12.0, uCard), sa = mix(0.5, 0.15, uCard);',
    '  vec2 shs = max(hs + spread, vec2(1.0));',
    '  float ds = sdRR(p - vec2(0.0, off), shs, max(r + spread, 0.0));',
    '  float sg = blur * 0.5;',
    '  float sh = sa * (1.0 - smoothstep(-sg * 1.6, sg * 1.6, ds));',
    '  sh += mix(0.0, 0.035, uCard) * (1.0 - smoothstep(-1.0, 1.0, sdRR(p - vec2(0.0, 1.0), hs, r)));',
    // radial deck gradient, as orb.svg: centre above the top edge, stops #1e1e21 / #0d0d0f (.64) / #080809
    '  vec2 gc = vec2(c.x, uRect.y - 0.14 * side);',
    '  vec2 gq = (vP - gc) / vec2(1.25 * max(side, uRect.z * 0.55), 1.25 * side * 0.76);',
    '  float gt = length(gq);',
    '  vec3 c0 = vec3(0.1176, 0.1176, 0.1294), c1 = vec3(0.051, 0.051, 0.0588), c2 = vec3(0.0314, 0.0314, 0.0353);',
    '  vec3 deck = gt < 0.64 ? mix(c0, c1, gt / 0.64) : mix(c1, c2, clamp((gt - 0.64) / 0.36, 0.0, 1.0));',
    '  vec2 gd = vP - uGlow.xy;',
    '  deck += uGlow.w * exp(-dot(gd, gd) / (uGlow.z * uGlow.z));',
    // a whisper of glass sheen, diagonal
    '  float sx = dot(p / max(hs, vec2(1.0)), normalize(vec2(1.0, 0.85)));',
    '  deck += uSheen * 0.018 * smoothstep(-0.9, -0.2, sx) * (1.0 - smoothstep(-0.2, 0.5, sx));',
    '  float ring = smoothstep(-1.7, -0.7, d) * body;',
    '  float top = smoothstep(0.0, 1.0, clamp(-p.y / hs.y, 0.0, 1.0)) * ring;',
    '  deck = mix(deck, vec3(1.0), 0.07 * ring + 0.05 * top);',
    // the light card (#FBFBFA), hairline rgba(0,0,0,.09), lit white top edge
    '  vec3 card = vec3(0.9843, 0.9843, 0.9804);',
    '  card = mix(card, vec3(0.0), 0.09 * ring * (1.0 - top));',
    '  float w = 1.0 - smoothstep(uWipe.z - uWipeSoft, uWipe.z, abs(vP.y - uWipe.y));',
    '  vec3 col = mix(deck, card, w);',
    '  gl_FragColor = (vec4(col * body, body) + vec4(0.0, 0.0, 0.0, sh) * (1.0 - body)) * uOpacity;',
    '}'
  ].join('\n');

  // Soft contact shadow under the orb (paper theme).
  var FS_SHADOW = [
    'precision highp float;',
    'varying vec2 vP;',
    'uniform vec4 uEll; uniform float uA;',
    'void main(){',
    '  vec2 q = (vP - uEll.xy) / uEll.zw;',
    '  float r2 = dot(q, q);',
    '  float a = uA * (0.62 * exp(-r2 * 2.2) + 0.38 * exp(-r2 * 9.0));',
    '  gl_FragColor = vec4(0.0, 0.0, 0.0, a);',
    '}'
  ].join('\n');

  // Lit beads: camera-facing impostors with a spherical normal. Motion stretch turns a bead into a capsule
  // along its screen velocity; depth of field widens its edge and spreads its light.
  var VS_BEAD = [
    'attribute vec2 aCorner;',
    'attribute vec4 iA;', // x, y (css px), radius px, blur px
    'attribute vec4 iB;', // streak x, y (px), grey, alpha
    'attribute vec4 iC;', // spec, glow, ink, flat
    'uniform vec2 uRes;',
    'varying vec2 vLocal; varying vec2 vAxis; varying vec2 vPix;',
    'varying vec3 vShape;', // radius, streak length, blur
    'varying vec4 vB; varying vec4 vC;',
    'void main(){',
    '  float L = length(iB.xy);',
    '  vec2 ax = L > 0.001 ? iB.xy / L : vec2(1.0, 0.0);',
    '  vec2 pp = vec2(-ax.y, ax.x);',
    '  float halo = (iC.y > 0.0 && L < iA.z) ? iA.z * 1.6 + 2.0 : 0.0;',
    '  float ext = iA.z + iA.w + 1.5 + halo;',
    '  vec2 loc = vec2(aCorner.x * (ext + L * 0.5), aCorner.y * ext);',
    '  vec2 pix = iA.xy + ax * loc.x + pp * loc.y;',
    '  vLocal = loc; vAxis = ax; vPix = pix;',
    '  vShape = vec3(iA.z, L, iA.w); vB = iB; vC = iC;',
    '  gl_Position = vec4(pix.x / uRes.x * 2.0 - 1.0, 1.0 - pix.y / uRes.y * 2.0, 0.0, 1.0);',
    '}'
  ].join('\n');

  var FS_BEAD = [
    'precision highp float;',
    'varying vec2 vLocal; varying vec2 vAxis; varying vec2 vPix;',
    'varying vec3 vShape; varying vec4 vB; varying vec4 vC;',
    'uniform vec3 uKey;',
    'uniform vec4 uClip; uniform float uClipR; uniform float uClipOn;',
    SDF,
    'void main(){',
    '  float R = max(vShape.x, 0.35), hl = vShape.y * 0.5, b = vShape.z;',
    '  vec2 q = vec2(vLocal.x - clamp(vLocal.x, -hl, hl), vLocal.y);',
    '  float d = length(q);',
    '  float soft = 0.55 + b;',
    '  float cov;',
    '  if (hl < 0.3) { cov = 1.0 - smoothstep(R - soft, R + soft, length(vLocal)); }',
    '  else {',
    // swept disc: the fraction of the exposure during which this pixel was inside the moving bead
    '    float Rs = R + soft * 0.6;',
    '    float w = sqrt(max(Rs * Rs - vLocal.y * vLocal.y, 0.0));',
    '    float ov = clamp(min(vLocal.x + w, hl) - max(vLocal.x - w, -hl), 0.0, 2.0 * hl);',
    '    cov = pow(ov / (2.0 * hl), 0.72);',
    '    cov *= 1.0 - smoothstep(Rs - 0.8 - b, Rs, abs(vLocal.y));',
    '  }',
    '  float energy = (R * R + 0.3) / ((R + b) * (R + b) + 0.3);',
    '  vec2 n2 = q / R;',
    '  float rr = dot(n2, n2);',
    '  if (rr > 1.0) { n2 *= inversesqrt(rr); rr = 1.0; }',
    '  vec2 ns = vAxis * n2.x + vec2(-vAxis.y, vAxis.x) * n2.y;',
    '  vec3 n = vec3(ns.x, -ns.y, sqrt(max(1.0 - rr, 0.0)));',
    '  vec3 Lk = uKey;',
    '  float ndl = dot(n, Lk);',
    '  float dif = clamp((ndl + 0.42) / 1.42, 0.0, 1.0);',
    '  vec3 H = normalize(Lk + vec3(0.0, 0.0, 1.0));',
    '  float nh = max(dot(n, H), 0.0);',
    '  float spec = pow(nh, 110.0);',
    '  float sheen = pow(nh, 12.0);',
    '  float fres = pow(1.0 - n.z, 2.6);',
    // studio reflection: a bright softbox above, a dark floor below, seen in the bead's mirror direction
    '  float ry = 2.0 * n.z * n.y;',
    '  float env = smoothstep(-0.1, 0.75, ry) * (0.25 + 0.75 * fres);',
    '  float g = vB.z, ink = vC.z;',
    // pearl on the dark deck: soft diffuse, crisp glint, a cool back-rim on the shadow side
    '  float back = clamp(dot(n.xy, normalize(vec2(0.62, -0.78))), 0.0, 1.0);',
    '  float cL = g * (0.26 + 0.84 * dif * dif) + vC.x * (1.1 * spec + 0.10 * sheen) + fres * back * 0.40 * (0.35 + g) + env * 0.10 * vC.x;',
    // polished ink bead on paper: deep body, bright glint, paper bounce on the lower rim
    '  float bounce = clamp(-n.y * 0.8 + 0.2, 0.0, 1.0);',
    '  float cI = g * (0.55 + 0.6 * dif) + vC.x * (0.95 * spec + 0.06 * sheen) + fres * bounce * 0.34 * (1.0 - g * 0.5) + env * 0.07 * vC.x;',
    '  float c = mix(cL, cI, ink);',
    '  float fl = max(vC.w, clamp(b / (R + 1.5), 0.0, 1.0) * 0.8);',
    '  c = mix(c, g + vC.x * 0.06 * (1.0 - ink), fl);',
    '  float a = vB.w * cov * energy;',
    '  if (uClipOn > 0.5) {',
    '    vec2 hs = uClip.zw * 0.5;',
    '    float dd = sdRR(vPix - uClip.xy - hs, hs, min(uClipR, min(hs.x, hs.y)));',
    '    a *= 1.0 - smoothstep(-0.8, 0.4, dd);',
    '  }',
    '  float halo = 0.0;',
    '  if (vC.y > 0.0 && hl < R) { float e = max(d - R, 0.0) / (R * 0.8 + 1.2); halo = vC.y * exp(-e * e) * (1.0 - cov * 0.6) * energy; }',
    '  if (uClipOn > 0.5) { vec2 hs2 = uClip.zw * 0.5; halo *= 1.0 - smoothstep(-0.8, 0.4, sdRR(vPix - uClip.xy - hs2, hs2, min(uClipR, min(hs2.x, hs2.y)))); }',
    '  c = clamp(c, 0.0, 1.0);',
    '  gl_FragColor = vec4(vec3(c * a + halo * (1.0 - a)), a);',
    '}'
  ].join('\n');

  /* ------------------------------------------------------------------ static geometry */
  var S_OF = new Float32Array(NB), L_OF = new Float32Array(NB), CA = new Float32Array(NB), SA = new Float32Array(NB);
  var ANG = new Float32Array(NB), PHI = new Float32Array(NB), COL = new Float32Array(NB);
  (function () {
    for (var s = 0; s < SEG; s++) {
      var a = TAU * s / SEG;
      // unroll: the ring is cut at its front (where the camera enters) and opens out into a flat sheet;
      // k' = segment offset from the back point (a = 3pi/2), wrapped to -22..21
      var k = ((s - 33) % SEG + SEG) % SEG; if (k >= 22) k -= SEG;
      for (var l = 0; l < LANES; l++) {
        var i = s * LANES + l;
        S_OF[i] = s; L_OF[i] = l; ANG[i] = a; CA[i] = Math.cos(a); SA[i] = Math.sin(a);
        PHI[i] = k * TAU / SEG; COL[i] = k + 22;
      }
    }
  })();
  var GX = new Float32Array(GH), GY = new Float32Array(GH), GZ = new Float32Array(GH);
  (function () {
    for (var g = 0; g < GH; g++) {
      var y = 1 - (g + 0.5) * 2 / GH, r = Math.sqrt(1 - y * y), th = g * 2.399963;
      GX[g] = Math.cos(th) * r * 0.8; GY[g] = y * 0.8; GZ[g] = Math.sin(th) * r * 0.8;
    }
  })();

  /* ------------------------------------------------------------------ gl helpers */
  function compile(gl, type, src) {
    var sh = gl.createShader(type); gl.shaderSource(sh, src); gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) { var log = gl.getShaderInfoLog(sh); gl.deleteShader(sh); throw new Error('IAOrb3D shader: ' + log); }
    return sh;
  }
  function program(gl, vs, fs, attribs) {
    var p = gl.createProgram();
    gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, vs));
    gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, fs));
    for (var k in attribs) gl.bindAttribLocation(p, attribs[k], k);
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error('IAOrb3D link: ' + gl.getProgramInfoLog(p));
    var u = {}, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (var i = 0; i < n; i++) { var inf = gl.getActiveUniform(p, i); u[inf.name] = gl.getUniformLocation(p, inf.name); }
    return { p: p, u: u };
  }

  function readRect(src) {
    if (!src) return null;
    if (src.getBoundingClientRect) { var r = src.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; }
    return { x: src.x != null ? src.x : src.left, y: src.y != null ? src.y : src.top, w: src.width != null ? src.width : src.w, h: src.height != null ? src.height : src.h };
  }

  /* ------------------------------------------------------------------ create */
  function create(container, opts) {
    opts = opts || {};
    var theme = opts.theme === 'onPaper' ? 'onPaper' : 'onDark';
    var dark = theme === 'onDark';
    var reduced = opts.reducedMotion != null ? !!opts.reducedMotion
      : !!(G.matchMedia && G.matchMedia('(prefers-reduced-motion: reduce)').matches);
    var DPR = Math.min(2, Math.max(1, opts.dpr || G.devicePixelRatio || 1));
    var useDeck = opts.deck != null ? !!opts.deck : dark;
    var landing = opts.landing || (useDeck ? 'card' : 'clear');
    var orbScale = opts.orbScale || 0.3;       // orb radius / deck side (official still: 0.30)
    var deckSize = opts.deckSize != null ? opts.deckSize : 1;
    var manualPointer = opts.pointer === 'manual' || opts.pointer === false;
    var smoothing = opts.smoothing !== false;
    var qa = !!opts.qa;

    var api = { supported: false, ready: null, canvas: null, stats: { cpu: 0, beads: 0 } };
    var resolveReady; api.ready = new Promise(function (r) { resolveReady = r; });

    if (getComputedStyle(container).position === 'static') container.style.position = 'relative';
    var cv = document.createElement('canvas');
    cv.setAttribute('aria-hidden', 'true');
    cv.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;display:block;pointer-events:none;' +
      (opts.fadeIn === false || qa ? '' : 'opacity:0;transition:opacity .7s cubic-bezier(.2,.7,.2,1);');
    container.appendChild(cv);
    api.canvas = cv;

    var ctxOpts = { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, preserveDrawingBuffer: qa, powerPreference: 'high-performance' };
    var gl = cv.getContext('webgl2', ctxOpts), gl2 = !!gl, inst = null;
    if (!gl) {
      gl = cv.getContext('webgl', ctxOpts) || cv.getContext('experimental-webgl', ctxOpts);
      if (gl) inst = gl.getExtension('ANGLE_instanced_arrays');
    }
    if (!gl || (!gl2 && !inst)) {
      cv.remove(); resolveReady(false);
      api.setDive = api.setGridTarget = api.setDeckRect = api.pulse = api.setPointer = api.pause = api.resume = api.destroy = api.renderNow = api.freeze = function () { return api; };
      return api;
    }
    api.supported = true;

    /* ---------- state */
    var W = 1, H = 1, CR = { left: 0, top: 0 };
    var deckSrc = opts.deckRect || null, gridSrc = opts.gridTarget || null;
    var gridOpt = { radius: 40, fit: 'fill', dot: null };
    var diveT = 0, diveP = 0, diveV = 0, divePrev = 0, qaPrev = null;
    var ptrT = { x: 0, y: 0 }, ptr = { x: 0, y: 0 }, ptrV = { x: 0, y: 0 };
    var clockS = reduced ? STILL : (opts.time != null ? opts.time : STILL), frozen = reduced || opts.time != null;
    var pulses = [], pulseSeq = 0;
    var visible = true, docHidden = !!document.hidden, paused = false, dead = false, raf = 0, last = 0, drawn = false;
    var lost = false;
    var pulseFix = null; // QA: a pulse frozen at a given age
    function realNow() { return pulseFix != null ? pulseFix : (G.performance ? performance.now() : Date.now()) / 1000; }

    /* ---------- gl resources */
    var P_DECK, P_SHADOW, P_BEAD, quadBuf, cornerBuf, instBuf, instData = new Float32Array(N * 2 * FLOATS);
    function initGL() {
      P_DECK = program(gl, VS_QUAD, FS_DECK, { aPos: 0 });
      P_SHADOW = program(gl, VS_QUAD, FS_SHADOW, { aPos: 0 });
      P_BEAD = program(gl, VS_BEAD, FS_BEAD, { aCorner: 0, iA: 1, iB: 2, iC: 3 });
      quadBuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), gl.STATIC_DRAW);
      cornerBuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, cornerBuf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      instBuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, instBuf);
      gl.bufferData(gl.ARRAY_BUFFER, instData.byteLength, gl.DYNAMIC_DRAW);
      gl.disable(gl.DEPTH_TEST); gl.disable(gl.CULL_FACE);
      gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    }
    function divisor(loc, d) { if (gl2) gl.vertexAttribDivisor(loc, d); else inst.vertexAttribDivisorANGLE(loc, d); }
    try { initGL(); } catch (e) {
      if (G.console) console.warn(e);
      cv.remove(); api.supported = false; resolveReady(false);
      api.setDive = api.setGridTarget = api.setDeckRect = api.pulse = api.setPointer = api.pause = api.resume = api.destroy = api.renderNow = api.freeze = function () { return api; };
      return api;
    }

    /* ---------- sizing */
    function measure() {
      var r = cv.getBoundingClientRect();
      CR = { left: r.left, top: r.top };
      var w = Math.max(1, r.width), h = Math.max(1, r.height);
      if (w !== W || h !== H || cv.width !== Math.round(w * DPR)) {
        W = w; H = h;
        cv.width = Math.max(1, Math.round(W * DPR)); cv.height = Math.max(1, Math.round(H * DPR));
      }
    }
    function localRect(src) {
      var r = readRect(src);
      if (!r) return null;
      if (src && src.getBoundingClientRect) return { x: r.x - CR.left, y: r.y - CR.top, w: r.w, h: r.h };
      return r.local ? r : { x: r.x - CR.left, y: r.y - CR.top, w: r.w, h: r.h };
    }
    function deckRect() {
      var r = deckSrc ? localRect(deckSrc) : null;
      if (r && r.w > 0) return r;
      var side = deckSize <= 1 ? Math.min(W, H) * deckSize : deckSize;
      return { x: (W - side) / 2, y: (H - side) / 2, w: side, h: side };
    }
    function gridRect() {
      var r = gridSrc ? localRect(gridSrc) : null;
      if (r && r.w > 0) return r;
      var m = Math.min(W, H) * 0.06;
      return { x: m, y: m, w: W - 2 * m, h: H - 2 * m };
    }

    /* ---------- the choreography of the dive, as a pure function of p */
    function phases(p, dk, gr) {
      var P = {};
      // one smooth flight parameter for the whole approach; everything else hangs off it
      var sf = seg(p, 0.02, 0.56);
      var s = 0.5 - 0.5 * Math.cos(PI * sf);
      P.s = s;
      var side = Math.min(dk.w, dk.h);
      var R0 = orbScale * side, f0 = Math.max(1, R0 * D0);
      var Ra1 = 0.4 * Math.min(gr.w, gr.h);
      var fIn = Math.max(gr.w * 0.29, gr.h * 0.45);
      // apparent orb radius grows to fill the window, then holds while the lens widens (a dolly zoom),
      // then the camera pushes through the front of the band to the centre of the ring
      var Ra = Math.exp(lerp(Math.log(R0), Math.log(Math.max(R0, Ra1)), sss(seg(s, 0, 0.46)))) * (1 + 0.12 * ss(seg(s, 0.42, 0.8)));
      P.f = Math.exp(lerp(Math.log(f0), Math.log(fIn), ss(seg(s, 0.3, 0.85))));
      P.d = s <= 0 ? D0 : (P.f / Ra) * (1 - ss(seg(s, 0.7, 1)));
      P.win = inOutCubic(seg(p, 0.02, 0.33));
      P.pp = sss(seg(s, 0, 0.6));
      P.inside = ss(seg(p, 0.3, 0.5));
      P.untilt = sss(seg(p, 0.42, 0.62));
      P.ghost = 1 - ss(seg(p, 0.3, 0.48));
      var u = seg(p, 0.55, 0.92);
      P.unroll = inOutCubic(u);
      P.push = sss(seg(p, 0.55, 0.94));
      P.flat = ss(seg(p, 0.58, 0.9));
      P.snap = ss(seg(p, 0.9, 0.985));
      P.aperture = ss(seg(p, 0.3, 0.45)) * (1 - ss(seg(p, 0.55, 0.75)));
      P.point = 1 - ss(seg(p, 0.0, 0.18));
      P.roll = 0.05 * Math.sin(PI * ss(seg(p, 0.04, 0.62)));
      P.glow = 1 - ss(seg(p, 0.04, 0.3));
      P.sheen = ss(seg(p, 0.08, 0.3)) * (1 - ss(seg(p, 0.85, 1)));
      P.wipe = seg(p, 0.905, 0.985);
      P.card = ss(seg(p, 0.86, 1.0));
      P.shadowFade = 1 - ss(seg(p, 0.02, 0.2));
      return P;
    }

    /* ---------- camera */
    var YAW = 0.25, PITCH = 0.17;   // pointer turn range, radians (subtle)
    function camera(P, dk, gr, cam) {
      var yaw = -ptr.x * YAW * P.point, pitch = ptr.y * PITCH * P.point;
      var cp = Math.cos(pitch), bx = Math.sin(yaw) * cp, by = Math.sin(pitch), bz = Math.cos(yaw) * cp;
      var rl = Math.sqrt(bz * bz + bx * bx) || 1, rx = bz / rl, ry = 0, rz = -bx / rl;
      var ux = by * rz - bz * ry, uy = bz * rx - bx * rz, uz = bx * ry - by * rx;
      var cr = Math.cos(P.roll), sr = Math.sin(P.roll);
      cam.rx = rx * cr + ux * sr; cam.ry = ry * cr + uy * sr; cam.rz = rz * cr + uz * sr;
      cam.ux = ux * cr - rx * sr; cam.uy = uy * cr - ry * sr; cam.uz = uz * cr - rz * sr;
      cam.bx = bx; cam.by = by; cam.bz = bz;
      cam.x = bx * P.d; cam.y = by * P.d; cam.z = bz * P.d;
      cam.f = P.f;
      cam.cx = lerp(dk.x + dk.w / 2, gr.x + gr.w / 2, P.pp);
      cam.cy = lerp(dk.y + dk.h / 2, gr.y + gr.h / 2, P.pp);
      return cam;
    }

    /* ---------- per-bead buffers */
    var SX = new Float32Array(N), SY = new Float32Array(N), SR = new Float32Array(N), SZ = new Float32Array(N);
    var AL = new Float32Array(N), GR = new Float32Array(N), SP = new Float32Array(N), GW = new Float32Array(N);
    var PX = new Float32Array(N), PY = new Float32Array(N), OK = new Uint8Array(N), OKP = new Uint8Array(N);
    var BL = new Float32Array(N);
    var order = new Uint16Array(N); for (var oi = 0; oi < N; oi++) order[oi] = oi;
    var camA = {}, camB = {};

    function pulseAt(i, now) {
      if (!pulses.length || i >= NB) return 0;
      var a = ANG[i], l = L_OF[i], v = 0;
      for (var k = 0; k < pulses.length; k++) {
        var pu = pulses[k], tt = now - pu.t0;
        if (tt < 0) continue;
        var dA = a - pu.a0; dA = Math.atan2(Math.sin(dA), Math.cos(dA));
        var front = tt * 3.3 - Math.abs(l - 5.5) * 0.045;
        var x = (Math.abs(dA) - front) / 0.42;
        v += pu.s * Math.exp(-x * x) * Math.exp(-tt / 0.95) * (0.55 + 0.45 * Math.cos(dA * 0.5));
      }
      return v > 1.4 ? 1.4 : v;
    }

    // Compute every bead's screen state for dive progress p. full=false only fills positions (for streaks).
    function solve(p, t, dk, gr, cam, full, outX, outY, outOK) {
      var P = phases(p, dk, gr);
      camera(P, dk, gr, cam);
      var th = TILT * (1 - P.untilt), cT = Math.cos(th), sT = Math.sin(th);
      var c0 = Math.cos(TILT), s0 = Math.sin(TILT);
      var fit = gridOpt.fit === 'even';
      var gw = gr.w, gh = gr.h;
      if (fit) { var pitch = Math.min(gw / SEG, gh / LANES); gw = pitch * SEG; gh = pitch * LANES; }
      var Dw = TAU * cam.f / gw;                       // wall distance so 44 columns span the rect
      var rowFinal = (gh / LANES) * Dw / cam.f / 0.075; // lane spacing grows into the row pitch
      var D = lerp(1, Dw, P.push);
      var rowS = lerp(1, rowFinal, P.push);
      var kappa = 1 - P.unroll;
      var flat = P.flat, inside = P.inside;
      var pitchPx = Math.min(gw / SEG, gh / LANES);
      var dotPx = gridOpt.dot || Math.max(1.6, Math.min(4.2, pitchPx * 0.13));
      var gxs = gr.x + (gr.w - gw) / 2, gys = gr.y + (gr.h - gh) / 2;
      var now = realNow();
      var aperture = reduced ? 0 : P.aperture * 0.022;
      var focus = lerp(Math.max(P.d, 0.9), lerp(1.05, Dw, P.push), P.inside);
      var zNear = 0.05;
      for (var i = 0; i < N; i++) {
        var X, Y0, Z0, Zr, Xr, Yr, band = i < NB, pb = 0;
        if (band) {
          var a = ANG[i], l = L_OF[i];
          var wv = (0.16 * Math.sin(3 * a - 1.7 * t + 0.22 * l) + 0.07 * Math.sin(5 * a + 1.1 * t));
          var y0 = (l - 5.5) * 0.075;
          var yRest = y0 + wv;
          var rr0 = Math.sqrt(Math.max(0, 1 - yRest * yRest));
          // rest (logo) frame, for the depth cue
          var exr = rr0 * CA[i], ezr = rr0 * SA[i];
          Xr = exr; Yr = -(yRest * c0 + ezr * s0); Zr = -yRest * s0 + ezr * c0;
          var wvF = wv * (1 - flat), y = y0 + wvF;
          var rr = Math.sqrt(Math.max(0, 1 - y * y)); rr += (1 - rr) * flat;
          if (full) pb = pulseAt(i, now);
          var swell = 1 + 0.03 * pb;
          if (kappa >= 0.9999) {
            X = rr * CA[i]; Z0 = rr * SA[i];
          } else {
            var sig = PHI[i] + (PI / SEG) * P.unroll;
            var bxv, bzv;
            if (kappa > 1e-4) { bxv = Math.sin(kappa * sig) / kappa; bzv = (1 - Math.cos(kappa * sig)) / kappa; }
            else { bxv = sig; bzv = 0; }
            X = rr * bxv; Z0 = rr * (bzv - D);
          }
          Y0 = -(y0 * rowS + wvF);
          X *= swell; Y0 *= swell; Z0 *= swell;
        } else {
          var g = i - NB;
          X = GX[g]; Y0 = -GY[g]; Z0 = GZ[g];
          Xr = X; Yr = Y0 * c0 - Z0 * s0; Zr = Y0 * s0 + Z0 * c0;
        }
        var Y = Y0 * cT - Z0 * sT, Z = Y0 * sT + Z0 * cT;
        // to view space
        var vx0 = X - cam.x, vy0 = Y - cam.y, vz0 = Z - cam.z;
        var vx = vx0 * cam.rx + vy0 * cam.ry + vz0 * cam.rz;
        var vy = vx0 * cam.ux + vy0 * cam.uy + vz0 * cam.uz;
        var z = -(vx0 * cam.bx + vy0 * cam.by + vz0 * cam.bz);
        if (z < zNear) { outOK[i] = 0; continue; }
        var sx = cam.cx + cam.f * vx / z, sy = cam.cy - cam.f * vy / z;
        if (band && P.snap > 0) {
          var col = COL[i], row = L_OF[i];
          var tx = gxs + (col + 0.5) * gw / SEG, ty = gys + (row + 0.5) * gh / LANES;
          sx = lerp(sx, tx, P.snap); sy = lerp(sy, ty, P.snap);
        }
        outX[i] = sx; outY[i] = sy; outOK[i] = 1;
        if (!full) continue;
        // size, colour and light: logo depth cue, then uniform beads inside, then flat grid dots
        var depth = (Zr + 1) / 2, edge = Math.min(1, Math.sqrt(Xr * Xr + Yr * Yr));
        var rw, grey, alpha, spec, glow;
        if (band) {
          var rl = Math.max(K_MIN, K_SIZE * (0.935 + 1.445 * depth) * (1 - 0.25 * edge)) * (D0 - Zr) / D0;
          var gl_ = dark ? 0.30 + 0.62 * depth - 0.06 * edge : 0.52 - 0.44 * depth + 0.18 * edge;
          var al = 0.4 + 0.6 * depth;
          var gu = dark ? 0.88 : 0.16;
          rw = lerp(rl, 0.034, inside);
          grey = lerp(gl_, gu, inside);
          alpha = lerp(al, 0.96, inside);
          spec = lerp(0.35 + 0.65 * depth, 1, inside);
          glow = dark ? lerp(0.022 * depth * depth, 0.02, inside) : 0;
          if (flat > 0) {
            rw = lerp(rw, dotPx * Dw / cam.f, flat);
            grey = lerp(grey, dark ? 0.8 : 0.26, flat);
            alpha = lerp(alpha, 0.92, flat);
            spec = lerp(spec, 0.4, flat);
            glow = lerp(glow, 0, flat);
          }
          if (pb > 0) {
            grey = dark ? grey + (1 - grey) * 0.6 * Math.min(1, pb) : grey * (1 - 0.4 * Math.min(1, pb));
            rw *= 1 + 0.24 * pb; spec *= 1 + 0.7 * pb; alpha = Math.min(1, alpha + 0.3 * pb);
            if (dark) glow += 0.035 * pb;
          }
        } else {
          rw = K_MIN * 0.9 * (D0 - Zr) / D0;
          var gd = (Zr / 0.8 + 1) / 2;
          grey = dark ? 0.36 + 0.1 * gd : 0.62;
          alpha = (dark ? 0.12 + 0.2 * gd : 0.12 + 0.24 * gd) * P.ghost;
          spec = 0.25; glow = 0;
          rw = lerp(rw, 0.03, inside);
        }
        var r = cam.f * rw / z;
        var near = dark ? ss(seg(z, zNear, 0.42)) : ss(seg(z, zNear, 0.95));
        alpha *= near;
        var coc = aperture * cam.f * Math.abs(1 / z - 1 / focus);
        if (coc > 12) coc = 12;
        var rMax = dark ? 120 : 70;
        if (r > rMax) { alpha *= rMax / r; r = rMax; }
        // cull what is well outside the canvas
        var ext = r + coc + 4;
        if (sx < -ext - 300 || sx > W + ext + 300 || sy < -ext - 300 || sy > H + ext + 300) alpha = 0;
        SR[i] = r; SZ[i] = z; AL[i] = alpha; GR[i] = grey; SP[i] = spec; GW[i] = glow; BL[i] = coc * (1 - P.snap);
      }
      return P;
    }

    /* ---------- draw */
    function drawQuad(prog, x, y, w, h) {
      gl.useProgram(prog.p);
      gl.uniform4f(prog.u.uQuad, x, y, w, h);
      gl.uniform2f(prog.u.uRes, W, H);
      gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
      gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      divisor(0, 0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    function drawDeck(rect, rad, P, opacity, cardMix, wipe, glow) {
      var side = Math.min(rect.w, rect.h), m = Math.max(40, side * 0.62) + 60;
      gl.useProgram(P_DECK.p);
      var u = P_DECK.u;
      gl.uniform4f(u.uRect, rect.x, rect.y, rect.w, rect.h);
      gl.uniform1f(u.uRad, rad);
      gl.uniform1f(u.uCard, cardMix);
      gl.uniform3f(u.uWipe, wipe.x, wipe.y, wipe.r);
      gl.uniform1f(u.uWipeSoft, wipe.soft);
      gl.uniform4f(u.uGlow, glow.x, glow.y, glow.r, glow.s);
      gl.uniform1f(u.uOpacity, opacity);
      gl.uniform1f(u.uSheen, P ? P.sheen : 0);
      drawQuad(P_DECK, rect.x - m, rect.y - m * 0.6, rect.w + 2 * m, rect.h + m * 1.8);
    }
    function wipeAt(x, y, wipe) {
      if (!wipe || wipe.r <= 0) return 0;
      var d = Math.abs(y - wipe.y);
      return 1 - ss((d - (wipe.r - wipe.soft)) / wipe.soft);
    }
    function sortOrder() {
      // insertion sort from last frame's order: nearly sorted, so this is cheap
      for (var i = 1; i < N; i++) {
        var v = order[i], z = SZ[v], j = i - 1;
        while (j >= 0 && SZ[order[j]] < z) { order[j + 1] = order[j]; j--; }
        order[j + 1] = v;
      }
    }
    function fillBeads(offset, alphaMul, P, wipe, inkAll, qaVel, flatAll) {
      var n = 0, k = offset * FLOATS;
      for (var o = 0; o < N; o++) {
        var i = order[o];
        if (!OK[i]) continue;
        var a = AL[i] * alphaMul;
        if (a < 0.003) continue;
        var vx = 0, vy = 0;
        if (OKP[i] && !reduced) {
          // a half-frame shutter at 60 fps, independent of the actual frame rate
          vx = (SX[i] - PX[i]) * shutter; vy = (SY[i] - PY[i]) * shutter;
          var L = Math.sqrt(vx * vx + vy * vy), maxL = Math.max(W, H) * 0.12;
          if (L > maxL) { vx *= maxL / L; vy *= maxL / L; L = maxL; }
          if (L < 0.6) { vx = 0; vy = 0; }
        }
        var ink = inkAll != null ? inkAll : wipeAt(SX[i], SY[i], wipe);
        var flat = flatAll != null ? flatAll : (P ? P.flat : 0);
        var g = GR[i];
        if (dark && ink > 0) g = lerp(g, 0.24, ink);
        instData[k++] = SX[i]; instData[k++] = SY[i]; instData[k++] = SR[i]; instData[k++] = BL[i];
        instData[k++] = vx; instData[k++] = vy; instData[k++] = g; instData[k++] = a;
        instData[k++] = SP[i]; instData[k++] = GW[i] * (1 - ink); instData[k++] = dark ? ink : 1; instData[k++] = flat;
        n++;
      }
      return n;
    }
    function drawBeads(count, clip, clipR) {
      if (!count) return;
      gl.useProgram(P_BEAD.p);
      var u = P_BEAD.u;
      gl.uniform2f(u.uRes, W, H);
      gl.uniform3f(u.uKey, keyV[0], keyV[1], keyV[2]);
      gl.uniform1f(u.uClipOn, clip ? 1 : 0);
      if (clip) { gl.uniform4f(u.uClip, clip.x, clip.y, clip.w, clip.h); gl.uniform1f(u.uClipR, clipR); }
      gl.bindBuffer(gl.ARRAY_BUFFER, instBuf);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, instData.subarray(0, count * FLOATS));
      var st = FLOATS * 4;
      for (var a = 1; a <= 3; a++) {
        gl.enableVertexAttribArray(a);
        gl.vertexAttribPointer(a, 4, gl.FLOAT, false, st, (a - 1) * 16);
        divisor(a, 1);
      }
      gl.bindBuffer(gl.ARRAY_BUFFER, cornerBuf);
      gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      divisor(0, 0);
      if (gl2) gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, count); else inst.drawArraysInstancedANGLE(gl.TRIANGLE_STRIP, 0, 4, count);
      for (var b = 1; b <= 3; b++) { divisor(b, 0); gl.disableVertexAttribArray(b); }
    }

    // key light, fixed in the world (upper left, toward the viewer); into view space per frame
    var KEY_W = (function () { var v = [-0.5, 0.62, 0.6], l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; })();
    var keyV = [0, 0, 1], lastPoint = 1, shutter = 0.6;
    function keyToView(cam) {
      var x = KEY_W[0] * cam.rx + KEY_W[1] * cam.ry + KEY_W[2] * cam.rz;
      var y = KEY_W[0] * cam.ux + KEY_W[1] * cam.uy + KEY_W[2] * cam.uz;
      var z = KEY_W[0] * cam.bx + KEY_W[1] * cam.by + KEY_W[2] * cam.bz;
      // exaggerate the light's travel a little so the glints visibly play as the orb turns
      var yaw = -ptr.x * YAW * 0.9 * lastPoint, pit = ptr.y * PITCH * 0.9 * lastPoint;
      x -= Math.sin(yaw) * 0.5; y -= Math.sin(pit) * 0.5;
      var l = Math.hypot(x, y, z) || 1;
      keyV[0] = x / l; keyV[1] = y / l; keyV[2] = z / l;
    }

    function render() {
      if (lost || dead) return;
      measure();
      gl.viewport(0, 0, cv.width, cv.height);
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      var dk = deckRect(), gr = gridRect();
      var t = clockS * CLOCK;
      var deckRad = Math.min(dk.w, dk.h) * 0.28;
      var gridRad = gridOpt.radius != null ? gridOpt.radius : 40;
      if (reduced) return renderReduced(dk, gr, t, deckRad, gridRad);

      var p = diveP;
      var t0 = G.performance ? performance.now() : 0;
      var P = solve(p, t, dk, gr, camA, true, SX, SY, OK);
      var pPrev = qaPrev != null ? qaPrev : divePrev;
      if (Math.abs(pPrev - p) > 1e-5) solve(pPrev, t, dk, gr, camB, false, PX, PY, OKP);
      else for (var i = 0; i < N; i++) OKP[i] = 0;
      lastPoint = P.point;
      keyToView(camA);
      sortOrder();

      var win = {
        x: lerp(dk.x, gr.x, P.win), y: lerp(dk.y, gr.y, P.win),
        w: lerp(dk.w, gr.w, P.win), h: lerp(dk.h, gr.h, P.win)
      };
      var winR = lerp(deckRad, gridRad, P.win);
      var wipe = null;
      if (landing === 'card' && P.wipe > 0) {
        var half = gr.h / 2 + 12;
        wipe = { x: gr.x + gr.w / 2, y: gr.y + gr.h / 2, r: lerp(0, half + 10, inOutCubic(P.wipe)), soft: 10 };
      }
      if (useDeck) {
        var R0 = orbScale * Math.min(dk.w, dk.h);
        drawDeck(win, winR, P, 1, P.card, wipe || { x: 0, y: 0, r: -1, soft: 1 },
          { x: camA.cx, y: camA.cy, r: R0 * 1.25, s: 0.045 * P.glow });
      } else if (!dark && P.shadowFade > 0.001) {
        var Rr = orbScale * Math.min(dk.w, dk.h);
        gl.useProgram(P_SHADOW.p);
        var ex = camA.cx, ey = camA.cy + Rr * 1.16, rx = Rr * 0.92, ry = Rr * 0.15;
        gl.uniform4f(P_SHADOW.u.uEll, ex, ey, rx, ry);
        gl.uniform1f(P_SHADOW.u.uA, 0.2 * P.shadowFade);
        drawQuad(P_SHADOW, ex - rx * 1.6, ey - ry * 2.4, rx * 3.2, ry * 4.8);
      }
      var n = fillBeads(0, 1, P, wipe, null, null, null);
      if (G.performance) api.stats.cpu = performance.now() - t0;
      api.stats.beads = n;
      drawBeads(n, useDeck ? win : null, winR);
      divePrev = p;
    }

    function renderReduced(dk, gr, t, deckRad, gridRad) {
      var p = diveT;
      keyV[0] = KEY_W[0]; keyV[1] = KEY_W[1]; keyV[2] = KEY_W[2];
      var k = ss(seg(p, 0.42, 0.58));
      // orb at rest, fading out
      if (k < 1) {
        solve(0, t, dk, gr, camA, true, SX, SY, OK);
        for (var i = 0; i < N; i++) OKP[i] = 0;
        sortOrder();
        if (useDeck) drawDeck(dk, deckRad, null, 1 - k, 0, { x: 0, y: 0, r: -1, soft: 1 }, { x: camA.cx, y: camA.cy, r: orbScale * Math.min(dk.w, dk.h) * 1.25, s: 0.045 });
        else if (!dark) {
          var Rr = orbScale * Math.min(dk.w, dk.h);
          gl.useProgram(P_SHADOW.p);
          var ex = camA.cx, ey = camA.cy + Rr * 1.16, rx = Rr * 0.92, ry = Rr * 0.15;
          gl.uniform4f(P_SHADOW.u.uEll, ex, ey, rx, ry); gl.uniform1f(P_SHADOW.u.uA, 0.2 * (1 - k));
          drawQuad(P_SHADOW, ex - rx * 1.6, ey - ry * 2.4, rx * 3.2, ry * 4.8);
        }
        drawBeads(fillBeads(0, 1 - k, null, null, dark ? 0 : 1, null, 0), useDeck ? dk : null, deckRad);
      }
      // the landed grid, fading in
      if (k > 0) {
        solve(1, t, dk, gr, camA, true, SX, SY, OK);
        sortOrder();
        var card = landing === 'card';
        if (useDeck) drawDeck(gr, gridRad, null, k, card ? 1 : 0, card ? { x: gr.x + gr.w / 2, y: gr.y + gr.h / 2, r: 1e5, soft: 1 } : { x: 0, y: 0, r: -1, soft: 1 }, { x: 0, y: 0, r: 1, s: 0 });
        drawBeads(fillBeads(0, k, null, null, dark ? (card ? 1 : 0) : 1, null, 1), useDeck ? gr : null, gridRad);
      }
    }

    /* ---------- loop */
    function running() { return !dead && !paused && visible && !docHidden && !lost && !reduced; }
    function stepSprings(dt) {
      // pointer: a soft, slightly springy follow
      var k = 70, c = 12.5;
      ptrV.x += ((ptrT.x - ptr.x) * k - ptrV.x * c) * dt; ptr.x += ptrV.x * dt;
      ptrV.y += ((ptrT.y - ptr.y) * k - ptrV.y * c) * dt; ptr.y += ptrV.y * dt;
      // dive: critically damped follow of the scroll target (silky even with coarse wheel steps)
      if (smoothing && qaPrev == null) {
        var w = 11;
        diveV += (w * w * (diveT - diveP) - 2 * w * diveV) * dt; diveP += diveV * dt;
        if (Math.abs(diveT - diveP) < 1e-4 && Math.abs(diveV) < 1e-3) { diveP = diveT; diveV = 0; }
      } else diveP = diveT;
      diveP = c01(diveP);
      var now = realNow();
      for (var i = pulses.length - 1; i >= 0; i--) if (now - pulses[i].t0 > 2.4) pulses.splice(i, 1);
    }
    function frame(ts) {
      raf = 0;
      if (dead) return;
      var dt = last ? Math.min(0.05, Math.max(0, (ts - last) / 1000)) : 1 / 60;
      last = ts;
      shutter = 0.6 * Math.min(1.5, (1 / 60) / Math.max(dt, 1 / 240));
      if (!frozen) clockS += dt;
      stepSprings(dt);
      render();
      if (!drawn) { drawn = true; cv.style.opacity = '1'; resolveReady(true); }
      // once the grid has landed and nothing moves, stop drawing until something changes
      var still = diveP === diveT && diveP >= 0.93 && !pulses.length && Math.abs(diveV) < 1e-4;
      if (running() && !still) raf = requestAnimationFrame(frame);
      else last = 0;
    }
    function kick() { if (!raf && !dead && !lost) raf = requestAnimationFrame(frame); }
    function invalidate() { if ((visible && !docHidden) || !drawn) kick(); }

    /* ---------- listeners */
    var ro = null, io = null;
    if (G.ResizeObserver) { ro = new ResizeObserver(function () { invalidate(); }); ro.observe(container); }
    else G.addEventListener('resize', invalidate);
    if (G.IntersectionObserver) {
      io = new IntersectionObserver(function (es) { visible = es[es.length - 1].isIntersecting; if (running()) kick(); }, { rootMargin: '120px 0px' });
      io.observe(container);
    }
    function onVis() { docHidden = !!document.hidden; if (running()) kick(); }
    document.addEventListener('visibilitychange', onVis);
    function onMove(e) {
      if (e.pointerType === 'touch') return;
      var dk = deckRect();
      var ox = CR.left + dk.x + dk.w / 2, oy = CR.top + dk.y + dk.h / 2;
      ptrT.x = Math.max(-1, Math.min(1, (e.clientX - ox) / (G.innerWidth * 0.5)));
      ptrT.y = Math.max(-1, Math.min(1, (e.clientY - oy) / (G.innerHeight * 0.5)));
      if (!raf && running()) kick();
    }
    function onLeave(e) { if (!e.relatedTarget) { ptrT.x = 0; ptrT.y = 0; } }
    if (!manualPointer && !reduced) { G.addEventListener('pointermove', onMove, { passive: true }); document.addEventListener('pointerout', onLeave); }
    cv.addEventListener('webglcontextlost', function (e) { e.preventDefault(); lost = true; if (raf) cancelAnimationFrame(raf); raf = 0; });
    cv.addEventListener('webglcontextrestored', function () { lost = false; try { initGL(); kick(); } catch (err) { /* stays on the still */ } });

    /* ---------- public API */
    api.setDive = function (p, o) {
      diveT = c01(+p || 0);
      if ((o && o.immediate) || !smoothing) { divePrev = diveP; diveP = diveT; diveV = 0; }
      if (o && o.prev != null) qaPrev = c01(o.prev); else if (!o || !o.keepPrev) qaPrev = null;
      invalidate();
      return api;
    };
    api.getDive = function () { return diveP; };
    api.setGridTarget = function (rect, o) {
      gridSrc = rect || null;
      if (o) { if (o.radius != null) gridOpt.radius = o.radius; if (o.fit) gridOpt.fit = o.fit; if (o.dot != null) gridOpt.dot = o.dot; }
      invalidate();
      return api;
    };
    api.setDeckRect = function (rect) { deckSrc = rect || null; invalidate(); return api; };
    api.pulse = function (strength, angle) {
      if (reduced || dead) return api;
      var s = strength == null ? 1 : Math.max(0, Math.min(1.5, +strength));
      var a0 = angle != null ? +angle : PI / 2 + (pulseSeq++ * 2.399963) % 1.6 - 0.8;
      pulseFix = null;
      pulses.push({ t0: realNow(), s: s * 0.8, a0: ((a0 % TAU) + TAU) % TAU });
      if (pulses.length > 8) pulses.shift();
      kick();
      return api;
    };
    api.setPointer = function (nx, ny) { ptrT.x = Math.max(-1, Math.min(1, +nx || 0)); ptrT.y = Math.max(-1, Math.min(1, +ny || 0)); if (!raf && running()) kick(); return api; };
    api.pause = function () { paused = true; return api; };
    api.resume = function () { paused = false; kick(); return api; };
    api.freeze = function (sec) { if (sec == null) { frozen = false; } else { frozen = true; clockS = +sec; } invalidate(); return api; };
    api.renderNow = function (o) {
      if (o && o.pointer) { ptr.x = ptrT.x = o.pointer[0]; ptr.y = ptrT.y = o.pointer[1]; ptrV.x = ptrV.y = 0; }
      if (o && o.dive != null) { diveT = diveP = c01(o.dive); diveV = 0; qaPrev = o.prev != null ? c01(o.prev) : null; }
      if (o && o.time != null) { clockS = o.time; frozen = true; }
      shutter = 0.6;
      if (o && o.pulse) { pulseFix = o.pulse.age || 0; pulses = [{ t0: 0, s: (o.pulse.s == null ? 1 : o.pulse.s) * 0.9, a0: o.pulse.angle != null ? o.pulse.angle : PI / 2 }]; }
      render();
      if (!drawn) { drawn = true; cv.style.opacity = '1'; resolveReady(true); }
      return api;
    };
    api.destroy = function () {
      dead = true; if (raf) cancelAnimationFrame(raf); raf = 0;
      if (ro) ro.disconnect(); if (io) io.disconnect();
      G.removeEventListener('resize', invalidate);
      document.removeEventListener('visibilitychange', onVis);
      G.removeEventListener('pointermove', onMove); document.removeEventListener('pointerout', onLeave);
      var ext = gl.getExtension('WEBGL_lose_context'); if (ext) ext.loseContext();
      if (cv.parentNode) cv.parentNode.removeChild(cv);
      resolveReady(false);
    };

    measure();
    kick();
    return api;
  }

  G.IAOrb3D = { create: create, version: '1.0.0', STILL: STILL, TILT: TILT };
})(window);
