import { expect, test } from "@playwright/test";

test("keyboard entry, timed incident, chapter links and canonical images", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  await expect(page.getByRole("heading", { name: "DIRECTIVE NETWORK" })).toBeVisible();
  await expect(page.getByRole("button", { name: "AUDIO: OFF" })).toBeDisabled();
  await page.screenshot({ path: testInfo.outputPath("access.png") });
  const enter = page.getByRole("link", { name: "ENTER BRIEFING", exact: true });
  await enter.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#hero-title")).toBeFocused();
  await expect(page.locator(".entry-veil")).toHaveAttribute("data-entering", "false");
  await expect(page.locator(".hero-image img")).toHaveJSProperty("complete", true);
  await page.screenshot({ path: testInfo.outputPath("hero.png") });
  await page.getByRole("link", { name: "SCROLL TO BEGIN BRIEFING" }).click();
  await expect(page.locator("#blackout")).toHaveAttribute("data-phase", "running");
  await expect(page.locator(".live-clock")).toContainText("02:17:00", { timeout: 5000 });
  await expect(page.locator("#blackout")).toHaveAttribute("data-phase", "complete");
  await expect(page.locator(".failure-log")).toHaveCSS("opacity", "1");
  await expect(page.locator(".failure-log li").last()).toHaveCSS("opacity", "1");
  await page.screenshot({ path: testInfo.outputPath("blackout.png") });
  await page.getByRole("link", { name: "02 CONFLICT" }).click();
  await expect(page.locator(".briefing-shell")).toHaveAttribute("data-hostile", "true");
  await expect(page.getByRole("heading", { name: "DOMINION", exact: true })).toBeInViewport();
  await expect(page.locator("#dominion")).toHaveAttribute("data-entrance", "complete");
  await expect(page.locator(".dominion-heading h2")).toHaveCSS("opacity", "1");
  await page.screenshot({ path: testInfo.outputPath("dominion.png") });
  await page.locator("#architect").scrollIntoViewIfNeeded();
  await expect(page.getByText("“Order follows silence.”")).toBeVisible();
  await expect(page.locator(".architect-copy")).toHaveClass(/scene-entered/);
  await expect(page.locator(".architect-copy")).toHaveCSS("opacity", "1");
  for (const img of await page.locator("#hero .cinematic-image img, #blackout .cinematic-image img, #dominion .cinematic-image img").all()) {
    await expect(img).toHaveJSProperty("complete", true);
    expect(await img.evaluate((node: HTMLImageElement) => node.naturalWidth)).toBeGreaterThan(0);
  }
  await page.screenshot({ path: testInfo.outputPath("architect.png") });
  expect(errors).toEqual([]);
});

test("fast scrolling resolves the incident without trapping the reader", async ({ page }) => {
  await page.goto("/#blackout");
  await expect(page.locator("#blackout")).toHaveAttribute("data-phase", "running");
  await page.locator("#architect").evaluate((node) => node.scrollIntoView({ behavior: "instant" }));
  await expect(page.locator("#blackout")).toHaveAttribute("data-phase", "complete");
  await page.locator("#blackout").evaluate((node) => node.scrollIntoView({ behavior: "instant" }));
  await expect(page.locator(".failure-log")).toHaveCSS("opacity", "1");
});

