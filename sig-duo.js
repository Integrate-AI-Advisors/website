/* 1.7: one team, two places. The team card shows the same morning in Slack and on your mission control.
   Tabs switch it; once the Slack conversation has played, it swaps gently on its own every 7 s until the visitor
   picks a tab. Pauses on hover, off screen and in a hidden tab; never swaps on its own under reduced motion. */
(function () {
  var card = document.querySelector('.chat--duo');
  if (!card) return;
  var tabs = [].slice.call(card.querySelectorAll('.duo__tab'));
  var panes = [].slice.call(card.querySelectorAll('.duo__pane'));
  var view = 0, pinned = false, hover = false, seen = false, timer = 0;
  var rm = document.documentElement.classList.contains('rm');

  function show(i) {
    view = i;
    card.setAttribute('data-view', String(i));
    tabs.forEach(function (t, k) { t.setAttribute('aria-selected', k === i ? 'true' : 'false'); t.tabIndex = k === i ? 0 : -1; });
    panes.forEach(function (p, k) { p.classList.toggle('is-on', k === i); p.setAttribute('aria-hidden', k === i ? 'false' : 'true'); });
  }
  function tick() {
    timer = 0;
    if (!pinned && !hover && seen && !document.hidden) show(view ? 0 : 1);
    arm(7000);
  }
  function arm(ms) { if (rm || pinned) return; clearTimeout(timer); timer = setTimeout(tick, ms); }

  tabs.forEach(function (t, k) {
    t.addEventListener('click', function () { pinned = true; clearTimeout(timer); show(k); });
    t.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault(); pinned = true; clearTimeout(timer);
      var n = (k + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length; show(n); tabs[n].focus();
    });
  });
  card.addEventListener('pointerenter', function () { hover = true; });
  card.addEventListener('pointerleave', function () { hover = false; });
  show(0);

  // start swapping only after the Slack conversation has had time to play (about 6 s after it comes into view)
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      seen = es[0].isIntersecting;
      if (seen && !timer) arm(view === 0 ? 9000 : 7000);
    }, { threshold: 0.35 }).observe(card);
  } else { seen = true; arm(9000); }
})();
