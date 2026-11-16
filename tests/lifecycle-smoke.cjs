/* Run with Vite on port 5173: node tests/lifecycle-smoke.cjs */
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const BASE = process.env.WOL_TEST_URL || "http://127.0.0.1:5173";
const KEY = "kikkey.weight-of-light.v1";
const SETTINGS = "kikkey.weight-of-light.settings.v1";
const results = [];
let browser;
async function fresh(init) {
  const context = await browser.newContext({
    viewport: { width: 1200, height: 900 },
    reducedMotion: "reduce",
  });
  await context.route("**/@vite/client", (route) =>
    route.fulfill({
      status: 200,
      contentType: "text/javascript",
      body: `
    const styles=new Map();
    export function updateStyle(id,css){let el=styles.get(id);if(!el){el=document.createElement('style');styles.set(id,el);document.head.append(el);}el.textContent=css;}
    export function removeStyle(id){styles.get(id)?.remove();styles.delete(id);}
    export function createHotContext(){return {accept(){},dispose(){},prune(){},invalidate(){},on(){},off(){},send(){},data:{}};}
    export function injectQuery(url,query){return url+(url.includes('?')?'&':'?')+query;}
  `,
    }),
  );
  await context.addInitScript(
    ({ SETTINGS }) => {
      try {
        localStorage.setItem(
          SETTINGS,
          JSON.stringify({ reducedMotion: true, quality: "low", muted: true }),
        );
      } catch {}
    },
    { SETTINGS },
  );
  if (init) await context.addInitScript(init);
  const page = await context.newPage();
  page.unhandled = [];
  page.on("pageerror", (error) => page.unhandled.push(error.message));
  await page.goto(BASE + "/?lang=en");
  await page.waitForFunction(() => !!window.__weightOfLight);
  return { context, page };
}
async function started(page) {
  await page.locator('[data-act="begin"]').click();
  await idle(page);
}
async function idle(page) {
  await page.waitForFunction(
    () =>
      window.__weightOfLight &&
      !window.__weightOfLight.busy &&
      ["playing", "tutorial", "won"].includes(window.__weightOfLight.status),
    null,
    { timeout: 45000 },
  );
}
async function take(page) {
  await page.locator('[data-action-id="take"]').click();
  await page.locator('[data-act="confirm-action"]').click();
  await idle(page);
}
async function check(name, fn) {
  const start = Date.now();
  try {
    const detail = await fn();
    results.push({ name, status: "passed", ms: Date.now() - start, detail });
    console.log("PASS", name);
  } catch (error) {
    results.push({
      name,
      status: "failed",
      ms: Date.now() - start,
      error: error.stack,
    });
    console.error("FAIL", name, error.message);
  }
}
(async () => {
  browser = await chromium.launch({
    executablePath: "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox", "--enable-unsafe-swiftshader"],
  });
  await check(
    "corrupt JSON and malformed completed records return to playable menu",
    async () => {
      const { context, page } = await fresh();
      try {
        const secondChapter = await page.evaluate(async () => {
          const { createState } = await import("/src/game.js");
          return createState(1);
        });
        const records = [
          '{"broken":',
          JSON.stringify({
            version: 1,
            state: secondChapter,
            history: [],
            completed: [null],
          }),
          JSON.stringify({
            version: 1,
            state: secondChapter,
            history: [],
            completed: [{ moves: 0, collected: [{}] }],
          }),
          JSON.stringify({
            version: 1,
            state: secondChapter,
            history: [],
            completed: [{ moves: -1, collected: [] }],
          }),
        ];
        for (const raw of records) {
          await page.evaluate(
            ({ KEY, raw }) => localStorage.setItem(KEY, raw),
            { KEY, raw },
          );
          await page.reload();
          assert.equal(
            await page.evaluate(() => window.__weightOfLight.storageError),
            "saveCorrupt",
          );
          assert.equal(await page.locator('[data-act="continue"]').count(), 0);
          await started(page);
          assert.equal(
            await page.evaluate(() => window.__weightOfLight.state.chapter),
            0,
          );
          await page.evaluate(() => window.__weightOfLight.exit());
        }
        assert.deepEqual(page.unhandled, []);
        return { corruptRecords: records.length };
      } finally {
        await context.close();
      }
    },
  );
  await check(
    "denied localStorage still permits starting and transferring light",
    async () => {
      const { context, page } = await fresh(() => {
        Storage.prototype.getItem = () => {
          throw new DOMException("Denied", "SecurityError");
        };
        Storage.prototype.setItem = () => {
          throw new DOMException("Denied", "SecurityError");
        };
      });
      try {
        await started(page);
        await take(page);
        assert.equal(
          await page.evaluate(() => window.__weightOfLight.state.carry),
          1,
        );
        assert.equal(
          await page.evaluate(() => window.__weightOfLight.storageError),
          "saveUnavailable",
        );
        assert.deepEqual(page.unhandled, []);
      } finally {
        await context.close();
      }
    },
  );
  await check(
    "WebGL context loss gives retry and restores saved puzzle state",
    async () => {
      const { context, page } = await fresh();
      try {
        await started(page);
        await take(page);
        const before = await page.evaluate(() =>
          window.__weightOfLight.getState(),
        );
        const supported = await page.evaluate(() => {
          const gl = document
            .querySelector(".scene-host canvas")
            .getContext("webgl2");
          const lose = gl.getExtension("WEBGL_lose_context");
          if (!lose) return false;
          lose.loseContext();
          return true;
        });
        assert.equal(supported, true, "WEBGL_lose_context is available");
        await page.waitForFunction(
          () => window.__weightOfLight.status === "error",
        );
        assert.equal(
          await page.evaluate(() => window.__weightOfLight.errorKey),
          "contextLost",
        );
        await page.locator('[data-act="retry"]').click();
        await idle(page);
        assert.deepEqual(
          await page.evaluate(() => window.__weightOfLight.getState()),
          before,
        );
        assert.equal(await page.locator(".scene-host canvas").count(), 1);
        assert.deepEqual(page.unhandled, []);
      } finally {
        await context.close();
      }
    },
  );
  await check(
    "destroy while GLB is loading cleans canvas and event handlers after settlement",
    async () => {
      const { context, page } = await fresh();
      let release, requestSeen;
      const seen = new Promise((r) => (requestSeen = r));
      const wait = new Promise((r) => (release = r));
      try {
        await page.route("**/models/town.glb", async (route) => {
          requestSeen();
          await wait;
          await route.continue();
        });
        await page.locator('[data-act="begin"]').click();
        await seen;
        const during = await page.evaluate(() => ({
          status: window.__weightOfLight.status,
          canvases: document.querySelectorAll(".scene-host canvas").length,
        }));
        assert.equal(during.status, "loading");
        assert.equal(during.canvases, 1);
        await page.evaluate(() => {
          const app = window.__weightOfLight;
          app.destroy();
          window.eventCalls = 0;
          app.handle = () => window.eventCalls++;
          app.pause = () => window.eventCalls++;
          app.root.innerHTML =
            '<button data-act="begin">Probe detached callbacks</button>';
          Object.defineProperty(document, "hidden", {
            get: () => true,
            configurable: true,
          });
          app.root.querySelector("button").click();
          document.dispatchEvent(new Event("visibilitychange"));
        });
        release();
        await page.waitForTimeout(1800);
        const after = await page.evaluate(() => ({
          canvases: document.querySelectorAll("canvas").length,
          labels: document.querySelectorAll(".world-labels").length,
          callbacks: window.eventCalls,
          scene: window.__weightOfLight.scene,
          destroyed: window.__weightOfLight.destroyed,
        }));
        assert.deepEqual(after, {
          canvases: 0,
          labels: 0,
          callbacks: 0,
          scene: null,
          destroyed: true,
        });
        assert.deepEqual(page.unhandled, []);
        return { during, after };
      } finally {
        release?.();
        await context.close();
      }
    },
  );
  await check(
    "repeated exit/start and module mount/destroy leave one active canvas",
    async () => {
      const { context, page } = await fresh();
      try {
        for (let i = 0; i < 3; i++) {
          await started(page);
          assert.equal(await page.locator(".scene-host canvas").count(), 1);
          assert.equal(await page.locator(".world-labels").count(), 1);
          await page.locator('.topbar [data-act="pause"]').click();
          await page.locator('[data-act="exit"]').click();
          assert.equal(await page.locator("canvas").count(), 0);
          assert.equal(await page.locator(".world-labels").count(), 0);
        }
        await page.evaluate(async () => {
          window.__weightOfLight.destroy();
          const { mount } = await import("/src/main.js");
          window.__weightOfLight = mount(document.querySelector("#app"));
        });
        await started(page);
        assert.equal(await page.locator("canvas").count(), 1);
        assert.deepEqual(page.unhandled, []);
        return { cycles: 3, remount: true };
      } finally {
        await context.close();
      }
    },
  );
  await check(
    "pause freezes transitions and ignores keyboard puzzle actions",
    async () => {
      const { context, page } = await fresh();
      try {
        await started(page);
        await take(page);
        const before = await page.evaluate(() =>
          window.__weightOfLight.getState(),
        );
        await page.locator('.topbar [data-act="pause"]').click();
        assert.equal(
          await page.evaluate(() => window.__weightOfLight.status),
          "paused",
        );
        await page.keyboard.press("z");
        await page.keyboard.press("ArrowRight");
        await page.waitForTimeout(200);
        assert.deepEqual(
          await page.evaluate(() => window.__weightOfLight.getState()),
          before,
        );
        await page.locator('[data-act="resume"]').click();
        await idle(page);
        await page.evaluate(() => {
          const app = window.__weightOfLight;
          app.scene.setOptions({ reducedMotion: false });
          app.perform("walk:aR");
          app.pause();
        });
        const frozen = await page.evaluate(() => ({
          busy: window.__weightOfLight.busy,
          status: window.__weightOfLight.status,
          state: window.__weightOfLight.getState(),
        }));
        await page.waitForTimeout(950);
        assert.deepEqual(
          await page.evaluate(() => ({
            busy: window.__weightOfLight.busy,
            status: window.__weightOfLight.status,
            state: window.__weightOfLight.getState(),
          })),
          frozen,
        );
        await page.locator('[data-act="resume"]').click();
        await idle(page);
        assert.equal(
          await page.evaluate(() => window.__weightOfLight.state.node),
          "aR",
        );
        assert.deepEqual(page.unhandled, []);
        return { transitionPaused: frozen.busy };
      } finally {
        await context.close();
      }
    },
  );
  await check(
    "physical KeyZ works after action UI rerender without refocusing root",
    async () => {
      const { context, page } = await fresh();
      try {
        await started(page);
        const before = await page.evaluate(() =>
          window.__weightOfLight.getState(),
        );
        await take(page);
        const focus = await page.evaluate(() => ({
          inside: document
            .querySelector("#app")
            .contains(document.activeElement),
          tag: document.activeElement.tagName,
          action: document.activeElement.dataset.act || null,
        }));
        assert.equal(
          focus.inside,
          true,
          "focus remains in game after action buttons rerender",
        );
        await page.keyboard.press("KeyZ");
        await idle(page);
        assert.deepEqual(
          await page.evaluate(() => window.__weightOfLight.getState()),
          before,
        );
        assert.deepEqual(page.unhandled, []);
        return { focus };
      } finally {
        await context.close();
      }
    },
  );
  const report = {
    date: new Date().toISOString(),
    browser: await browser.version(),
    base: BASE,
    results,
  };
  await fs.mkdir(path.resolve(__dirname, "../test-results"), {
    recursive: true,
  });
  await fs.writeFile(
    path.resolve(__dirname, "../test-results/lifecycle-results.json"),
    JSON.stringify(report, null, 2),
  );
  await fs.writeFile(
    path.resolve(__dirname, "../docs/LIFECYCLE.md"),
    [
      "# Lifecycle and failure-path checks",
      "",
      `Run: ${report.date}. Chromium ${report.browser}; headless software WebGL on cloud Linux.`,
      "",
      "Command: `node tests/lifecycle-smoke.cjs` with Vite at `http://127.0.0.1:5173`. The test blocks Vite’s HMR client to keep source edits by other agents from resetting active checks.",
      "",
      ...results.map(
        (r) =>
          `- ${r.status.toUpperCase()}: ${r.name}${r.error ? " — " + r.error.split("\n")[0] : ""}`,
      ),
      "",
      `Result: ${results.filter((r) => r.status === "passed").length} passed; ${results.filter((r) => r.status === "failed").length} failed.`,
      "",
      "These checks exercise corrupted persistence, blocked storage, WebGL loss/recovery, an in-flight model request at destruction, repeated starts, abortable event subscriptions, pause, and physical keyboard undo. They do not establish a browser heap/GPU memory profile or physical-device performance. In-flight fetch cancellation is not asserted; cleanup after its completion is asserted.",
      "",
    ].join("\n"),
  );
  await browser.close();
  if (results.some((r) => r.status === "failed")) process.exitCode = 1;
})().catch(async (e) => {
  console.error(e);
  await browser?.close();
  process.exitCode = 1;
});
