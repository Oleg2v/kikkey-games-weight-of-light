import "@fontsource-variable/manrope";
import "@fontsource-variable/assistant";
import "@fontsource/cormorant-garamond/400.css";
import "./style.css";
import {
  LEVELS,
  createState,
  actions,
  apply,
  solve,
  isComplete,
  validateState,
  height,
  connections,
} from "./game.js";
import { t, number, languages } from "./i18n.js";
import { Soundscape } from "./audio.js";

const KEY = "kikkey.weight-of-light.v1",
  SETTINGS = "kikkey.weight-of-light.settings.v1";
const escape = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const icons = {
  pause: '<path d="M8 5v14M16 5v14"/>',
  undo: '<path d="M4 10h10a6 6 0 0 1 0 12M4 10l5-5M4 10l5 5"/>',
  journal:
    '<path d="M12 6c-4-3-9-2-9-2v15s5-1 9 2c4-3 9-2 9-2V4s-5-1-9 2v15"/>',
  hint: '<path d="M9 18h6M9 21h6M8 14a7 7 0 1 1 8 0l-1 2H9z"/>',
  sound: '<path d="m4 9 5 0 5-4v14l-5-4H4zM18 8a6 6 0 0 1 0 8"/>',
  arrow: '<path d="M4 12h15m-6-6 6 6-6 6"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  star: '<path d="m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5z"/>',
  case: '<rect x="3" y="7" width="18" height="14" rx="3"/><path d="M8 7V4h8v3M3 13h18M10 12v3h4v-3"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
};
const icon = (name) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.star}</svg>`;
const skyline = `<svg class="intro-art" viewBox="0 0 800 800" fill="none" aria-hidden="true"><defs><radialGradient id="halo"><stop stop-color="#e4bb72" stop-opacity=".25"/><stop offset="1" stop-color="#e4bb72" stop-opacity="0"/></radialGradient><linearGradient id="tower" x2="1" y2="1"><stop stop-color="#cdbd9a"/><stop offset="1" stop-color="#52616a"/></linearGradient></defs><circle cx="440" cy="240" r="210" fill="url(#halo)"/><g stroke="#a18f71" stroke-width="1"><path d="M100 0v510M300 0v450M550 0v470M700 0v560"/><path d="m55 510 160-55 145 70-160 65zM450 470l160-55 145 70-160 65z" fill="#23333c"/><path d="m85 405 100-38 90 42v108l-100 35-90-42z" fill="#4b5c64"/><path d="m85 405 42-85 58 47 90 42-42-85-106-4" fill="#283e4c"/><path d="m520 368 90-32 82 40v110l-90 32-82-40z" fill="#b3a88f"/><path d="m520 368 46-75 44 43 82 40-38-73-88-10" fill="#374e5e"/><path d="m180 552 420-34M200 590v140M595 550v160"/><path d="m350 407 35-252 90 0 25 252-70 33z" fill="url(#tower)"/><path d="m385 155 0-49 90 0v49z" fill="#e8cb85"/><path d="m375 106 55-55 55 55z" fill="#384e5d"/><path d="m430 51 0-33M375 165h110M363 310l123-2"/><path d="m408 420 0-49q21-26 43-3v57" fill="#20313d"/><path d="M150 418v42l23-9v-43zM213 431v38l22 11v-38zM550 381v35l21 10v-35zM622 385v35l24-8v-35z" fill="#f3cd84" stroke="#e6b96e"/></g><circle cx="431" cy="130" r="6" fill="#fff0b2"/><g fill="#ddcba5"><circle cx="235" cy="160" r="1.5"/><circle cx="620" cy="185" r="1.5"/><circle cx="145" cy="245" r="1"/><circle cx="585" cy="70" r="1"/></g></svg>`;

export class WeightOfLight {
  constructor(root, options = {}) {
    this.root = root;
    this.standalone = options.standalone === true;
    this.epoch = 0;
    this.abort = new AbortController();
    this.state = createState();
    this.history = [];
    this.completed = [];
    this.status = "ready";
    this.scene = null;
    this.busy = false;
    this.pending = null;
    this.modal = null;
    this.hintStep = 0;
    this.story = "chapter.0.story";
    this.storageError = null;
    this.saved = null;
    this.settings = {
      music: 0.35,
      effects: 0.65,
      muted: false,
      reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
      quality: "high",
    };
    try {
      const p = JSON.parse(localStorage.getItem(SETTINGS) || "null");
      if (p && typeof p === "object") {
        for (const k of ["music", "effects"])
          if (typeof p[k] === "number")
            this.settings[k] = Math.max(0, Math.min(1, p[k]));
        for (const k of ["muted", "reducedMotion"])
          if (typeof p[k] === "boolean") this.settings[k] = p[k];
        if (["low", "high"].includes(p.quality))
          this.settings.quality = p.quality;
        if (languages.includes(p.lang)) this.lang = p.lang;
      }
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (
          s.version === 1 &&
          validateState(s.state) &&
          Array.isArray(s.history) &&
          s.history.every(
            (x) => validateState(x) && x.chapter === s.state.chapter,
          ) &&
          Array.isArray(s.completed) &&
          s.completed.length === s.state.chapter &&
          s.completed.every(
            (x, i) =>
              x &&
              Number.isInteger(x.moves) &&
              x.moves >= 0 &&
              Array.isArray(x.collected) &&
              x.collected.every((id) => id === `trace${i + 1}`) &&
              new Set(x.collected).size === x.collected.length,
          )
        ) {
          this.saved = s;
        } else this.storageError = "saveCorrupt";
      }
    } catch (e) {
      this.storageError =
        e instanceof SyntaxError ? "saveCorrupt" : "saveUnavailable";
    }
    this.lang =
      new URLSearchParams(location.search).get("lang") || this.lang || "ru";
    if (!languages.includes(this.lang)) this.lang = "ru";
    this.audio = new Soundscape();
    this.audio.setSettings(this.settings);
    this.mount();
  }
  tr(key, p) {
    return t(this.lang, key, p);
  }
  button(
    label,
    act,
    { className = "", symbol, disabled = false, attrs = "" } = {},
  ) {
    return `<button type="button" class="${className}" data-act="${act}" ${disabled ? "disabled" : ""} ${attrs}>${symbol ? icon(symbol) : ""}<span>${escape(label)}</span></button>`;
  }
  mount() {
    this.root.className = "wol";
    this.root.tabIndex = -1;
    this.root.innerHTML =
      '<div class="scene-host"></div><div class="grain"></div><div class="interface"></div><div class="modal-host"></div>';
    this.view = this.root.querySelector(".interface");
    this.host = this.root.querySelector(".scene-host");
    this.modals = this.root.querySelector(".modal-host");
    const signal = this.abort.signal;
    this.root.addEventListener(
      "click",
      (e) => {
        const b = e.target.closest("[data-act]");
        if (b && !b.disabled) this.handle(b.dataset.act, b);
      },
      { signal },
    );
    this.root.addEventListener("change", (e) => this.change(e), { signal });
    window.addEventListener("resize", () => this.layoutScene(), { signal });
    this.root.addEventListener("keydown", (e) => this.key(e), { signal });
    document.addEventListener(
      "visibilitychange",
      () => {
        if (document.hidden && ["playing", "tutorial"].includes(this.status))
          this.pause();
      },
      { signal },
    );
    this.render();
    return this;
  }
  languageControl() {
    return `<label class="lang-label"><span class="sr-only">${escape(this.tr("language"))}</span><select data-setting="lang" aria-label="${escape(this.tr("language"))}">${[
      ["ru", "Русский"],
      ["en", "English"],
      ["he", "עברית"],
    ]
      .map(
        ([v, n]) =>
          `<option value="${v}" ${this.lang === v ? "selected" : ""}>${n}</option>`,
      )
      .join("")}</select></label>`;
  }
  header() {
    return `<header class="topbar"><div class="wordmark">${icon("star")}<span>KIKKEY <small>GAMES</small></span></div><div class="chapter-progress" dir="ltr">${[0, 1, 2, 3].map((i) => `<span class="${this.state.chapter === i ? "current" : this.state.chapter > i ? "done" : ""}">${["I", "II", "III", "IV"][i]}</span>`).join("<i></i>")}</div><nav>${this.languageControl()}${this.button(this.tr("pause"), "pause", { symbol: "pause", className: "icon-button", attrs: `aria-label="${escape(this.tr("pause"))}"` })}</nav></header>`;
  }
  render() {
    if (this.destroyed) return;
    const hadFocus = this.view?.contains(document.activeElement);
    const priorAction = document.activeElement?.dataset?.act;
    this.root.lang = this.lang;
    this.root.dir = this.lang === "he" ? "rtl" : "ltr";
    this.root.dataset.status = this.status;
    this.root.classList.toggle("reduced", this.settings.reducedMotion);
    if (this.standalone) document.title = `${this.tr("title")} · Kikkey Games`;
    if (this.status === "ready") {
      this.view.innerHTML = `<header class="topbar"><div class="wordmark">${icon("star")}<span>KIKKEY <small>GAMES</small></span></div>${this.languageControl()}</header><main class="intro"><div class="intro-copy"><p class="eyebrow">${escape(this.tr("kicker"))}</p><h1>${escape(this.tr("title"))}<span>WEIGHT OF LIGHT</span></h1><div class="gold-rule"></div><p class="tagline">${escape(this.tr("tagline"))}</p><p class="intro-story">${escape(this.tr("chapter.0.story"))}</p><div class="intro-actions">${this.button(this.tr(this.saved ? "continue" : "begin"), this.saved ? "continue" : "begin", { className: "primary", symbol: "arrow" })}${this.saved ? this.button(this.tr("newGame"), "begin", { className: "text-button" }) : ""}</div><p class="small-notice">${this.storageError ? escape(this.tr(this.storageError)) : ""}</p></div>${skyline}<div class="intro-foot"><span>01 — 04</span><span>${escape(this.tr("chapter.0.subtitle"))}</span>${this.button(this.tr("credits"), "credits", { className: "text-button" })}</div></main>`;
      return;
    }
    if (this.status === "loading" || this.status === "error") {
      this.view.innerHTML = `${this.header()}<div class="load-card">${icon("star")}<p class="eyebrow">KIKKEY GAMES</p><h2>${escape(this.tr(this.status === "loading" ? "loading" : this.errorKey || "loadError"))}</h2>${this.status === "error" ? this.button(this.tr("retry"), "retry", { className: "primary" }) + this.button(this.tr("exit"), "exit", { className: "text-button" }) : '<div class="loading-line"></div>'}</div>`;
      return;
    }
    const s = this.state,
      c = s.chapter,
      all = actions(s),
      node = LEVELS[c].nodes.find((n) => n.id === s.node),
      open = connections(s).filter((e) => e.a === s.node || e.b === s.node);
    const done = isComplete(s);
    this.view.innerHTML = `${this.header()}<section class="chapter-heading"><p class="eyebrow">${escape(this.tr(`chapter.${c}.subtitle`))}</p><h1>${escape(this.tr(`chapter.${c}.title`))}</h1><p class="chapter-goal">${escape(this.tr(`chapter.${c}.goal`))}</p></section><div class="world-space" data-dual="${s.counts.length > 1}"></div><aside class="story-card"><span class="story-mark">“</span><p>${escape(this.tr(this.story))}</p>${this.button(this.tr("journal"), "journal", { symbol: "journal", className: "text-button" })}</aside><div class="scene-caption"><span class="tiny-star">✧</span><span>${escape(this.tr("title"))}</span><span>${escape(this.tr("chapterCount", { n: c + 1 }))}</span></div><section class="controls"><div class="case-block">${icon("case")}<div><span class="eyebrow">${escape(this.tr("carryLabel"))}</span><div class="charges" dir="ltr">${[0, 1].map((i) => `<i class="${i < s.carry ? "filled" : ""}"></i>`).join("")}<span>${escape(this.tr("carry", { n: s.carry }))}</span></div><small>${escape(this.tr("insulated"))}</small></div></div><div class="action-block"><p class="where"><span class="location-dot"></span>${escape(this.tr(node.labelKey))}<small>${escape(this.tr("here"))}</small></p><div class="actions">${all.map((a) => this.button(this.actionLabel(a), `game:${a.id}`, { className: ["take", "give", "light", "listen", "finish"].includes(a.type) ? "action action-gold" : "action", symbol: { take: "minus", give: "plus", walk: "arrow", read: "journal" }[a.type] || "star", disabled: this.busy, attrs: `data-action-id="${escape(a.id)}"` })).join("")}${done && c < 3 ? this.button(this.tr("nextChapter"), "next", { className: "primary", symbol: "arrow", disabled: this.busy }) : ""}</div>${s.ending ? this.button(this.tr(`ending.${s.ending}.title`), "result", { className: "primary", symbol: "star" }) : ""}${this.forecastHTML()}<div class="path-list">${open
      .map((e) => {
        const dest = e.a === s.node ? e.b : e.a;
        return `<span class="${e.open ? "open" : ""}">${e.open ? "◇" : "×"} ${escape(this.tr(`node.${dest}`))}<span class="sr-only">: ${escape(this.tr(e.open ? "available" : "blocked"))}</span></span>`;
      })
      .join(
        "",
      )}</div></div><div class="tools">${this.button(this.tr("undo"), "undo", { symbol: "undo", className: "tool", disabled: !this.history.length || this.busy })}${this.button(this.tr("hint"), "hint", { symbol: "hint", className: "tool", disabled: this.busy })}</div></section><footer class="bottomline"><span>${escape(this.tr("transfers", { n: this.completed.reduce((a, x) => a + x.moves, 0) + s.moves }))}</span><span>${escape(this.tr("traces", { n: this.completed.reduce((a, x) => a + x.collected.length, 0) + s.collected.length }))}</span><span class="save-note">${escape(this.tr(this.storageError || "saved"))}</span></footer>`;
    this.layoutScene();
    this.scene?.setLabel?.((n) => this.nodeLabel(n));
    if (hadFocus) {
      const b = priorAction
        ? [...this.view.querySelectorAll("[data-act]")].find(
            (b) => b.dataset.act === priorAction,
          )
        : null;
      (b && !b.disabled ? b : this.root).focus({ preventScroll: true });
    }
  }
  layoutScene() {
    const space = this.view?.querySelector(".world-space");
    if (space && matchMedia("(max-width:650px)").matches) {
      const r = space.getBoundingClientRect(),
        base = this.root.getBoundingClientRect();
      this.host.style.top = `${r.top - base.top}px`;
      this.host.style.height = `${r.height}px`;
    } else {
      this.host.style.top = "";
      this.host.style.height = "";
    }
  }
  actionLabel(a) {
    const p = { ...a.params };
    if (p.place) p.place = this.tr(p.place);
    return this.tr(a.labelKey, p);
  }
  nodeLabel(n) {
    return (
      this.tr(n.labelKey) +
      (n.platform
        ? ` · ${number(this.lang, this.state.counts[n.platform[0]][n.platform[1]])}`
        : n.lamp
          ? ` · ${number(this.lang, this.state.lamps[n.lamp] || 0)}`
          : "")
    );
  }
  forecastHTML() {
    if (!this.pending) return "";
    const next = apply(this.state, this.pending.id);
    const lamps = LEVELS[next.chapter].lamps.filter(
      (l) => next.lamps[l.id] !== this.state.lamps[l.id],
    );
    const beforePaths = connections(this.state),
      changed = connections(next).filter(
        (e, i) => e.open !== beforePaths[i].open,
      );
    return `<div class="forecast" role="status"><div><p class="eyebrow">${escape(this.tr("forecast"))}</p><div class="balance-preview" dir="ltr">${this.state.counts.map((pair, m) => `<span>${pair.map((n) => number(this.lang, n)).join(" : ")} <b>→</b> ${next.counts[m].map((n) => number(this.lang, n)).join(" : ")} <span class="balance-sign">${next.counts[m][0] === next.counts[m][1] ? "═" : next.counts[m][0] > next.counts[m][1] ? "↙" : "↘"}</span></span>`).join(" · ")}<span>${icon("case")}${escape(this.tr("carry", { n: next.carry }))}</span></div>${lamps.map((l) => `<p class="forecast-detail">${escape(this.tr(l.labelKey))}: <bdi>${number(this.lang, this.state.lamps[l.id])} → ${number(this.lang, next.lamps[l.id])}</bdi></p>`).join("")}${changed.map((e) => `<p class="forecast-detail">${escape(this.tr(e.open ? "available" : "blocked"))}: ${escape(this.tr(`node.${e.a}`))} / ${escape(this.tr(`node.${e.b}`))}</p>`).join("")}</div><div>${this.button(this.tr("confirmAction"), "confirm-action", { className: "primary compact" })}${this.button(this.tr("cancel"), "cancel-action", { className: "text-button" })}</div></div>`;
  }
  async start(restore = false) {
    if (this.busy) return;
    const epoch = ++this.epoch;
    this.busy = true;
    await this.audio.unlock();
    this.audio.resume();
    if (restore && this.saved) {
      this.state = structuredClone(this.saved.state);
      this.history = structuredClone(this.saved.history);
      this.completed = structuredClone(this.saved.completed);
    } else if (!restore) {
      this.state = createState();
      this.history = [];
      this.completed = [];
    }
    this.status = "loading";
    this.render();
    try {
      this.scene?.destroy();
      const { createScene } = await import("./scene.js");
      if (this.destroyed || epoch !== this.epoch) return;
      const created = await createScene(this.host, {
        ...this.settings,
        onPick: (id) => this.pick(id),
        onError: (key) => this.fail(key),
        labelNode: (n) => this.nodeLabel(n),
      });
      if (this.destroyed || epoch !== this.epoch) {
        created.destroy();
        return;
      }
      this.scene = created;
      await this.scene.setState(this.state);
      this.story = this.state.heard
        ? "story.recording"
        : `chapter.${this.state.chapter}.story`;
      this.status =
        this.state.chapter === 0 && this.state.moves === 0
          ? "tutorial"
          : "playing";
      this.audio.setState(this.state);
      this.save();
    } catch (e) {
      console.error("Scene load failed", e);
      this.status = "error";
      this.errorKey = "loadError";
    } finally {
      if (this.destroyed || epoch !== this.epoch) return;
      this.busy = false;
      this.render();
      if (this.state.ending) this.showEnding();
      this.root.focus({ preventScroll: true });
    }
  }
  async perform(id) {
    if (this.busy || !["playing", "tutorial"].includes(this.status)) return;
    const a = actions(this.state).find((a) => a.id === id);
    if (!a) return;
    this.pending = null;
    this.scene?.setPreview(null);
    const before = structuredClone(this.state),
      after = apply(before, id);
    this.history.push(before);
    this.state = after;
    this.busy = true;
    this.audio.setState(after);
    this.audio.play(a.type);
    this.render();
    const activeScene = this.scene;
    await activeScene.setState(after, before, a);
    if (this.destroyed || activeScene !== this.scene || this.status === "error")
      return;
    this.busy = false;
    this.status = "playing";
    this.hintStep = 0;
    if (a.type === "read") this.story = `story.${a.target}`;
    else if (a.type === "listen") this.story = "story.recording";
    else if (a.type === "light")
      this.story =
        a.target === "gate"
          ? "story.gate"
          : a.target === "home"
            ? "story.lamp"
            : this.story;
    this.save();
    this.render();
    if (a.type === "listen" || a.type === "read")
      this.openModal(
        this.tr(a.type === "listen" ? "action.listen" : "journal"),
        `<p class="narrative">${escape(this.tr(this.story))}</p>`,
      );
    if (after.ending) this.showEnding();
  }
  async undo() {
    if (
      this.busy ||
      !this.history.length ||
      !["playing", "tutorial"].includes(this.status)
    )
      return;
    this.pending = null;
    this.scene?.setPreview(null);
    const before = this.state;
    this.state = this.history.pop();
    this.busy = true;
    this.audio.setState(this.state);
    this.audio.play("undo");
    this.render();
    const activeScene = this.scene;
    await activeScene.setState(this.state, before, { type: "undo" });
    if (this.destroyed || activeScene !== this.scene || this.status === "error")
      return;
    this.busy = false;
    this.story = this.state.heard
      ? "story.recording"
      : `chapter.${this.state.chapter}.story`;
    this.save();
    this.render();
  }
  pick(id) {
    if (
      this.busy ||
      this.modal ||
      !["playing", "tutorial"].includes(this.status)
    )
      return;
    if (id === this.state.node) {
      const a =
        actions(this.state).find((a) => a.type === "take") ||
        actions(this.state).find((a) => a.type === "light");
      if (a) this.handle(`game:${a.id}`);
      return;
    }
    const a = actions(this.state).find(
      (a) => a.type === "walk" && a.target === id,
    );
    if (a) this.perform(a.id);
    else {
      this.audio.play("select");
      this.scene.focus(id);
    }
  }
  async handle(act, button) {
    if (act.startsWith("game:")) {
      const id = act.slice(5),
        a = actions(this.state).find((a) => a.id === id);
      if (!a || this.busy) return;
      if (a.type === "finish") {
        this.openModal(
          this.tr("ending." + a.target + ".title"),
          `<p>${escape(this.tr("finishPrompt"))}</p>${this.button(this.tr("confirm"), `finish:${id}`, { className: "primary" })}`,
        );
        return;
      }
      if (["take", "give", "light", "reclaim"].includes(a.type)) {
        this.pending = a;
        this.scene?.setPreview(apply(this.state, a.id));
        this.audio.play("select");
        this.render();
        this.view.querySelector('[data-act="confirm-action"]')?.focus();
      } else this.perform(id);
      return;
    }
    if (act.startsWith("finish:")) {
      this.closeModal();
      this.perform(act.slice(7));
      return;
    }
    switch (act) {
      case "begin":
      case "replay":
        this.closeModal();
        this.start(false);
        break;
      case "continue":
        this.start(true);
        break;
      case "retry":
        this.start(true);
        break;
      case "confirm-action":
        if (this.pending) this.perform(this.pending.id);
        break;
      case "cancel-action":
        this.pending = null;
        this.scene?.setPreview(null);
        this.render();
        break;
      case "undo":
        this.undo();
        break;
      case "result":
        this.showEnding();
        break;
      case "pause":
        this.pause();
        break;
      case "resume":
      case "close":
        this.closeModal();
        break;
      case "exit":
        this.exit();
        break;
      case "next":
        this.completed.push({
          moves: this.state.moves,
          collected: [...this.state.collected],
        });
        this.state = createState(this.state.chapter + 1);
        this.history = [];
        this.pending = null;
        this.scene.setState(this.state);
        this.audio.setState(this.state);
        this.story = `chapter.${this.state.chapter}.story`;
        this.save();
        this.render();
        break;
      case "settings":
        this.settingsModal();
        break;
      case "help":
        this.openModal(
          this.tr("helpTitle"),
          `<p>${escape(this.tr("helpBody"))}</p><p class="key-help">${escape(this.tr("keysHelp"))}</p>`,
        );
        break;
      case "credits":
        this.openModal(
          this.tr("credits"),
          `<p>${escape(this.tr("creditBody"))}</p>`,
        );
        break;
      case "journal":
        this.journal();
        break;
      case "hint":
        this.hint();
        break;
      case "restart":
        this.openModal(
          this.tr("restart"),
          `<p>${escape(this.tr("confirmRestart"))}</p>${this.button(this.tr("confirm"), "do-restart", { className: "primary" })}`,
        );
        break;
      case "do-restart":
        this.closeModal();
        this.state = createState(this.state.chapter);
        this.history = [];
        this.pending = null;
        this.scene.setState(this.state);
        this.audio.setState(this.state);
        this.story = `chapter.${this.state.chapter}.story`;
        this.save();
        this.render();
        break;
    }
  }
  openModal(title, body) {
    this.focusBefore = document.activeElement;
    this.modal = { title, body };
    this.scene?.pause();
    this.audio.pause();
    if (this.status !== "ready") this.status = "paused";
    this.modals.innerHTML = `<div class="modal-backdrop"><section class="modal" role="dialog" aria-modal="true" aria-label="${escape(title)}"><header><p class="eyebrow">KIKKEY GAMES</p>${this.button(this.tr("close"), "close", { symbol: "close", className: "icon-button" })}</header><h2>${escape(title)}</h2><div class="modal-content">${body}</div><footer>${this.button(this.tr(this.status === "ready" ? "close" : "resume"), "close", { className: "text-button", symbol: "arrow" })}</footer></section></div>`;
    this.view.inert = true;
    this.host.inert = true;
    this.modals.querySelector("button")?.focus();
  }
  closeModal() {
    if (!this.modal) return;
    this.modal = null;
    this.modals.innerHTML = "";
    this.view.inert = false;
    this.host.inert = false;
    if (this.status === "paused") {
      this.status = this.state.ending ? "won" : "playing";
      this.scene?.resume();
      this.audio.resume();
    }
    const target = this.focusBefore?.isConnected ? this.focusBefore : this.root;
    target.focus({ preventScroll: true });
  }
  pause() {
    if (!["playing", "tutorial", "won"].includes(this.status)) return;
    this.openModal(
      this.tr("pause"),
      `<p>${escape(this.tr("pausedNote"))}</p><div class="menu-grid">${this.button(this.tr("resume"), "resume", { className: "primary" })}${this.button(this.tr("settings"), "settings")}${this.button(this.tr("help"), "help")}${this.button(this.tr("journal"), "journal")}${this.button(this.tr("restart"), "restart")}${this.button(this.tr("exit"), "exit")}</div>`,
    );
  }
  resume() {
    this.closeModal();
  }
  settingsModal() {
    this.openModal(
      this.tr("settings"),
      `<div class="settings-form"><label>${escape(this.tr("language"))}${this.languageControl()}</label>${["music", "effects"].map((k) => `<label>${escape(this.tr(k))}<input type="range" min="0" max="1" step=".05" value="${this.settings[k]}" data-setting="${k}" aria-label="${escape(this.tr(k))}"/></label>`).join("")}${["muted", "reducedMotion"].map((k) => `<label>${escape(this.tr(k === "muted" ? "mute" : k))}<input type="checkbox" data-setting="${k}" ${this.settings[k] ? "checked" : ""}/></label>`).join("")}<label>${escape(this.tr("quality"))}<select data-setting="quality"><option value="high" ${this.settings.quality === "high" ? "selected" : ""}>${escape(this.tr("qualityHigh"))}</option><option value="low" ${this.settings.quality === "low" ? "selected" : ""}>${escape(this.tr("qualityLow"))}</option></select></label></div>`,
    );
    this.modal.kind = "settings";
  }
  journal() {
    const traces = [
      ...this.completed.flatMap((x) => x.collected),
      ...this.state.collected,
    ];
    let body = Array.from(
      { length: this.state.chapter + 1 },
      (_, i) =>
        `<article><p class="eyebrow">${escape(this.tr(`chapter.${i}.subtitle`))}</p><p>${escape(this.tr(`chapter.${i}.story`))}</p></article>`,
    ).join("");
    body += traces
      .map(
        (id) => `<article><p>${escape(this.tr(`story.${id}`))}</p></article>`,
      )
      .join("");
    if (this.state.heard)
      body += `<article><p>${escape(this.tr("story.recording"))}</p></article>`;
    this.openModal(this.tr("journal"), body);
  }
  hint() {
    let text;
    if (this.hintStep === 0) text = this.tr(`hint.${this.state.chapter}.rule`);
    else if (this.hintStep === 1)
      text = this.tr(`hint.${this.state.chapter}.node`);
    else {
      const final = this.state.chapter === 3;
      const undecided =
        final &&
        this.state.heard &&
        !this.state.lamps.memorial &&
        !this.state.lamps.homeA &&
        !this.state.lamps.homeB;
      const goal = final
        ? !this.state.heard
          ? "heard"
          : this.state.lamps.memorial
            ? "memorial"
            : "homes"
        : undefined;
      const path = undecided ? null : solve(this.state, goal);
      const a = path?.length
        ? actions(this.state).find((a) => a.id === path[0])
        : null;
      text = undecided
        ? this.tr("hint.choice")
        : a
          ? this.tr("hintNext", { action: this.actionLabel(a) })
          : this.tr("noHint");
    }
    this.hintStep = Math.min(this.hintStep + 1, 2);
    this.openModal(
      this.tr("hint"),
      `<p>${escape(text)}</p><div class="hint-dots" dir="ltr">${[0, 1, 2].map((i) => `<i class="${i <= this.hintStep ? "on" : ""}"></i>`).join("")}</div>`,
    );
  }
  showEnding() {
    this.openModal(
      this.tr(`ending.${this.state.ending}.title`),
      `<p class="narrative">${escape(this.tr(`ending.${this.state.ending}.body`))}</p><p class="result-stat">${escape(this.tr("transfers", { n: this.completed.reduce((a, x) => a + x.moves, 0) + this.state.moves }))} · ${escape(this.tr("traces", { n: this.completed.reduce((a, x) => a + x.collected.length, 0) + this.state.collected.length }))}</p>${this.button(this.tr("replay"), "replay", { className: "primary", symbol: "arrow" })}<div class="commission"><p class="eyebrow">KIKKEY GAMES</p><a href="mailto:support@kikkey.com?subject=${encodeURIComponent(this.tr("brandCTA") + " · Weight of Light")}">${escape(this.tr("brandCTA"))}${icon("arrow")}</a><a href="mailto:support@kikkey.com?subject=${encodeURIComponent(this.tr("projectCTA") + " · Weight of Light")}">${escape(this.tr("projectCTA"))}${icon("arrow")}</a><a href="https://wa.me/972538259813?text=${encodeURIComponent(this.tr("projectCTA") + " · Weight of Light")}" target="_blank" rel="noopener noreferrer">${escape(this.tr("whatsapp"))}${icon("arrow")}</a></div>`,
    );
    this.status = "won";
    this.scene?.resume();
    this.audio.resume();
    this.audio.setState(this.state);
    this.audio.play("finish");
  }
  change(e) {
    const k = e.target.dataset.setting;
    if (!k) return;
    if (k === "lang") {
      this.lang = e.target.value;
      this.render();
      if (this.modal?.kind === "settings") this.settingsModal();
    } else {
      this.settings[k] =
        e.target.type === "checkbox"
          ? e.target.checked
          : e.target.type === "range"
            ? Number(e.target.value)
            : e.target.value;
      this.audio.setSettings(this.settings);
      this.scene?.setOptions(this.settings);
      this.root.classList.toggle("reduced", this.settings.reducedMotion);
    }
    try {
      localStorage.setItem(
        SETTINGS,
        JSON.stringify({ ...this.settings, lang: this.lang }),
      );
    } catch {}
  }
  key(e) {
    if (e.code === "Escape") {
      e.preventDefault();
      this.modal ? this.closeModal() : this.pause();
      return;
    }
    if (this.modal) {
      if (e.code === "Tab") {
        const list = [
          ...this.modals.querySelectorAll("button,a,input,select"),
        ].filter((x) => !x.disabled);
        if (e.shiftKey && document.activeElement === list[0]) {
          e.preventDefault();
          list.at(-1).focus();
        } else if (!e.shiftKey && document.activeElement === list.at(-1)) {
          e.preventDefault();
          list[0].focus();
        }
      }
      return;
    }
    if (["INPUT", "SELECT", "TEXTAREA"].includes(e.target.tagName)) return;
    if (e.code === "KeyZ") {
      e.preventDefault();
      this.undo();
    }
    if (["ArrowLeft", "ArrowRight"].includes(e.code) && !this.busy) {
      const current = LEVELS[this.state.chapter].nodes.find(
        (n) => n.id === this.state.node,
      );
      const possible = actions(this.state)
        .filter((a) => a.type === "walk")
        .filter((a) => {
          const n = LEVELS[this.state.chapter].nodes.find(
            (n) => n.id === a.target,
          );
          const nx = this.scene?.screenX?.(n.id) ?? n.x,
            cx = this.scene?.screenX?.(current.id) ?? current.x;
          return e.code === "ArrowLeft" ? nx < cx : nx > cx;
        });
      if (possible.length) {
        e.preventDefault();
        this.perform(possible[0].id);
      }
    }
  }
  save() {
    const data = {
      version: 1,
      state: this.state,
      history: this.history.slice(-100),
      completed: this.completed,
    };
    this.saved = structuredClone(data);
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch {
      this.storageError = "saveUnavailable";
    }
  }
  fail(key) {
    this.errorKey = key;
    this.busy = false;
    this.status = "error";
    this.audio.pause();
    this.render();
  }
  exit() {
    this.epoch++;
    this.closeModal();
    this.save();
    this.scene?.destroy();
    this.scene = null;
    this.audio.pause();
    this.busy = false;
    this.status = "ready";
    this.render();
  }
  getState() {
    return structuredClone(this.state);
  }
  destroy() {
    this.epoch++;
    this.destroyed = true;
    this.abort.abort();
    this.scene?.destroy();
    this.audio.destroy();
    this.root.innerHTML = "";
  }
}
export const mount = (root, options) => new WeightOfLight(root, options);
