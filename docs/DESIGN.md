# Weight of Light — design notes

**Promise:** a small act of care visibly changes a city. Light is a discrete weight in suspended vessels. Noya, a night courier, carries her late mother's last parcel toward a lighthouse, discovering why her mother chose inhabited windows over a grand public lamp.

The world is an architectural miniature: deep blue painted wood, warm ivory plaster, milk glass, brass axles, individual slate roof tiles, a short red cape and linen details. The keyframe is a quiet three-quarter orthographic view of two houses suspended at different heights, a single warm vial, Noya on the lower timber deck and the lighthouse beyond. Shape and height must explain the puzzle without bloom. The camera does not require manual orbiting.

## Loop and input

Read the destination and reachable paths → select a one-charge transfer → inspect the forecast → confirm → watch the charge travel and the platforms settle → walk along a newly aligned connection. The case holds two; only suspended vials affect weight. Higher charge count means lower platform, equality puts both at the middle. Noya rides with the platform. Input is locked during a committed transition so one gesture cannot apply twice.

There is no reflex challenge or failure timer. A wrong move is an experiment. Undo restores the complete preceding puzzle state. Restart is explicit. The pure rules module also proves every reachable state can reach a completion without relying on undo. See [PUZZLES.md](PUZZLES.md) for the graph, invariants and complete solutions.

Touch targets and named action buttons are primary controls; keyboard navigation and physical `KeyboardEvent.code` shortcuts supplement them. Choosing Hebrew changes interface direction, never left/right in the world. Three hint tiers explain the rule, point to the relevant place, then suggest a legal next action. The solution is not shown preemptively.

## Four chapters

| Chapter                   | New decision                                                                       | Story and visible consequence                                                                                                          |
| ------------------------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| I — The threshold         | Equalize `(2,1)`, cross, make the right side heavier                               | Noya learns a single careful transfer can move a house. A high side balcony hides a childhood trace.                                   |
| II — The window           | Use both case slots, preserve a charge for an isolated lamp                        | A kitchen becomes inhabited; a small repaired object carries another trace of her mother.                                              |
| III — The other side      | Store a charge in a gate, reclaim it from the far side, preserve access            | Two mechanisms lead to the lighthouse door. A letter on the upper side route requires a different ordering.                            |
| IV — For the whole street | Prepare a lit return stair, rise to the recording, choose where two charges remain | The shutters open. The memorial keeps the mother's voice, or two homes receive the light. Both choices finish at the safe street exit. |

The mother's message is short: Noya thought she had darkened the city; she wanted light to reach home. The two endings are complete alternatives without a morality grade. Three optional traces and a count of transfers provide a reason to return; the first run is not scored against time.

## Visual and audio implementation

Blender produces the editable miniature kit and its local GLB: Noya, five animation clips, three house silhouettes, timber platform and bridge, two physically distinct light vessels, lighthouse and household props. Material colors and mesh details carry the handmade look. Shared meshes/materials are reused; per-instance light changes must clone affected materials. Source files stay out of the public build.

The score is an original procedural Web Audio composition: glass resonances, muted plucked strings, wooden ticks, tension noises and an inhabited-house layer. State changes affect arrangement; the two endings use different motifs. Audio starts only after interaction. Music/effects controls, mute, safe silence on unsupported audio, pause and disposal are part of the game lifecycle. There is no recorded voice; the recording is delivered as localized written dialogue.

## Working resource budgets

These are engineering targets, not measured device performance claims. See the validation report for actual browser observations.

- One locally served GLB under 2 MB; no external texture or asset CDN. Current kit uses untextured authored materials and editable Blender source outside `public`.
- At most one shadow-casting directional light, a 1024×1024 shadow map, no postprocessing/bloom dependency. Non-shadow fill lights preserve readable silhouettes.
- Device pixel ratio capped at 1.6 in the detailed mode and 1 in the reduced mode; shadows can be disabled.
- Aim below 300,000 rendered triangles and 500 draw calls per detailed frame, including the costs of repeated houses and shadow passes. Reduce repeated background detail if measured device costs exceed the budget.
- Load Three.js and the model only when entering the city. One animation loop, one active scene and one audio context per mounted game; dispose them on exit/destroy.
- Target 60 FPS on a selected desktop and 30 FPS on a selected midrange phone. Software rendering and touch/viewport emulation do not establish those device targets.

## Scope and acceptance

This is a self-contained four-chapter browser episode with RU/EN/HE UI and narrative, local versioned saves, pause, undo, restart, settings and two endings. It has no account, multiplayer, payment, backend or analytics requirement. Commission contacts appear after completion and open user-controlled mail/WhatsApp drafts; the game does not send messages.

The requested **8–12 minute first play** remains an unmeasured playtest target. The finite optimal routes are compact; a repeat play with known solutions can be much shorter. Do not add delays to manufacture a runtime. Observe unfamiliar players to assess readability, discovery and pacing. Hebrew review by a native speaker, real-phone input/performance and physical-device audio judgment remain separate release checks.

A possible later episode could follow the street's repairer through shutters that redirect reflected light, using the same miniature materials and discrete planning. It is not part of this release and introduces no additional current systems.
