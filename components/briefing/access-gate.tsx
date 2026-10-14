"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { useCinema } from "@/components/cinematic/provider";

export function AccessGate() {
  const runtime = useCinema();
  const [entered, setEntered] = useState(false);
  const [entering, setEntering] = useState(false);
  const veil = useRef<HTMLDivElement>(null);
  const animation = useRef<Animation | null>(null);
  const gate = useRef<HTMLElement>(null);
  const busy = useRef(false);
  useEffect(() => {
    const unsubscribe = runtime.subscribe(() => { if (!runtime.getSnapshot().pageVisible) animation.current?.finish(); });
    return () => { unsubscribe(); animation.current?.cancel(); };
  }, [runtime]);

  async function enter(event: MouseEvent<HTMLAnchorElement>) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (busy.current) return;
    busy.current = true; setEntering(true);
    const reduce = runtime.getSnapshot().capabilities.reducedMotion;
    const layer = veil.current;
    try {
      if (!reduce && layer && runtime.getSnapshot().pageVisible) {
        animation.current = layer.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 260, fill: "forwards" });
        await animation.current.finished;
      }
      // Collapse beneath darkness; never lock page scrolling.
      if (gate.current) gate.current.hidden = true;
      setEntered(true);
      document.getElementById("hero")?.scrollIntoView({ behavior: "instant", block: "start" });
      document.getElementById("hero-title")?.focus({ preventScroll: true });
      if (!reduce && layer && runtime.getSnapshot().pageVisible) {
        animation.current?.cancel();
        animation.current = layer.animate(
          [{ opacity: 1, offset: 0 }, { opacity: 1, offset: 0.2 }, { opacity: 0, offset: 1 }],
          { duration: 850, fill: "forwards", easing: "ease-out" },
        );
        await animation.current.finished;
      }
    } catch {
      // Unmounts can cancel the optional effect; the page stays accessible.
    } finally {
      animation.current?.cancel(); setEntering(false); busy.current = false;
    }
  }

  return (
    <>
      <section ref={gate} className="access-gate" aria-labelledby="access-title" hidden={entered}>
        <div className="terminal">
          <div className="terminal-heading">
            <span className="terminal-v" aria-hidden="true">V</span>
            <div><p className="system-label">SECURE TERMINAL // 05</p><h2 id="access-title">DIRECTIVE NETWORK</h2></div>
          </div>
          <div className="terminal-log" aria-label="Connection status">
            <p className="terminal-line"><span aria-hidden="true">01</span> ESTABLISHING CONNECTION...</p>
            <p className="terminal-line"><span aria-hidden="true">02</span> CLEARANCE VERIFIED <span className="terminal-check" aria-hidden="true">✓</span></p>
            <p className="terminal-line terminal-transmission"><span aria-hidden="true">03</span> ENCRYPTED TRANSMISSION DETECTED</p>
          </div>
          <a className="briefing-action" href="#hero" onClick={enter} aria-disabled={entering}>ENTER BRIEFING <span aria-hidden="true">↗</span></a>
          <div className="terminal-audio">
            <button type="button" className="audio-control" disabled aria-describedby="audio-note"><span aria-hidden="true">×</span> AUDIO: OFF</button>
            <span id="audio-note">AUDIO CHANNEL UNAVAILABLE</span>
          </div>
        </div>
        <div className="access-footer container system-label"><span>AUTHORIZATION // LEVEL V</span><span>ENCRYPTED CONNECTION</span></div>
      </section>
      <div ref={veil} className="entry-veil" aria-hidden="true" data-entering={entering} />
    </>
  );
}
