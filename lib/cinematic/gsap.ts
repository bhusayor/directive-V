import type { CinematicRuntime } from "./runtime";
let engine: Promise<{ gsap: typeof import("gsap").gsap; ScrollTrigger: typeof import("gsap/ScrollTrigger").ScrollTrigger }> | undefined;
export function loadGsap() {
  if (!engine) engine = Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(([core, plugin]) => {
    core.gsap.registerPlugin(plugin.ScrollTrigger);
    return { gsap: core.gsap, ScrollTrigger: plugin.ScrollTrigger };
  }).catch((error) => { engine = undefined; throw error; });
  return engine;
}
export type Engine = Awaited<ReturnType<typeof loadGsap>>;

/** Async-safe, StrictMode-safe ownership of timelines and ScrollTriggers. */
export function scopedGsap(runtime: CinematicRuntime, root: Element, build: (engine: Engine) => void | (() => void)) {
  let disposed = false;
  let context: gsap.Context | undefined;
  let cleanup: (() => void) | undefined;
  loadGsap().then((engine) => {
    if (disposed) return;
    context = engine.gsap.context(() => { cleanup = build(engine) || undefined; }, root);
    runtime.metrics.timelines++;
  }).catch(() => { /* All narrative/content has a non-GSAP fallback. */ });
  return () => {
    disposed = true;
    cleanup?.();
    if (context) { context.revert(); runtime.metrics.timelines--; }
  };
}

/** Batch layout/media changes, never refresh on every scroll frame. */
export function watchLayout(root: Element) {
  let disposed = false;
  let timer: ReturnType<typeof setTimeout>;
  const refresh = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (!disposed && engine) engine.then(({ ScrollTrigger }) => { if (!disposed) ScrollTrigger.refresh(true); }).catch(() => {});
    }, 180);
  };
  const observer = new ResizeObserver(refresh); observer.observe(root);
  root.addEventListener("load", refresh, true);
  document.fonts.ready.then(() => { if (!disposed) refresh(); });
  return () => { disposed = true; clearTimeout(timer); observer.disconnect(); root.removeEventListener("load", refresh, true); };
}
