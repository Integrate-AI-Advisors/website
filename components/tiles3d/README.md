# tiles3d: "Twenty dashboards become one", in real 3D

One self-contained WebGL component (`tiles3d.js`, global `IATiles3D`) for the Signal v1.1 hero. It draws
twenty machined tiles and the dark logo deck on a transparent canvas over the warm paper page, then flies the
twenty into the deck while the page ticks its numeral from 20 to 1.

- **Library:** three@0.149.0 UMD from jsDelivr (global `THREE`). If `THREE` is not on the page, the component
  injects that exact script itself. No import maps.
- **Fonts:** JetBrains Mono 500 for tile labels, loaded through `document.fonts` before any texture is drawn
  (the Google Fonts stylesheet is injected if the page has not declared the family).
- **Greyscale only.** Nothing that moves is coloured.
- **Cost:** 21 meshes + 566 orb points, about 25 draw calls. Measured 60 fps with no frame over 20 ms through
  the whole sequence at 1x and 2x pixel ratio (M1, headless Chrome). Ready in about 0.2 s once cached.

## What it looks like

- **Tiles:** squircle slabs (continuous corners, 27% radius) with a quarter-round bevel and a short machined
  side wall. Nine physically based finishes: polished chrome and satin aluminium (slightly convex faces, a
  dedicated contrasty chrome studio), black glass (deep black, clear coat, crisp strip reflections), pearl
  ceramic (glaze and sheen), matte porcelain, brushed graphite (fine streaks in its roughness), perforated pearl, engraved
  hatch porcelain, and frosted glass (two tiles, faked translucency, no transmission pass).
- **Faces:** label in JetBrains Mono uppercase (0.08em tracking, wraps to two lines on narrow tiles) plus the
  live glyph from the DOM version, ported 1:1 (bars that breathe, sparklines that draw on, dots that blink, the
  Skio arc that spins). The glyph animation runs in the shader, so there are no texture uploads per frame.
  Printed ink is matte (no clear coat, low specular); pale ink on dark tiles is self-lit so it always reads.
- **Light:** three hand-built studio rooms turned into environment maps with PMREMGenerator (a bright soft room
  for ceramics, a black room with strip lights for black glass and the deck, a chrome room whose crisp
  structure sits outside what resting faces reflect, so it shows on bevels and sweeps across faces as tiles
  turn). A key light. ACES tone mapping. A whisper of aerial haze toward the paper colour for depth.
- **Shadows:** custom soft contact shadows on an invisible floor that *is* the page. Silhouettes are projected
  along the key light, the lowest point wins, and two blur widths are mixed by height, so a tile high above the
  page casts a wider, fainter shadow. No shadow maps, no aliasing.
- **Deck:** the brand's dark rounded tile (30% corner radius, the exact `orb.svg` radial #1e1e21 to #080809,
  unaffected by tone mapping so it matches the DOM deck) as black glass, with the composing orb alive on it:
  12 lanes x 44 + 38 ghost dots from the brand engine, sorted and weaving, floating a hair above the face with
  real relief (front dots brighter and bigger). Each impact briefly brightens the orb.

## API

```js
const t3 = IATiles3D.create(containerEl, {
  reducedMotion,        // default: the OS setting. One calm composed frame instead of motion.
  dpr,                  // default devicePixelRatio, capped at 2
  deck: { x, y, size }, // container px: where the deck lands. Default: centre, size clamp(104, 176, 30% of width)
  bleed,                // px the canvas extends past the container on each side (default 16% of the shorter side, 32..160)
  inset: 0.04,          // fraction of the container kept clear around the tile field
  pointer: 'auto',      // 'auto' listens to window pointermove; 'manual' = only setPointer()
  seed: 20,             // the choreography is deterministic for a given seed
  exposure: 1.12, paper: '#F1F1EF'
});

t3.ready                       // Promise, resolves with the instance; rejects if WebGL or three fails (keep the DOM tiles as fallback)
t3.enter({ delay, stagger, chaos: true, firstSwap })   // Promise: resolves when all twenty have landed
t3.chaos(false)                // stop the neighbour swaps (floating and pointer continue)
t3.collapse({ onImpact(i, total), onDone(), first, span, fly, settle })   // Promise: resolves at onDone
t3.getDeckRect()               // { left, top, width, height, x, y, radius, local: { x, y } } in viewport px (local = container px)
t3.getDeckRect({ live: true }) // the deck's current projected rect (same as above once settled)
t3.setDeck({ x, y, size })     // move the landing spot (container px), e.g. to the mission control card's centre
t3.setPointer(nx, ny)          // -1..1 across the container, y up; setPointer(null) returns to auto
t3.fadeOut(ms)                 // Promise: fades the canvas, then hides it and stops the loop
t3.pause(); t3.resume(); t3.reset(); t3.destroy();
IATiles3D.supported()          // quick WebGL check before creating
IATiles3D.TILES                // the twenty names, in order
```

