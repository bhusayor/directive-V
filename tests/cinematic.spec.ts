import { expect, test, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import ts from "typescript";
import { classify, type CapabilityInput } from "../lib/cinematic/capabilities";

const capable: CapabilityInput = { width: 1440, finePointer: true, webgl: true, reducedMotion: false, cores: 8, memory: 8, dpr: 3 };
async function fullGraphics(page: Page) {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "hardwareConcurrency", { value: 12 });
    Object.defineProperty(navigator, "deviceMemory", { value: 8 });
    // Allow Chrome's real software GL in CI; no fake draw/resource implementation.
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, kind: string, options?: object) {
      return Reflect.apply(getContext, this, [kind, kind === "webgl" ? { ...options, failIfMajorPerformanceCaveat: false } : options]);
    } as typeof getContext;
    const counters = { draws: 0, textures: 0, programs: 0, buffers: 0, shaders: 0 };
    Object.assign(window, { gpuCounters: counters });
    for (const [method, field] of [["drawArrays", "draws"], ["deleteTexture", "textures"], ["deleteProgram", "programs"], ["deleteBuffer", "buffers"], ["deleteShader", "shaders"]] as const) {
      const original = WebGLRenderingContext.prototype[method];
      Object.defineProperty(WebGLRenderingContext.prototype, method, { value: function (this: WebGLRenderingContext, ...args: unknown[]) {
        counters[field]++; return Reflect.apply(original, this, args);
      } });
    }
  });
}

test("FULL scene renders only the failure beat and disposes GPU allocations", async ({ page }, testInfo) => {
  await fullGraphics(page);
  await page.goto("/");
  await expect(page.locator(".briefing-shell")).toHaveAttribute("data-tier", "FULL");
  if (process.env.PLAYWRIGHT_PRODUCTION === "1") expect(await page.evaluate(() => "directiveCinema" in window)).toBe(false);
  await expect(page.locator(".blackout-canvas")).not.toHaveAttribute("data-webgl", "ready");
  await page.getByRole("link", { name: "ENTER BRIEFING", exact: true }).click();
  await expect(page.locator("#hero-title")).toBeFocused();
  await expect(page.locator(".entry-veil")).toHaveAttribute("data-entering", "false");
  await page.mouse.move(1200, 200);
  await expect.poll(() => page.locator(".hero-depth").evaluate((node) => new DOMMatrixReadOnly(getComputedStyle(node).transform).a)).toBeGreaterThanOrEqual(1);
  await page.screenshot({ path: testInfo.outputPath("hero-depth.png") });
  await page.locator(".blackout-clock-block").evaluate((node) => node.scrollIntoView({ behavior: "instant", block: "center" }));
  await expect(page.locator(".blackout-canvas")).toHaveAttribute("data-webgl", "ready");
  await expect(page.locator("#blackout")).toHaveAttribute("data-phase", "complete", { timeout: 12_000 });
  const counters = () => page.evaluate(() => (window as unknown as { gpuCounters: { draws: number; textures: number; programs: number; buffers: number; shaders: number } }).gpuCounters);
  await expect.poll(async () => (await counters()).textures).toBe(1);
  const result = await counters();
  expect(result.draws).toBeGreaterThan(0); expect(result.draws).toBeLessThan(60);
  expect(result).toMatchObject({ programs: 1, buffers: 1, shaders: 2 });
  await page.mouse.move(300, 500); await page.mouse.wheel(0, 300);
  await expect(page.locator(".blackout-canvas")).not.toHaveAttribute("data-webgl", "ready");
  expect((await counters()).draws).toBe(result.draws);
});

