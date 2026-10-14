# DIRECTIVE V — Codex Project Instructions

## Mission
Build a production-quality cinematic promotional landing page for the fictional AAA tactical war shooter **DIRECTIVE V**.

We are **not building the game**. The website is a concept experience that should make DIRECTIVE V feel like a credible premium game reveal.

Before making meaningful design or implementation decisions, read every document in `/docs` and inspect the supplied assets in:
- `/public/assets/characters`
- `/public/assets/cinematic`

These documents and supplied assets are the canonical source of truth.

## Core creative principle
The visitor should feel like they are **accessing a classified military operation**, not browsing a conventional game marketing website.

Five words govern the experience:
- Dark
- Tactical
- Cinematic
- Controlled
- Dangerous

The site must remain premium, restrained and readable.

## Visual philosophy
Aim approximately for:
- 70% cinematic imagery
- 20% typography
- 10% tactical/system interface

Avoid generic gaming UI.

Do not default to:
- excessive neon
- glowing borders everywhere
- glassmorphism
- rounded SaaS cards
- random HUD clutter
- constant glitch effects
- generic gaming gradients
- decorative icons without meaning
- excessive use of red

Signal Red is semantic. It means threat, warning, Dominion, target, classified or active.

## Canonical palette
- Void: `#08090A`
- Carbon: `#141618`
- Ash: `#A3A6A8`
- Bone: `#E8E5DF`
- Signal Red: `#C92A2A`

## Typography
Use three voices:
1. Condensed/strong display face for cinematic headlines.
2. Neutral sans-serif for body/interface copy.
3. Monospace for intelligence data, coordinates, timestamps and system labels.

Large headlines may intentionally exceed conventional UI scale.

## Layout
- Use a disciplined 12-column desktop grid.
- Use generous negative space.
- Cinematic imagery may break the grid.
- Metadata should remain precisely aligned.
- Corners should generally be 0–2px.
- Do not turn sections into rows of conventional cards unless structurally necessary.

## Motion
Motion must support story.

### Cinematic motion
Slow, atmospheric, approximately 3–8 seconds:
- camera pushes
- parallax
- masking
- fog/rain/particles
- image depth
- light sweeps

### Interface motion
Fast, approximately 100–250ms:
- line extensions
- crosshair snaps
- labels
- counters
- system-state transitions

### Glitch
Glitch is narrative, not decoration.
Use it primarily when Dominion interferes with the system and during the Operator 06 reveal.

Respect `prefers-reduced-motion`.

## Audio
Audio is opt-in.
Never autoplay loud audio.
The experience should support an eventual:
- Enter with Audio
- Enter Muted

The visual experience must still work completely without sound.

## Images
The supplied production assets are canonical.
Do not silently replace them with stock imagery.
Preserve the established operator identities.
Do not add generated text baked into image files when HTML/CSS text can remain sharp and animated.

## Responsive behavior
Desktop receives the richest cinematic presentation.
Tablet/mobile should preserve narrative and hierarchy rather than simply shrinking desktop.
Heavy effects must degrade gracefully on lower-powered devices.

## Performance
Optimize aggressively:
- lazy-load below-the-fold media
- responsive images
- preload only critical hero assets
- avoid unnecessary WebGL
- avoid huge always-running animation loops
- preserve accessibility and usability

## Technical preference
A strong default stack is:
- Next.js
- TypeScript
- Tailwind CSS
- GSAP + ScrollTrigger only where scroll choreography genuinely benefits from it
- CSS transitions/animations for simpler UI motion

Do not add Three.js/WebGL merely to make the stack look sophisticated.

## Critical rule
**If an element does not contribute to information, atmosphere or story, remove it.**
