"use client";
import Image from "next/image";
import { useEffect, useRef } from "react";
import { useSequence } from "@/lib/cinematic/sequence";
import { useCinema } from "@/components/cinematic/provider";
const restoration = { staticValue: "stable", ready: "ready", start: "restoring", complete: "stable", beats: [], duration: 2900, target: ".program-identity", threshold: 0.12 } as const;

export function DirectiveFive() {
  const root = useRef<HTMLElement>(null);
  const runtime = useCinema();
  const [state] = useSequence<string>(root, restoration);
  useEffect(() => { runtime.signal("directive-five", state === "stable" ? "SYSTEM_STABLE" : "SYSTEM_RESTORING"); }, [runtime, state]);
  return (
    <section ref={root} id="directive-five" className="directive-five" data-restoration={state} data-chapter aria-labelledby="directive-title">
      <div className="restoration-strip container" data-reveal>
        <span>HOSTILE SIGNAL ISOLATED</span><span>DIRECTIVE NETWORK RESTORED</span>
      </div>
      <div className="program-layout container">
        <p className="chapter-label system-label"><span>CLASSIFIED PROGRAM</span><span>AUTHORIZATION // LEVEL V</span></p>
        <div className="program-heading" data-reveal>
          <p className="system-label">DIRECTIVE FIVE</p>
          <h2 id="directive-title">WHEN COMMAND FAILS,<br /><span>FIVE REMAIN.</span></h2>
        </div>
        <div className="program-principle" data-reveal>
          <p>Autonomous five-person tactical units.<br />Built to operate when the system cannot.</p>
          <ul aria-label="Directive Five operating conditions">
            {["COMMUNICATIONS FAIL", "SATELLITES DISAPPEAR", "COMMAND COLLAPSES", "SYSTEMS ARE COMPROMISED"].map((condition, index) => (
              <li key={condition}><span aria-hidden="true">0{index + 1}</span>{condition}</li>
            ))}
          </ul>
        </div>
        <figure className="program-identity" data-reveal>
          <div className="identity-formation" aria-hidden="true">
            <div className="identity-marks">{["I", "II", "III", "IV", "V"].map((mark) => <span key={mark}><i />{mark}</span>)}</div>
            <span className="identity-v">V</span>
          </div>
          <Image src="/assets/cinematic/05-directive-v-insignia.png" alt="Directive V institutional insignia" width={1672} height={941} sizes="(max-width: 720px) 60vw, 280px" className="program-insignia" />
          <figcaption className="system-label">DIRECTIVE FIVE // AUTHORIZED</figcaption>
        </figure>
      </div>
    </section>
  );
}
