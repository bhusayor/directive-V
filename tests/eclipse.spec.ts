import { expect, test, type Page } from "@playwright/test";
import { networkNodes, networkEdges } from "../lib/cinematic/eclipse-network";
import { readFileSync } from "node:fs";
import ts from "typescript";

type GPURecord = { draws: number; released: number; sample: boolean; pixels: number; red: number; samples: number };
async function graphics(page: Page, failure?: "unsupported" | "allocation") {
  await page.addInitScript((failure) => {
    Object.defineProperty(navigator, "hardwareConcurrency", { value: 12 });
    Object.defineProperty(navigator, "deviceMemory", { value: 8 });
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, kind: string, options?: object) {
      if (kind === "webgl" && failure === "unsupported") return null;
      if (kind === "webgl" && failure === "allocation" && this.classList.contains("eclipse-canvas")) throw new Error("Simulated allocation failure");
      return Reflect.apply(original, this, [kind, kind === "webgl" ? { ...options, failIfMajorPerformanceCaveat: false } : options]);
    } as typeof original;
    const data: GPURecord = { draws: 0, released: 0, sample: false, pixels: 0, red: 0, samples: 0 };
    Object.assign(window, { eclipseGPU: data });
    const draw = WebGLRenderingContext.prototype.drawArrays;
    WebGLRenderingContext.prototype.drawArrays = function (mode, first, count) {
      draw.call(this, mode, first, count);
      if (!(this.canvas as HTMLCanvasElement).classList.contains("eclipse-canvas")) return;
      data.draws++;
      if (mode !== this.POINTS || !data.sample) return;
      data.sample = false; data.pixels = 0; data.red = 0; data.samples++;
      const pixels = new Uint8Array(this.drawingBufferWidth * this.drawingBufferHeight * 4);
      this.readPixels(0, 0, this.drawingBufferWidth, this.drawingBufferHeight, this.RGBA, this.UNSIGNED_BYTE, pixels);
      for (let i = 0; i < pixels.length; i += 4) {
        if (pixels[i + 3] > 12 && pixels[i] > 20) data.pixels++;
        if (pixels[i] > 30 && pixels[i] > pixels[i + 1] * 2 && pixels[i + 3] > 12) data.red++;
      }
    };
    const release = WebGLRenderingContext.prototype.deleteBuffer;
    WebGLRenderingContext.prototype.deleteBuffer = function (buffer) {
      if ((this.canvas as HTMLCanvasElement).classList.contains("eclipse-canvas")) data.released++;
      release.call(this, buffer);
    };
  }, failure);
}
const gpu = (page: Page) => page.evaluate(() => (window as unknown as { eclipseGPU: GPURecord }).eclipseGPU);
async function open(page: Page) {
  await page.goto("/");
  await expect(page.locator(".operator-archive")).toHaveAttribute("data-ready", "true");
  await page.evaluate(() => document.fonts.ready);
  await page.locator("#eclipse").evaluate((node) => node.scrollIntoView({ behavior: "instant" }));
  await expect(page.locator("#eclipse-title")).toBeInViewport();
  await page.locator("#eclipse .cinematic-image img").first().waitFor();
  await expect(page.locator("#eclipse .cinematic-image img").first()).toHaveJSProperty("complete", true);
}
async function at(page: Page, progress: number) {
  await page.locator(".eclipse-track").evaluate((node, progress) => {
    window.scrollTo({ top: window.scrollY + node.getBoundingClientRect().top + (node.clientHeight - innerHeight) * progress, behavior: "instant" });
  }, progress);
  await expect.poll(async () => Math.abs(Number(await page.locator(".eclipse-track").getAttribute("data-progress")) - progress)).toBeLessThan(.015);
}
async function sample(page: Page, progress: number) {
  const prior = (await gpu(page)).samples;
  await page.evaluate(() => { (window as unknown as { eclipseGPU: GPURecord }).eclipseGPU.sample = true; });
  await at(page, progress);
  await expect.poll(async () => (await gpu(page)).samples).toBeGreaterThan(prior);
  // Sample the resolved state too, not just the first frame of a transition.
  await page.evaluate(() => { (window as unknown as { eclipseGPU: GPURecord }).eclipseGPU.sample = true; });
  await page.mouse.move(900 + progress * 100, 260);
  await expect.poll(async () => (await gpu(page)).samples).toBeGreaterThan(prior + 1);
  return gpu(page);
}

