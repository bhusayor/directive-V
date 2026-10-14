import { expect, test, type Page } from "@playwright/test";

const ids = ["warden", "ghost", "atlas", "cipher", "pulse"];
const mediaFor = (page: Page, id: string) => page.locator(`#operator-${id} .operator-media`);
async function openLineup(page: Page) {
  await page.goto(`${process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000"}/#raven`);
  await expect(page.locator(".operator-archive")).toHaveAttribute("data-ready", "true");
  await page.evaluate(() => document.fonts.ready);
  await page.mouse.move(0, 0);
  await page.locator(".raven-lineup").evaluate(async (node) => {
    // Let the hydrated layout commit before overriding the initial anchor scroll.
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    node.scrollIntoView({ behavior: "instant", block: "center" });
  });
}
async function hoverOperator(page: Page, id: string) {
  // Move once into a strip: unlike locator.hover(), do not chase its moving center.
  const box = await page.locator(`#operator-${id} .operator-inline-image`).boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.move(box!.x + box!.width / 2, Math.max(100, box!.y + 150));
  await expect(page.locator(".operator-archive")).toHaveAttribute("data-active", id);
}

test("no page-load video requests; five sharp full-height resting portraits", async ({ page }, testInfo) => {
  const requests: string[] = [];
  page.on("request", (request) => { if (request.url().endsWith(".mp4")) requests.push(request.url()); });
  await page.goto("/");
  await expect(page.locator(".operator-archive")).toHaveAttribute("data-ready", "true");
  await expect(page.locator("video")).toHaveCount(0);
  expect(requests).toEqual([]);
  await openLineup(page);
  await expect(page.locator(".operator-archive")).toHaveAttribute("data-active", "none");
  await expect(page.locator("video")).toHaveCount(5);
  for (const id of ids) {
    const media = mediaFor(page, id);
    await expect(media.locator("img")).toHaveJSProperty("complete", true);
    await expect(media.locator("img")).toHaveCSS("filter", "none");
    await expect(media.locator("img")).toHaveCSS("opacity", "1");
    await expect(media.locator("video")).toHaveJSProperty("paused", true);
    await expect(media.locator("video")).toHaveAttribute("preload", "metadata");
    const box = await media.boundingBox();
    expect(box!.width).toBeGreaterThan(280);
    expect(box!.height).toBeGreaterThan(750);
  }
  await page.screenshot({ path: testInfo.outputPath("raven-resting.png") });
  await expect(page.getByText(/FIELD RECORDING|PREPARING RECORDING|RECORDING UNAVAILABLE/)).toHaveCount(0);
  await expect(page.locator("video[controls]")).toHaveCount(0);
});

for (const [index, id] of ids.entries()) {
  test(`${id}: real hover, correct clip, full-height clear video and graceful ending`, async ({ page }, testInfo) => {
    await openLineup(page);
    await hoverOperator(page, id);
    const media = mediaFor(page, id), video = media.locator("video");
    await expect(media).toHaveAttribute("data-video-visible", "true");
    await expect(video).toHaveCSS("opacity", "1");
    await expect(video).toHaveAttribute("src", `/assets/operators/Videos/0${index + 1}-${id}.mp4`);
    await expect(video).toHaveJSProperty("muted", true);
    await expect(video).toHaveJSProperty("playsInline", true);
    await expect(video).toHaveJSProperty("controls", false);
    await expect(video).toHaveJSProperty("loop", false);
    await expect(video).toHaveCSS("filter", "none");
    await expect(video).toHaveCSS("object-fit", "cover");
    await expect(media.locator("img")).toHaveCSS("opacity", "1");
    await expect(page.locator(`#operator-${id} .operator-intel-slot`)).toHaveCSS("opacity", "1");
    await expect.poll(async () => Math.round((await media.boundingBox())!.width)).toBeGreaterThan(800);
    const box = await video.boundingBox();
    expect(box!.height).toBeGreaterThan(750);
    expect(await video.evaluate((node: HTMLVideoElement) => node.videoWidth)).toBe(720);
    expect(await page.locator("video").evaluateAll((nodes: HTMLVideoElement[]) => nodes.filter((node) => !node.paused).length)).toBe(1);
    await page.screenshot({ path: testInfo.outputPath(`${id}-playing.png`) });
    await video.evaluate((node: HTMLVideoElement) => { node.currentTime = 4; });
    await expect.poll(() => video.evaluate((node: HTMLVideoElement) => node.currentTime)).toBeGreaterThan(4);
    await expect(video).toHaveCSS("opacity", "1");
    await page.screenshot({ path: testInfo.outputPath(`${id}-mid.png`) });
    await video.evaluate((node: HTMLVideoElement) => { node.currentTime = 7; });
    await expect.poll(() => video.evaluate((node: HTMLVideoElement) => node.currentTime)).toBeGreaterThan(7);
    await expect(video).toHaveCSS("opacity", "1");
    await page.screenshot({ path: testInfo.outputPath(`${id}-late.png`) });
    // Let the remaining second finish naturally; the screenshot may itself span the ending.
    await expect(media).toHaveAttribute("data-video-visible", "false");
    await expect(video).toHaveJSProperty("paused", true);
    await expect(video).toHaveJSProperty("currentTime", 0);
    await expect(video).toHaveCSS("opacity", "0");
    await expect(media.locator("img")).toHaveCSS("opacity", "1");
  });
}

