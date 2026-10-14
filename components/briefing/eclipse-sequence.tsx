"use client";
import { useCallback, useEffect, useRef } from "react";
import { CinematicImage } from "./cinematic-image";
import { EclipseNetwork } from "@/components/cinematic/eclipse-network";
import { useCinema, useCinemaSnapshot } from "@/components/cinematic/provider";
import { useScrollScene } from "@/lib/cinematic/use-scroll-scene";
import { eclipsePhase, networkNodes, compromiseAt } from "@/lib/cinematic/eclipse-network";

const alerts = ["SATELLITE LINK COMPROMISED", "DEFENSE NETWORK EXPOSED", "GRID ACCESS BREACHED"];
export function EclipseSequence() {
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const count = useRef<HTMLSpanElement>(null);
  const runtime = useCinema();
  const { capabilities } = useCinemaSnapshot();
  const enhanced = capabilities.ready && capabilities.tier !== "STATIC";
  const update = useCallback((value: number) => {
    const node = root.current; if (!node) return;
    const phase = eclipsePhase(value);
    node.dataset.phase = phase;
    node.style.setProperty("--eclipse-progress", value.toFixed(4));
    if (track.current) track.current.dataset.progress = value.toFixed(3);
    const compromised = networkNodes.filter((node) => node.arrival <= compromiseAt(value)).length;
    if (count.current) count.current.textContent = String(compromised).padStart(2, "0");
    runtime.signal("eclipse", value > .19 ? "SYSTEM_COMPROMISED" : "SYSTEM_WARNING");
  }, [runtime]);
  const progress = useScrollScene(track, update);
  useEffect(() => {
    if (!enhanced && root.current) { root.current.dataset.phase = "static"; runtime.signal("eclipse", "SYSTEM_WARNING"); }
  }, [enhanced, runtime]);
  return <section ref={root} id="eclipse" className="eclipse" data-chapter data-enhanced={enhanced} aria-labelledby="eclipse-title">
    <div className="eclipse-entry">
      <div className="eclipse-entry-art" aria-hidden="true"><CinematicImage file="10-project-eclipse.png" alt="" className="eclipse-ground-image" /></div>
      <div className="eclipse-entry-shade" aria-hidden="true" />
      <div className="eclipse-entry-copy container">
        <p className="eclipse-transmission system-label"><span className="eclipse-signal" aria-hidden="true" />NEW DIRECTIVE RECEIVED<span>PRIORITY // OMEGA</span></p>
        <h2 id="eclipse-title"><span>PROJECT</span>ECLIPSE</h2>
        <div className="eclipse-entry-bottom"><p>Dominion has resurfaced.</p><a href="#eclipse-network" className="text-link">TRACE THE NETWORK <span aria-hidden="true">↓</span></a></div>
      </div>
    </div>
    <div ref={track} id="eclipse-network" className="eclipse-track">
      <div className="eclipse-stage" aria-hidden="true">
        <div className="eclipse-environment"><CinematicImage file="10-project-eclipse.png" alt="" className="eclipse-ground-image" /></div>
        <EclipseNetwork progress={progress} />
        <div className="eclipse-vignette" />
        <div className="eclipse-stage-index system-label"><span>DISTRIBUTED INFRASTRUCTURE</span><span>SCHEMATIC // NOT GEOGRAPHIC</span></div>
      </div>
      <div className="eclipse-beats">
        <article className="eclipse-beat eclipse-reveal container" aria-labelledby="network-title">
          <div className="eclipse-beat-copy">
            <p className="system-label eclipse-kicker">01 / INFRASTRUCTURE MODEL</p>
            <h3 id="network-title">THE NETWORK<br />IS THE <em>WEAPON.</em></h3>
            <p className="eclipse-body">You do not need to invade a country<br />if you can switch it off.</p>
            <ul className="eclipse-legend" aria-label="Connected infrastructure"><li>COMMUNICATIONS</li><li>SATELLITES</li><li>DEFENSE</li><li>POWER</li></ul>
          </div>
        </article>
        <article className="eclipse-beat eclipse-compromise container" aria-labelledby="compromise-title">
          <div className="eclipse-beat-copy">
            <p className="system-label eclipse-kicker">02 / DOMINION COMMAND PROPAGATION</p>
            <h3 id="compromise-title">CONTROL<br />THE SYSTEM.</h3>
            <ul className="eclipse-alerts">{alerts.map((alert, index) => <li key={alert} data-alert={index}><span aria-hidden="true">0{index + 1} /</span>{alert}</li>)}</ul>
            <p className="eclipse-node-count system-label" aria-hidden="true"><span ref={count}>00</span> / 40 MODEL NODES COMPROMISED</p>
          </div>
        </article>
        <article className="eclipse-beat eclipse-revelation container" aria-labelledby="test-title">
          <div className="eclipse-beat-copy">
            <p className="system-label eclipse-kicker">03 / CIPHER // INTELLIGENCE CONFIRMED</p>
            <h3 id="test-title">THE BLACKOUT<br />WAS ONLY<br /><em>A TEST.</em></h3>
            <p className="eclipse-body">Four years of preparation.<br />A distributed infrastructure compromise.</p>
          </div>
        </article>
        <article id="eclipse-directive" className="eclipse-beat eclipse-directive container" aria-labelledby="activation-title">
          <div className="eclipse-activation">
            <p className="system-label eclipse-kicker">ECLIPSE ACTIVATION // 72 HOURS</p>
            <h3 id="activation-title"><span>72</span> HOURS.</h3>
            <p className="eclipse-fiction system-label">CAMPAIGN INTELLIGENCE // FICTIONAL ACTIVATION WINDOW</p>
          </div>
          <div className="eclipse-orders">
            <p className="system-label">TF-5 / RAVEN // MISSION DIRECTIVE</p>
            <ol><li>FIND DOMINION.</li><li>IDENTIFY ECLIPSE.</li><li>STOP ACTIVATION.</li><li>COME HOME.</li></ol>
          </div>
        </article>
      </div>
    </div>
  </section>;
}
