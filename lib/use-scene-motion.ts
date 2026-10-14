"use client";
import { useEffect, type RefObject } from "react";
import { useCinema, useCinemaSnapshot } from "@/components/cinematic/provider";

/** Readable without JS; shared observers only add optional motion. */
export function useSceneMotion(root: RefObject<HTMLElement | null>) {
  const runtime = useCinema();
  const { capabilities } = useCinemaSnapshot();
  useEffect(() => {
    const nodes = Array.from(root.current?.querySelectorAll<HTMLElement>("[data-reveal], [data-camera]") ?? []);
    if (capabilities.reducedMotion) {
      nodes.forEach((node) => node.classList.remove("scene-entered", "scene-visible"));
      return;
    }
    const disposers = nodes.map((node) => runtime.observe(node, (entry) => {
      node.classList.toggle("scene-visible", entry.isIntersecting);
      if (entry.isIntersecting) node.classList.add("scene-entered");
    }, { threshold: 0.12 }));
    return () => disposers.forEach((dispose) => dispose());
  }, [root, runtime, capabilities.reducedMotion]);
}