test("direct transfers, one playing video, stable dossier region and delayed exit", async ({ page }) => {
  await openLineup(page);
  await hoverOperator(page, "warden");
  await expect(mediaFor(page, "warden")).toHaveAttribute("data-video-visible", "true");
  await expect(page.locator("#operator-warden .operator-intel-slot")).toHaveCSS("opacity", "1");
  await page.locator("#operator-warden .operator-stats").hover();
  await expect(page.locator(".operator-archive")).toHaveAttribute("data-active", "warden");
  await page.evaluate(() => {
    const archive = document.querySelector(".operator-archive")!;
    (window as unknown as { transfers: string[] }).transfers = [];
    new MutationObserver(() => (window as unknown as { transfers: string[] }).transfers.push(archive.getAttribute("data-active")!))
      .observe(archive, { attributes: true, attributeFilter: ["data-active"] });
  });
  for (const id of ["ghost", "atlas", "cipher", "pulse", "warden"]) {
    await hoverOperator(page, id);
    await expect(mediaFor(page, id)).toHaveAttribute("data-video-visible", "true");
    expect(await page.locator("video").evaluateAll((nodes: HTMLVideoElement[]) => nodes.filter((node) => !node.paused).length)).toBe(1);
    // Pause long enough for the panel to resolve before targeting the next narrow strip.
    await expect(page.locator(`#operator-${id} .operator-intel-slot`)).toHaveCSS("opacity", "1");
  }
  expect(await page.evaluate(() => (window as unknown as { transfers: string[] }).transfers)).not.toContain("none");
  await page.mouse.move(0, 0);
  await expect(page.locator(".operator-archive")).toHaveAttribute("data-active", "warden", { timeout: 100 });
  await expect(page.locator(".operator-archive")).toHaveAttribute("data-active", "none");
  await expect.poll(() => page.locator("video").evaluateAll((nodes: HTMLVideoElement[]) => nodes.every((node) => node.paused && node.currentTime === 0))).toBe(true);
});

test("rapid transfer and re-entry cannot leave competing or stuck playback", async ({ page }) => {
  await openLineup(page);
  // Keyboard arrows exercise transfers faster than the 800ms panel animation.
  await page.locator(".raven-roster a").first().focus();
  for (let i = 0; i < 12; i++) await page.keyboard.press("ArrowRight");
  await expect(page.locator(".operator-archive")).toHaveAttribute("data-active", "atlas");
  await expect(mediaFor(page, "atlas")).toHaveAttribute("data-video-visible", "true");
  expect(await page.locator("video").evaluateAll((nodes: HTMLVideoElement[]) => nodes.filter((node) => !node.paused).length)).toBe(1);
  await page.keyboard.press("Escape");
  await page.keyboard.press("Enter");
  await expect(mediaFor(page, "atlas")).toHaveAttribute("data-video-visible", "true");
});

test("a stationary-pointer layout exit does not collapse the selected dossier", async ({ page }) => {
  await openLineup(page); await hoverOperator(page, "warden");
  await expect(page.locator("#operator-warden .operator-intel-slot")).toHaveCSS("opacity", "1");
  const box = await page.locator("#operator-warden .operator-stats").boundingBox();
  const point = { x: box!.x + 10, y: box!.y + 10 };
  await page.mouse.move(point.x, point.y);
  await page.locator(".operator-archive").evaluate((node, point) => {
    node.dispatchEvent(new PointerEvent("pointerout", {
      bubbles: true, pointerType: "mouse", clientX: point.x, clientY: point.y, relatedTarget: document.body,
    }));
  }, point);
  // Longer than the 200ms exit grace period; no physical mouse movement occurred.
  await page.waitForTimeout(300);
  await expect(page.locator(".operator-archive")).toHaveAttribute("data-active", "warden");
  await page.mouse.move(0, 0);
  await expect(page.locator(".operator-archive")).toHaveAttribute("data-active", "none");
});

