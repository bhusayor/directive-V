"use client";
import { useEffect, useRef, useState } from "react";
import { useCinema, useCinemaSnapshot } from "./provider";
import { useVisibility } from "@/lib/cinematic/hooks";
import { relevance } from "@/lib/cinematic/media";
import { textureScene } from "@/lib/cinematic/webgl";

export function BlackoutDistortion({ phase }: { phase: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const scene = useRef<ReturnType<typeof textureScene> | null>(null);
  const runtime = useCinema();
  const { capabilities, pageVisible } = useCinemaSnapshot();
  const { near, visible } = useVisibility(canvas);
  const [failed, setFailed] = useState(false);
  const relevant = phase === "ready" || phase === "running" || phase === "dark";
  useEffect(() => {
    const node = canvas.current;
    if (!node || !near || !pageVisible || !relevant || failed || capabilities.tier !== "FULL") return;
    const controller = new AbortController();
    const image = node.parentElement?.querySelector("img");
    let loading = false;
    let timer: ReturnType<typeof setTimeout>;
    const disposeScene = () => {
      if (scene.current) { scene.current.dispose(); scene.current = null; runtime.metrics.webglScenes--; }
      node.style.opacity = "0";
    };
    const fail = (event?: Event) => { event?.preventDefault(); disposeScene(); setFailed(true); };
    const load = () => {
      if (!image?.currentSrc || controller.signal.aborted || scene.current || loading) return;
      loading = true;
      runtime.media.loadImage(image.currentSrc, relevance.NEXT, controller.signal).then((texture) => {
        if (controller.signal.aborted) return;
        scene.current = textureScene(node, texture, capabilities.dprCap); runtime.metrics.webglScenes++;
        node.dataset.webgl = "ready";
      }).catch((error) => { if (error.name !== "AbortError") fail(); });
    };
    node.addEventListener("webglcontextlost", fail); image?.addEventListener("load", load);
    if (image?.complete) load();
    const observer = new ResizeObserver(() => {
      clearTimeout(timer); timer = setTimeout(() => scene.current?.resize(), 180);
    }); observer.observe(node);
    return () => {
      controller.abort(); clearTimeout(timer); observer.disconnect(); image?.removeEventListener("load", load);
      node.removeEventListener("webglcontextlost", fail); disposeScene(); delete node.dataset.webgl;
    };
  }, [runtime, near, pageVisible, relevant, failed, capabilities.tier, capabilities.dprCap]);
  useEffect(() => {
    const node = canvas.current;
    if (!node || phase !== "dark" || !visible || !pageVisible || !scene.current) return;
    const start = performance.now();
    const stop = runtime.onFrame((_, now) => {
      const progress = Math.min(1, (now - start) / 150);
      scene.current?.render(progress); runtime.metrics.webglFrames++;
      node.style.opacity = progress < 1 ? "1" : "0";
      runtime.metrics.webglLoopActive = progress < 1;
      if (progress === 1) stop();
      return progress < 1;
    });
    runtime.invalidate();
    return () => { stop(); node.style.opacity = "0"; runtime.metrics.webglLoopActive = false; };
  }, [runtime, phase, visible, pageVisible]);
  return <canvas ref={canvas} className="blackout-canvas" aria-hidden="true" data-fallback={failed} />;
}
