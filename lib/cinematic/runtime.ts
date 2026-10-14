import { classify, initialCapabilities, probeWebGL, type Capabilities } from "./capabilities";
import { MediaManager } from "./media";

export type SystemState = "SYSTEM_STABLE" | "SYSTEM_WARNING" | "SYSTEM_COMPROMISED" | "SYSTEM_RESTORING";
export type Snapshot = {
  capabilities: Capabilities; pageVisible: boolean; suspension: number;
  section: string; system: SystemState; activeVideo: string | null;
};
type Frame = (dt: number, now: number) => boolean | void;
type ObserverPool = { observer: IntersectionObserver; targets: Map<Element, Set<(entry: IntersectionObserverEntry) => void>> };
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** Per-provider service, not a cross-request singleton. React only sees discrete changes. */
export class CinematicRuntime {
  readonly media = new MediaManager();
  readonly scroll = { direction: 0, velocity: 0, normalizedVelocity: 0, isFastScrolling: false, isIdle: true, y: 0 };
  readonly pointer = { x: 0, y: 0, normalizedX: 0, normalizedY: 0, velocityX: 0, velocityY: 0, speed: 0 };
  readonly metrics = { rafActive: false, webglScenes: 0, webglFrames: 0, webglLoopActive: false, timelines: 0, observers: 0 };
  private snapshot: Snapshot = { capabilities: initialCapabilities, pageVisible: true, suspension: 0, section: "hero", system: "SYSTEM_STABLE", activeVideo: null };
  private listeners = new Set<() => void>();
  private frames = new Set<Frame>();
  private pools = new Map<string, ObserverPool>();
  private videos = new Map<string, () => void>();
  private narrative = new Map<string, SystemState>();
  private raf = 0;
  private previous = 0;
  private lastScroll = 0;
  private lastPointer = 0;
  private running = false;
  getSnapshot = () => this.snapshot;
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  private update(next: Partial<Snapshot>) {
    this.snapshot = { ...this.snapshot, ...next }; this.listeners.forEach((listener) => listener());
  }
  setSection(section: string) {
    if (section !== this.snapshot.section) this.update({ section, system: this.narrative.get(section) ?? (section === "dominion" ? "SYSTEM_COMPROMISED" : "SYSTEM_STABLE") });
  }
  signal(section: string, system: SystemState) {
    this.narrative.set(section, system);
    if (section === this.snapshot.section && system !== this.snapshot.system) this.update({ system });
  }
  registerVideo(id: string, stop: () => void) {
    this.videos.set(id, stop);
    return () => { stop(); this.videos.delete(id); this.releaseVideo(id); };
  }
  claimVideo(id: string) {
    this.videos.forEach((stop, key) => { if (key !== id) stop(); });
    if (this.snapshot.activeVideo !== id) this.update({ activeVideo: id });
  }
  releaseVideo(id: string) { if (this.snapshot.activeVideo === id) this.update({ activeVideo: null }); }
  observe(node: Element, callback: (entry: IntersectionObserverEntry) => void, options: IntersectionObserverInit = {}) {
    const key = JSON.stringify(options);
    let pool = this.pools.get(key);
    if (!pool) {
      const targets = new Map<Element, Set<(entry: IntersectionObserverEntry) => void>>();
      pool = { targets, observer: new IntersectionObserver((entries) => {
        entries.forEach((entry) => targets.get(entry.target)?.forEach((fn) => fn(entry)));
      }, options) };
      this.pools.set(key, pool); this.metrics.observers = this.pools.size;
    }
    const callbacks = pool.targets.get(node) ?? new Set();
    callbacks.add(callback); pool.targets.set(node, callbacks); pool.observer.observe(node);
    return () => {
      callbacks.delete(callback);
      if (!callbacks.size) { pool!.observer.unobserve(node); pool!.targets.delete(node); }
      if (!pool!.targets.size) { pool!.observer.disconnect(); this.pools.delete(key); }
      this.metrics.observers = this.pools.size;
    };
  }
  onFrame(callback: Frame) {
    this.frames.add(callback);
    return () => { this.frames.delete(callback); };
  }
  invalidate = () => {
    if (!this.raf && this.running && this.snapshot.pageVisible) {
      this.metrics.rafActive = true; this.raf = requestAnimationFrame(this.tick);
    }
  };
  private tick = (now: number) => {
    this.raf = 0;
    const dt = Math.min((now - this.previous) / 1000 || 0.016, 0.05); this.previous = now;
    if (now - this.lastScroll > 80) this.scroll.velocity *= Math.exp(-dt * 14);
    if (now - this.lastPointer > 60) {
      this.pointer.velocityX *= Math.exp(-dt * 16); this.pointer.velocityY *= Math.exp(-dt * 16);
    }
    this.scroll.normalizedVelocity = clamp(this.scroll.velocity / 2400, -1, 1);
    this.scroll.isFastScrolling = Math.abs(this.scroll.normalizedVelocity) > 0.6;
    this.scroll.isIdle = Math.abs(this.scroll.velocity) < 2;
    this.pointer.speed = Math.hypot(this.pointer.velocityX, this.pointer.velocityY);
    if (this.scroll.isIdle) { this.scroll.velocity = 0; this.scroll.normalizedVelocity = 0; this.scroll.direction = 0; }
    if (this.pointer.speed < 2) { this.pointer.velocityX = 0; this.pointer.velocityY = 0; this.pointer.speed = 0; }
    let needsFrame = !this.scroll.isIdle || this.pointer.speed > 0;
    this.frames.forEach((callback) => { if (callback(dt, now)) needsFrame = true; });
    this.metrics.rafActive = false;
    if (needsFrame) this.invalidate();
  };
  start() {
    this.running = true;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const fine = matchMedia("(hover: hover) and (pointer: fine)");
    const nav = navigator as Navigator & { deviceMemory?: number; connection?: EventTarget & { saveData?: boolean } };
    const webgl = probeWebGL();
    let resizeTimer: ReturnType<typeof setTimeout>;
    let dprQuery: MediaQueryList;
    const configure = () => {
      const capabilities = classify({ width: innerWidth, finePointer: fine.matches, reducedMotion: motion.matches, webgl,
        cores: navigator.hardwareConcurrency, memory: nav.deviceMemory, saveData: nav.connection?.saveData, dpr: devicePixelRatio || 1 });
      this.update({ capabilities }); this.invalidate();
      dprQuery?.removeEventListener("change", resize);
      dprQuery = matchMedia(`(resolution: ${devicePixelRatio}dppx)`); dprQuery.addEventListener("change", resize);
    };
    const resize = () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(configure, 180); };
    const visibility = () => {
      const visible = !document.hidden;
      if (!visible) {
        this.videos.forEach((stop) => stop());
        cancelAnimationFrame(this.raf); this.raf = 0; this.metrics.rafActive = false;
        this.scroll.velocity = 0; this.scroll.normalizedVelocity = 0; this.scroll.isIdle = true;
        this.pointer.velocityX = 0; this.pointer.velocityY = 0; this.pointer.speed = 0;
      }
      this.update({ pageVisible: visible, suspension: this.snapshot.suspension + (visible ? 0 : 1) });
      if (visible) this.invalidate();
    };
    const scroll = () => {
      const now = performance.now();
      const dy = scrollY - this.scroll.y;
      this.scroll.velocity = clamp(dy / Math.max((now - this.lastScroll) / 1000, 0.016), -6000, 6000);
      this.scroll.direction = Math.sign(dy); this.scroll.y = scrollY; this.lastScroll = now; this.invalidate();
    };
    const pointer = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || !this.snapshot.capabilities.desktop || this.snapshot.capabilities.reducedMotion) return;
      const now = performance.now(), dt = Math.max((now - this.lastPointer) / 1000, 0.016);
      this.pointer.velocityX = clamp((event.clientX - this.pointer.x) / dt, -5000, 5000);
      this.pointer.velocityY = clamp((event.clientY - this.pointer.y) / dt, -5000, 5000);
      Object.assign(this.pointer, { x: event.clientX, y: event.clientY,
        normalizedX: clamp(event.clientX / innerWidth * 2 - 1, -1, 1), normalizedY: clamp(event.clientY / innerHeight * 2 - 1, -1, 1) });
      this.lastPointer = now; this.invalidate();
    };
    this.scroll.y = scrollY; configure(); visibility();
    window.addEventListener("scroll", scroll, { passive: true }); window.addEventListener("pointermove", pointer, { passive: true });
    window.addEventListener("resize", resize); document.addEventListener("visibilitychange", visibility);
    motion.addEventListener("change", configure); fine.addEventListener("change", configure); nav.connection?.addEventListener("change", configure);
    return () => {
      this.running = false; clearTimeout(resizeTimer); cancelAnimationFrame(this.raf); this.raf = 0;
      this.videos.forEach((stop) => stop()); this.media.dispose();
      this.videos.clear(); this.frames.clear();
      this.pools.forEach((pool) => pool.observer.disconnect()); this.pools.clear();
      this.metrics.observers = 0;
      window.removeEventListener("scroll", scroll); window.removeEventListener("pointermove", pointer); window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", visibility); motion.removeEventListener("change", configure);
      fine.removeEventListener("change", configure); dprQuery?.removeEventListener("change", resize); nav.connection?.removeEventListener("change", configure);
      this.metrics.rafActive = false;
    };
  }
  debug() { return { ...this.snapshot, ...this.metrics, frameSubscribers: this.frames.size, videoOwners: this.videos.size, scroll: { ...this.scroll }, pointer: { ...this.pointer }, media: Object.fromEntries(this.media.records) }; }
}