QA only: `create(el, { manual: true })` turns the loop off; `t3.advance(dt)` steps in fixed 1/120 s steps and
draws one frame (deterministic). `t3.studio(spec)` poses objects for still renders (see `renders.html`).

`getDeckRect()` always returns the settled target rect (stable, known before the collapse even starts), so the
page can measure the card morph early. It matches the rendered deck's silhouette to the pixel once settled.

## Timings

**enter()** (from the call): first tile at +0.08 s, then one every 28 ms in a shuffled order (last starts at
0.61 s). Each tile descends toward the page from near the lens, fading in over 0.3 s, with a little spin, and
settles on springs by about 1.4 s. Floating and bobbing start at once; the pointer push and group tilt from
0.53 s; gentle neighbour swaps (the travelling tile lifts over the other) from 0.8 s, every 0.30 to 0.46 s.

**collapse()** (from the call; defaults match the v1 DOM timeline exactly):

| time   | what happens |
|--------|--------------|
| 0      | deck pops in above the grid (0 to 52% size, a quarter turn, about 0.45 s); remaining tiles feel a pull toward it |
| 0.02+  | tiles launch nearest first, each on a 0.46 s cubic arc that lifts toward the lens and swirls in one direction, banking, spinning, shrinking to 30% and sinking into the deck |
| 0.48   | first impact: `onImpact(1, 20)`, deck grows a step and gives a tiny punch |
| 0.48 to 1.28 | impacts 2 to 20, spaced by the inverse of power2.inOut over 0.8 s (same curve as v1's numeral strip) |
| 1.28   | final impact: `onImpact(20, 20)`, bigger punch, a thin chrome ripple ring (with its own soft shadow) grows to 1.85x and fades over 0.95 s |
| 1.28 to 1.90 | the deck settles face-on, exactly onto `getDeckRect()` |
| 1.90   | `onDone()` (use `settle: 0.26` to get v1's "click + 0.26 s" hand-off instead) |

## Wiring it into `initHero` (suggested)

1. `const t3 = IATiles3D.create(stage, { reducedMotion: reduce })` and keep the DOM tiles hidden only once
   `t3.ready` resolves (fallback: the current DOM tiles).
2. At hero start: `t3.enter()`. Before `T0`: `t3.setDeck({ x: cx, y: cy, size })` with the values v1 already
   computes in `collapse()` (mission control centre relative to the stage, `clamp(104, 176, mr.width * 0.3)`).
3. At `T0 = 1.7`: `t3.collapse({ onImpact: (i, n) => i < n ? tickNumeral(n - i) : headlineToOne(), settle: 0.26, onDone: unfold })`.
4. In `unfold()`, start the clip-path morph from `t3.getDeckRect()` instead of `stage._one`, and call
   `t3.fadeOut(300)` once the DOM card covers the deck; `t3.destroy()` afterwards frees the GPU.

Notes: the canvas (class `ia-tiles3d`, `pointer-events: none`) is appended to the container and overflows it by
`bleed` px; give the container `overflow: visible` so shadows are not cut. It pauses itself when the tab is
hidden or the stage is off-screen.

## Files

- `tiles3d.js`: the component.
- `demo.html`: full-viewport demo in the Artifact content format (mock headline, numeral wired to `onImpact`,
  enter, chaos, collapse, then the deck rect outlined with a white dashed line on its edge, Replay button).
  `?t=2.6` freezes time for screenshots, `?hold=1.9` sets the float time, `?px=0.2&py=0.1` places the pointer,
  `?rm=1` shows the reduced-motion frame.
- `local-demo.html`: the same wrapped in a full document for file:// testing.
- `renders.html`: poses stills (`?shot=chromeB|pearl|glass|graphite|alu|frost|cluster|grid|deck34|deck&labels=0|1&dpr=4`).
- `qa/cdp.mjs`: QA driver (headless Chrome over the DevTools protocol, own profile, many shots per launch).
- `qa/final-*.png`: reference frames.

## Still renders (`renders/`)

Transparent PNG, 2x, supersampled (canvas at 4x, captured at 2x), trimmed, soft contact shadow baked in,
greyscale (stored as grey + alpha), all under 250 KB. Labelled and clean (`-clean`, no labels) versions.

| file | what | size |
|------|------|------|
| `tile-chrome.png`, `tile-chrome-clean.png` | polished chrome tile, three-quarter | 624x673 |
| `tile-pearl.png`, `tile-pearl-clean.png` | pearl ceramic tile | 659x703 |
| `tile-glass.png`, `tile-glass-clean.png` | black glass tile | 634x708 |
| `tile-graphite.png`, `tile-graphite-clean.png` | brushed graphite tile | 663x703 |
| `cluster.png`, `cluster-clean.png` | a loose cluster of six mixed tiles at different heights | 1525x1203 |
| `grid.png`, `grid-clean.png` | a neat 3x3 grid snapping together, seen at an angle | 1207x1165 |
| `deck-three-quarter.png` | the dark logo deck with the live orb, three-quarter | 642x722 |
| `deck-face.png` | the deck face-on | 714x730 |

Show them at half their pixel size (they are 2x). They sit best on the paper `#F1F1EF` or white cards.

## Signal Colour additions (version 1.1.0-colour)

This copy lives in `variants/signal-colour/`. It adds one optional input and changes nothing else: with no
palette it draws exactly the greyscale 1.0 tiles. The deck and its composing orb stay greyscale (the logo).

- **`palette`** (new option): `IATiles3D.create(el, { palette })`. When the option is absent the component
  reads `window.IA_COLOUR.tiles3d` (the page's `colour.js` sets it); pass `palette: null` to force greyscale.
  ```js
  palette = {
    finishes: { myFinish: { color, metal, rough, cc, ccr, sheen, env, envI, glow, tm, grad, ink, inkR, emit,
                            accent, pat, patR, patAmt, opacity, edge, shadow, dome, pattern } },   // optional, adds or overrides finishes
    tiles: { 'Xero': 'glassGreen', 'Cropster': { accent: '#A86F1C' }, 'Bank': { finish: 'frostGreen' } }
  }
  ```
- **New finishes** (usable by name, brand hues only): `ceramicGreen`, `ceramicBlue`, `ceramicAmber` (tinted glaze,
  deep-hue label, glyph in the hue), `glassGreen`, `glassBlue`, `glassAmber` (jewel glass: the face is the brand hue
  itself, not tone mapped, lit a little more toward the lower edge, crisp strip reflections, pale self-lit ink),
  `frostGreen`, `frostBlue`, `frostAmber` (translucent tinted glass), `aluGreen`, `aluBlue`, `aluAmber` (anodised
  metal). `IATiles3D.FINISHES` lists every finish name.
- **New finish fields:** `accent` (ink for the live glyph: bars, lines, dots; labels keep `ink`), `glow` (the body
  lights itself by this fraction of its colour), `tm: false` (skip tone mapping so the face matches the CSS hue),
  `grad` (emissive gradient, brighter toward the lower edge), `pattern` (which surface pattern the atlas draws:
  `dots`, `graphite`, `hatch`).
- **Shader change:** the atlas's animated channel (G) can be inked separately (`uInk2`, `uInkEmit2`), and glass
  can carry an emissive gradient (`uGrad`). Program cache key is now `ia-tile-c1`.
- **Renders:** `renders-colour.html` poses the coloured tiles (`?shot=glassGreen|glassBlue|glassAmber|ceramicAmber|
  ceramicBlue|grid&fin=<any finish>`) and exposes `window.__trim(pad)`; the page's `.tools/stills.mjs` captures
  trimmed transparent PNGs (4x, kept in `.tools/stills-raw/`, halved into `img/`).
