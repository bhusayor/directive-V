import { CinematicImage } from "./cinematic-image";
import { HeroDepth } from "@/components/cinematic/hero-depth";

export function HeroReveal() {
  return (
    <section id="hero" className="hero" aria-labelledby="hero-title" data-chapter>
      <HeroDepth><CinematicImage file="01-hero-squad.png" alt="Raven's five operators advance through rain and smoke, Warden leading at the center." className="hero-image" priority /></HeroDepth>
      <div className="hero-shade" aria-hidden="true" />
      <div className="hero-top container system-label"><span>DIRECTIVE NETWORK // CLASSIFIED</span><span>TF-5 / RAVEN</span></div>
      <div className="hero-copy container" data-reveal>
        <h1 id="hero-title" tabIndex={-1}>DIRECTIVE <span>V</span></h1>
        <div className="hero-bottom">
          <p className="hero-tagline">FIVE GO IN.<br />FIVE COME OUT.</p>
          <a className="scroll-cue" href="#blackout">SCROLL TO BEGIN BRIEFING <span aria-hidden="true">↓</span></a>
          <p className="system-label hero-status">ECLIPSE // STATUS UNKNOWN</p>
        </div>
      </div>
    </section>
  );
}
