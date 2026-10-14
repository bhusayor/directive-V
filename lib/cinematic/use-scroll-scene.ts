"use client";
import { useEffect, useRef, type RefObject } from "react";
import { useCinema, useCinemaSnapshot } from "@/components/cinematic/provider";
import { useVisibility } from "./hooks";
import { scopedGsap } from "./gsap";
import { clamp01 } from "./eclipse-network";

/** Reversible scroll signal: no one-shot timeline and no scroll interception. */
export function useScrollScene(root: RefObject<HTMLElement | null>, onProgress: (progress: number) => void) {
  const runtime = useCinema();
  const { capabilities, pageVisible } = useCinemaSnapshot();
  const { near } = useVisibility(root, "700px 0px", 0);
  const progress = useRef(0);
  const callback = useRef(onProgress);
  useEffect(() => { callback.current = onProgress; }, [onProgress]);
  useEffect(() => {
    const node = root.current;
    if (!node || capabilities.tier === "STATIC" || !near || !pageVisible) return;
    let target = 0, controlled = false;
    const measure = () => { const rect = node.getBoundingClientRect(); return clamp01(-rect.top / Math.max(1, node.offsetHeight - innerHeight)); };
    target = measure(); progress.current = target; callback.current(target);
    const dispose = scopedGsap(runtime, node, ({ ScrollTrigger }) => {
      controlled = true;
      const update = (value: { progress: number }) => { target = value.progress; runtime.invalidate(); };
      ScrollTrigger.create({ trigger: node, start: "top top", end: "bottom bottom", onUpdate: update, onRefresh: update, invalidateOnRefresh: true });
      return () => { controlled = false; };
    });
    const stop = runtime.onFrame((dt) => {
      if (!controlled) target = measure(); // Same readable scene if the optional chunk fails.
      const delta = target - progress.current;
      if (Math.abs(delta) < 0.00015) { progress.current = target; return false; }
      progress.current += delta * (1 - Math.exp(-dt * 9));
      callback.current(progress.current);
      return true;
    });
    runtime.invalidate();
    return () => { stop(); dispose(); };
  }, [root, runtime, near, pageVisible, capabilities.tier]);
  return progress;
}