for (const width of [1440, 1024, 768, 390, 320]) {
  test(`reduced-motion narrative remains readable at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await page.getByRole("link", { name: "ENTER BRIEFING", exact: true }).click();
    await expect(page.locator("#hero-title")).toBeFocused();
    await expect(page.locator("#blackout")).toHaveAttribute("data-phase", "static");
    for (const time of ["02:16:57", "02:16:58", "02:16:59", "02:17:00"]) {
      await expect(page.locator(".clock-record").getByText(time, { exact: false })).toBeVisible();
    }
    await expect(page.locator(".blackout-veil")).toHaveCSS("display", "none");
    await expect(page.locator(".failure-log")).toHaveCSS("opacity", "1");
    for (const section of ["#hero", "#blackout", "#dominion", "#architect"]) {
      await page.locator(section).scrollIntoViewIfNeeded();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      const outside = await page.locator(`${section} h1, ${section} h2, ${section} h3, ${section} dd`).evaluateAll((nodes) => nodes.filter((node) => {
        const rect = node.getBoundingClientRect();
        return rect.left < -1 || rect.right > window.innerWidth + 1;
      }).map((node) => node.textContent));
      expect(outside).toEqual([]);
    }
    await page.screenshot({ path: testInfo.outputPath(`narrative-${width}.png`), fullPage: true });
    if (width === 390) {
      await page.locator("#hero").screenshot({ path: testInfo.outputPath("mobile-hero.png") });
      await page.locator("#architect").screenshot({ path: testInfo.outputPath("mobile-architect.png") });
    }
  });
}

test("changing motion preference immediately exposes the static incident", async ({ page }) => {
  await page.goto("/#blackout");
  await expect(page.locator("#blackout")).toHaveAttribute("data-phase", "running");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator("#blackout")).toHaveAttribute("data-phase", "static");
  await expect(page.locator(".clock-record")).toBeVisible();
  await expect(page.locator(".failure-log")).toHaveCSS("opacity", "1");
});

test("the briefing is readable without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000");
  await page.getByRole("link", { name: "ENTER BRIEFING", exact: true }).click();
  await expect(page.locator("#hero-title")).toBeInViewport();
  await expect(page.locator(".clock-record")).toBeVisible();
  await expect(page.locator(".failure-log")).toHaveCSS("opacity", "1");
  await context.close();
});

test("02:17 cuts atomically, failures arrive separately, and the city survives in the aftermath", async ({ page }, testInfo) => {
  await page.goto("/");
  await expect(page.locator("#blackout")).toHaveAttribute("data-phase", "ready");
  const beats = await page.evaluate(() => new Promise<Array<{ phase: string; clock: string; count: number; at: number }>>((resolve) => {
    const scene = document.querySelector("#blackout")!;
    const records: Array<{ phase: string; clock: string; count: number; at: number }> = [];
    const observer = new MutationObserver(() => {
      const previous = records.at(-1);
      if (previous?.phase === scene.getAttribute("data-phase") && previous.clock === scene.querySelector(".live-clock")!.textContent && previous.count === scene.querySelectorAll('.failure-log li[data-visible="true"]').length) return;
      records.push({
        phase: scene.getAttribute("data-phase")!,
        clock: scene.querySelector(".live-clock")!.textContent!,
        count: scene.querySelectorAll('.failure-log li[data-visible="true"]').length,
        at: performance.now(),
      });
      if (scene.getAttribute("data-phase") === "complete") { observer.disconnect(); resolve(records); }
    });
    observer.observe(scene, { attributes: true, childList: true, characterData: true, subtree: true });
    scene.querySelector(".blackout-clock-block")!.scrollIntoView({ behavior: "instant", block: "center" });
  }));
  const clocks = [...new Set(beats.map((beat) => beat.clock))];
  expect(clocks).toEqual(["02:16:57UTC", "02:16:58UTC", "02:16:59UTC", "02:17:00UTC"]);
  const firstCut = beats.find((beat) => beat.clock === "02:17:00UTC")!;
  expect(firstCut.phase).toBe("dark");
  expect(firstCut.count).toBe(0);
  const failures = beats.filter((beat) => beat.phase === "failures");
  expect(failures.map((beat) => beat.count)).toEqual([1, 2, 3, 4, 5]);
  expect(failures[0].at - firstCut.at).toBeGreaterThan(700);
  for (let i = 1; i < failures.length; i++) expect(failures[i].at - failures[i - 1].at).toBeGreaterThan(300);
  await expect(page.locator(".blackout-image")).toHaveCSS("opacity", "0.1");
  await page.locator("#blackout-aftermath").scrollIntoViewIfNeeded();
  await expect(page.locator(".blackout-duration")).toHaveCSS("opacity", "1");
  await page.screenshot({ path: testInfo.outputPath("aftermath.png") });
});

test("hostile intrusion resolves in order and reduced motion cancels it", async ({ page }, testInfo) => {
  await page.goto("/");
  await expect(page.locator("#dominion")).toHaveAttribute("data-entrance", "ready");
  const beats = await page.evaluate(() => new Promise<string[]>((resolve) => {
    const scene = document.querySelector("#dominion")!;
    const records: string[] = [];
    const observer = new MutationObserver(() => {
      records.push(scene.getAttribute("data-entrance")!);
      if (records.at(-1) === "complete") { observer.disconnect(); resolve(records); }
    });
    observer.observe(scene, { attributes: true, attributeFilter: ["data-entrance"] });
    scene.scrollIntoView({ behavior: "instant", block: "start" });
  }));
  expect(beats).toEqual(["silence", "trace", "red", "signal", "resolve", "phrase", "title", "complete"]);
  await expect(page.locator(".dominion-image")).toHaveCSS("opacity", "1");
  await expect(page.locator(".dominion-copy > .metadata-rail")).toHaveCSS("opacity", "1");
  await page.screenshot({ path: testInfo.outputPath("dominion-resolved.png") });
  await page.reload();
  await page.locator("#dominion").evaluate((node) => node.scrollIntoView({ behavior: "instant" }));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator("#dominion")).toHaveAttribute("data-entrance", "static");
  await expect(page.locator(".dominion-image")).toHaveCSS("opacity", "1");
  await expect(page.locator(".dominion-heading h2")).toHaveCSS("opacity", "1");
});

test("keyboard focus keeps navigation readable during the blackout cut", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#blackout")).toHaveAttribute("data-phase", "ready");
  await page.locator("#blackout").evaluate((node) => node.setAttribute("data-phase", "dark"));
  await expect(page.locator(".tactical-header")).toHaveCSS("opacity", "0.03");
  await page.locator(".tactical-header a").first().evaluate((node: HTMLAnchorElement) => node.focus({ preventScroll: true }));
  await expect(page.locator(".tactical-header")).toHaveCSS("opacity", "1");
});