test("schematic is connected; every node is reachable, not random decoration", () => {
  expect(networkNodes).toHaveLength(40);
  expect(networkEdges.length).toBeGreaterThan(40);
  expect(networkNodes.every((node) => Number.isFinite(node.arrival) && node.arrival > 0 && node.arrival <= 1)).toBe(true);
  expect(new Set(networkNodes.map((node) => node.kind)).size).toBe(4);
});

test("FULL network visibly draws, propagates red, reverses and reaches the mission directive", async ({ page }, testInfo) => {
  await graphics(page); await open(page);
  await page.screenshot({ path: testInfo.outputPath("eclipse-entry.png") });
  await at(page, 0);
  await expect(page.locator(".eclipse-network-visual")).toHaveAttribute("data-renderer", "ready");
  await expect(page.locator(".eclipse-canvas")).toHaveCSS("opacity", "1");
  const neutral = await sample(page, .01);
  expect(neutral.pixels).toBeGreaterThan(2000); expect(neutral.red).toBeLessThan(100);
  await page.screenshot({ path: testInfo.outputPath("eclipse-network.png") });
  const breached = await sample(page, .34);
  expect(breached.red).toBeGreaterThan(neutral.red + 500);
  await expect(page.locator('[data-alert="0"]')).toHaveCSS("opacity", "1");
  await expect(page.locator('[data-alert="1"]')).toHaveCSS("opacity", "1");
  await page.screenshot({ path: testInfo.outputPath("eclipse-compromise.png") });
  await at(page, .52);
  await expect(page.locator('[data-alert="2"]')).toHaveCSS("opacity", "1");
  await expect(page.locator(".header-state")).toHaveText("NETWORK EXPOSED");
  const reversed = await sample(page, .01);
  expect(reversed.red).toBeLessThan(100);
  await expect(page.locator("#eclipse")).toHaveAttribute("data-phase", "network");
  await expect(page.locator(".eclipse-node-count > span")).toHaveText("00");
  await at(page, .67);
  await expect(page.locator("#test-title")).toBeInViewport();
  await page.screenshot({ path: testInfo.outputPath("eclipse-revelation.png") });
  await at(page, 1);
  await expect(page.locator("#activation-title")).toBeInViewport();
  await expect(page.locator(".eclipse-orders li")).toHaveText(["FIND DOMINION.", "IDENTIFY ECLIPSE.", "STOP ACTIVATION.", "COME HOME."]);
  await expect(page.locator(".eclipse-node-count > span")).toHaveText("40");
  await page.screenshot({ path: testInfo.outputPath("eclipse-directive.png") });
  expect(await page.locator("#eclipse [role=timer]").count()).toBe(0);
});

test("GPU is idle at rest, releases offscreen/hidden, and restores only the current scroll state", async ({ page }) => {
  await graphics(page); await open(page); await at(page, .35);
  await expect(page.locator(".eclipse-network-visual")).toHaveAttribute("data-renderer", "ready");
  await page.waitForTimeout(1100); // Let damped movement settle, then measure a separate idle interval.
  const before = await gpu(page); await page.waitForTimeout(300);
  expect((await gpu(page)).draws).toBe(before.draws);
  await page.evaluate(() => { Object.defineProperty(document, "hidden", { configurable: true, value: true }); document.dispatchEvent(new Event("visibilitychange")); });
  await expect(page.locator(".eclipse-network-visual")).toHaveAttribute("data-renderer", "fallback");
  await expect.poll(async () => (await gpu(page)).released).toBeGreaterThanOrEqual(2);
  const hidden = await gpu(page); await page.waitForTimeout(200);
  expect((await gpu(page)).draws).toBe(hidden.draws);
  await page.evaluate(() => { Object.defineProperty(document, "hidden", { configurable: true, value: false }); document.dispatchEvent(new Event("visibilitychange")); });
  await expect(page.locator(".eclipse-network-visual")).toHaveAttribute("data-renderer", "ready");
  await expect(page.locator("#eclipse")).toHaveAttribute("data-phase", "defense");
  await page.locator("#hero").evaluate((node) => node.scrollIntoView({ behavior: "instant" }));
  await expect.poll(async () => (await gpu(page)).released).toBeGreaterThanOrEqual(4);
  const away = await gpu(page); await page.waitForTimeout(200);
  expect((await gpu(page)).draws).toBe(away.draws);
});

