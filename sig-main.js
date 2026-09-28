/* IntegrateAI · Signal 1.1 · boot. */
(function () {
  'use strict';
  var S = window.SIG;
  var root = document.documentElement;
  var QA = window.__QA || {};
  if (QA.rm) root.classList.add('rm');
  var reduce = root.classList.contains('rm');
  var hasGSAP = !!(window.gsap && window.ScrollTrigger);

  S.setupCopy();

  // No GSAP (or the safety timer fired): the static poster, with the booking panel still working.
  if (window.__signalFallback || !hasGSAP) {
    root.classList.remove('js');
    window.__signalReady = true;
    S.booking(null);
    return;
  }
  window.__signalReady = true;
  gsap.registerPlugin(ScrollTrigger);
  gsap.config({ nullTargetWarn: false });

  // Reduced motion: calm and still, every interaction still works.
  if (reduce) {
    S.booking(null);
    var d = S.buildDial();
    S.charge(true);
    S.$$('canvas.orbit__orb, canvas.close__canvas').forEach(function (c) { S.makeOrb(c, { still: true }); });
    var mx = S.makeMatrix(S.$('.screen__matrix-c'));
    if (mx) mx.setReveal(1);
    return;
  }

  var lenis = null;
  if (window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true, wheelMultiplier: 1 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
    window.__lenis = lenis;
  }

  // The 3D hero tiles start loading at once (three.js is injected by the component, once).
  var t3 = null, t3ready = Promise.resolve(null);
  try {
    if (window.IATiles3D && window.IATiles3D.supported && window.IATiles3D.supported() && !QA.no3d) {
      t3 = window.IATiles3D.create(S.$('.tiles3d-mount'), { reducedMotion: false, seed: 20 });
      t3ready = t3.ready.then(function () { return t3; }, function () { return null; });
    }
  } catch (e) { t3 = null; }
  S.preloaderStart();

  var fontsReady = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
  var cap = new Promise(function (r) { setTimeout(r, 1400); });
  var started = false;
  Promise.race([fontsReady, cap]).then(start, start);

  function start() {
    if (started) return;
    started = true;
    S.prepLines();
    // pins first, in page order, so every later trigger measures the spacers
    S.scene();
    var dial = S.buildDial();
    S.goals(dial);
    S.nav();
    S.booking(lenis);
    S.reveals();
    S.team();
    S.joined();
    S.charge(false);
    S.price();
    S.close();
    S.footer();
    S.signals();
    S.magnets();
    S.anchors(lenis);
    S.closeOrb();
    var hero = S.hero();
    ScrollTrigger.sort();
    ScrollTrigger.refresh();
    // Play with the 3D tiles if they are ready within a short window; otherwise the DOM tiles play.
    var chosen = false;
    Promise.race([t3ready, new Promise(function (r) { setTimeout(function () { r(null); }, 900); })]).then(function (inst) {
      chosen = true;
      if (!inst && t3) { t3ready.then(function (late) { if (late) late.destroy(); }); t3 = null; }
      S.preloaderEnd(function () { hero.play(inst); });
    });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) gsap.globalTimeline.pause();
      else if (QA.stopAt == null) gsap.globalTimeline.resume();
    });
    window.addEventListener('load', function () { ScrollTrigger.refresh(); });
  }
})();
