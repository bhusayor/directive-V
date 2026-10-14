"use client";

import { Children, useEffect, useRef, useState, type ReactNode, type KeyboardEvent } from "react";
import { operators } from "@/lib/operators";
import { OperatorMedia } from "./operator-media";
import { useCinema, useCinemaSnapshot } from "@/components/cinematic/provider";
import { useVisibility } from "@/lib/cinematic/hooks";

/** Without JavaScript all five dossiers remain in ordinary document flow. */
export function OperatorArchive({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const lineup = useRef<HTMLDivElement>(null);
  const exitTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const current = useRef<number | null>(null);
  const keyboard = useRef(false);
  const pointer = useRef({ x: -1, y: -1 });
  const regionPointer = useRef({ x: -1, y: -1 });
  const runtime = useCinema();
  const { capabilities, pageVisible, suspension } = useCinemaSnapshot();
  const { ready, desktop, reducedMotion: reduced, saveData } = capabilities;
  const [intent, setIntent] = useState(0);
  const [active, setActive] = useState<number | null>(null);
  const { near, visible } = useVisibility(lineup);
  const dossiers = Children.toArray(children);

  function select(index: number | null) {
    clearTimeout(exitTimer.current);
    setIntent(suspension);
    if (current.current === index) return;
    // Synchronous pause precedes React's next render and any new play request.
    root.current?.querySelectorAll("video").forEach((node) => node.pause());
    current.current = index; setActive(index);
  }
  function leave() {
    pointer.current = { x: -1, y: -1 };
    clearTimeout(exitTimer.current);
    exitTimer.current = setTimeout(() => {
      if (desktop && !(keyboard.current && root.current?.contains(document.activeElement))) select(null);
    }, 200);
  }
  function navigate(event: KeyboardEvent<HTMLElement>, index: number, selector: string) {
    const next = event.key === "ArrowRight" ? (index + 1) % 5 : event.key === "ArrowLeft" ? (index + 4) % 5 : event.key === "Home" ? 0 : event.key === "End" ? 4 : null;
    if (next === null) return;
    event.preventDefault(); keyboard.current = true; select(next);
    root.current?.querySelectorAll<HTMLElement>(selector)[next]?.focus({ preventScroll: true });
  }

  useEffect(() => {
    const configure = () => {
      const snapshot = runtime.getSnapshot();
      if (snapshot.capabilities.ready && !snapshot.capabilities.desktop && current.current === null) { current.current = 0; setActive(0); }
    };
    const hash = () => {
      const index = operators.findIndex((operator) => location.hash === `#operator-${operator.id}`);
      if (index >= 0) { current.current = index; setActive(index); }
    };
    configure(); hash();
    const unsubscribe = runtime.subscribe(configure);
    window.addEventListener("hashchange", hash);
    return () => { unsubscribe(); clearTimeout(exitTimer.current); window.removeEventListener("hashchange", hash); };
  }, [runtime]);

  return <div ref={root} className="operator-archive" data-ready={ready} data-desktop={desktop}
    data-active={active === null ? "none" : operators[active].id}
    onPointerEnter={() => clearTimeout(exitTimer.current)}
    onPointerMoveCapture={(event) => { regionPointer.current = { x: event.clientX, y: event.clientY }; }}
    onPointerLeave={(event) => {
      // A font/layout shift can move the region beneath a stationary pointer.
      // Only a physical exit should dismiss a deliberately selected dossier.
      if (event.relatedTarget && Math.abs(event.clientX - regionPointer.current.x) < 0.5 && Math.abs(event.clientY - regionPointer.current.y) < 0.5) return;
      leave();
    }}
    onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) { keyboard.current = false; leave(); } }}
    onKeyDown={(event) => { if (event.key === "Escape" && desktop) { event.preventDefault(); select(null); } }}>
    <nav className="raven-roster container" aria-label="Raven personnel archive">
      {operators.map((operator, index) => <a key={operator.id} href={`#operator-${operator.id}`}
        aria-current={active === index ? "true" : undefined} aria-controls={`intel-${operator.id}`}
        onClick={(event) => { event.preventDefault(); select(index); }}
        onFocus={(event) => { if (event.currentTarget.matches(":focus-visible")) { keyboard.current = true; select(index); } }}
        onKeyDown={(event) => navigate(event, index, ".raven-roster a")}>
        <span>{operator.number}</span>{operator.callsign}
      </a>)}
    </nav>
    <div ref={lineup} className="raven-lineup" onPointerMove={(event) => {
      if (!desktop || event.pointerType !== "mouse") return;
      if (pointer.current.x === event.clientX && pointer.current.y === event.clientY) return;
      pointer.current = { x: event.clientX, y: event.clientY }; keyboard.current = false;
      const panel = (event.target as HTMLElement).closest<HTMLElement>("[data-operator-index]");
      if (panel) select(Number(panel.dataset.operatorIndex));
    }}>
      {operators.map((operator, index) => <article key={operator.id} id={`operator-${operator.id}`}
        className={`operator-dossier operator-${operator.id}`} data-operator-index={index} data-selected={active === index}
        aria-labelledby={`${operator.id}-title`}>
        <div className="operator-inline-image">
          <OperatorMedia media={operator} alt={operator.alt} prepare={ready && desktop && !reduced && !saveData && near && pageVisible}
            active={active === index && visible && pageVisible && !reduced && desktop && intent === suspension} />
          <button type="button" className="operator-select" aria-label={`${operator.number} ${operator.callsign}`}
            aria-expanded={active === index} aria-controls={`intel-${operator.id}`}
            onFocus={(event) => { if (event.currentTarget.matches(":focus-visible")) { keyboard.current = true; select(index); } }}
            onClick={() => select(index)} onKeyDown={(event) => navigate(event, index, ".operator-select")}>
            <span className="panel-identity"><span>{operator.number}</span><strong>{operator.callsign}</strong></span>
          </button>
        </div>
        <div id={`intel-${operator.id}`} className="operator-intel-slot" inert={ready && active !== index ? true : undefined}>
          {dossiers[index]}
        </div>
      </article>)}
    </div>
  </div>;
}