for (const failure of ["unsupported", "allocation"] as const) test(`${failure} WebGL retains imagery, schematic and story`, async ({ page }) => {
  const errors: string[] = []; page.on("pageerror", (error) => errors.push(error.message));
  await graphics(page, failure); await open(page);
  await page.locator(".eclipse-reveal").evaluate((node) => node.scrollIntoView({ behavior: "instant" }));
  await expect(page.locator(".eclipse-network-visual")).toHaveAttribute("data-renderer", failure === "allocation" ? "failed" : "fallback");
  await expect(page.locator(".eclipse-schematic")).toHaveCSS("opacity", "0.85");
  await expect(page.locator(".eclipse-canvas")).toHaveCSS("opacity", "0");
  await page.locator("#eclipse-directive").evaluate((node) => node.scrollIntoView({ behavior: "instant" }));
  await expect(page.getByText("FIND DOMINION.", { exact: true })).toBeInViewport();
  await expect(page.locator("#eclipse .eclipse-ground-image").first()).toBeVisible();
  expect(errors).toEqual([]);
});

test("context loss falls back immediately; resize bounds canvas pixels", async ({ page }) => {
  await graphics(page); await open(page); await at(page, .2);
  const canvas = page.locator(".eclipse-canvas");
  await expect(page.locator(".eclipse-network-visual")).toHaveAttribute("data-renderer", "ready");
  await page.setViewportSize({ width: 1200, height: 800 });
  await expect.poll(() => canvas.evaluate((node: HTMLCanvasElement) => node.width)).toBe(1200);
  await canvas.evaluate((node: HTMLCanvasElement) => node.getContext("webgl")!.getExtension("WEBGL_lose_context")!.loseContext());
  await expect(page.locator(".eclipse-network-visual")).toHaveAttribute("data-renderer", "failed");
  await expect(page.locator(".eclipse-schematic")).toHaveCSS("opacity", "0.85");
  await at(page, 1); await expect(page.locator(".eclipse-orders")).toBeInViewport();
});

test("switching to reduced motion releases the active scene and keeps every story beat", async ({ page }) => {
  await graphics(page); await open(page); await at(page, .35);
  await expect(page.locator(".eclipse-network-visual")).toHaveAttribute("data-renderer", "ready");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator("#eclipse")).toHaveAttribute("data-enhanced", "false");
  await expect.poll(async () => (await gpu(page)).released).toBeGreaterThanOrEqual(2);
  await expect(page.locator(".eclipse-stage")).toHaveCSS("position", "absolute");
  await expect(page.locator(".eclipse-alerts li").last()).toHaveCSS("opacity", "1");
  await page.emulateMedia({ reducedMotion: "no-preference" }); await at(page, .35);
  await expect(page.locator(".eclipse-network-visual")).toHaveAttribute("data-renderer", "ready");
});

for (const width of [320, 390, 768, 1440]) test(`static reduced-motion story is complete at ${width}px`, async ({ page }, testInfo) => {
  await page.setViewportSize({ width, height: 900 }); await page.emulateMedia({ reducedMotion: "reduce" }); await open(page);
  await expect(page.locator("#eclipse")).toHaveAttribute("data-enhanced", "false");
  await expect(page.locator(".eclipse-stage")).toHaveCSS("position", "absolute");
  for (const selector of [".eclipse-reveal", ".eclipse-compromise", ".eclipse-revelation", ".eclipse-directive"]) {
    await page.locator(selector).evaluate((node) => node.scrollIntoView({ behavior: "instant" }));
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const outside = await page.locator(`${selector} h3, ${selector} li`).evaluateAll((nodes) => nodes.some((node) => {
      const rect = node.getBoundingClientRect(); return rect.left < 0 || rect.right > innerWidth + 1;
    })); expect(outside).toBe(false);
  }
  await expect(page.locator(".eclipse-alerts li").first()).toHaveCSS("opacity", "1");
  await expect(page.locator(".eclipse-canvas")).not.toHaveAttribute("data-frames", /.+/);
  await page.screenshot({ path: testInfo.outputPath(`directive-${width}.png`) });
});

test("touch uses a lighter schematic, keeps natural scrolling and reverses labels", async ({ browser }, testInfo) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await context.newPage(); await graphics(page); await open(page);
  await expect(page.locator(".briefing-shell")).toHaveAttribute("data-tier", "REDUCED");
  await at(page, .5); await expect(page.locator("#eclipse")).toHaveAttribute("data-phase", "grid");
  await expect(page.locator(".eclipse-network-visual")).toHaveAttribute("data-renderer", "fallback");
  await expect(page.locator(".eclipse-alerts li").last()).toHaveCSS("opacity", "1");
  await at(page, 0); await expect(page.locator("#eclipse")).toHaveAttribute("data-phase", "network");
  await page.screenshot({ path: testInfo.outputPath("network-mobile.png") });
  await at(page, 1); await page.screenshot({ path: testInfo.outputPath("directive-mobile.png") });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await context.close();
});

