/** Canonical personnel data transcribed from docs/OPERATORS.md. */
export const statLabels = ["TACTICAL IQ", "ACCURACY", "STRENGTH", "STAMINA", "MOBILITY", "STEALTH"] as const;
export type OperatorMediaSource = {
  poster: string;
  video?: string;
  posterPosition?: string;
  videoPosition?: string;
};
export type Operator = OperatorMediaSource & {
  id: string; number: string; division: string; name: string; callsign: string;
  role: string; nationality: string; alt: string; primary: string; score: number;
  stats: readonly number[]; ability: string; capability: string; quote?: string;
};
export const operators: readonly Operator[] = [
  {
    id: "warden", number: "01", division: "COMMAND", name: "ELIAS KANE", callsign: "WARDEN",
    role: "TACTICAL COMMANDER", nationality: "BRITISH–NIGERIAN", poster: "/assets/characters/01-warden.png",
    video: "/assets/operators/Videos/01-warden.mp4", posterPosition: "center top", videoPosition: "center 12%",
    alt: "Elias Kane, Warden, in command armor with his crimson stripe and assault rifle.",
    primary: "TACTICAL IQ", score: 96, stats: [96, 89, 82, 84, 73, 64],
    ability: "COMMAND LINK", capability: "Shares enemy markings and tactical intelligence across Raven, coordinating the squad as one.",
    quote: "Nobody gets left behind.",
  },
  {
    id: "ghost", number: "02", division: "RECON", name: "AMARA OKAFOR", callsign: "GHOST",
    role: "MARKSMAN", nationality: "NIGERIAN", poster: "/assets/characters/02-ghost.png",
    video: "/assets/operators/Videos/02-ghost.mp4", posterPosition: "48% top", videoPosition: "48% 12%",
    alt: "Amara Okafor, Ghost, with pulled-back micro-braids, lightweight armor and her precision rifle.",
    primary: "ACCURACY", score: 98, stats: [91, 98, 61, 76, 86, 94],
    ability: "DEAD SILENCE", capability: "Reduces movement detection while sharpening awareness within her reconnaissance radius.",
  },
  {
    id: "atlas", number: "03", division: "HEAVY", name: "VIKTOR VOLKOV", callsign: "ATLAS",
    role: "HEAVY WEAPONS / DEFENSE", nationality: "UKRAINIAN", poster: "/assets/characters/03-atlas.png",
    video: "/assets/operators/Videos/03-atlas.mp4", posterPosition: "52% top", videoPosition: "52% top",
    alt: "Viktor Volkov, Atlas, in heavy reinforced armor carrying a belt-fed machine gun.",
    primary: "STRENGTH", score: 99, stats: [74, 72, 99, 93, 52, 31],
    ability: "HOLD THE LINE", capability: "Deploys reinforced protection, greatly increasing survivability under incoming fire for a limited period.",
  },
  {
    id: "cipher", number: "04", division: "INTELLIGENCE", name: "KENJI SATO", callsign: "CIPHER",
    role: "INTELLIGENCE / ELECTRONIC WARFARE", nationality: "JAPANESE", poster: "/assets/characters/04-cipher.png",
    video: "/assets/operators/Videos/04-cipher.mp4", posterPosition: "center top", videoPosition: "center top",
    alt: "Kenji Sato, Cipher, with a recon eyepiece, forearm interface and compact suppressed weapon.",
    primary: "TACTICAL IQ", score: 99, stats: [99, 77, 43, 72, 91, 85],
    ability: "BLACKOUT", capability: "Temporarily disrupts enemy electronics and connected battlefield systems within a limited area.",
    quote: "Now we're even.",
  },
  {
    id: "pulse", number: "05", division: "SUPPORT", name: "SOFIA ALVAREZ", callsign: "PULSE",
    role: "COMBAT MEDIC / SUPPORT", nationality: "COLOMBIAN", poster: "/assets/characters/05-pulse.png",
    video: "/assets/operators/Videos/05-pulse.mp4", posterPosition: "center top", videoPosition: "center 8%",
    alt: "Sofia Alvarez, Pulse, in mobile combat armor with integrated trauma equipment and a carbine.",
    primary: "STAMINA", score: 96, stats: [88, 81, 69, 96, 90, 66],
    ability: "SECOND WIND", capability: "Rapidly stabilizes critically injured teammates and temporarily improves their stamina after recovery.",
  },
] as const;
