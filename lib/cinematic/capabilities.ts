export type Tier = "FULL" | "REDUCED" | "STATIC";
export type Capabilities = {
  ready: boolean; tier: Tier; reducedMotion: boolean; webgl: boolean;
  desktop: boolean; saveData: boolean; dpr: number; dprCap: number;
};
export type CapabilityInput = {
  width: number; finePointer: boolean; reducedMotion: boolean; webgl: boolean;
  cores?: number; memory?: number; saveData?: boolean; dpr: number;
};
export const initialCapabilities: Capabilities = {
  ready: false, tier: "STATIC", reducedMotion: true, webgl: false,
  desktop: false, saveData: false, dpr: 1, dprCap: 1,
};
export function classify(input: CapabilityInput): Capabilities {
  const desktop = input.width >= 1100 && input.finePointer;
  const constrained = input.saveData || (input.memory !== undefined && input.memory <= 2) || (input.cores !== undefined && input.cores <= 2);
  const tier: Tier = input.reducedMotion || !input.webgl || constrained ? "STATIC"
    : desktop && (input.cores ?? 4) >= 8 && (input.memory ?? 4) >= 4 ? "FULL" : "REDUCED";
  return { ready: true, tier, reducedMotion: input.reducedMotion, webgl: input.webgl,
    desktop, saveData: Boolean(input.saveData), dpr: input.dpr,
    dprCap: Math.min(input.dpr, tier === "FULL" ? 1.5 : 1) };
}
export function probeWebGL() {
  const canvas = document.createElement("canvas");
  try {
    const gl = canvas.getContext("webgl", { failIfMajorPerformanceCaveat: true });
    if (!gl) return false;
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch { return false; }
}
