# Weight of Light · Вес света · משקל האור

A standalone Kikkey Games browser story in four chapters. Noya carries light between suspended vessels to rearrange the city, reaches her mother's recording and chooses where the final two charges remain. Includes Russian, English and Hebrew, three optional discoveries, undo, local saves and two endings.

## Develop and build

Use **Node.js 24** (the development environment has 24.22.1) and npm. Runtime and build dependencies are pinned in `package.json` and `package-lock.json`.

```sh
npm ci
npm run dev
```

Vite serves the standalone development page; use the address printed by the command. Add `?lang=ru`, `?lang=en` or `?lang=he` to select the initial language. All model/font resources are served locally by the project, with no runtime asset CDN.

```sh
npm test
npm run build
npm run preview
```

`npm test` runs the Node test suites, including finite-state puzzle proofs and dictionary checks. `npm run build` creates `dist`; `npm run preview` serves that build for local verification. Blender is not required for these commands because the exported GLB is checked into the project. The relative Vite asset base supports a project subpath.

## Play

Choose actions with touch/mouse or Tab and Enter. Physical left/right arrow keys follow available paths to their respective sides; Z undoes a move and Escape opens/closes pause. Transfers have a forecast and require confirmation. Controls are also available as named buttons. The case holds two charges. A heavier suspended vial descends; equal vials align at the middle. Household lamps and the case are isolated from the scales.

Language can change during play without resetting puzzle state. Hebrew interface reading order is RTL; the world and left/right controls keep their original directions. Progress and settings are stored in this browser only. They are not synchronized between devices. A storage failure leaves the game playable but cannot preserve progress after the tab closes.

## Project map

- `src/game.js` — pure puzzle state, legal actions, reachability search and save validation.
- `src/main.js` — mounted game lifecycle, localized UI, saves, input and chapter progression.
- `src/scene.js` — Three.js miniature scene, assets, movement and cleanup.
- `src/i18n.js` — complete UI/narrative dictionaries and locale formatting.
- `src/audio.js` — original procedural score, effects and mixer lifecycle.
- `public/models/town.glb` — browser-ready original model kit.
- `art/weight-of-light.blend`, `art/generate.py` — editable artwork and deterministic authoring source; excluded from `dist`.
- `tests/` — meaningful rules and localization checks.

Read [DESIGN.md](docs/DESIGN.md) for the player promise and budgets, [PUZZLES.md](docs/PUZZLES.md) for exact solutions and state proofs, [ASSETS.md](docs/ASSETS.md) for models/provenance/export contracts, [AUDIO.md](docs/AUDIO.md) for sound implementation, and [QA.md](docs/QA.md) for executed validation and outstanding checks. Publication is separate; [DELIVERY.md](docs/DELIVERY.md) records its workflow and prerequisites.

## Edit and regenerate artwork

Open `art/weight-of-light.blend` in Blender to inspect the original models. Preserve any manual edits before rerunning the generator, which rebuilds the source tray and exported kit.

```sh
XDG_CONFIG_HOME=/tmp/weight-of-light-art/config \
XDG_CACHE_HOME=/tmp/weight-of-light-art/cache \
blender --background --factory-startup --python-exit-code 1 --python art/generate.py
```

The export was authored with Blender 4.3.2. The generator verifies root groups, animation names and the asset size budget. Fontsource packages include their own font licenses; Three.js and Vite include their package licenses. Model and audio provenance is documented separately; do not infer a project redistribution license from a dependency's license.

## Embed lifecycle

The public API is `mount(element)`, returning a `WeightOfLight` instance. Mount a game inside an isolated container; call `start()` from an explicit user action so the audio context may unlock. Use `pause()`, `resume()` and `destroy()` when the host navigation or component lifecycle changes. `getState()` returns a detached snapshot for inspection; avoid mutating the internal state.

```js
import { mount } from "./src/main.js";

const game = mount(document.querySelector("#game-container"));
startButton.addEventListener("click", () => game.start());
// When navigating away:
game.pause();
// When returning:
game.resume();
// When removing the integration completely:
game.destroy();
```

The standalone page starts through its own bootstrap. Heavy scene code and model loading begin on entry, rather than at module import. `destroy()` removes listeners and releases graphics/audio resources. Create a new instance for a later mount; do not reuse a destroyed instance. The repository does not modify kikkey.com routes, DNS or contacts.

## Practical limits

The intended 8–12 minute first play is a playtest target, not a measured duration. Known solutions make repeat play shorter. Native-speaker Hebrew review, real-phone performance/input and final physical-device audio judgment are still release checks; browser emulation is not proof of those. There is no spoken voice recording: the message is presented as localized dialogue with music. Read the QA report before describing the build as release-validated or asserting a frame-rate target.

## Browser checks

With the development server running and Chromium installed at `/usr/bin/chromium`:

```sh
npm run test:browser
npm run test:lifecycle
```

Playwright is a pinned development dependency. These checks click actual UI actions and store screenshots in ignored `test-results/`. `node tests/browser-smoke.cjs --resources` performs the shorter current-resource check. `tests/production-smoke.cjs` accepts `WOL_TEST_URL` pointing to a served production build, and verifies a complete mobile journey without the development debug API. Its default URL expects the build served under the GitHub Pages-style project subpath.
