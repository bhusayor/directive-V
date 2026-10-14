"use client";

import { useRef } from "react";
import { useSequence } from "@/lib/cinematic/sequence";
const sequence = { staticValue: "static", ready: "ready", start: "access", complete: "restored", beats: [[650, "compromised"]], duration: 1250, threshold: 0.5 } as const;

export function CipherInteraction() {
  const root = useRef<HTMLDivElement>(null);
  const [state] = useSequence<string>(root, sequence);
  return (
    <div ref={root} className="cipher-readout" data-state={state}>
      <p className="system-label">LOCAL CAPABILITY // BLACKOUT</p>
      <ol aria-label="Cipher local network sequence">
        <li data-step="access">SYSTEM ACCESS</li>
        <li data-step="compromised">LOCAL NETWORK COMPROMISED</li>
        <li data-step="restored">NETWORK RESTORED</li>
      </ol>
    </div>
  );
}
