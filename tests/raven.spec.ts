import { expect, test } from "@playwright/test";

const records = [
  ["warden", "ELIAS KANE", "COMMAND LINK", [96, 89, 82, 84, 73, 64]],
  ["ghost", "AMARA OKAFOR", "DEAD SILENCE", [91, 98, 61, 76, 86, 94]],
  ["atlas", "VIKTOR VOLKOV", "HOLD THE LINE", [74, 72, 99, 93, 52, 31]],
  ["cipher", "KENJI SATO", "BLACKOUT", [99, 77, 43, 72, 91, 85]],
  ["pulse", "SOFIA ALVAREZ", "SECOND WIND", [88, 81, 69, 96, 90, 66]],
] as const;

test("Directive restores control, Raven retains its introduction and closing", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page.locator("#architect").scrollIntoViewIfNeeded();
  await expect(page.locator(".briefing-shell")).toHaveAttribute("data-hostile", "true");
  await page.locator("#directive-five").evaluate((node) => node.scrollIntoView({ behavior: "instant" }));
  await expect(page.locator(".briefing-shell")).toHaveAttribute("data-hostile", "false");
  await expect(page.getByRole("heading", { name: "WHEN COMMAND FAILS, FIVE REMAIN." })).toBeVisible();
  await page.locator(".program-identity").scrollIntoViewIfNeeded();
  await expect(page.locator(".identity-v")).toHaveCSS("opacity", "1");
  await page.locator("#directive-five").screenshot({ path: testInfo.outputPath("directive-five.png") });
  await page.getByRole("link", { name: "03 OPERATORS", exact: true }).click();
  await expect(page.getByRole("link", { name: "03 OPERATORS", exact: true })).toHaveAttribute("aria-current", "location");
  await page.locator(".raven-intro").screenshot({ path: testInfo.outputPath("raven-intro.png") });
  await page.locator(".raven-closing").scrollIntoViewIfNeeded();
  await expect(page.locator(".unit-five li")).toHaveText(["01", "02", "03", "04", "05"]);
  await expect(page.locator(".unit-promise")).toHaveText("FIVE GO IN.FIVE COME OUT.");
  await expect(page.locator("#raven")).not.toContainText("OPERATOR 06");
  expect(errors).toEqual([]);
});

for (const [width, motion] of [[320, "reduce"], [390, "no-preference"], [768, "no-preference"], [1024, "no-preference"], [1100, "no-preference"], [1440, "reduce"], [1920, "no-preference"]] as const) {
  test(`all five dossiers remain readable at ${width}px / ${motion}`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: motion });
    await page.goto("/#raven");
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator(".operator-archive")).toHaveAttribute("data-ready", "true");
    for (const [id, name, capability, stats] of records) {
      await page.locator(`.raven-roster a[href="#operator-${id}"]`).click();
      const dossier = page.locator(`#operator-${id}`);
      await expect(page.locator(".operator-archive")).toHaveAttribute("data-active", id);
      await expect(dossier.locator(".operator-intel-slot")).toHaveCSS("opacity", "1");
      await dossier.locator(".operator-inline-image").scrollIntoViewIfNeeded();
      await expect(dossier.locator("img")).toHaveJSProperty("complete", true);
      expect(await dossier.locator("img").evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
      await expect(dossier.locator("img")).toHaveAttribute("loading", "lazy");
      await expect(dossier.locator(".operator-name")).toHaveText(name);
      await expect(dossier.locator("h4")).toHaveText(capability);
      await expect(dossier.locator(".operator-stats dd")).toHaveText(stats.map(String));
      await expect(dossier.locator(".operator-intel-slot")).not.toHaveAttribute("inert");
      const outside = await dossier.locator("h3, h4, dt, dd").evaluateAll((nodes) => nodes.filter((node) => {
        const rect = node.getBoundingClientRect();
        return rect.left < -1 || rect.right > innerWidth + 1;
      }).map((node) => node.textContent));
      expect(outside).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await dossier.screenshot({ path: testInfo.outputPath(`${id}-${width}.png`) });
    }
    if (motion === "reduce" || width < 1100) await expect(page.locator("video")).toHaveCount(0);
  });
}

test("Cipher disrupts only its local readout once, reduced motion reveals all beats", async ({ page }) => {
  await page.goto("/#raven");
  await expect(page.locator(".cipher-readout")).toHaveAttribute("data-state", "ready");
  await page.evaluate(() => {
    const readout = document.querySelector(".cipher-readout")!;
    (window as unknown as { cipherStates: string[] }).cipherStates = [];
    new MutationObserver(() => {
      (window as unknown as { cipherStates: string[] }).cipherStates.push(readout.getAttribute("data-state")!);
    }).observe(readout, { attributes: true, attributeFilter: ["data-state"] });
  });
  await page.locator('.raven-roster a[href="#operator-cipher"]').click();
  await page.locator(".cipher-readout").scrollIntoViewIfNeeded();
  await expect(page.locator(".cipher-readout")).toHaveAttribute("data-state", "restored");
  expect(await page.evaluate(() => (window as unknown as { cipherStates: string[] }).cipherStates)).toEqual(["access", "compromised", "restored"]);
  await page.locator('.raven-roster a[href="#operator-pulse"]').click();
  await page.locator('.raven-roster a[href="#operator-cipher"]').click();
  await expect(page.locator(".cipher-readout")).toHaveAttribute("data-state", "restored");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".cipher-readout")).toHaveAttribute("data-state", "static");
  for (const step of await page.locator(".cipher-readout li").all()) await expect(step).toHaveCSS("opacity", "1");
});

test("keyboard selectors transfer focus and Escape returns the desktop lineup to rest", async ({ page }) => {
  await page.goto("/#raven");
  const links = page.locator(".raven-roster a");
  await links.first().focus();
  await expect(page.locator(".operator-archive")).toHaveAttribute("data-active", "warden");
  await page.keyboard.press("ArrowRight");
  await expect(links.nth(1)).toBeFocused();
  await expect(page.locator(".operator-archive")).toHaveAttribute("data-active", "ghost");
  await page.keyboard.press("End");
  await expect(links.last()).toBeFocused();
  await expect(page.locator(".operator-archive")).toHaveAttribute("data-active", "pulse");
  await page.keyboard.press("Home");
  await expect(links.first()).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.locator(".operator-archive")).toHaveAttribute("data-active", "none");
  await page.keyboard.press("Enter");
  await expect(page.locator(".operator-archive")).toHaveAttribute("data-active", "warden");
  await page.locator("#operator-warden .operator-select").focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("#operator-ghost .operator-select")).toBeFocused();
  await expect(page.locator(".operator-archive")).toHaveAttribute("data-active", "ghost");
});

test("all records and personnel anchors work without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(`${process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000"}/#raven`);
  await page.evaluate(() => document.fonts.ready);
  const ghost = page.getByRole("link", { name: "02 GHOST", exact: true });
  await ghost.focus();
  await expect(ghost).toBeInViewport();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#operator-ghost$/);
  await expect(page.locator("#operator-ghost .operator-inline-image")).toBeInViewport();
  for (const [id] of records) await expect(page.locator(`#${id}-title`)).toBeVisible();
  await expect(page.locator(".cipher-readout")).toHaveAttribute("data-state", "static");
  await expect(page.locator("video")).toHaveCount(0);
  await context.close();
});
