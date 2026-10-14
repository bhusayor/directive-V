# Phase 4 — Project Eclipse: the network is the weapon

Scope: Project Eclipse only, appended directly after Raven's unchanged closing.
Operations, Multiplayer, Operator 06 and audio are not implemented. Phases 1–3.5
retain their compositions, assets, story order and interaction design.

## Narrative and art

1. Raven's promise gives way to darkness and a new Omega-priority directive.
2. PROJECT ECLIPSE introduces the supplied `10-project-eclipse.png`.
3. A connected infrastructure model reveals communications, satellite relays,
   defense installations and power systems.
4. A single compromised relay reaches multiple downstream nodes. Three intelligence
   warnings resolve as the red propagation spreads.
5. THE BLACKOUT WAS ONLY A TEST.
6. ECLIPSE ACTIVATION // 72 HOURS, followed by Raven's four mission orders.

The activation window is fixed fictional campaign intelligence, explicitly labeled;
there is no live timer, real release date, or clock interval.

The canonical Eclipse poster contains baked-in text and an orbital-looking form.
CSS deliberately crops its ground-level troops, staging area and infrastructure.
The original image is not edited or replaced. Atmospheric layering suppresses the
poster typography/orbital silhouette; sharp HTML carries all required copy. The new
network is expressly a schematic, not a geographic map or a glowing globe.

## Architecture

- `EclipseSequence`: semantic, server-renderable narrative in normal document flow.
- `useScrollScene`: reusable reversible progress signal, scoped through the existing
  GSAP/ScrollTrigger owner. It uses normal scroll coordinates, not pinning, wheel
  interception or scroll locking. A short damped response drives the GPU uniforms.
  Native position measurement is the fallback if the GSAP chunk cannot load.
- `eclipse-network.ts`: deterministic shared topology: 40 connected nodes, four
  infrastructure kinds, a breadth-first propagation order, and static projection.
  Node positions are modeled infrastructure, not random particles.
- `EclipseNetwork`: matching SVG fallback plus a transparent WebGL canvas. SVG is
  retained until actual geometry has drawn successfully, then crossfades out.
- `network-scene.ts`: lazy native WebGL perspective renderer. Towers, defense volumes,
  grid junctions and elevated relay links are line geometry. Camera position and
  propagation are uniforms; red advances continuously along links. Nodes use small
  sharp markers rather than decorative glow. Only two draw calls per rendered frame.
- `useNetworkCanvas`: lifecycle ownership on the existing runtime RAF/visibility/
  capability services. It does not create a second animation loop.

The Eclipse entry and stage reuse `CinematicImage` and its media-manager/native lazy
loading strategy. Both instances share the same responsive image URL/cache; no new
texture download is needed because the network itself is procedural geometry.

The existing header consumes Eclipse's warning/compromised narrative state as
PRIORITY OMEGA / NETWORK EXPOSED. Navigation links and previous-section states remain
unchanged.

## Scroll and tiers

The sticky background remains behind four naturally scrolling narrative beats.
Reverse scrolling rewinds camera position, model count, node/edge colors and warning
states; there is no irreversible completed state.

- FULL: real WebGL perspective, small damped pointer influence, scroll camera push
  and continuous connection propagation.
- REDUCED: the same topology in SVG, staged red propagation and simpler scrolling;
  no GPU initialization or pointer perspective.
- STATIC / reduced-motion: non-sticky imagery and SVG with every narrative beat and
  warning readable immediately. No scrubbing requirement or shader distortion.

Mobile uses its own typography scale, cropped diagram and stacked activation/orders
layout. It is not a shrunken desktop canvas.

## Lifetime and performance

The renderer imports and initializes only near the stage, in FULL, while the page is
visible. It draws only for dirty progress, resize or settling pointer input. Rendering
stops at rest and outside the visible stage. DPR is capped at 1.5 and drawing-buffer
width at 1920px. Resize is debounced 180ms.

Leaving the relevant area or hiding the page deletes both geometry buffers, the
program and shaders, removes frame subscriptions, and shrinks the canvas backing
store to 1×1. The connected canvas retains a dormant reusable context so re-entry can
rebuild correctly. Real unmount explicitly loses the context; StrictMode's simulated
teardown does not destroy a still-connected canvas. Context loss/allocation/shader/
draw failures fall back to the image and SVG without blocking the narrative.

There are no textures, render targets, particle systems, continuous time uniforms,
postprocessing passes, physics or Three.js scene graph. No new dependencies were
added. The production build reports about 125kB first-load JS versus 122kB at Phase
3.5. The lazy network renderer is approximately 2.4kB gzip.

Remaining concerns: the canonical image is deliberately magnified for atmosphere;
it is not a new high-resolution ground-level render. Hardware capability detection
is a conservative heuristic, not an FPS guarantee. Chrome software-GL tests verify
rendering/lifecycle behavior, but physical low-powered devices and Safari still merit
visual/performance review. Existing dependency-audit findings are not addressed by
this feature phase.

## Verification

Eclipse tests cover real nonempty GPU pixels, increasing red pixels, reverse scroll,
reachability of every model node, idle rendering, offscreen/tab suspension and
re-entry, unsupported/failed/context-lost graphics, resize, preference changes,
320–1440px reduced-motion layouts, touch, no JavaScript and actual StrictMode unmount.
Pixel readback exists only in tests, not in the production render loop.

Screenshots are captured at entry, network reveal, compromise, revelation and final
directive, including touch/mobile. Existing opening-media assertions are scoped to
their original chapters so they do not require loading the new below-fold imagery.

For manual review, open `/#eclipse`, then scroll slowly through the network and back
up. Check that white routes turn red progressively and reverse cleanly. Stop scrolling:
the network should settle, not keep animating. Change tabs, return, and scroll again.
Toggle reduced motion and resize to mobile; all warnings/orders must remain readable.
The 72-hour window must never decrement.

## Files changed

Added:
- `components/briefing/eclipse-sequence.tsx`
- `components/cinematic/eclipse-network.tsx`
- `lib/cinematic/eclipse-network.ts`
- `lib/cinematic/network-scene.ts`
- `lib/cinematic/use-scroll-scene.ts`
- `lib/cinematic/use-network-canvas.ts`
- `app/eclipse.css`
- `tests/eclipse.spec.ts`
- `docs/PROJECT-ECLIPSE-IMPLEMENTATION.md`

Updated:
- `app/page.tsx` — append Eclipse after Raven.
- `app/globals.css` — import the scoped Eclipse stylesheet.
- `components/system/briefing-shell.tsx` — Eclipse-only system status.
- `tests/opening.spec.ts` — retain opening assertions within opening chapters.

No package manifests, supplied assets, operator records or canonical story documents
were changed.

Reference: [canvas context identity](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/getContext)
informs dormant-context reuse; [ScrollTrigger lifecycle](https://gsap.com/docs/v3/Plugins/ScrollTrigger/)
is managed through the existing scoped engine.
