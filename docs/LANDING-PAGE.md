# DIRECTIVE V — Landing Page Architecture

The page should feel like a mission briefing that becomes increasingly compromised.

Do not implement this as a conventional stack of unrelated marketing sections.

---

# 00 — ACCESS / PRELOADER

## Purpose
Establish the fiction immediately: the visitor is accessing a secure Directive network.

## Visual
Near-black screen with minimal system text.

Example:
```text
DIRECTIVE NETWORK
SECURE TERMINAL // 05

ESTABLISHING CONNECTION...
████████████░░░ 84%

CLEARANCE VERIFIED
```

Then:
`ENCRYPTED TRANSMISSION DETECTED`

Primary:
`ENTER BRIEFING`

Secondary:
`AUDIO: OFF` or eventual `ENTER MUTED`

## Motion
Short only. Do not trap users behind a long fake loader.

On entry:
black screen → radio/static cue → unknown transmission:
“Raven... do you copy?”

Then hero.

---

# 01 — HERO / THE REVEAL

## Asset
Use the supplied hero squad cinematic asset.

## Composition
Full viewport.
All five Raven operators.
Warden slightly ahead.
Atmospheric war environment.

## Copy
Small:
`DIRECTIVE NETWORK // CLASSIFIED`

Main:
**DIRECTIVE V**

Tagline:
**FIVE GO IN. FIVE COME OUT.**

Prompt:
`SCROLL TO BEGIN BRIEFING ↓`

Corner metadata:
`ECLIPSE // STATUS UNKNOWN`

## Motion
Slow camera push / image scale.
Atmospheric parallax if feasible.
Do not over-animate.

---

# 02 — THE BLACKOUT

## Asset
Use the supplied Blackout cinematic image.

## Opening
Large:
**17 NOV 2049**

Clock:
`02:16:57 UTC`
`02:16:58`
`02:16:59`
`02:17:00`

At 02:17:
brief blackout / visual silence.

Then fragmented system failure.

Possible labels:
- `SIGNAL LOST`
- `SAT-09 OFFLINE`
- `GRID FAILURE`
- `UNAUTHORIZED COMMAND`
- `DEFENSE NETWORK COMPROMISED`

Large:
**11 MINUTES.**
**42 SECONDS.**

Supporting:
“Long enough to change the balance of power forever.”

Final:
**THE BLACKOUT**

## Motion
This is one of the major story-driven sequences.
Use restraint and accessibility fallback.

---

# 03 — DOMINION

## Assets
Use Dominion faction imagery and Architect asset.

## Transition
This is the first meaningful introduction of Signal Red.

`SIGNAL INTERFERENCE DETECTED`

Controlled distortion.

Main:
**THEY NEVER LEFT.**

Faction:
**DOMINION**

Metadata:
```text
ORIGIN // UNKNOWN
COMMAND // UNKNOWN
STRENGTH // UNKNOWN
OBJECTIVE // ███████████
```

Architect dossier:
```text
ARCHITECT

IDENTITY      UNKNOWN
NATIONALITY   UNKNOWN
LOCATION      UNKNOWN
STATUS        ACTIVE
```

Associated line:
“Order follows silence.”

Do not reveal Architect clearly.

---

# 04 — DIRECTIVE FIVE

## Asset
Use Directive V insignia where appropriate.

## Tone
Return to control:
- white/bone typography
- disciplined grid
- cleaner interface

System:
`CLASSIFIED PROGRAM`
`AUTHORIZATION // LEVEL V`

Main:
**WHEN COMMAND FAILS, FIVE REMAIN.**

## Brand animation
Five vertical lines:
`I II III IV V`

Collapse/resolve into the V identity.

This should be elegant, not a flashy logo animation.

---

# 05 — MEET RAVEN

## Purpose
Largest character-focused part of the site.

Opening:
**FIVE OPERATORS.**
**ONE DIRECTIVE.**

System:
`RAVEN // TF-5`

Use supplied master operator images and cinematic portrait assets if/when available.

A scroll/pinned presentation is appropriate on desktop, with a simpler stacked/swipe presentation on mobile.

---

## 05.1 — WARDEN

```text
01 / COMMAND

ELIAS KANE
WARDEN

TACTICAL COMMANDER
BRITISH–NIGERIAN
```

Highlight:
`TACTICAL IQ // 96`

Ability:
**COMMAND LINK**

Potential quote:
“Nobody gets left behind.”

Use visual treatment that communicates command and stability.

---

## 05.2 — GHOST

```text
02 / RECON

AMARA OKAFOR
GHOST

MARKSMAN
NIGERIAN
```

Highlight:
`ACCURACY // 98`

Ability:
**DEAD SILENCE**

Optional micro-effect:
recon optic activation / subtle targeting information.

---

## 05.3 — ATLAS

```text
03 / HEAVY

VIKTOR VOLKOV
ATLAS
```

