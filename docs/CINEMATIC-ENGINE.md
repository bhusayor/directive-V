# Phase 3.5 — Cinematic engine

This is the promotional website runtime, not a game engine. Canonical art, copy,
section order and the approved Raven interaction remain unchanged. No Phase 4
sections, custom cursor, audio, particles, Three.js or React Three Fiber were added.

## Ownership

`CinematicProvider` creates one runtime per mounted briefing (never a server-global
singleton). It owns capabilities, page visibility, section/narrative state, pooled
intersection observers, mutable pointer/scroll signals, media records and exclusive
video ownership. React subscribes to discrete changes through `useSyncExternalStore`.
Pointer/scroll samples and damped motion use a demand-driven RAF, not per-frame React
state. Idle frames stop. The header updates only when crossing its scroll threshold.

`useVisibility` pools observers by options. `useSequence` owns finite semantic story
beats, lazy GSAP loading, skip/fast-scroll resolution, preference changes and hidden-tab
completion. Completed sequences never restart on returning to the tab. If GSAP fails
to load, finite timers deliver the same beats. No scrolling is intercepted or pinned.

`scopedGsap` scopes optional effects with `gsap.context()` and reverts both animations
and ScrollTriggers. Async initialization is guarded against unmount/StrictMode.
`watchLayout` batches resize/media/font changes before safe ScrollTrigger refresh;
it never refreshes on each scroll event. Hero ScrollTrigger exists only while visible.

The shared narrative vocabulary is `SYSTEM_STABLE`, `SYSTEM_WARNING`,
`SYSTEM_COMPROMISED`, and `SYSTEM_RESTORING`. Each section records its state; the active
section determines the shell state. Header framing and the existing interference and
restoration lines consume it. There is no giant global story state machine.

## Experience tiers

| Tier | Selection | Enhancement |
| --- | --- | --- |
| FULL | Fine-pointer desktop >=1100px, >=8 reported cores, >=4GB reported memory (4GB assumption if unavailable), usable WebGL, no reduced-motion/save-data constraint | Small damped Hero drift and scroll push, optional Blackout shader |
| REDUCED | Other WebGL-capable, unconstrained devices; typical tablet/mobile or weaker desktop | Lighter Hero scroll transform and finite narrative fades; no shader or pointer drift |
| STATIC | Reduced-motion, unavailable graphics, save-data, <=2 reported cores or <=2GB reported memory | Static image treatment, no depth or shader; readable core narrative |

Reduced-motion always exposes all clock/failure beats without timed dependency and
disables autoplay video. Unsupported WebGL alone does not remove the existing CSS
incident: its short clock/collapse/failure sequence still works. Coarse-pointer/mobile
Raven remains image-led, with the approved accessible selectors. Desktop interaction
layout is independent of motion tier. Save-data also suppresses operator video loads.

Capability queries use no browser sniffing. Resize/DPR changes are debounced 180ms;
motion/input preference changes apply immediately. FULL canvas DPR is capped at 1.5,
other tiers at 1. Actual canvas width is also capped at 1920px. Unknown hardware is
treated conservatively, not as a guaranteed high-end desktop.

## Existing-section enhancements

- Access: unchanged terminal composition. Optional entry transition resolves when the
  page becomes hidden; audio remains unavailable.
- Hero: the single canonical image gets at most 4px horizontal pointer translation,
  2px vertical pointer translation plus 2px velocity influence; targets decay toward
  rest. A separate, small 1.018 scale factor follows scroll. Typography never moves.
  The original finite camera push remains; STATIC removes image animation.
- Blackout: seconds 57, 58, 59, then 02:17:00 at 3000ms. The existing CSS illumination
  collapse lasts 150ms, with a FULL-only texture displacement/channel separation overlay
  during those same 150ms. Then 650ms near-black silence. Failure messages begin at
  3800ms and arrive individually every 480ms. The report resolves at 6370ms. Skipping,
  scrolling beyond the incident or hiding the tab resolves it immediately. The faint
  city memory in the aftermath is preserved.
- Dominion: the existing silence → trace → red → signal → image → phrase → title
  entrance now shares the runtime. A brief 1–2px metadata/line disturbance introduces
  red into the existing header; no permanent glitch loop.
- Directive Five: a brief framing realignment and retreat from red accompanies the
  existing five-marks-to-V sequence. The section restores the shared network state.
- Raven/Cipher: shared visibility, capabilities, media readiness, video ownership and
  finite readout sequencing. Local pointer coordinates still protect the approved
  hover intent against layout shifts; pointer sampling is also available centrally.
  Panel sizing, copy, crops and hover/keyboard interaction remain unchanged.

## WebGL lifecycle

`textureScene` is a small native WebGL 2D textured plane, not a 3D framework. The
Blackout enhancement initializes only near the viewport, only in FULL, before the
failure beat. It reuses the responsive image URL rather than downloading the original
asset separately. Its shader renders only for the visible 150ms failure window.
It never starts a permanent background rendering loop.

