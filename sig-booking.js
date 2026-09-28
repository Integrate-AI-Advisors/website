/* IntegrateAI · Signal 1.1 · the booking panel. Opens in place, never scrolls you to the bottom. */
(function () {
  'use strict';
  var S = window.SIG;

  S.booking = function (lenis) {
    var dlg = S.$('#book');
    if (!dlg || typeof dlg.showModal !== 'function') return; // the buttons keep their fallback link to the close section
    var root = document.documentElement;
    var card = S.$('.book__card', dlg), veil = S.$('.book__veil', dlg), morph = S.$('.book__morph', dlg);
    var inner = S.$('.book__in', dlg), xBtn = S.$('.book__x', dlg);
    var trigger = null, busy = false, isOpen = false;
    var anim = function () { return !!window.gsap && !root.classList.contains('rm'); };

    S.$$('[data-book]').forEach(function (a) {
      a.addEventListener('click', function (e) { e.preventDefault(); open(a); });
    });

    function lock(on) {
      if (lenis) { if (on) lenis.stop(); else lenis.start(); }
      root.classList.toggle('is-locked', on);
    }

    function focusables() {
      return S.$$('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])', card).filter(function (el) { return el.offsetParent !== null; });
    }

    function reset() {
      if (window.gsap) gsap.set([card, inner, veil, morph], { clearProps: 'transform,opacity,y,x' });
      card.style.clipPath = '';
      card.style.transform = '';
    }

    function open(btn) {
      if (isOpen || busy) return;
      trigger = btn; isOpen = true;
      reset();
      dlg.showModal();
      lock(true);
      var first = S.$('.book__primary', card);
      if (first) first.focus({ preventScroll: true });
      if (!anim()) return;
      busy = true;
      gsap.fromTo(veil, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: 'power2.out' });
      if (S.isPhone()) {
        gsap.fromTo(card, { yPercent: 100 }, { yPercent: 0, duration: 0.62, ease: 'expo.out', onComplete: function () { busy = false; } });
        gsap.fromTo(inner, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, delay: 0.14, ease: 'expo.out' });
        return;
      }
      var br = btn.getBoundingClientRect(), cr = card.getBoundingClientRect();
      var dx = (br.left + br.width / 2) - (cr.left + cr.width / 2);
      var dy = (br.top + br.height / 2) - (cr.top + cr.height / 2);
      var ih = Math.max(0, (cr.height - br.height) / 2), iw = Math.max(0, (cr.width - br.width) / 2);
      var clip = S.inset(card, { t: ih, r: iw, b: ih, l: iw, rad: br.height / 2 });
      morph.style.background = getComputedStyle(btn).backgroundColor || '#191919';
      gsap.set(card, { x: dx, y: dy });
      gsap.set(morph, { opacity: 1 });
      gsap.set(inner, { opacity: 0, y: 16 });
      var tl = gsap.timeline({ onComplete: function () { clip.clear(); busy = false; } });
      tl.to(card, { x: 0, y: 0, duration: 0.78, ease: 'expo.inOut' }, 0)
        .to(clip, { t: 0, r: 0, b: 0, l: 0, rad: 34, duration: 0.78, ease: 'expo.inOut', onUpdate: clip.apply }, 0)
        .to(morph, { opacity: 0, duration: 0.3, ease: 'power2.out' }, 0.22)
        .to(inner, { opacity: 1, y: 0, duration: 0.7, ease: 'expo.out' }, 0.46);
    }

    function finish() {
      dlg.close();
      lock(false);
      isOpen = false; busy = false;
      reset();
      if (trigger) trigger.focus({ preventScroll: true });
    }

    function close() {
      if (!isOpen || busy) return;
      if (!anim()) { finish(); return; }
      busy = true;
      gsap.to(veil, { opacity: 0, duration: 0.45, ease: 'power2.inOut' });
      if (S.isPhone()) { gsap.to(card, { yPercent: 100, y: 0, duration: 0.45, ease: 'power3.in', onComplete: finish }); return; }
      var br = trigger && trigger.getBoundingClientRect();
      var seen = br && br.width > 0 && br.bottom > 0 && br.top < innerHeight;
      if (!seen) { gsap.to(card, { scale: 0.95, opacity: 0, duration: 0.35, ease: 'power2.in', onComplete: finish }); return; }
      var cr = card.getBoundingClientRect();
      var dx = (br.left + br.width / 2) - (cr.left + cr.width / 2);
      var dy = (br.top + br.height / 2) - (cr.top + cr.height / 2);
      var ih = Math.max(0, (cr.height - br.height) / 2), iw = Math.max(0, (cr.width - br.width) / 2);
      var clip = S.inset(card, { t: 0, r: 0, b: 0, l: 0, rad: 34 });
      var tl = gsap.timeline({ onComplete: finish });
      tl.to(inner, { opacity: 0, y: 10, duration: 0.22, ease: 'power2.in' }, 0)
        .to(morph, { opacity: 1, duration: 0.3, ease: 'power2.in' }, 0.12)
        .to(card, { x: dx, y: dy, duration: 0.6, ease: 'expo.inOut' }, 0.08)
        .to(clip, { t: ih, r: iw, b: ih, l: iw, rad: br.height / 2, duration: 0.6, ease: 'expo.inOut', onUpdate: clip.apply }, 0.08);
    }

    dlg.addEventListener('cancel', function (e) { e.preventDefault(); close(); });
    dlg.addEventListener('click', function (e) { if (!card.contains(e.target)) close(); });
    xBtn.addEventListener('click', close);
    dlg.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab') return;
      var f = focusables(); if (!f.length) return;
      var a = f[0], z = f[f.length - 1];
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
      else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
    });

    // Phones: drag the sheet down to dismiss.
    var drag = null;
    card.addEventListener('pointerdown', function (e) {
      if (!S.isPhone() || busy || e.target.closest('a,button')) return;
      var r = card.getBoundingClientRect();
      if (e.clientY - r.top > 90) return;
      drag = { y0: e.clientY, t0: performance.now(), dy: 0 };
      card.setPointerCapture(e.pointerId);
    });
    card.addEventListener('pointermove', function (e) {
      if (!drag) return;
      drag.dy = Math.max(0, e.clientY - drag.y0);
      gsap.set(card, { y: drag.dy });
    });
    function endDrag() {
      if (!drag) return;
      var v = drag.dy / Math.max(1, performance.now() - drag.t0);
      var d = drag.dy; drag = null;
      if (d > 110 || v > 0.7) close();
      else gsap.to(card, { y: 0, duration: 0.5, ease: 'expo.out' });
    }
    card.addEventListener('pointerup', endDrag);
    card.addEventListener('pointercancel', endDrag);

    S.openBooking = open;
    S.closeBooking = close;
  };
})();
