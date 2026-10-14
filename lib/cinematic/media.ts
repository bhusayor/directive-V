export type MediaState = "IDLE" | "LOADING" | "READY" | "ERROR";
export const relevance = { VISIBLE: 0, NEXT: 1, NEAR: 2, DISTANT: 3 } as const;
type RecordValue = { state: MediaState; priority: number };
type Job = { src: string; priority: number; signal?: AbortSignal; resolve: (image: HTMLImageElement) => void; reject: (error: Error) => void };

/** Native Next/Image and video loading report here; textures use the bounded queue. */
export class MediaManager {
  readonly records = new Map<string, RecordValue>();
  private queue: Job[] = [];
  private loading = 0;
  private cache = new Map<string, HTMLImageElement>();
  private cancel = new Set<() => void>();
  report(src: string, state: MediaState, priority: number = relevance.NEAR) {
    this.records.set(src, { state, priority });
  }
  loadImage(src: string, priority: number, signal?: AbortSignal): Promise<HTMLImageElement> {
    if (signal?.aborted) return Promise.reject(new DOMException("Aborted", "AbortError"));
    const cached = this.cache.get(src);
    if (cached) return Promise.resolve(cached);
    this.report(src, "IDLE", priority);
    return new Promise((resolve, reject) => {
      this.queue.push({ src, priority, signal, resolve, reject });
      this.queue.sort((a, b) => a.priority - b.priority); this.pump();
    });
  }
  private pump() {
    while (this.loading < 2 && this.queue.length) {
      const job = this.queue.shift()!;
      if (job.signal?.aborted) { job.reject(new DOMException("Aborted", "AbortError")); continue; }
      this.loading++; this.report(job.src, "LOADING", job.priority);
      const image = new Image(); image.decoding = "async";
      let settled = false;
      const finish = (error?: Error) => {
        if (settled) return; settled = true;
        this.loading--; image.onload = null; image.onerror = null;
        job.signal?.removeEventListener("abort", abort); this.cancel.delete(abort);
        if (error) {
          this.report(job.src, error.name === "AbortError" ? "IDLE" : "ERROR", job.priority);
          image.src = ""; job.reject(error);
        } else {
          this.report(job.src, "READY", job.priority); this.cache.set(job.src, image);
          while (this.cache.size > 6) this.cache.delete(this.cache.keys().next().value!);
          job.resolve(image);
        }
        this.pump();
      };
      const abort = () => finish(new DOMException("Aborted", "AbortError"));
      this.cancel.add(abort); job.signal?.addEventListener("abort", abort, { once: true });
      image.onload = () => { image.decode().then(() => finish()).catch(() => finish(new Error("Image decode failed"))); };
      image.onerror = () => finish(new Error("Image load failed"));
      image.src = job.src;
    }
  }
  dispose() {
    this.queue.splice(0).forEach((job) => job.reject(new DOMException("Aborted", "AbortError")));
    [...this.cancel].forEach((cancel) => cancel()); this.cache.clear(); this.records.clear();
  }
}