test("context loss and resize retain the CSS incident", async ({ page }) => {
  await fullGraphics(page); await page.goto("/#blackout");
  const canvas = page.locator(".blackout-canvas");
  await expect(canvas).toHaveAttribute("data-webgl", "ready");
  await page.setViewportSize({ width: 1200, height: 800 });
  await expect.poll(() => canvas.evaluate((node: HTMLCanvasElement) => node.width)).toBe(1200);
  await canvas.evaluate((node: HTMLCanvasElement) => node.getContext("webgl")!.getExtension("WEBGL_lose_context")!.loseContext());
  await expect(canvas).toHaveAttribute("data-fallback", "true");
  await expect(page.locator("#blackout")).toHaveAttribute("data-phase", "complete", { timeout: 12_000 });
  await expect(page.locator(".failure-log li").last()).toHaveCSS("opacity", "1");
});
test("capabilities use resources, input, graphics and preferences; DPR stays bounded", () => {
  expect(classify(capable)).toMatchObject({ tier: "FULL", dprCap: 1.5 });
  for (const patch of [{ width: 768 }, { finePointer: false }, { cores: 4 }]) expect(classify({ ...capable, ...patch }).tier).toBe("REDUCED");
  for (const patch of [{ reducedMotion: true }, { webgl: false }, { saveData: true }, { cores: 2 }, { memory: 2 }]) expect(classify({ ...capable, ...patch }).tier).toBe("STATIC");
});

for (const mode of ["unsupported", "failed"] as const) {
  test(`WebGL ${mode} preserves the complete incident`, async ({ page }) => {
    await page.addInitScript((mode) => {
      Object.defineProperty(navigator, "hardwareConcurrency", { value: 12 });
      Object.defineProperty(navigator, "deviceMemory", { value: 8 });
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, kind: string, options?: unknown) {
        if (kind === "webgl") {
          if (mode === "unsupported") return null;
          // Capability probe succeeds; the real scene allocation fails.
          if (!(options as { failIfMajorPerformanceCaveat?: boolean })?.failIfMajorPerformanceCaveat) throw new Error("Simulated GPU allocation failure");
          return { getExtension: () => null };
        }
        return Reflect.apply(original, this, [kind, options]);
      } as typeof original;
    }, mode);
    const errors: string[] = []; page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/#blackout");
    await expect(page.locator("#blackout")).toHaveAttribute("data-phase", "complete", { timeout: 12_000 });
    await expect(page.locator(".failure-log li").last()).toHaveCSS("opacity", "1");
    if (mode === "unsupported") await expect(page.locator(".briefing-shell")).toHaveAttribute("data-tier", "STATIC");
    else await expect(page.locator(".blackout-canvas")).toHaveAttribute("data-fallback", "true");
    await expect(page.locator(".blackout-canvas")).toHaveCSS("opacity", "0");
    expect(errors).toEqual([]);
  });
}

test("responsive capability changes preserve layout and reduced-motion narrative", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "hardwareConcurrency", { value: 12 });
    Object.defineProperty(navigator, "deviceMemory", { value: 8 });
  });
  await page.goto("/");
  await expect(page.locator(".operator-archive")).toHaveAttribute("data-desktop", "true");
  await page.setViewportSize({ width: 768, height: 1024 });
  await expect(page.locator(".operator-archive")).toHaveAttribute("data-desktop", "false");
  await expect(page.locator(".briefing-shell")).not.toHaveAttribute("data-tier", "FULL");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".briefing-shell")).toHaveAttribute("data-tier", "STATIC");
  await expect(page.locator("#blackout")).toHaveAttribute("data-phase", "static");
  await expect(page.locator(".hero-depth")).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, 0)");
  await expect(page.locator(".blackout-canvas")).not.toHaveAttribute("data-webgl", "ready");
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(page.locator(".operator-archive")).toHaveAttribute("data-desktop", "true");
  await expect(page.locator(".clock-record")).toBeVisible();
});

test("hidden narrative resolves once; returning never replays it", async ({ page }) => {
  await page.goto("/#blackout");
  await expect(page.locator("#blackout")).toHaveAttribute("data-phase", "running");
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, value: true }); document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(page.locator(".briefing-shell")).toHaveAttribute("data-page-visible", "false");
  await expect(page.locator("#blackout")).toHaveAttribute("data-phase", "complete");
  await expect(page.locator(".blackout-canvas")).not.toHaveAttribute("data-webgl", "ready");
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, value: false }); document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(page.locator("#blackout")).toHaveAttribute("data-phase", "complete");
});

