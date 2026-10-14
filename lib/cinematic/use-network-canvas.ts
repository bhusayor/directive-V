"use client";
import { useEffect, useRef, useState, type RefObject } from "react";
import { useCinema, useCinemaSnapshot } from "@/components/cinematic/provider";
import { useVisibility } from "./hooks";
import type { NetworkScene } from "./network-scene";

/** Demand-driven scene ownership on the shared RAF; never an independent loop. */
export function useNetworkCanvas(canvas: RefObject<HTMLCanvasElement | null>, progress: RefObject<number>) {
  const runtime = useCinema();
  const { capabilities, pageVisible } = useCinemaSnapshot();
  const { near, visible } = useVisibility(canvas, "400px 0px", 0.05);
  const inView = useRef(visible);
  useEffect(() => { inView.current = visible; runtime.invalidate(); }, [runtime, visible]);
  const [status, setStatus] = useState("fallback");
  const failed = useRef(false);
  const releaseContext = useRef<(() => void) | undefined>(undefined);
  useEffect(() => {
    const node = canvas.current;
    if (!node || !near || !pageVisible || capabilities.tier !== "FULL" || failed.current) { setStatus("fallback"); return; }
    let disposed = false, scene: NetworkScene | undefined, removeFrame: (() => void) | undefined;
    let resizeTimer: ReturnType<typeof setTimeout>;
    let dirty = true, lastProgress = -1, x = 0, y = 0;
    const destroy = () => {
      removeFrame?.(); removeFrame = undefined;
      if (scene) { scene.dispose(); scene = undefined; runtime.metrics.webglScenes--; }
      runtime.metrics.webglLoopActive = false;
    };
    const fail = (event?: Event) => { event?.preventDefault(); failed.current = true; destroy(); if (!disposed) setStatus("failed"); };
    node.addEventListener("webglcontextlost", fail);
    const resize = new ResizeObserver(() => {
      clearTimeout(resizeTimer); resizeTimer = setTimeout(() => {
        if (!disposed && scene) { scene.resize(); dirty = true; runtime.invalidate(); }
      }, 180);
    }); resize.observe(node);
    import("./network-scene").then(({ createNetworkScene }) => {
      if (disposed) return;
      scene = createNetworkScene(node, capabilities.dprCap); runtime.metrics.webglScenes++;
      releaseContext.current = scene.releaseContext;
      removeFrame = runtime.onFrame((dt) => {
        if (!scene || !inView.current) { runtime.metrics.webglLoopActive = false; return false; }
        const targetX = runtime.pointer.speed > 2 ? runtime.pointer.normalizedX : 0;
        const targetY = runtime.pointer.speed > 2 ? runtime.pointer.normalizedY : 0;
        const smoothing = 1 - Math.exp(-dt * 3);
        x += (targetX - x) * smoothing; y += (targetY - y) * smoothing;
        const moving = Math.abs(targetX - x) + Math.abs(targetY - y) > .002;
        const changed = dirty || Math.abs(progress.current - lastProgress) > .00005 || moving;
        if (!changed) { runtime.metrics.webglLoopActive = false; return false; }
        try {
          if (scene.render({ progress: progress.current, x, y })) {
            // Only expose the canvas AFTER geometry has actually been drawn.
            setStatus((current) => current === "ready" ? current : "ready");
            runtime.metrics.webglFrames++; node.dataset.frames = String(Number(node.dataset.frames ?? 0) + 1);
            dirty = false; lastProgress = progress.current;
          }
        } catch { fail(); return false; }
        runtime.metrics.webglLoopActive = moving;
        return moving;
      });
      runtime.invalidate();
    }).catch(() => { if (!disposed) fail(); });
    return () => {
      disposed = true; clearTimeout(resizeTimer); resize.disconnect(); node.removeEventListener("webglcontextlost", fail); destroy();
    };
  }, [canvas, progress, runtime, near, pageVisible, capabilities.tier, capabilities.dprCap]);
  useEffect(() => {
    const node = canvas.current;
    // StrictMode's simulated teardown keeps the DOM; only a real unmount loses it.
    return () => { if (!node?.isConnected) releaseContext.current?.(); };
  }, [canvas]);
  return status;
}
