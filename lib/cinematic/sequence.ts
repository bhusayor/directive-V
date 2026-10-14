"use client";
import { useEffect, useRef, useState, type RefObject } from "react";
import { useCinema } from "@/components/cinematic/provider";
import { loadGsap } from "./gsap";

type Config<T> = {
  staticValue: T; ready: T; start: T; complete: T;
  beats: ReadonlyArray<readonly [number, T]>; duration: number;
  threshold?: number; rootMargin?: string; target?: string;
};
/** Finite semantic beats. Skipping, hidden tabs and fast scrolling resolve the story. */
export function useSequence<T>(root: RefObject<Element | null>, config: Config<T>) {
  const runtime = useCinema();
  const [value, setValue] = useState(config.staticValue);
  const finish = useRef<() => void>(() => {});
  useEffect(() => {
    const node = config.target ? root.current?.querySelector(config.target) : root.current;
    if (!node) return;
    let started = false, done = false, disposed = false, generation = 0;
    let context: gsap.Context | undefined;
    let unsubscribeView: (() => void) | undefined;
    let preference: boolean | undefined;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const clear = () => {
      generation++; timers.splice(0).forEach(clearTimeout);
      if (context) { context.revert(); context = undefined; runtime.metrics.timelines--; }
    };
    const complete = () => { clear(); done = true; setValue(config.complete); };
    finish.current = complete;
    const start = () => {
      if (started || done || !runtime.getSnapshot().pageVisible) return;
      started = true; setValue(config.start);
      const request = ++generation;
      loadGsap().then(({ gsap }) => {
        if (disposed || request !== generation) return;
        context = gsap.context(() => {
          const timeline = gsap.timeline();
          config.beats.forEach(([at, state]) => timeline.call(() => setValue(state), [], at / 1000));
          timeline.call(complete, [], config.duration / 1000);
        }, node);
        runtime.metrics.timelines++;
      }).catch(() => {
        if (disposed || request !== generation) return;
        config.beats.forEach(([at, state]) => timers.push(setTimeout(() => setValue(state), at)));
        timers.push(setTimeout(complete, config.duration));
      });
    };
    const configure = () => {
      const snapshot = runtime.getSnapshot();
      if (!snapshot.capabilities.ready) return;
      if (!snapshot.pageVisible && started && !done) complete();
      const reduce = snapshot.capabilities.reducedMotion;
      if (preference === reduce) return;
      preference = reduce; clear(); unsubscribeView?.();
      if (reduce) { if (started) done = true; setValue(config.staticValue); return; }
      if (done) { setValue(config.complete); return; }
      setValue(config.ready);
      unsubscribeView = runtime.observe(node, (entry) => {
        if (entry.isIntersecting) start();
        else if (!done && (started || entry.boundingClientRect.bottom < 0)) complete();
      }, { threshold: config.threshold ?? 0, rootMargin: config.rootMargin ?? "0px" });
    };
    configure();
    const unsubscribe = runtime.subscribe(configure);
    return () => { disposed = true; clear(); unsubscribeView?.(); unsubscribe(); };
  }, [root, runtime, config]);
  return [value, () => finish.current()] as const;
}
