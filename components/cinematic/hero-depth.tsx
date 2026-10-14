"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { useCinema, useCinemaSnapshot } from "./provider";
import { useVisibility } from "@/lib/cinematic/hooks";
import { scopedGsap } from "@/lib/cinematic/gsap";

export function HeroDepth({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const runtime = useCinema();
  const { capabilities, pageVisible } = useCinemaSnapshot();
  const { visible } = useVisibility(root);
  useEffect(() => {
    const node = root.current;
    if (!node || !visible || !pageVisible || capabilities.tier === "STATIC") return;
    const dispose = scopedGsap(runtime, node, ({ gsap }) => {
      gsap.to(node, { "--camera-depth": 1.018, ease: "none", scrollTrigger: {
        trigger: node.parentElement, start: "top top", end: "bottom top", scrub: 0.8,
      } });
    });
    let x = 0, y = 0;
    const stop = runtime.onFrame((dt) => {
      const moving = capabilities.tier === "FULL" && runtime.pointer.speed > 2;
      const targetX = moving ? runtime.pointer.normalizedX * 4 : 0;
      const targetY = (moving ? runtime.pointer.normalizedY * 2 : 0) + runtime.scroll.normalizedVelocity * 2;
      const damping = 1 - Math.exp(-dt * 3);
      x += (targetX - x) * damping; y += (targetY - y) * damping;
      node.style.setProperty("--camera-x", `${x.toFixed(3)}px`);
      node.style.setProperty("--camera-y", `${y.toFixed(3)}px`);
      return Math.abs(targetX - x) + Math.abs(targetY - y) > 0.015;
    });
    runtime.invalidate();
    return () => { stop(); dispose(); node.style.removeProperty("--camera-x"); node.style.removeProperty("--camera-y"); };
  }, [runtime, capabilities.tier, pageVisible, visible]);
  return <div ref={root} className="hero-depth">{children}</div>;
}
