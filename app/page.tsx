import { BriefingShell } from "@/components/system/briefing-shell";
import { HeroReveal } from "@/components/briefing/hero-reveal";
import { BlackoutSequence } from "@/components/briefing/blackout-sequence";
import { DominionSequence } from "@/components/briefing/dominion-sequence";
import { DirectiveFive } from "@/components/briefing/directive-five";
import { RavenSequence } from "@/components/briefing/raven-sequence";
import { CinematicProvider } from "@/components/cinematic/provider";
import { EclipseSequence } from "@/components/briefing/eclipse-sequence";

export default function HomePage() {
  return (
    <CinematicProvider><BriefingShell>
      <main id="main-content" tabIndex={-1}>
        <HeroReveal />
        <BlackoutSequence />
        <DominionSequence />
        <DirectiveFive />
        <RavenSequence />
        <EclipseSequence />
      </main>
    </BriefingShell></CinematicProvider>
  );
}
