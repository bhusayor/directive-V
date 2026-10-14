"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useSequence } from "@/lib/cinematic/sequence";
import { useCinema } from "@/components/cinematic/provider";

type Entrance = "static" | "ready" | "silence" | "trace" | "red" | "signal" | "resolve" | "phrase" | "title" | "complete";
const beats: ReadonlyArray<readonly [number, Entrance]> = [
  [400, "trace"],
  [700, "red"],
  [1000, "signal"],
  [1450, "resolve"],
  [2250, "phrase"],
  [2850, "title"],
  [3650, "complete"],
];
const entranceSequence = { staticValue: "static", ready: "ready", start: "silence", complete: "complete", beats, duration: 3650, rootMargin: "-10% 0px -15% 0px", target: ".interference-bar" } as const;

/** A finite entrance around the existing composition; scrolling is never intercepted. */
export function HostileEntrance({ children }: { children: ReactNode }) {
  const root = useRef<HTMLElement>(null);
  const [entrance] = useSequence<Entrance>(root, entranceSequence);
  const runtime = useCinema();
  useEffect(() => {
    runtime.signal("dominion", ["ready", "silence", "trace"].includes(entrance) ? "SYSTEM_WARNING" : "SYSTEM_COMPROMISED");
  }, [runtime, entrance]);
  return (
    <section ref={root} id="dominion" className="dominion" aria-labelledby="dominion-title" data-chapter data-entrance={entrance}>
      {children}
    </section>
  );
}
