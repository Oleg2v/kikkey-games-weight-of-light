/** Original, locally synthesized score for Weight of Light. No network assets. */
export class Soundscape {
  constructor() {
    this.context = null;
    this.settings = { music: 0.38, effects: 0.65, muted: false };
    this.state = { chapter: 0, lamps: {}, heard: false, ending: null };
    this.paused = false;
    this.destroyed = false;
    this.available = null;
    this._timer = null;
    this._voices = new Set();
    this._step = 0;
    this._nextBeat = 0;
    this._lastEffect = 0;
  }

  /** Call only from an explicit user gesture. Failure leaves a playable silent game. */
  async unlock() {
    if (this.destroyed) return false;
    try {
      if (!this.context) {
        const Context =
          globalThis.AudioContext || globalThis.webkitAudioContext;
        if (!Context) {
          this.available = false;
          return false;
        }
        this.context = new Context();
        const ctx = this.context;
        this.master = ctx.createGain();
        this.musicBus = ctx.createGain();
        this.effectsBus = ctx.createGain();
        this.limiter = ctx.createDynamicsCompressor();
        this.limiter.threshold.value = -12;
        this.limiter.knee.value = 18;
        this.limiter.ratio.value = 4;
        this.limiter.attack.value = 0.008;
        this.limiter.release.value = 0.24;
        this.musicBus.connect(this.master);
        this.effectsBus.connect(this.master);
        this.master.connect(this.limiter);
        this.limiter.connect(ctx.destination);
        this._noise = this._makeNoise();
        this._mix(true);
      }
      if (this.context.state === "suspended" && !this.paused)
        await this.context.resume();
      this.available = this.context.state === "running";
      if (this.available && !this.paused) this._begin();
      return this.available;
    } catch {
      this.available = false;
      return false;
    }
  }

  setSettings(settings = {}) {
    for (const name of ["music", "effects"]) {
      if (Number.isFinite(settings[name]))
        this.settings[name] = Math.max(0, Math.min(1, settings[name]));
    }
    if (typeof settings.muted === "boolean")
      this.settings.muted = settings.muted;
    this._mix();
  }

  setState(state = {}) {
    for (const name of ["chapter", "lamps", "heard", "ending"]) {
      if (Object.hasOwn(state, name)) this.state[name] = state[name];
    }
  }

  _mix(immediate = false) {
    if (!this.context || this.context.state === "closed") return;
    try {
      const now = this.context.currentTime;
      for (const [node, value] of [
        [this.master, this.settings.muted ? 0 : 0.72],
        [this.musicBus, this.settings.music],
        [this.effectsBus, this.settings.effects],
      ]) {
        node.gain.cancelScheduledValues(now);
        if (immediate) node.gain.setValueAtTime(value, now);
        else node.gain.setTargetAtTime(value, now, 0.035);
      }
    } catch {
      /* Audio failure must not block input. */
    }
  }

  _makeNoise() {
    const ctx = this.context;
    const buffer = ctx.createBuffer(
      1,
      Math.ceil(ctx.sampleRate * 2),
      ctx.sampleRate,
    );
    const data = buffer.getChannelData(0);
    let seed = 0x579ad,
      brown = 0;
    for (let i = 0; i < data.length; i++) {
      seed ^= seed << 13;
      seed ^= seed >>> 17;
      seed ^= seed << 5;
      const white = ((seed >>> 0) / 4294967296) * 2 - 1;
      brown = (brown + white * 0.025) / 1.025;
      data[i] = brown * 3.3;
    }
    return buffer;
  }

  _begin() {
    if (
      this._timer !== null ||
      this.destroyed ||
      this.paused ||
      this.context?.state !== "running"
    )
      return;
    this._nextBeat = this.context.currentTime + 0.06;
    this._clock();
  }

  _clock() {
    this._timer = null;
    if (this.destroyed || this.paused || this.context?.state !== "running")
      return;
    try {
      const now = this.context.currentTime;
      // Do not catch up music missed while a tab was inactive.
      if (this._nextBeat < now - 0.2) this._nextBeat = now + 0.03;
      while (this._nextBeat < now + 0.18) {
        this._score(this._step++, this._nextBeat);
        this._nextBeat += this.state.ending === "homes" ? 0.58 : 0.68;
      }
    } catch {
      /* A disconnected device is nonfatal. */
    }
    this._timer = setTimeout(() => this._clock(), 120);
  }

