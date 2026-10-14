import { MetadataRail } from "@/components/system/metadata-rail";
import { CinematicImage } from "./cinematic-image";
import { HostileEntrance } from "./hostile-entrance";

export function DominionSequence() {
  return (
    <HostileEntrance>
      <div className="interference-bar">
        <div className="container system-label"><span className="interference-symbol" aria-hidden="true">×</span> SIGNAL INTERFERENCE DETECTED <span className="interference-code" aria-hidden="true">{"// 02:17"}</span></div>
      </div>
      <div className="dominion-reveal">
        <CinematicImage file="03-dominion.png" alt="Masked Dominion soldiers assemble beneath crimson insignia in an industrial compound." className="dominion-image" />
        <div className="dominion-shade" aria-hidden="true" />
        <div className="dominion-copy container">
          <p className="system-label chapter-label"><span>02 / CONFLICT</span><span>HOSTILE ORGANIZATION</span></p>
          <div className="dominion-heading"><p>THEY NEVER LEFT.</p><h2 id="dominion-title">DOMINION</h2></div>
          <MetadataRail items={[["ORIGIN", "UNKNOWN"], ["COMMAND", "UNKNOWN"], ["STRENGTH", "UNKNOWN"], ["OBJECTIVE", "███████████"]]} />
        </div>
      </div>
      <article id="architect" className="architect container" aria-labelledby="architect-title">
        <div className="dossier-heading system-label"><span>DOMINION // COMMAND DOSSIER</span><span>ACCESS RESTRICTED</span></div>
        <div className="architect-layout">
          <div className="architect-visual">
            <CinematicImage file="04-architect.png" alt="The Architect sits in shadow, face concealed, flanked by Dominion guards." className="architect-image" sizes="(max-width: 720px) 100vw, 60vw" />
            <span className="architect-image-label system-label">VISUAL IDENTIFICATION // UNCONFIRMED</span>
          </div>
          <div className="architect-copy" data-reveal>
            <p className="system-label">SUBJECT // UNKNOWN</p>
            <h3 id="architect-title">ARCHITECT</h3>
            <MetadataRail items={[["IDENTITY", "UNKNOWN"], ["NATIONALITY", "UNKNOWN"], ["LOCATION", "UNKNOWN"], ["STATUS", "ACTIVE"]]} />
            <blockquote>“Order follows silence.”</blockquote>
          </div>
        </div>
      </article>
    </HostileEntrance>
  );
}
