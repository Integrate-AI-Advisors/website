# IAOrb3D · the composing orb in 3D, plus the dive into mission control

One self-contained script, `orb3d.js`, global `IAOrb3D`. Zero dependencies: raw WebGL 2 (falls back to
WebGL 1 with instancing), no three.js, no import map, nothing fetched. About 0.1 to 0.2 ms of CPU per frame.

- **The orb**: the brand engine exactly (12 lanes x 44 band dots + 38 ghost dots, band clock
  `t = seconds x 2.34 x 0.42`, the sphere never spins, only the band weaves). Every dot is a lit bead: a camera-facing
  impostor with a spherical normal, soft wrapped diffuse, a crisp specular glint, a studio reflection and a rim.
  Front beads are larger and brighter, back beads smaller and dimmer, exactly as the logo. Greyscale only.
- **Orientation matches the official `orb.svg`**, fitted dot by dot against the file: tilt 0.729 rad about X with
  screen y pointing down (the brief's formula is drawn y-up, which mirrors it), band clock 2.4 s
  (`t = 2.368`), dot radius `0.0229 x R x (0.935 + 1.445 depth)(1 - 0.25 edge)`, minimum `0.0227 R`, alpha
  `0.4 + 0.6 depth`, orb radius 0.30 of the tile. The first frame is the official still; then the band weaves.
- **Two themes**: `onDark` (pearl beads inside the brand's dark deck tile, drawn in WebGL with its radial gradient,
  hairline, lit top edge and drop shadow) and `onPaper` (polished ink beads on `#F1F1EF`, soft contact shadow).
- **Respond**: the pointer turns the orb a little (springy, about 14 degrees at the screen edge); the light is fixed
  in the world, so the glints glide across the beads as it turns.
- **Pulse**: a ripple of brightness and size that travels both ways round the band from where the data arrived.
- **The dive** (`setDive(p)`, reversible, a pure function of p): the tile opens into the screen rectangle like an app
  opening from its icon while the camera flies at the orb; the lens widens (a dolly zoom) so the front band swells;
  the camera pushes through the mouth of the band and the beads stream past in a radial warp with real motion blur
  (swept-disc streaks from actual scroll speed) and a touch of depth of field; inside, the ring levels out around
  you, is cut where you entered, and unrolls into a flat wall: lanes become the 12 rows, segments the 44 columns, the
  weave flattens, the ghosts fade. The grid lands exactly on the target rectangle. Then the dark screen switches on
  like a CRT (a line opening from the middle row) into the light card colour `#FBFBFA`, the dots turning to ink, so
  the page can fade the real mission control in on top with no seam.

## Files

| File | What |
| --- | --- |
| `orb3d.js` | the component (the only file the page needs) |
| `demo.html` | the orb on its dark deck in the centre of a paper page; a long scroll drives the dive into a mission-control rectangle; a Pulse button; the paper theme and a small CSS-tile orb below |
| `qa-phone.html`, `qa-bench.html` | QA-only harnesses (390 px iframe; CPU timing). Not for publishing. |
| `qa/shot.sh`, `qa/sheet.sh` | headless Chrome screenshot helper and contact-sheet builder |
| `qa/*.png` | QA screenshots |

## Quick start

```html
<div id="orbHost" style="position:absolute; inset:0"></div>
<script src="components/orb3d/orb3d.js"></script>
<script>
  var orb = IAOrb3D.create(document.getElementById('orbHost'), { theme: 'onDark' });
  orb.setDeckRect(document.querySelector('.orbit__deck'));             // where the dark tile sits
  orb.setGridTarget({ x: 56, y: 120, width: 1328, height: 760 }, { radius: 40 }); // where mission control will be
  // on scroll: orb.setDive(progress 0..1)
  // as each data dot lands: orb.pulse(0.6, angleTowardsTheToolItCameFrom)
  orb.ready.then(function (ok) { if (ok) document.documentElement.classList.add('orb3d-on'); }); // hide the SVG still
</script>
```

The canvas fills its container (absolute, `inset:0`, `pointer-events:none`, transparent). A static container gets
`position:relative`. The canvas fades in over 0.7 s on its first frame.

## API

### `IAOrb3D.create(containerEl, options)` returns `orb`

| Option | Default | Meaning |
| --- | --- | --- |
| `theme` | `'onDark'` | `'onDark'` light beads on the dark deck, or `'onPaper'` ink beads on paper |
| `reducedMotion` | `prefers-reduced-motion` | still frame at the brand still clock (2.4 s), no pointer, no pulse; `setDive` becomes a short crossfade from orb to landed grid, no flight |
| `dpr` | `devicePixelRatio`, capped at 2 | canvas resolution |
| `deck` | `true` for onDark, `false` for onPaper | draw the dark deck tile (and its shadow) in WebGL. Use `false` when a CSS tile is behind the canvas (for example the close section) |
| `landing` | `'card'` with a deck, else `'clear'` | end of the dive: `'card'` switches the dark screen on to `#FBFBFA` with ink dots; `'deck'` stays dark with light dots; `'clear'` no surface |
| `deckSize` | `1` | tile size when no deck rect is given: a fraction (up to 1) of the container's shorter side, or pixels |
| `orbScale` | `0.30` | orb radius as a fraction of the tile side (the official still is 0.30) |
| `pointer` | self-listening | `'manual'` to drive it yourself with `setPointer` |
| `smoothing` | `true` | a critically damped follow of `setDive` targets (silky with coarse wheel steps). Set `false` if the page already smooths its scroll (Lenis, GSAP scrub) |
| `time` | none | freeze the band clock at this many seconds (QA) |
| `qa` | `false` | preserve the drawing buffer and skip the fade-in (screenshots) |

### Methods (all chainable)

| Method | Meaning |
| --- | --- |
| `setDive(p, { immediate })` | dive progress 0..1. Reversible. `immediate:true` skips smoothing |
| `getDive()` | the smoothed progress actually drawn (use it to time page reveals) |
| `setDeckRect(rectOrEl)` | the dark tile, in viewport px (`{x,y,width,height}` or `{left,top,width,height}`). Pass an **element** to track it live every frame (its transforms included), which is what the constellation needs while the page scales its deck |
| `setGridTarget(rectOrEl, { radius, fit, dot })` | the rectangle the grid lands in. A rect is measured once (viewport px at call time, stored relative to the canvas); an element is tracked live. `radius` corner radius of the screen (default 40), `fit` `'fill'` (44 columns across the width, 12 rows down the height; default) or `'even'` (square pitch, centred), `dot` grid dot radius in px (default about 13% of the pitch, 1.6 to 4.2 px) |
| `pulse(strength = 1, angle)` | ripple. `angle` in radians, screen direction the data came from (0 = right, PI/2 = up, y up); the ripple starts on the band nearest that side. Without it, successive pulses start at gently varied points near the front. 0.4 to 0.7 is a good "data arrived" strength |
| `setPointer(nx, ny)` | -1..1 each, relative to the orb (only with `pointer:'manual'`) |
| `pause()`, `resume()` | stop or restart the loop. It also pauses by itself when the container is off screen or the tab is hidden, and idles once the grid has landed and nothing moves |
| `freeze(seconds)` | fix the band clock (`freeze()` to release) |
| `renderNow({ dive, prev, time, pointer:[x,y], pulse:{s,age,angle} })` | draw one exact frame now (QA). `prev` is the previous frame's dive value, which sets the motion streaks |
| `destroy()` | remove the canvas, listeners, observers and the GL context |
| `ready` | `Promise<boolean>`: true after the first frame, false if WebGL is unavailable (keep the SVG still then) |
| `supported`, `canvas`, `stats` | WebGL available; the canvas element; `{ cpu, beads }` of the last frame |

### The dive timeline (p)

| p | What the viewer sees |
| --- | --- |
| 0 to 0.03 | the orb at rest on its tile |
| 0.02 to 0.33 | the tile opens into the target rectangle; the orb grows to fill it |
| 0.25 to 0.45 | dolly zoom: the lens widens, the front band swells towards you |
| 0.38 to 0.55 | through the mouth of the band: radial warp, motion streaks, a little depth of field |
| 0.42 to 0.62 | inside, the ring levels out around you |
| 0.55 to 0.92 | the ring unrolls into a flat, even 12 x 44 grid; the weave flattens; ghosts are gone by 0.48 |
| 0.905 to 0.985 | (landing `'card'`) the screen switches on from the middle row outwards, dots turn to ink |
| 0.965 to 1 | the page fades the real mission control in over the rectangle (the demo does exactly this) |

Give the dive a long scroll (the demo uses a 460vh section with a sticky 100vh stage). The flight looks best at
normal scrolling speed; streak length follows real speed and relaxes to crisp beads when scrolling stops.

## Wiring it into Signal v1.1

**Constellation (pinned scene).**
1. Put a host `<div class="orbit__gl" style="position:absolute;inset:0;z-index:2">` inside `.orbit__stage`, under
   the pills and lines (z-index 4/5) so the pills still fly into the tile.
2. `var orb = IAOrb3D.create(host, { theme: 'onDark' }); orb.setDeckRect(deck);` where `deck` is `.orbit__deck`.
   The page keeps scaling the deck as it does now; the WebGL tile follows it live.
3. When `orb.ready` resolves `true`, make the DOM deck transparent (`background:none; box-shadow:none`) and hide its
   `img.deck__still` and the old 2D canvas. Keep them in the markup for no-JS and WebGL-less visitors.
4. After "9 systems up to date" has shown, extend the pin (for example another 200 to 300% of the viewport) and
   drive `orb.setDive(q)` with the progress of that extension. Fade the pills, lines and the done pill out over
   q 0 to 0.1.
5. `setGridTarget` to the rectangle where the mission control screen will appear inside the pinned stage (a rect,
   or an absolutely positioned placeholder element with the screen's size and 40 px radius). If the real screen
   lives in the next section, show a copy of it (or the section's screen, lifted) over the stage as the dive ends,
   fading it in over `getDive()` 0.965 to 1, then unpin.
6. Call `orb.pulse(0.5, angle)` each time a travelling dot reaches the tile, with
   `angle = Math.atan2(-(pillY - cy), pillX - cx)`.

**Close section.** `IAOrb3D.create(document.querySelector('.close__orb'), { theme: 'onDark', deck: false })`
(the CSS tile stays; the orb draws its beads on top). Hide `.close__canvas` and the still once `ready` is true.

**Reduced motion.** Nothing to do: the component draws the official still frame and a calm crossfade for the dive.
Pages usually skip the pin in that mode anyway.

## QA

`demo.html?qa=1` renders one exact frame with no scrolling (the intro is hidden so the stage is at the top):
`dive=0.4` progress, `vel=0.008` previous-frame offset for motion streaks, `t=2.4` band clock, `px=0.8&py=-0.6`
pointer, `pulse=1&age=0.35&ang=2.6` a frozen ripple, `theme=onPaper`, `s=720` tile size, `fit=even`, `reduce=1`,
`after=1` shows the two-theme section. Shots:

```
DSF=2 qa/shot.sh name "t=2.4&dive=0.4&vel=0.008" 1440,900
qa/shot.sh ph "t=2.4&dive=0.6" 520,844 qa-phone.html     # true 390 px layout (headless Chrome will not go below 500)
```

The helper uses its own profile in this folder and SwiftShader WebGL (headless Chrome on this Mac does not exit
after a GPU screenshot, so the helper kills it once the PNG is written). Checked: desktop and 390 px phone, both
themes, pointer turn, pulse, reduced motion, every dive stage, no console errors.

## Signal Colour additions (version 1.0.0-colour)

This copy lives in `variants/signal-colour/`. Two optional extras; without them it renders exactly as 1.0.

- **`tint`** (new option): `IAOrb3D.create(el, { tint: { glint: '#FFF0D6', rim: '#9CCFD9', bounce: '#hex', amount: 0.72 } })`.
  The bead's light is split into body, glint (key specular and studio reflection), rim (the back light on the
  shadow side, dark theme) and bounce (paper bounce, paper theme); each light term is multiplied by its tint,
  mixed toward white by `1 - amount`. Absent: white light. When the option is absent the component reads
  `window.IA_COLOUR.orb3d.tint`.
- **Coloured ripples:** `orb.pulse(strength, angle, colour)` takes an optional sRGB hex. The ripple's beads take
  that hue, lit by their own light (up to 85% at the crest, never in reduced motion, never on the landed grid),
  then fade back to silver. Without a colour the ripple is the 1.0 greyscale brightening.
- **Shader change:** a fourth per-bead attribute `iD` (ripple colour rgb, amount; 16 floats per bead instead of 12)
  and three uniforms `uGlint`, `uRim`, `uBounce`. `renderNow({ pulse: { colour } })` freezes a coloured ripple for QA.
- The page's `colour.js` wraps `IAOrb3D.create` so that a ripple from the scene's orbit takes the colour of the
  tool pill on that side (money green, sales blue, operations sea, customers amber).