Resize is debounced. Hidden/far-away/completed scenes abort pending media and release
resources. Allocation, upload, shader/link failures and context loss fall back to the
unchanged DOM image/CSS story. Every owned texture, buffer, shader and program is
deleted and the context is explicitly released. This effect allocates no render
targets; future effects must add their own resources to the disposal stack.

## Media and video

`MediaManager` exposes IDLE/LOADING/READY/ERROR and relevance priorities:
VISIBLE → NEXT → NEAR → DISTANT. Responsive Next images keep native lazy loading;
`useImageMedia` tracks their state rather than preloading every asset. Only the Hero
is critical. Texture loads use a two-job priority queue, abort signals, decoding, and
a bounded six-image cache, cleared on runtime disposal.

Raven attaches metadata-only video sources near the lineup on eligible desktops.
`useManagedVideo` claims exclusive playback before calling play: other players stop
synchronously. Only the active relevant video plays. A decoded frame must be ready
before the 440ms crossfade; the portrait always stays underneath. Inactive/ended clips
pause immediately and reset after the fade. Failed/rejected/stalled clips silently
release their source and retain the portrait/intelligence.

Leaving the viewport pauses all videos. Hiding the document stops playback and detaches
sources. Returning preserves the selected dossier but requires a fresh hover movement,
click or keyboard intent before playback. No simultaneous autoplay restart occurs.

## Cleanup and debugging

Unmount cancels RAF, media jobs, frame callbacks, video timers/requests, event listeners,
resize timers and pooled observers. Component contexts revert GSAP/ScrollTriggers.
Page hiding also pauses CSS animation and resolves pending narrative sequences.

In development only, run `window.directiveCinema.inspect()` in the console. It reports
tier, preferences, GL availability, DPR cap, section/system state, active video,
WebGL frames/loop, observers, timelines, approximate scroll velocity and media records.
The utility is removed on unmount and is not installed in production.

Future sections should compose these hooks and resource owners, keep story content in
DOM, and request effects only while relevant. No Eclipse, Operations or Operator 06
effects are implemented here.

## Validation and limits

Final validation: `npm run typecheck`, `npm run lint`, `npm run build`, and all
49 Chrome browser tests passed against the production build. The only test-runner
warning was an environment color-setting conflict (`NO_COLOR` / `FORCE_COLOR`).
Production does not expose `window.directiveCinema`.

Port 3000 was occupied by another app redirecting to `/signup`; it was not stopped.
QA used port 3001 with `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3001` and
`PLAYWRIGHT_PRODUCTION=1`. To preview after QA, run `npm run dev -- --port 3001`.

The suite covers original Phase 1–3.1 behavior, tiers, responsive changes, reduced
motion, unsupported/failed WebGL, real GL draws/disposal, context loss, tab visibility,
video ownership, and actual React StrictMode unmount cleanup. Tests use semantic states
and broad timing bounds, not exact frame counts. Headless GL tests allow Chrome's
software renderer, while production capability probing rejects major performance
caveats. Hardware behavior still merits inspection on a physical low-end/mobile device.

GSAP 3.15.0 is the only added dependency. The first measured production build changed
initial route JS from 12.6kB to about 19.2kB; first-load JS from 115kB to 122kB.
Lazy GSAP/ScrollTrigger chunks total about 45.6kB gzip and are not needed by the
reduced-motion path. Canonical video/image sizes remain the main media cost.

The current npm audit reports seven findings (six high, one moderate), in the existing
Next/PostCSS and ESLint/fast-glob/micromatch/braces dependency chains, not GSAP. Suggested
fixes include major-version changes; no force upgrade is included in this motion phase.

Implementation references: [GSAP context lifecycle](https://gsap.com/docs/v3/GSAP/gsap.context%28%29/),
[safe ScrollTrigger refresh](https://gsap.com/docs/v3/Plugins/ScrollTrigger/static.refresh%28%29/),
[WebGL resource guidance](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices).

## Files changed in Phase 3.5

- `package.json`, `package-lock.json`
- `app/page.tsx`, `app/globals.css`
- `components/cinematic/provider.tsx`, `hero-depth.tsx`, `blackout-distortion.tsx`
- `lib/cinematic/capabilities.ts`, `runtime.ts`, `hooks.ts`, `gsap.ts`, `sequence.ts`,
  `media.ts`, `video.ts`, `webgl.ts`
- `lib/use-scene-motion.ts`
- `components/system/briefing-shell.tsx`
- `components/briefing/access-gate.tsx`, `hero-reveal.tsx`, `blackout-sequence.tsx`,
  `hostile-entrance.tsx`, `directive-five.tsx`, `cipher-interaction.tsx`,
  `cinematic-image.tsx`, `operator-archive.tsx`, `operator-media.tsx`
- `playwright.config.ts`
- `tests/cinematic.spec.ts`, `opening.spec.ts`, `operator-media.spec.ts`, `raven.spec.ts`
- `docs/CINEMATIC-ENGINE.md`

No supplied artwork, video, operator data or story documents were changed.
