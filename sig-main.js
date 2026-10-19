/* IntegrateAI · Signal 1.2 · boot. Plain native scrolling at every size: no smooth-scroll library, no pins,
   no scrubbing. Things animate once as they arrive, on their own clock.
   2.0-u3 · boot safety: every section starts inside its own guard, so one broken section cannot blank the page
   (the loading screen still clears, the top bar and the headline still show). window.__signalBooted is set at
   the end of start(); the 4-second timer in the page head checks it (source/index.src.html, line 2). */
(function () {
  'use strict';
  var S = window.SIG;
  var root = document.documentElement;
  var QA = window.__QA || {};
  var failed = [];
  window.__signalFailed = failed; // the names of any sections that failed (read by the QA checks)

  // Runs S[name](args...). An error is logged and that section is skipped; the rest of the page carries on.
  function run(name) {
    var args = Array.prototype.slice.call(arguments, 1);
    try { return S[name].apply(S, args); } catch (e) { note(name, e); return null; }
  }
  function guard(name, fn) {
    try { return fn(); } catch (e) { note(name, e); return null; }
  }
  function note(name, e) {
    failed.push(name);
    try { console.error('Signal: ' + name + ' failed', e); } catch (x) {}
  }

  // No core script at all: the static poster.
  if (!S) {
    root.classList.remove('js');
    window.__signalReady = window.__signalBooted = true;
    return;
  }

  if (QA.rm) root.classList.add('rm');
  var reduce = root.classList.contains('rm');
  var hasGSAP = !!(window.gsap && window.ScrollTrigger);

  run('setupCopy');

  // No GSAP (or the safety timer fired): the static poster, with the booking panel still working.
  if (window.__signalFallback || !hasGSAP) {
    root.classList.remove('js');
    window.__signalReady = true;
    run('booking', null);
    window.__signalBooted = true;
    return;
  }
  window.__signalReady = true;
  gsap.registerPlugin(ScrollTrigger);
  gsap.config({ nullTargetWarn: false });

  // Reduced motion: calm and still, every interaction still works.
  if (reduce) {
    run('booking', null);
    run('buildDial');
    run('charge', true);
    run('liveDecks', true);
    guard('orbs', function () { S.$$('canvas.orbit__orb, canvas.close__canvas').forEach(function (c) { S.makeOrb(c, { still: true }); }); });
    guard('matrix', function () { var mx = S.makeMatrix(S.$('.screen__matrix-c')); if (mx) mx.setReveal(1); });
    window.__signalBooted = true;
    return;
  }

  /* ---------- the safety net ---------- */
  var heroPlaying = false, rescued = false;

  // The hero as a still poster (its reduced-motion look), used when the hero's script fails.
  function heroStill(inst) {
    guard('heroStill', function () {
      var hero = S.$('.hero');
      if (!hero) return;
      if (inst && inst.destroy) guard('tiles3dDestroy', function () { inst.destroy(); });
      var all = Array.prototype.slice.call(hero.querySelectorAll('*'));
      gsap.killTweensOf(all);
      all.forEach(function (el) {
        ['transform', 'translate', 'rotate', 'scale', 'opacity', 'visibility', 'color', 'clip-path', 'z-index'].forEach(function (p) { el.style.removeProperty(p); });
      });
      // figures the intro rolls or counts up go back to their written values; the status lights go on
      S.$$('.odo[data-odo]', hero).forEach(function (el) { el.textContent = el.getAttribute('data-odo'); el._odo = null; });
      S.$$('[data-count]', hero).forEach(function (el) { el.textContent = el.getAttribute('data-count'); });
      S.$$('.st, .dot', hero).forEach(function (el) { el.classList.add('is-on'); });
      hero.classList.remove('is-chaos', 't3-on');
      hero.classList.add('hero--still');
      ScrollTrigger.refresh();
    });
  }
  // The loading screen goes and the top bar shows, whatever state they are in.
  function clearPreloader() {
    guard('preloaderKill', function () {
      if (S.preloaderKill) S.preloaderKill();
      else { var el = S.$('.pre'); if (el) el.remove(); }
    });
    guard('navShow', function () {
      var bar = S.$('.nav__bar');
      if (!bar) return;
      gsap.killTweensOf(bar);
      bar.style.removeProperty('opacity');
      bar.style.removeProperty('visibility');
    });
  }
  function rescue(why) {
    if (rescued) return;
    rescued = true;
    failed.push('rescue (' + why + ')');
    try { console.error('Signal: page rescued (' + why + ')'); } catch (x) {}
    clearPreloader();
    if (!heroPlaying) heroStill(null);
  }
  window.__signalRescue = rescue; // the head timer calls this if start() began and did not finish

  // A last net for anything that fails later, asynchronously: if the loading screen is still up, or the
  // headline still hidden, 8 seconds after start (with the page in view), put the page right.
  function watchdog() {
    setTimeout(function check() {
      if (document.hidden) {
        document.addEventListener('visibilitychange', function again() {
          document.removeEventListener('visibilitychange', again);
          setTimeout(check, 3000);
        });
        return;
      }
      var copy = S.$('.hero__copy');
      if (S.$('.pre') || (copy && getComputedStyle(copy).visibility === 'hidden')) rescue('still loading after 8 s');
    }, 8000);
  }

  // The 3D hero tiles start loading at once (three.js is injected by the component, once).
  var t3 = null, t3ready = Promise.resolve(null);
  try {
    if (window.IATiles3D && window.IATiles3D.supported && window.IATiles3D.supported() && !QA.no3d) {
      t3 = window.IATiles3D.create(S.$('.tiles3d-mount'), { reducedMotion: false, seed: 20 });
      t3ready = t3.ready.then(function () { return t3; }, function () { return null; });
    }
  } catch (e) { t3 = null; }
  run('preloaderStart');

  var fontsReady = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
  var cap = new Promise(function (r) { setTimeout(r, 1400); });
  var started = false;
  Promise.race([fontsReady, cap]).then(start, start);

  function start() {
    if (started) return;
    started = true;
    window.__signalStarted = true;
    watchdog();
    run('prepLines');
    run('scene');
    var dial = run('buildDial');
    run('goals', dial);
    run('nav');
    run('booking', null);
    run('reveals');
    run('team');
    run('joined');
    run('charge', false);
    run('price');
    run('close');
    run('footer');
    run('signals');
    run('magnets');
    run('anchors', null);
    run('closeOrb');
    run('liveDecks', false);
    var hero = run('hero');
    guard('refresh', function () { ScrollTrigger.refresh(); });
    // Play with the 3D tiles if they are ready within a short window; otherwise the DOM tiles play.
    Promise.race([t3ready, new Promise(function (r) { setTimeout(function () { r(null); }, 900); })]).then(function (inst) {
      var ok = guard('preloaderEnd', function () {
        if (!inst && t3) { t3ready.then(function (late) { if (late) late.destroy(); }); t3 = null; }
        S.preloaderEnd(function () {
          if (hero && guard('heroPlay', function () { hero.play(inst); return true; })) heroPlaying = true;
          else heroStill(inst);
        });
        return true;
      });
      if (!ok) rescue('preloaderEnd');
    });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) gsap.globalTimeline.pause();
      else if (QA.stopAt == null) gsap.globalTimeline.resume();
    });
    window.addEventListener('load', function () { ScrollTrigger.refresh(); });
    window.__signalBooted = true;
  }
})();
