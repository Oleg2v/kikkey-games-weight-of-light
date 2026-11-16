/* Real UI acceptance checks. Run: node tests/browser-smoke.cjs
   Requires running Vite on 127.0.0.1:5173 and the platform Playwright module. */
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "test-results");
const BASE = process.env.WOL_TEST_URL || "http://127.0.0.1:5173";
const KEY = "kikkey.weight-of-light.v1",
  SETTINGS = "kikkey.weight-of-light.settings.v1";
const results = [],
  failures = [],
  errors = [];
let browser, page;
async function check(name, fn) {
  const started = Date.now();
  try {
    const detail = await fn();
    results.push({ name, status: "passed", ms: Date.now() - started, detail });
    console.log("PASS", name, detail ? JSON.stringify(detail) : "");
  } catch (e) {
    const item = {
      name,
      status: "failed",
      ms: Date.now() - started,
      error: e.stack || String(e),
    };
    results.push(item);
    failures.push(item);
    console.error("FAIL", name, e.message);
    await page
      ?.screenshot({
        path: path.join(OUT, `failure-${results.length}.png`),
        fullPage: true,
      })
      .catch(() => {});
  }
}
async function ready() {
  await page.waitForFunction(
    () =>
      window.__weightOfLight &&
      !window.__weightOfLight.busy &&
      ["playing", "tutorial", "won"].includes(window.__weightOfLight.status),
    null,
    { timeout: 45000 },
  );
}
async function begin(lang = "en", viewport = { width: 1440, height: 900 }) {
  await page.setViewportSize(viewport);
  await page.goto(BASE + "/?lang=" + lang);
  await page.evaluate(
    ({ KEY, SETTINGS }) => {
      localStorage.removeItem(KEY);
      localStorage.setItem(
        SETTINGS,
        JSON.stringify({ reducedMotion: true, quality: "low", muted: true }),
      );
    },
    { KEY, SETTINGS },
  );
  await page.reload();
  await page.locator('[data-act="begin"]').click();
  await ready();
}
async function state() {
  return page.evaluate(() => window.__weightOfLight.getState());
}
async function closeModal() {
  if (await page.locator('.modal [data-act="close"]').count())
    await page.locator('.modal [data-act="close"]').first().click();
}
async function act(id) {
  await ready();
  await page.locator(`[data-action-id="${id}"]`).click();
  if (await page.locator('[data-act="confirm-action"]').count())
    await page.locator('[data-act="confirm-action"]').click();
  if (id.startsWith("finish:"))
    await page.locator(`[data-act="finish:${id}"]`).click();
  await page.waitForFunction(() => !window.__weightOfLight.busy, null, {
    timeout: 45000,
  });
  if (!id.startsWith("finish:")) await closeModal();
  await ready();
}
async function solveChapter(goal) {
  const plan = await page.evaluate(async (goal) => {
    const g = await import("/src/game.js");
    return g.solve(window.__weightOfLight.getState(), goal);
  }, goal);
  assert.ok(Array.isArray(plan), "solver found a route");
  for (const id of plan) await act(id);
  return plan.length;
}
async function screenshot(name) {
  await page.screenshot({
    path: path.join(OUT, name + ".png"),
    fullPage: true,
  });
}
async function metrics() {
  return page.evaluate(() => {
    const w = document.documentElement.clientWidth;
    return {
      width: w,
      scrollWidth: document.documentElement.scrollWidth,
      height: innerHeight,
      scrollHeight: document.documentElement.scrollHeight,
      dir: document.querySelector("#app").dir,
      overflow: [
        ...document.querySelectorAll(
          ".interface button,.interface select,.chapter-goal,.modal button,.modal p",
        ),
      ]
        .filter((e) => {
          const r = e.getBoundingClientRect();
          return r.width && (r.right > w + 2 || r.left < -2);
        })
        .map((e) => ({
          tag: e.tagName,
          text: e.textContent?.slice(0, 50),
          rect: {
            x: e.getBoundingClientRect().x,
            width: e.getBoundingClientRect().width,
          },
        })),
    };
  });
}
(async () => {
  await fs.mkdir(OUT, { recursive: true });
  browser = await chromium.launch({
    executablePath: "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox", "--enable-unsafe-swiftshader"],
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
  });
  await context.addInitScript(() => {
    const Native = window.WebSocket;
    window.WebSocket = class extends Native {
      addEventListener(type, listener, options) {
        if (type === "message")
          return super.addEventListener(
            type,
            function (e) {
              try {
                if (
                  ["full-reload", "update", "prune"].includes(
                    JSON.parse(e.data).type,
                  )
                )
                  return;
              } catch {}
              listener.call(this, e);
            },
            options,
          );
        return super.addEventListener(type, listener, options);
      }
    };
  });
  page = await context.newPage();
  page.on("pageerror", (e) =>
    errors.push({ type: "pageerror", message: e.message }),
  );
  page.on("console", (m) => {
    if (m.type() === "error")
      errors.push({
        type: "console",
        message: m.text(),
        location: m.location(),
      });
  });
  page.on("response", (response) => {
    if (response.status() >= 400)
      errors.push({
        type: "http",
        status: response.status(),
        url: response.url(),
      });
  });
  if (process.argv.includes("--resources")) {
    await check("current resource and browser error retest", async () => {
      for (const lang of ["ru", "en", "he"]) {
        await begin(lang);
        await act("take");
      }
      assert.deepEqual(errors, []);
      return {
        languages: ["ru", "en", "he"],
        failedRequests: 0,
        consoleErrors: 0,
        pageErrors: 0,
      };
    });
    const retest = {
      date: new Date().toISOString(),
      browser: await browser.version(),
      results,
      errors,
    };
    await fs.writeFile(
      path.join(OUT, "resource-retest.json"),
      JSON.stringify(retest, null, 2),
    );
    await fs.appendFile(
      path.join(ROOT, "docs/QA.md"),
      "\n## Resource retest\n\n" +
        retest.date +
        ": " +
        (failures.length ? "FAILED" : "PASSED") +
        " fresh RU/EN/HE loading and first transfer. Failed HTTP responses, console errors, and unhandled page errors: " +
        errors.length +
        ". Run `node tests/browser-smoke.cjs --resources`. The original isolated 404 occurred while assets and page metadata were still being edited; its URL was not recorded, so its exact origin is unconfirmed. The current retest records URLs and passes only if no resource/browser errors occur.\n",
    );
    await browser.close();
    if (failures.length) process.exitCode = 1;
    return;
  }
  for (const [lang, ending] of [
    ["ru", "homes"],
    ["en", "memorial"],
    ["he", "homes"],
  ])
    await check(`full UI journey ${lang} → ${ending}`, async () => {
      await begin(lang);
      await screenshot(`${lang}-01-start`);
      let actions = 0;
      for (let chapter = 0; chapter < 4; chapter++) {
        assert.equal((await state()).chapter, chapter);
        actions += await solveChapter(chapter === 3 ? ending : undefined);
        console.log("CHAPTER", lang, chapter + 1, "complete");
        await screenshot(
          `${lang}-0${chapter + 1}-${chapter === 3 ? "ending" : "complete"}`,
        );
        if (chapter < 3) {
          await page.locator('[data-act="next"]').click();
          await ready();
        }
      }
      const s = await state();
      assert.equal(s.ending, ending);
      assert.equal(await page.locator(".modal .commission a").count(), 3);
      assert.ok(await page.locator('[data-act="replay"]').isVisible());
      return { actions, ending, moves: s.moves, chapters: 4 };
    });
  await check(
    "language switch preserves state; transfer preview, undo, reload and restart",
    async () => {
      await begin("ru");
      const initial = await state();
      await page.locator('[data-action-id="take"]').click();
      assert.deepEqual(
        await state(),
        initial,
        "forecast must not mutate state",
      );
      await page.locator('[data-act="cancel-action"]').click();
      assert.deepEqual(await state(), initial);
      await act("take");
      const moved = await state();
      for (const lang of ["en", "he", "ru"]) {
        await page.locator('.topbar [data-setting="lang"]').selectOption(lang);
        assert.deepEqual(await state(), moved);
        assert.equal(
          await page.locator("#app").getAttribute("dir"),
          lang === "he" ? "rtl" : "ltr",
        );
      }
      await page.locator('[data-act="undo"]').click();
      await ready();
      assert.deepEqual(await state(), initial);
      await act("take");
      assert.deepEqual(await state(), moved);
      await page.reload();
      await page.locator('[data-act="continue"]').click();
      await ready();
      assert.deepEqual(await state(), moved);
      await page.locator("#app").focus();
      await page.keyboard.press("Escape");
      assert.ok(await page.locator('[data-act="resume"]').isVisible());
      await page.keyboard.press("Escape");
      await ready();
      await page.locator('.topbar [data-act="pause"]').click();
      await page.locator('[data-act="restart"]').click();
      await page.locator('[data-act="do-restart"]').click();
      await ready();
      assert.deepEqual(await state(), initial);
      return {
        preview: true,
        undo: true,
        reload: true,
        keyboardPause: true,
        restart: true,
      };
    },
  );
  for (const viewport of [
    { width: 360, height: 640 },
    { width: 390, height: 844 },
    { width: 844, height: 390 },
    { width: 768, height: 1024 },
    { width: 1440, height: 900 },
  ])
    await check(
      `responsive Hebrew UI ${viewport.width}×${viewport.height}`,
      async () => {
        await begin("he", viewport);
        const before = await metrics();
        assert.ok(
          before.scrollWidth <= before.width + 2,
          JSON.stringify(before),
        );
        assert.equal(before.overflow.length, 0, JSON.stringify(before));
        await page.locator('[data-action-id="take"]').click();
        const forecast = await metrics();
        assert.equal(forecast.overflow.length, 0, JSON.stringify(forecast));
        await screenshot(`he-${viewport.width}x${viewport.height}-forecast`);
        await page.locator('[data-act="confirm-action"]').click();
        await ready();
        for (const b of await page
          .locator(".actions button:enabled,.tools button:enabled")
          .all())
          await b.click({ trial: true, timeout: 5000 });
        await page.locator('.topbar [data-act="pause"]').click();
        await page.locator('[data-act="help"]').click();
        const help = await metrics();
        assert.equal(help.overflow.length, 0, JSON.stringify(help));
        await screenshot(`he-${viewport.width}x${viewport.height}-help`);
        await closeModal();
        return { before, forecast, help };
      },
    );
  await check("pseudo-localization expanded 50% at 360×640", async () => {
    await begin("en", { width: 360, height: 640 });
    await page.evaluate(async () => {
      const { dictionaries } = await import("/src/i18n.js");
      for (const key of Object.keys(dictionaries.en))
        dictionaries.en[key] +=
          " " +
          dictionaries.en[key]
            .replace(/\{\w+\}/g, "")
            .slice(0, Math.ceil(dictionaries.en[key].length * 0.5));
      window.__weightOfLight.render();
    });
    await page.locator('[data-action-id="take"]').click();
    const m = await metrics();
    await screenshot("pseudo-360x640");
    assert.equal(m.overflow.length, 0, JSON.stringify(m));
    return m;
  });
  await check("corrupt saved state offers a new game", async () => {
    await page.goto(BASE + "/?lang=en");
    await page.evaluate((KEY) => localStorage.setItem(KEY, '{"broken":'), KEY);
    await page.reload();
    assert.ok(await page.locator('[data-act="begin"]').isVisible());
    assert.ok(
      (await page.locator(".small-notice").textContent()).includes(
        "could not be read",
      ),
    );
    await page.locator('[data-act="begin"]').click();
    await ready();
    assert.equal((await state()).chapter, 0);
  });
  await check("denied localStorage does not prevent play", async () => {
    const isolated = await browser.newContext({
      viewport: { width: 390, height: 844 },
      reducedMotion: "reduce",
    });
    const previous = page;
    page = await isolated.newPage();
    await page.addInitScript(() => {
      Storage.prototype.getItem = () => {
        throw new DOMException("Denied", "SecurityError");
      };
      Storage.prototype.setItem = () => {
        throw new DOMException("Denied", "SecurityError");
      };
    });
    try {
      await page.goto(BASE + "/?lang=en");
      await page.locator('[data-act="begin"]').click();
      await ready();
      await act("take");
      assert.equal((await state()).carry, 1);
      assert.equal(
        await page.evaluate(() => window.__weightOfLight.storageError),
        "saveUnavailable",
      );
    } finally {
      await isolated.close();
      page = previous;
    }
  });
  await check("software renderer timing sample, desktop", async () => {
    await begin("en");
    await act("take");
    const sample = await page.evaluate(
      () =>
        new Promise((resolve) => {
          const gaps = [];
          let last = performance.now(),
            start = last;
          function frame(now) {
            gaps.push(now - last);
            last = now;
            if (now - start < 1800) requestAnimationFrame(frame);
            else {
              gaps.sort((a, b) => a - b);
              resolve({
                frames: gaps.length,
                durationMs: now - start,
                meanFps: (gaps.length * 1000) / (now - start),
                p95Ms: gaps[Math.floor(gaps.length * 0.95)],
                renderer:
                  "Chromium software WebGL; cloud Linux; not a real phone",
              });
            }
          }
          requestAnimationFrame(frame);
        }),
    );
    return sample;
  });
  await check("no unhandled browser errors during acceptance run", async () => {
    assert.deepEqual(errors, []);
  });
  const report = {
    date: new Date().toISOString(),
    browser: await browser.version(),
    base: BASE,
    results,
    errors,
  };
  await fs.writeFile(
    path.join(OUT, "browser-results.json"),
    JSON.stringify(report, null, 2),
  );
  const lines = [
    "# Browser acceptance checks",
    "",
    `Run: ${report.date}`,
    `Browser: ${report.browser} on cloud Linux, headless Chromium with software WebGL. This is not physical-device or hardware GPU validation.`,
    "",
    "Command: `node tests/browser-smoke.cjs` with Vite running on port 5173.",
    "",
    ...results.map(
      (r) =>
        `- ${r.status.toUpperCase()}: ${r.name}${r.status === "failed" ? " — " + r.error.split("\n")[0] : ""}`,
    ),
    "",
    "The main playthroughs use a state-space solver only to choose legal actions, then click visible game buttons and confirmations. No game state is injected. Screenshots and detailed timings are in `test-results/`.",
    "",
    `Totals: ${results.length - failures.length} passed, ${failures.length} failed.`,
    "",
    "Limits: not a native-speaker review of Hebrew; no physical phone/audio listening panel; no 8–12 minute human playtest. Software-renderer frame timings cannot establish the 60/30 FPS target on target devices.",
  ];
  await fs.writeFile(path.join(ROOT, "docs/QA.md"), lines.join("\n") + "\n");
  await browser.close();
  if (failures.length) process.exitCode = 1;
})().catch(async (e) => {
  console.error(e);
  await browser?.close();
  process.exitCode = 1;
});