test("returning to Raven requires fresh intent before playback", async ({ page }) => {
  await page.goto("/#raven");
  await page.evaluate(() => document.fonts.ready);
  await page.locator(".raven-lineup").evaluate((node) => node.scrollIntoView({ behavior: "instant", block: "center" }));
  await page.locator(".raven-roster a").first().focus();
  await expect(page.locator("#operator-warden .operator-media")).toHaveAttribute("data-video-visible", "true");
  for (const hidden of [true, false]) {
    await page.evaluate((hidden) => {
      Object.defineProperty(document, "hidden", { configurable: true, value: hidden }); document.dispatchEvent(new Event("visibilitychange"));
    }, hidden);
    await expect(page.locator(".briefing-shell")).toHaveAttribute("data-page-visible", String(!hidden));
  }
  await expect(page.locator("#operator-warden .operator-media")).toHaveAttribute("data-video-visible", "false");
  expect(await page.locator("video").evaluateAll((nodes: HTMLVideoElement[]) => nodes.every((node) => node.paused))).toBe(true);
  await page.keyboard.press("Enter");
  await expect(page.locator("#operator-warden .operator-media")).toHaveAttribute("data-video-visible", "true");
});

// Test the actual service without exposing production-only test controls.
function moduleSource(name: string) {
  return ts.transpileModule(readFileSync(`lib/cinematic/${name}.ts`, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
}
test("React StrictMode unmount reverts scoped GSAP, triggers and runtime subscriptions", async ({ page }) => {
  await page.goto("/favicon.ico");
  const sources = Object.fromEntries(["capabilities", "media", "runtime", "sequence"].map((name) => [name, moduleSource(name)]));
  sources.engine = moduleSource("gsap");
  sources.provider = ts.transpileModule(readFileSync("components/cinematic/provider.tsx", "utf8"), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX,
  } }).outputText;
  for (const [name, path] of Object.entries({
    react: "react/cjs/react.development.js", "react/jsx-runtime": "react/cjs/react-jsx-runtime.development.js",
    "react-dom": "react-dom/cjs/react-dom.development.js", "react-dom/client": "react-dom/cjs/react-dom-client.development.js",
    scheduler: "scheduler/cjs/scheduler.development.js", gsap: "gsap/dist/gsap.js", "gsap/ScrollTrigger": "gsap/dist/ScrollTrigger.js",
  })) sources[name] = readFileSync(`node_modules/${path}`, "utf8");
  const result = await page.evaluate(async (sources) => {
    const modules: Record<string, Record<string, unknown>> = {};
    const require = (raw: string): Record<string, unknown> => {
      const name = raw === "./gsap" ? "engine" : raw.replace(/^\.\//, "").replace(/^@\/lib\/cinematic\//, "").replace("@/components/cinematic/provider", "provider");
      if (modules[name]) return modules[name];
      const exports: Record<string, unknown> = {}; modules[name] = exports;
      new Function("exports", "require", "module", "process", sources[name])(exports, require, { exports }, { env: { NODE_ENV: "development" } });
      return exports;
    };
    const React = require("react") as unknown as typeof import("react");
    const { createRoot } = require("react-dom/client") as unknown as typeof import("react-dom/client");
    const { CinematicProvider, useCinema } = require("provider") as unknown as typeof import("../components/cinematic/provider");
    const { useSequence } = require("sequence") as unknown as typeof import("../lib/cinematic/sequence");
    const { scopedGsap } = require("engine") as unknown as typeof import("../lib/cinematic/gsap");
    const config = { staticValue: "static", ready: "ready", start: "running", complete: "complete", beats: [], duration: 60000 };
    let runtime: ReturnType<typeof useCinema>;
    let stopped = 0;
    function Scene() {
      const node = React.useRef<HTMLDivElement>(null);
      runtime = useCinema(); useSequence(node, config);
      React.useEffect(() => {
        const unregister = runtime.registerVideo("test", () => { stopped++; runtime.releaseVideo("test"); });
        runtime.claimVideo("test");
        const frame = runtime.onFrame(() => false);
        const dispose = scopedGsap(runtime, node.current!, ({ gsap }) => {
          gsap.to(node.current, { x: 2, duration: 60, scrollTrigger: { trigger: node.current, start: "top top", end: "+=100", scrub: true } });
        });
        return () => { unregister(); frame(); dispose(); };
      }, []);
      return React.createElement("div", { ref: node, style: { height: "300px" } }, "Lifecycle fixture");
    }
    const host = document.createElement("div"); document.body.prepend(host); const root = createRoot(host);
    root.render(React.createElement(React.StrictMode, null, React.createElement(CinematicProvider, null, React.createElement(Scene))));
    const until = async (condition: () => boolean) => {
      const deadline = performance.now() + 3000;
      while (!condition()) { if (performance.now() > deadline) throw new Error("Lifecycle did not settle"); await new Promise((resolve) => setTimeout(resolve, 20)); }
    };
    await until(() => Boolean(runtime?.debug().timelines === 2));
    const mounted = runtime!.debug();
    root.unmount();
    await new Promise((resolve) => setTimeout(resolve, 50));
    const { ScrollTrigger } = require("gsap/ScrollTrigger") as unknown as typeof import("gsap/ScrollTrigger");
    return { mounted, disposed: runtime!.debug(), triggers: ScrollTrigger.getAll().length, stopped,
      debugRemoved: !("directiveCinema" in window) };
  }, sources);
  expect(result.mounted.timelines).toBe(2);
  expect(result.disposed).toMatchObject({ timelines: 0, observers: 0, frameSubscribers: 0, videoOwners: 0, rafActive: false, activeVideo: null });
  expect(result.triggers).toBe(0); expect(result.debugRemoved).toBe(true); expect(result.stopped).toBeGreaterThan(0);
});

test("runtime disposal cancels frames, observers, listeners and video ownership", async ({ page }) => {
  await page.goto("/favicon.ico");
  const sources = Object.fromEntries(["capabilities", "media", "runtime"].map((name) => [name, moduleSource(name)]));
  const result = await page.evaluate(async (sources) => {
    const modules: Record<string, Record<string, unknown>> = {};
    const require = (name: string): Record<string, unknown> => {
      name = name.replace("./", "");
      if (modules[name]) return modules[name];
      const exports: Record<string, unknown> = {}; modules[name] = exports;
      new Function("exports", "require", sources[name])(exports, require); return exports;
    };
    type Runtime = import("../lib/cinematic/runtime").CinematicRuntime;
    const Constructor = require("runtime").CinematicRuntime as new () => Runtime;
    const runtime = new Constructor(); const dispose = runtime.start();
    let frames = 0, stopped = 0;
    runtime.observe(document.body, () => {});
    runtime.onFrame(() => { frames++; return true; });
    runtime.registerVideo("test", () => { stopped++; runtime.releaseVideo("test"); }); runtime.claimVideo("test");
    runtime.invalidate();
    await new Promise(requestAnimationFrame);
    dispose(); const atDispose = frames;
    window.dispatchEvent(new Event("scroll")); window.dispatchEvent(new Event("resize"));
    await new Promise((resolve) => setTimeout(resolve, 220));
    return { debug: runtime.debug(), frames, atDispose, stopped };
  }, sources);
  expect(result.stopped).toBe(1); expect(result.frames).toBe(result.atDispose);
  expect(result.debug).toMatchObject({ activeVideo: null, rafActive: false, observers: 0, frameSubscribers: 0, videoOwners: 0 });
});
