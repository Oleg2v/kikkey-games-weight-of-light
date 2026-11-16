# Browser acceptance checks

Run: 2026-11-16T20:09:16.349Z
Browser: 156.0.8078.79 on cloud Linux, headless Chromium with software WebGL. This is not physical-device or hardware GPU validation.

Command: `node tests/browser-smoke.cjs` with Vite running on port 5173.

- PASSED: full UI journey ru → homes
- PASSED: full UI journey en → memorial
- PASSED: full UI journey he → homes
- PASSED: language switch preserves state; transfer preview, undo, reload and restart
- PASSED: responsive Hebrew UI 360×640
- PASSED: responsive Hebrew UI 390×844
- PASSED: responsive Hebrew UI 844×390
- PASSED: responsive Hebrew UI 768×1024
- PASSED: responsive Hebrew UI 1440×900
- PASSED: pseudo-localization expanded 50% at 360×640
- PASSED: corrupt saved state offers a new game
- PASSED: denied localStorage does not prevent play
- PASSED: software renderer timing sample, desktop
- FAILED: no unhandled browser errors during acceptance run — AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:

The main playthroughs use a state-space solver only to choose legal actions, then click visible game buttons and confirmations. No game state is injected. Screenshots and detailed timings are in `test-results/`.

Totals: 13 passed, 1 failed.

Limits: not a native-speaker review of Hebrew; no physical phone/audio listening panel; no 8–12 minute human playtest. Software-renderer frame timings cannot establish the 60/30 FPS target on target devices.

## Resource retest

2026-11-16T20:10:45.661Z: PASSED fresh RU/EN/HE loading and first transfer. Failed HTTP responses, console errors, and unhandled page errors: 0. Run `node tests/browser-smoke.cjs --resources`. The original isolated 404 occurred while assets and page metadata were still being edited; its URL was not recorded, so its exact origin is unconfirmed. The current retest records URLs and passes only if no resource/browser errors occur.

## Production build and lifecycle

- Frozen installation (`npm ci`) and production build pass; all 17 rules/localization tests pass.
- Seven lifecycle checks pass: corrupt records, unavailable storage, context recovery, cancellation during model loading, repeated mounts, paused transitions, physical keyboard undo. See LIFECYCLE.md.
- Built `dist` was served under `/kikkey-games-weight-of-light/`, matching the Pages project subpath. `tests/production-smoke.cjs` clicked all 43 actions through four chapters to the homes ending at 390×844, without a debug API. All resource requests and JavaScript checks passed.
- Current mobile layout reserves a dedicated scene area beneath the heading, so long translated goals cannot cover game geometry. On short phones the page scrolls vertically; gameplay buttons remain available and have 44px touch targets.
- The full acceptance run observed a software-renderer sample near 12 FPS on the shared cloud host. This is a measured limitation of that test environment, not evidence for or against the real-device 60/30 FPS targets. Real-phone and hardware-GPU checks remain outstanding.