Highlight:
`STRENGTH // 99`

Ability:
**HOLD THE LINE**

Visual detail:
surface the scratched `5/5` motif if visible/appropriate.

Transitions may feel heavier/slower, but avoid gimmicks.

---

## 05.4 — CIPHER

```text
04 / INTELLIGENCE

KENJI SATO
CIPHER
```

Highlight:
`TACTICAL IQ // 99`

Ability:
**BLACKOUT**

Narrative micro-interaction:
Cipher can briefly disrupt parts of the site interface before restoring them.

Keep it short and intentional.

---

## 05.5 — PULSE

```text
05 / SUPPORT

SOFIA ALVAREZ
PULSE
```

Highlight:
`STAMINA // 96`

Ability:
**SECOND WIND**

Potential subtle heartbeat/waveform visual.

End by bringing all five identities back together:
**RAVEN.**

---

# 06 — PROJECT ECLIPSE

## Purpose
Reveal current stakes.

System:
`NEW DIRECTIVE RECEIVED`
`PRIORITY // OMEGA`

Main:
**PROJECT ECLIPSE**

Countdown concept:
`71 : 43 : 08`
`UNTIL ACTIVATION`

This can be a fictional looping/controlled countdown; do not imply a real product launch date.

Copy:
“Dominion has resurfaced.”

Then:
- Find Eclipse.
- Stop the activation.
- Come home.

## Visual
If a dedicated Eclipse production asset is available, use it.
Eclipse should remain grounded: infrastructure/network-scale threat, not fantasy orbital superweapon.

---

# 07 — OPERATIONS

## Purpose
Sell the imagined campaign through environments rather than feature cards.

Desktop can use horizontal/pinned cinematic progression if performance remains good.
Mobile should use natural vertical flow.

### 01 — NIGHTFALL
Rainy metropolitan infiltration.

Possible metadata:
`02:40 LOCAL`

Use Nightfall asset.

### 02 — WHITEOUT
Arctic communications station.

Metadata:
`-31°C`

Use Whiteout asset.

### 03 — DEAD SIGNAL
Underground Dominion facility.

Metadata:
`LOCATION // REDACTED`

Use Dead Signal asset.

### 04 — SANDSTORM
Desert satellite/communications installation.

Use Sandstorm asset.

### 05 — ECLIPSE
No conventional environment reveal.

`LOCATION // CLASSIFIED`

The absence of imagery should create mystery.

---

# 08 — 5V5 MULTIPLAYER

## Purpose
Reveal that the fictional product is not solely a campaign.

Main:
**FIVE**
**AGAINST**
**FIVE.**

Supporting:
“Information wins battles before bullets do.”

Potential fictional modes:

### BREACH
Attack / defend objectives.

### EXTRACT
Secure intelligence and reach extraction.

### CONTROL
Capture strategic positions.

Do not turn this into a dense feature comparison grid.

---

# 09 — OPERATOR 06

## Purpose
Narrative payoff.

Begin clean and controlled:

```text
MISSION BRIEFING COMPLETE

RAVEN PERSONNEL

01 WARDEN      ACTIVE
02 GHOST       ACTIVE
03 ATLAS       ACTIVE
04 CIPHER      ACTIVE
05 PULSE       ACTIVE
```

Then a system cursor / unexpected entry:

`06`

Glitch.

`UNAUTHORIZED ACCESS`

Main:
**OPERATOR**
**06**

```text
IDENTITY       ███████████
AFFILIATION    ███████████
STATUS         ACTIVE
```

Then:
**RAVEN WAS NEVER FIVE.**

Connection terminates.

This is the strongest glitch/corruption moment on the page because previous glitch usage has been restrained.

Use a dedicated Operator 06 teaser asset if available.

---

# 10 — FINAL SCREEN

Silence / near-black.

Logo:
**DIRECTIVE V**

First line:
`FIVE GO IN.`

Then expected:
`FIVE COME OUT.`

That line may corrupt/strike out.

Final hook:
**WHO IS SIX?**

CTA:
`ACCESS DIRECTIVE`

Secondary:
`WATCH TRANSMISSION`

Optional:
`COMING // █████`

Do not invent a real release date.

---

# Narrative sequence

ACCESS  
↓  
HERO  
↓  
THE BLACKOUT  
↓  
DOMINION  
↓  
DIRECTIVE FIVE  
↓  
MEET RAVEN  
↓  
PROJECT ECLIPSE  
↓  
OPERATIONS  
↓  
5V5  
↓  
OPERATOR 06  
↓  
CONNECTION TERMINATED / FINAL

---

# Implementation principle
A visitor skimming quickly should still understand the hierarchy.

A visitor who slows down should discover deeper:
- metadata
- transmissions
- operator stats
- visual clues
- system corruption
- story connections

Cinematic storytelling must never make basic navigation unusable.