  _score(step, at) {
    const chapter = Math.max(0, Math.min(3, Number(this.state.chapter) || 0));
    const ending = this.state.ending;
    const homeCount = Object.values(this.state.lamps || {}).filter(
      (value) => Number(value) > 0,
    ).length;
    const root = ending === "homes" ? 48 : [50, 53, 50, 48][chapter];
    const phrase =
      ending === "homes"
        ? [
            0,
            null,
            7,
            null,
            12,
            null,
            9,
            7,
            null,
            4,
            null,
            7,
            2,
            null,
            null,
            null,
          ]
        : [
            0,
            null,
            null,
            7,
            null,
            10,
            null,
            5,
            null,
            null,
            3,
            null,
            7,
            null,
            null,
            null,
          ];
    const degree = phrase[step % phrase.length];
    if (degree !== null)
      this._glass(
        this._hz(root + 12 + degree),
        at,
        0.09,
        this.musicBus,
        step % 4 === 0 ? -0.28 : 0.22,
      );
    if (step % 8 === 0) {
      this._string(this._hz(root), at, 5.0, 0.09, -0.2);
      this._string(this._hz(root + 7), at + 0.05, 4.8, 0.035, 0.25);
    }
    if (step % 4 === 2) this._wood(at, 0.035, this.musicBus);
    if ((homeCount > 0 || ending === "homes") && step % 16 === 0) {
      // Soft, vowel-like harmonics join the street when a home is lit.
      this._string(this._hz(root + 16), at + 0.2, 6.0, 0.028, -0.4);
      this._string(this._hz(root + 21), at + 0.4, 6.0, 0.022, 0.4);
    }
    if ((this.state.heard || ending === "memorial") && step % 8 === 6) {
      this._glass(this._hz(root + 24), at, 0.045, this.musicBus, 0);
    }
  }

  _hz(midi) {
    return 440 * 2 ** ((midi - 69) / 12);
  }

  _route(gain, bus, pan) {
    const nodes = [gain];
    if (this.context.createStereoPanner) {
      const panner = this.context.createStereoPanner();
      panner.pan.value = pan;
      gain.connect(panner);
      panner.connect(bus);
      nodes.push(panner);
    } else gain.connect(bus);
    return nodes;
  }

  _track(sources, nodes, end) {
    const voice = { sources, nodes };
    this._voices.add(voice);
    sources[0].onended = () => {
      for (const node of [...sources, ...nodes]) {
        try {
          node.disconnect();
        } catch {}
      }
      this._voices.delete(voice);
    };
    for (const source of sources) source.stop(end);
  }

  _tone(
    frequency,
    at,
    duration,
    level,
    bus,
    { wave = "sine", attack = 0.008, pan = 0, endFrequency, detune = 0 } = {},
  ) {
    const ctx = this.context;
    const oscillator = ctx.createOscillator();
    const envelope = ctx.createGain();
    oscillator.type = wave;
    oscillator.frequency.setValueAtTime(frequency, at);
    oscillator.detune.value = detune;
    if (endFrequency)
      oscillator.frequency.exponentialRampToValueAtTime(
        Math.max(20, endFrequency),
        at + duration * 0.8,
      );
    envelope.gain.setValueAtTime(0.0001, at);
    envelope.gain.exponentialRampToValueAtTime(
      Math.max(0.0002, level),
      at + attack,
    );
    envelope.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    oscillator.connect(envelope);
    const nodes = this._route(envelope, bus, pan);
    oscillator.start(at);
    this._track([oscillator], nodes, at + duration + 0.02);
  }

  _glass(frequency, at, level, bus = this.effectsBus, pan = 0) {
    this._tone(frequency, at, 1.8, level, bus, { pan });
    this._tone(frequency * 2.756, at, 0.32, level * 0.15, bus, {
      pan,
      attack: 0.003,
    });
    this._tone(frequency * 4.07, at, 0.12, level * 0.035, bus, {
      pan,
      attack: 0.002,
    });
  }

  _string(frequency, at, duration, level, pan) {
    this._tone(frequency, at, duration, level, this.musicBus, {
      wave: "triangle",
      attack: 0.85,
      pan,
      detune: -3,
    });
    this._tone(
      frequency * 2,
      at + 0.02,
      duration - 0.02,
      level * 0.18,
      this.musicBus,
      { attack: 0.9, pan, detune: 3 },
    );
  }

