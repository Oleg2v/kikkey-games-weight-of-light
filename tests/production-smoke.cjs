/* Validate dist under a GitHub Pages-style project subpath. No debug API used. */
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
(async () => {
  const { createState, solve, apply } = await import("../src/game.js");
  const errors = [],
    failed = [];
  const browser = await chromium.launch({
    executablePath: "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox", "--enable-unsafe-swiftshader"],
  });
  try {
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
    });
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("response", (r) => {
      if (r.status() >= 400) failed.push([r.status(), r.url()]);
    });
    await page.addInitScript(() =>
      localStorage.setItem(
        "kikkey.weight-of-light.settings.v1",
        JSON.stringify({ reducedMotion: true, muted: true, quality: "low" }),
      ),
    );
    await page.goto(
      process.env.WOL_TEST_URL ||
        "http://127.0.0.1:4174/kikkey-games-weight-of-light/?lang=en",
    );
    assert.equal(
      await page.evaluate(() => typeof window.__weightOfLight),
      "undefined",
    );
    await page.locator("[data-act=begin]").click();
    await page.locator("[data-action-id=take]").waitFor();
    let count = 0;
    for (let chapter = 0; chapter < 4; chapter++) {
      let state = createState(chapter);
      const plan = solve(state, chapter === 3 ? "homes" : undefined);
      for (const id of plan) {
        await page.locator(`[data-action-id="${id}"]`).click();
        if (await page.locator("[data-act=confirm-action]").count())
          await page.locator("[data-act=confirm-action]").click();
        if (id.startsWith("finish:")) {
          await page.locator(`[data-act="finish:${id}"]`).click();
          await page.locator("[data-act=replay]").waitFor();
        } else if (id === "listen" || id.startsWith("read:")) {
          await page.locator(".modal").waitFor();
          await page.locator(".modal [data-act=close]").first().click();
        } else
          await page.waitForFunction(() =>
            [...document.querySelectorAll(".actions button")].some(
              (b) => !b.disabled,
            ),
          );
        state = apply(state, id);
        count++;
      }
      if (chapter < 3) await page.locator("[data-act=next]").click();
    }
    assert.equal(await page.locator(".commission a").count(), 3);
    assert.deepEqual(errors, []);
    assert.deepEqual(failed, []);
    await page.screenshot({
      path: "test-results/production-mobile-ending.png",
      fullPage: true,
    });
    console.log(
      JSON.stringify({
        status: "PASS",
        actions: count,
        chapters: 4,
        ending: "homes",
        viewport: "390x844",
        subpath: true,
        debugAPI: false,
        errors,
        failed,
      }),
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
