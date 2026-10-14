"use client";

import { useEffect, useRef, useState } from "react";
import { AccessGate } from "@/components/briefing/access-gate";
import { useSceneMotion } from "@/lib/use-scene-motion";
import { useCinema, useCinemaSnapshot } from "@/components/cinematic/provider";
import { watchLayout } from "@/lib/cinematic/gsap";

export function BriefingShell({ children }: { children: React.ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const runtime = useCinema();
  const { section: active, system, capabilities, pageVisible } = useCinemaSnapshot();
  const hostile = active === "dominion";
  useSceneMotion(root);

  useEffect(() => {
    let scrolled = false;
    const onScroll = () => {
      const next = window.scrollY > 24;
      if (next !== scrolled) { scrolled = next; setIsScrolled(next); }
    };
    onScroll();
    const frame = runtime.onFrame(onScroll);
    const disposers = Array.from(root.current?.querySelectorAll("[data-chapter]") ?? []).map((section) =>
      runtime.observe(section, (entry) => { if (entry.isIntersecting) runtime.setSection(entry.target.id); }, { rootMargin: "-15% 0px -60% 0px" }));
    const layout = root.current ? watchLayout(root.current) : () => {};
    return () => { frame(); layout(); disposers.forEach((dispose) => dispose()); };
  }, [runtime]);

  return (
    <div ref={root} className={`briefing-shell${isScrolled ? " briefing-shell--scrolled" : ""}`} data-hostile={hostile} data-eclipse={active === "eclipse"} data-system={system} data-tier={capabilities.tier} data-page-visible={pageVisible}>
      <a className="skip-link" href="#main-content">Skip to briefing</a>
      <header className="tactical-header">
        <a className="brand-lockup" href="#hero" aria-label="Directive V — return to reveal">DIRECTIVE <span aria-hidden="true">{"//"}</span> <strong>V</strong></a>
        <nav className="tactical-nav" aria-label="Briefing sections">
          <a href="#blackout" aria-current={active === "blackout" ? "location" : undefined}>01 INTEL</a>
          <a href="#dominion" aria-current={active === "dominion" ? "location" : undefined}>02 CONFLICT</a>
          <a href="#raven" aria-current={active === "raven" || active === "directive-five" ? "location" : undefined}>03 OPERATORS</a>
        </nav>
        <span className="header-state"><span aria-hidden="true" className="status-dot" />{active === "eclipse" ? system === "SYSTEM_COMPROMISED" ? "NETWORK EXPOSED" : "PRIORITY OMEGA" : hostile ? "INTERFERENCE" : "SECURE NETWORK"}</span>
      </header>
      <AccessGate />
      {children}
      <footer className="briefing-footer container">
        <span className="system-label">DIRECTIVE NETWORK // CLASSIFIED</span>
        <a className="text-link" href="#hero">RETURN TO BRIEFING <span aria-hidden="true">↑</span></a>
      </footer>
    </div>
  );
}