  _wood(at, level, bus = this.effectsBus) {
    this._tone(310, at, 0.09, level, bus, { endFrequency: 105, attack: 0.003 });
    this._tone(690, at, 0.045, level * 0.18, bus, { attack: 0.002 });
  }

  _creak(at, level = 0.055) {
    const ctx = this.context;
    const source = ctx.createBufferSource();
    source.buffer = this._noise;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.Q.value = 5;
    filter.frequency.setValueAtTime(240, at);
    filter.frequency.exponentialRampToValueAtTime(620, at + 0.24);
    filter.frequency.exponentialRampToValueAtTime(180, at + 0.66);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(level, at + 0.12);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.72);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.effectsBus);
    source.start(at);
    this._track([source], [filter, gain], at + 0.75);
    this._wood(at + 0.72, 0.06);
  }

  play(type) {
    if (this.destroyed || this.paused || this.context?.state !== "running")
      return;
    try {
      const at = this.context.currentTime + 0.005;
      if (type === "select" && at - this._lastEffect < 0.055) return;
      this._lastEffect = at;
      switch (type) {
        case "select":
          this._glass(this._hz(86), at, 0.045);
          break;
        case "take":
          this._glass(this._hz(74), at, 0.15, this.effectsBus, -0.2);
          this._glass(this._hz(81), at + 0.11, 0.08, this.effectsBus, 0.15);
          this._creak(at + 0.2);
          break;
        case "give":
          this._glass(this._hz(81), at, 0.12, this.effectsBus, 0.15);
          this._glass(this._hz(74), at + 0.11, 0.09, this.effectsBus, -0.2);
          this._creak(at + 0.2);
          break;
        case "walk":
          this._wood(at, 0.08);
          this._wood(at + 0.24, 0.05);
          break;
        case "light":
          for (const [i, note] of [62, 69, 74, 78].entries())
            this._glass(this._hz(note), at + i * 0.12, 0.09);
          break;
        case "reclaim":
          this._glass(this._hz(69), at, 0.12);
          this._glass(this._hz(62), at + 0.14, 0.08);
          break;
        case "read":
          this._glass(this._hz(77), at, 0.085);
          this._glass(this._hz(81), at + 0.22, 0.06);
          break;
        case "listen":
          for (const [i, note] of [62, 69, 65, 74].entries())
            this._glass(this._hz(note), at + i * 0.4, 0.1);
          break;
        case "finish":
          for (const [i, note] of (this.state.ending === "homes"
            ? [60, 64, 67, 72, 76]
            : [62, 65, 69, 74]
          ).entries())
            this._glass(this._hz(note), at + i * 0.18, 0.12);
          break;
        case "undo":
          this._glass(this._hz(79), at, 0.075);
          this._glass(this._hz(72), at + 0.1, 0.06);
          this._creak(at + 0.15, 0.035);
          break;
        default:
          break;
      }
    } catch {
      /* Input remains valid when audio is unavailable. */
    }
  }

  _stopVoices() {
    for (const voice of this._voices) {
      for (const source of voice.sources) {
        try {
          source.stop();
        } catch {}
      }
      for (const node of [...voice.sources, ...voice.nodes]) {
        try {
          node.disconnect();
        } catch {}
      }
    }
    this._voices.clear();
  }

  pause() {
    if (this.destroyed) return;
    this.paused = true;
    if (this._timer !== null) clearTimeout(this._timer);
    this._timer = null;
    this._stopVoices();
    try {
      this.context?.suspend().catch(() => {});
    } catch {}
  }

  async resume() {
    if (this.destroyed) return false;
    this.paused = false;
    if (!this.context) return false; // Resuming is not an implicit first unlock.
    try {
      await this.context.resume();
      this.available = this.context.state === "running";
      this._begin();
      return this.available;
    } catch {
      return false;
    }
  }

  destroy() {
    if (this.destroyed) return;
    this.pause();
    this.destroyed = true;
    for (const node of [
      this.musicBus,
      this.effectsBus,
      this.master,
      this.limiter,
    ]) {
      try {
        node?.disconnect();
      } catch {}
    }
    try {
      this.context?.close().catch(() => {});
    } catch {}
    this._noise = null;
  }
}