test("no JavaScript still delivers Eclipse in the canonical order", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false }); const page = await context.newPage();
  await page.goto(`${process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000"}/#eclipse`);
  await expect(page.locator("#eclipse-title")).toBeInViewport();
  expect(await page.locator("main > section").evaluateAll((nodes) => nodes.map((node) => node.id))).toEqual(["hero", "blackout", "dominion", "directive-five", "raven", "eclipse"]);
  await expect(page.locator(".eclipse-alerts li")).toHaveCount(3);
  await page.locator(".eclipse-directive").scrollIntoViewIfNeeded();
  await expect(page.getByText("COME HOME.", { exact: true })).toBeVisible();
  await expect(page.locator("#operations, #multiplayer, #operator-06")).toHaveCount(0);
  await context.close();
});

test("actual network hook survives StrictMode and releases its GPU context on unmount", async ({ page }) => {
  await graphics(page); await page.goto("/favicon.ico");
  const sources: Record<string, string> = {};
  for (const name of ["capabilities", "media", "runtime", "hooks", "use-network-canvas", "network-scene", "eclipse-network", "provider"]) {
    const file = name === "provider" ? "components/cinematic/provider.tsx" : `lib/cinematic/${name}.ts`;
    sources[name] = ts.transpileModule(readFileSync(file, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  }
  for (const [name, path] of Object.entries({ react: "react/cjs/react.development.js", "react/jsx-runtime": "react/cjs/react-jsx-runtime.development.js", "react-dom": "react-dom/cjs/react-dom.development.js", "react-dom/client": "react-dom/cjs/react-dom-client.development.js", scheduler: "scheduler/cjs/scheduler.development.js" })) sources[name] = readFileSync(`node_modules/${path}`, "utf8");
  const result = await page.evaluate(async (sources) => {
    const modules: Record<string, Record<string, unknown>> = {};
    const require = (raw: string): Record<string, unknown> => {
      const name = raw.replace(/^\.\//, "").replace(/^@\/lib\/cinematic\//, "").replace("@/components/cinematic/provider", "provider");
      if (modules[name]) return modules[name];
      const exports: Record<string, unknown> = {}; modules[name] = exports;
      new Function("exports", "require", "module", "process", sources[name])(exports, require, { exports }, { env: { NODE_ENV: "development" } }); return exports;
    };
    const React = require("react") as unknown as typeof import("react");
    const { createRoot } = require("react-dom/client") as unknown as typeof import("react-dom/client");
    const { CinematicProvider, useCinema } = require("provider") as unknown as typeof import("../components/cinematic/provider");
    const { useNetworkCanvas } = require("use-network-canvas") as unknown as typeof import("../lib/cinematic/use-network-canvas");
    let runtime: ReturnType<typeof useCinema>;
    function Scene() {
      const canvas = React.useRef<HTMLCanvasElement>(null), progress = React.useRef(.4); runtime = useCinema();
      const status = useNetworkCanvas(canvas, progress);
      return React.createElement("canvas", { ref: canvas, className: "eclipse-canvas", "data-renderer": status, style: { width: "800px", height: "500px" } });
    }
    const host = document.createElement("div"); document.body.prepend(host); const root = createRoot(host);
    root.render(React.createElement(React.StrictMode, null, React.createElement(CinematicProvider, null, React.createElement(Scene))));
    const deadline = performance.now() + 5000;
    while (!host.querySelector('[data-renderer="ready"]')) {
      if (performance.now() > deadline) throw new Error("Network did not render after StrictMode mount");
      await new Promise((resolve) => setTimeout(resolve, 30));
    }
    const gl = host.querySelector("canvas")!.getContext("webgl")!;
    const mounted = runtime!.debug(); root.unmount();
    await new Promise((resolve) => setTimeout(resolve, 100));
    return { mounted, unmounted: runtime!.debug(), contextLost: gl.isContextLost() };
  }, sources);
  expect(result.mounted.webglScenes).toBe(1); expect(result.mounted.webglFrames).toBeGreaterThan(0);
  expect(result.unmounted).toMatchObject({ webglScenes: 0, observers: 0, frameSubscribers: 0, webglLoopActive: false });
  expect(result.contextLost).toBe(true);
});
