"use client";
import { useEffect, useState, type RefObject } from "react";
import { useCinema } from "@/components/cinematic/provider";
import { relevance } from "./media";

/** Observers are pooled by options and disconnected after the last subscriber. */
export function useVisibility(ref: RefObject<Element | null>, margin = "350px 0px", threshold = 0.1) {
  const runtime = useCinema();
  const [state, setState] = useState({ near: false, visible: false });
  useEffect(() => {
    if (!ref.current) return;
    const near = runtime.observe(ref.current, (entry) => setState((previous) => previous.near === entry.isIntersecting ? previous : { ...previous, near: entry.isIntersecting }), { rootMargin: margin });
    const visible = runtime.observe(ref.current, (entry) => {
      const value = entry.isIntersecting && entry.intersectionRatio >= threshold;
      setState((previous) => previous.visible === value ? previous : { ...previous, visible: value });
    }, { threshold });
    return () => { near(); visible(); };
  }, [ref, runtime, margin, threshold]);
  return state;
}

/** Browser-native responsive/lazy images share readiness and relevance records. */
export function useImageMedia(ref: RefObject<Element | null>, src: string, critical = false) {
  const runtime = useCinema();
  const { near, visible } = useVisibility(ref);
  const priority = critical || visible ? relevance.VISIBLE : near ? relevance.NEAR : relevance.DISTANT;
  useEffect(() => {
    const image = ref.current?.querySelector("img");
    const failed = runtime.media.records.get(src)?.state === "ERROR";
    runtime.media.report(src, image?.complete && image.naturalWidth ? "READY" : failed ? "ERROR" : near || critical ? "LOADING" : "IDLE", priority);
  }, [runtime, ref, src, priority, near, critical]);
  return {
    onLoad: () => runtime.media.report(src, "READY", priority),
    onError: () => runtime.media.report(src, "ERROR", priority),
  };
}
