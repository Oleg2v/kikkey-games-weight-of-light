# Lifecycle and failure-path checks

Run: 2026-11-16T20:04:16.282Z. Chromium 156.0.8078.79; headless software WebGL on cloud Linux.

Command: `node tests/lifecycle-smoke.cjs` with Vite at `http://127.0.0.1:5173`. The test blocks Vite’s HMR client to keep source edits by other agents from resetting active checks.

- PASSED: corrupt JSON and malformed completed records return to playable menu
- PASSED: denied localStorage still permits starting and transferring light
- PASSED: WebGL context loss gives retry and restores saved puzzle state
- PASSED: destroy while GLB is loading cleans canvas and event handlers after settlement
- PASSED: repeated exit/start and module mount/destroy leave one active canvas
- PASSED: pause freezes transitions and ignores keyboard puzzle actions
- PASSED: physical KeyZ works after action UI rerender without refocusing root

Result: 7 passed; 0 failed.

These checks exercise corrupted persistence, blocked storage, WebGL loss/recovery, an in-flight model request at destruction, repeated starts, abortable event subscriptions, pause, and physical keyboard undo. They do not establish a browser heap/GPU memory profile or physical-device performance. In-flight fetch cancellation is not asserted; cleanup after its completion is asserted.
