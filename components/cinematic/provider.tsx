"use client";
import { createContext, useContext, useEffect, useRef, useSyncExternalStore, type ReactNode } from "react";
import { CinematicRuntime } from "@/lib/cinematic/runtime";

const Context = createContext<CinematicRuntime | null>(null);
export function CinematicProvider({ children }: { children: ReactNode }) {
  const ref = useRef<CinematicRuntime | null>(null);
  if (!ref.current) ref.current = new CinematicRuntime();
  const runtime = ref.current;
  useEffect(() => {
    const stop = runtime.start();
    if (process.env.NODE_ENV === "development") {
      const debugWindow = window as Window & { directiveCinema?: { inspect: () => unknown } };
      debugWindow.directiveCinema = { inspect: () => runtime.debug() };
      return () => { delete debugWindow.directiveCinema; stop(); };
    }
    return stop;
  }, [runtime]);
  return <Context.Provider value={runtime}>{children}</Context.Provider>;
}
export function useCinema() {
  const runtime = useContext(Context);
  if (!runtime) throw new Error("CinematicProvider is required");
  return runtime;
}
export function useCinemaSnapshot() {
  const runtime = useCinema();
  return useSyncExternalStore(runtime.subscribe, runtime.getSnapshot, runtime.getSnapshot);
}