test("slow readiness never removes the portrait", async ({ page }) => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => { release = resolve; });
  await page.route("**/01-warden.mp4", async (route) => { await gate; await route.continue(); });
  await openLineup(page);
  await hoverOperator(page, "warden");
  const media = mediaFor(page, "warden");
  await expect(media).toHaveAttribute("data-preview", "loading");
  await expect(media.locator("img")).toHaveCSS("opacity", "1");
  await expect(media.locator("video")).toHaveCSS("opacity", "0");
  release();
  await expect(media).toHaveAttribute("data-video-visible", "true");
});

for (const failure of ["missing", "unsupported", "rejected"] as const) {
  test(`${failure} video silently retains portrait and intelligence`, async ({ page }) => {
    if (failure === "missing") await page.route("**/01-warden.mp4", (route) => route.fulfill({ status: 404, body: "Not found" }));
    if (failure === "unsupported") await page.route("**/01-warden.mp4", (route) => route.fulfill({ contentType: "video/mp4", body: "Invalid media" }));
    if (failure === "rejected") await page.addInitScript(() => {
      HTMLMediaElement.prototype.play = () => Promise.reject(new DOMException("Playback denied", "NotAllowedError"));
    });
    await openLineup(page); await hoverOperator(page, "warden");
    const media = mediaFor(page, "warden");
    await expect(media.locator("video")).toHaveCount(0);
    await expect(media.locator("img")).toHaveCSS("opacity", "1");
    await expect(media).toHaveAttribute("data-video-visible", "false");
    await expect(page.locator("#warden-title")).toBeVisible();
    await expect(page.locator("#raven")).not.toContainText(/unavailable|loading|failed/i);
  });
}

test("stalls return to a portrait and release the failed decoder", async ({ page }) => {
  await openLineup(page); await hoverOperator(page, "warden");
  const media = mediaFor(page, "warden");
  await expect(media).toHaveAttribute("data-video-visible", "true");
  await media.locator("video").evaluate((node: HTMLVideoElement) => { node.pause(); node.dispatchEvent(new Event("waiting")); });
  await expect(media).toHaveAttribute("data-video-visible", "false");
  await expect(media.locator("img")).toHaveCSS("opacity", "1");
  await expect(media.locator("video")).toHaveCount(0, { timeout: 7000 });
});

test("reduced motion, offscreen and background changes stop all playback", async ({ page }) => {
  await openLineup(page); await hoverOperator(page, "warden");
  await expect(mediaFor(page, "warden")).toHaveAttribute("data-video-visible", "true");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator("video")).toHaveCount(0);
  await expect(page.locator("#warden-title")).toBeVisible();
  await hoverOperator(page, "ghost");
  await expect(page.locator("#ghost-title")).toBeVisible();
  await expect(page.locator("video")).toHaveCount(0);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(mediaFor(page, "ghost")).toHaveAttribute("data-video-visible", "true");
  await page.locator(".raven-closing").evaluate((node) => node.scrollIntoView({ behavior: "instant" }));
  await expect.poll(() => page.locator("video").evaluateAll((nodes: HTMLVideoElement[]) => nodes.every((node) => node.paused))).toBe(true);
  await page.locator(".raven-lineup").evaluate((node) => node.scrollIntoView({ behavior: "instant", block: "center" }));
  await hoverOperator(page, "warden");
  await expect(mediaFor(page, "warden")).toHaveAttribute("data-video-visible", "true");
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, value: true });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(page.locator("video")).toHaveCount(0);
});

test("touch uses five image-led selectors without player UI or video downloads", async ({ browser }, testInfo) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  const requests: string[] = [];
  page.on("request", (request) => { if (request.url().endsWith(".mp4")) requests.push(request.url()); });
  await openLineup(page);
  for (const id of ids) {
    await page.locator(`.raven-roster a[href="#operator-${id}"]`).tap();
    await expect(page.locator(".operator-archive")).toHaveAttribute("data-active", id);
    await expect(page.locator(`#${id}-title`)).toBeVisible();
    await mediaFor(page, id).scrollIntoViewIfNeeded();
    await expect(mediaFor(page, id).locator("img")).toHaveJSProperty("complete", true);
    await page.locator(`#operator-${id}`).screenshot({ path: testInfo.outputPath(`${id}-touch.png`) });
  }
  await expect(page.locator("video")).toHaveCount(0);
  expect(requests).toEqual([]);
  await context.close();
});
