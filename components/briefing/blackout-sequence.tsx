"use client";

import { useEffect, useRef } from "react";
import { useSequence } from "@/lib/cinematic/sequence";
import { useCinema } from "@/components/cinematic/provider";
import { BlackoutDistortion } from "@/components/cinematic/blackout-distortion";
import { CinematicImage } from "./cinematic-image";

const times = ["02:16:57", "02:16:58", "02:16:59", "02:17:00"];
const failures = ["SIGNAL LOST", "SAT-09 OFFLINE", "GRID FAILURE", "UNAUTHORIZED COMMAND", "DEFENSE NETWORK COMPROMISED"];
type Phase = "static" | "ready" | "running" | "dark" | "failures" | "complete";
type Incident = { phase: Phase; tick: number; failures: number };
const incidentSequence = {
  staticValue: { phase: "static", tick: 3, failures: 5 } as Incident,
  ready: { phase: "ready", tick: 0, failures: 0 } as Incident,
  start: { phase: "running", tick: 0, failures: 0 } as Incident,
  complete: { phase: "complete", tick: 3, failures: 5 } as Incident,
  beats: [
    [1000, { phase: "running", tick: 1, failures: 0 }],
    [2000, { phase: "running", tick: 2, failures: 0 }],
    [3000, { phase: "dark", tick: 3, failures: 0 }],
    ...failures.map((_, index) => [3800 + index * 480, { phase: "failures", tick: 3, failures: index + 1 }] as const),
  ] as ReadonlyArray<readonly [number, Incident]>,
  duration: 6370, threshold: 0.35,
};

export function BlackoutSequence() {
  const trigger = useRef<HTMLDivElement>(null);
  const report = useRef<HTMLUListElement>(null);
  const [incident, finish] = useSequence<Incident>(trigger, incidentSequence);
  const { phase, tick } = incident;
  const runtime = useCinema();
  useEffect(() => {
    runtime.signal("blackout", phase === "dark" || phase === "failures" || phase === "complete" ? "SYSTEM_COMPROMISED" : phase === "running" ? "SYSTEM_WARNING" : "SYSTEM_STABLE");
    if ((phase === "complete" || phase === "static") && trigger.current?.contains(document.activeElement)) report.current?.focus({ preventScroll: true });
  }, [runtime, phase]);
  return (
    <section id="blackout" className="blackout" aria-labelledby="blackout-title" data-chapter data-phase={phase}>
      <div className="blackout-environment">
        <CinematicImage file="02-blackout.png" alt="Communications towers overlook a burning London skyline during the Blackout." className="blackout-image" />
        <BlackoutDistortion phase={phase} />
      </div>
      <div className="blackout-event">
        <div className="blackout-shade" aria-hidden="true" />
        <div className="blackout-event-copy container">
          <p className="chapter-label system-label"><span>01 / INTEL</span><span>INCIDENT RECORD</span></p>
          <div ref={trigger} className="blackout-clock-block">
            <h2 id="blackout-title" className="blackout-date">17 NOV 2049</h2>
            <div className="live-clock" aria-hidden="true">{times[tick]}<span>UTC</span></div>
            <ol className="clock-record" aria-label="Recorded time sequence in UTC">
              {times.map((time) => <li key={time}>{time} <span>UTC</span></li>)}
            </ol>
            {phase !== "static" && phase !== "complete" && <button className="text-link sequence-skip" type="button" onClick={finish}>SKIP TO INCIDENT REPORT <span aria-hidden="true">↓</span></button>}
          </div>
          <ul ref={report} className="failure-log" aria-label="Network failures" tabIndex={-1}>
            {failures.map((failure, index) => <li key={failure} data-visible={index < incident.failures}><span aria-hidden="true">[ × ]</span> {failure}</li>)}
          </ul>
        </div>
        <div className="blackout-veil" aria-hidden="true" />
      </div>
      <div id="blackout-aftermath" className="blackout-aftermath container">
        <div className="incident-index system-label"><span>02:17 UTC</span><span>CONTROL LOST</span></div>
        <div className="blackout-duration">
          <p>11 MINUTES.<br /><span>42 SECONDS.</span></p>
          <p className="aftermath-copy">Long enough to change the balance of power forever.</p>
        </div>
        <p className="blackout-name">THE BLACKOUT</p>
      </div>
    </section>
  );
}
