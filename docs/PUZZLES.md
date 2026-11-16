# Weight of Light — puzzle design and proof

## Promise and playable loop

Noya does not jump against a clock. She reads suspended architecture, moves one indivisible light charge, sees which crossings will align, then walks the route she has made. The case holds **two** charges. The lighthouse is her destination; her mother's small acts of redistribution explain the darkened monument along the way. A wrong experiment is recoverable, never fatal. The UI keeps an immutable snapshot before each action for undo.

Four chapters introduce equilibrium, carrying capacity, temporary storage, and a final route combining both mechanisms. The projected 8–12 minute first play is a playtest target, not a measured duration or a timer imposed on the player. Number of transfers is a replay statistic. Three optional traces reward different routes; no score judges the final choice.

## State and actions

`src/game.js` is a pure ES module, with no clock, rendering, storage or input dependencies. Its serializable state is:

```js
{
  chapter: 0,                   // 0 through 3
  counts: [[2, 1]],             // one or two pairs [physical left, physical right]
  carry: 0,                    // integer 0..2
  node: 'aL',                   // reached platform or stationary landing
  lamps: {},                   // isolated stationary reservoirs
  collected: [],               // chapter-local trace ids; campaign stores all chapters
  heard: false,                // final recording opened
  ending: null,                // null, 'memorial', or 'homes'
  moves: 0                     // transfers only; walking/reading does not increment
}
```

At a reached platform, `take` moves one charge to the case and `give` returns one. A reached lamp supports `light:<id>` and `reclaim:<id>`, subject to capacity. `walk:<node>` is legal only along an aligned, unlocked edge. `read:<trace>` records a discovery. `listen` opens the recording shutters. `finish:<ending>` is a separate, irreversible confirmation, available only after the final arrangement is complete and Noya has physically reached the safe street exit. Before it, every transfer and both choices remain reversible.

The case and domestic lamps never contribute weight. Only each pair's two suspended reservoirs determine its positions:

| Relationship | Left height  | Right height |
| ------------ | ------------ | ------------ |
| Left > right | 0 (low)      | 3 (high)     |
| Left = right | 1.5 (middle) | 1.5 (middle) |
| Left < right | 3 (high)     | 0 (low)      |

Noya remains on the same platform while it moves. Inter-platform crossings exist only at equality. Platform-to-fixed-landing crossings require equal heights. Stationary stair geometry in chapter IV has explicit lamp/story prerequisites. It is the sole fixed connection between different elevations; it does not change the weighing rules. The rendering layer animates the already-determined transition and must reject further puzzle input until it finishes. RTL changes interface reading order, never these physical sides or coordinates.

`LEVELS` exposes the complete nodes, coordinates, edges and lamp metadata. `connections(state)` includes closed edges for forecast rendering. `apply` does not mutate its argument and returns that same argument on an illegal action. `validateState` rejects corrupt snapshots and broken light conservation. `solve` uses breadth-first search, ignores the transfer statistic when deduplicating states, and returns a legal action-id path or `null`. It accepts a custom predicate, or `heard`, `trace`, `memorial`, `homes`.

## Chapter I — The threshold

Initial A = `(2,1)`, Noya at A-left low, exit at A-right low. Total light = 3.

Required route:

```text
take → (1,1), carry 1
walk:aR
give → (1,2), carry 0
walk:exit
```

The first optional trace is at an upper balcony beside A-left. Taking **two** charges raises A-left to high `(0,1)`. Visit/read the trace, return, give one back to equalize, cross and give the other. This adds two transfers over the direct solution. The game should not reveal this route before the player requests a final-tier hint.

## Chapter II — The window

Initial A = `(3,1)`, kitchen lamp empty, total light = 4. The kitchen is reachable only from A-right low; the exit is beyond it. The lamp takes one isolated charge.

```text
take, take → (1,1), carry 2
walk:aR
give → (1,2), carry 1
walk:home
light:home → kitchen 1, carry 0
walk:exit
```

A side landing beside the kitchen contains the second trace, a repaired toy and a note. Reading it is optional and does not take the house's light away. The moving mechanism stays `(1,2)` while the kitchen lights.

## Chapter III — The other side

Initial A = `(3,1)`, B = `(2,1)`, gate and lighthouse-door lamps empty, total light = 7. A-right low leads to a central balcony. The gate holds **one** isolated charge. Its handle is reachable from the central balcony **and** from B-left when B-left is low. It is not reachable from B-left at middle or high height. Removing the charge immediately closes the crossing; returning it reopens it. B-right low leads to the lighthouse door, which needs one charge to complete the chapter.

Direct solution, **8 transfers / 13 actions**:

```text
take, take, walk:aR, give, walk:balcony
light:gate, walk:bL, reclaim:gate
# The gate is now closed behind Noya, and her case holds one charge.
take, walk:bR, give, walk:exit, light:door
```

The optional third trace is on B-left's upper side balcony. The player must postpone reclaiming the gate charge, because the case needs both slots to raise B-left. Verified detour, **12 transfers / 20 actions**:

```text
take, take, walk:aR, give, walk:balcony
light:gate, walk:bL
take, take, walk:trace, read:trace3, walk:bL
give, give
# B-left is low again; the handle is now within reach.
reclaim:gate, take, walk:bR, give, walk:exit, light:door
```

This detour changes both route and order. A solution for the introductory mechanisms alone would not prove it works; the finite-state search includes the gate, the reached node, the case capacity, and the letter state.

## Chapter IV — For the whole street

Initial A = `(3,1)`, B = `(2,1)`, total light = 7. The central landing has a one-charge stair lamp; the recording room is reached from B-right **high**. The stair from the recording room back to the balcony is visible, but opens only after the recording is heard and while the stair lamp holds a charge. The recording room contains a two-charge memorial lantern. Two houses lie along the fixed lower route back to the street.

Common efficient approach:

```text
take, take, walk:aR, give, walk:balcony
light:return
walk:bL, take, walk:bR, take, walk:recording
```

The spare charge from A is deliberately reserved for the return stair. Taking from B-right, instead of giving as in the earlier chapters, raises it to the room. Noya arrives carrying two charges. If the stair was not prepared, the ordinary mechanism can still be reversed; there is no fatal trap. Preparing it first avoids a trip back and preserves the two charges for the choice.

Memorial ending:

```text
light:memorial, light:memorial, listen
walk:balcony, walk:homeA, walk:homeB, walk:exit
finish:memorial
```

Homes ending:

```text
listen, walk:balcony, walk:homeA, light:homeA
walk:homeB, light:homeB, walk:exit
finish:homes
```

Both complete efficient paths use **8 transfers / 19 actions**. The memorial keeps the recording alive; the homes receive the two charges and the mother's window takes their reflected light. Before confirmation, the player can walk back, reclaim the two charges and change the arrangement. The stair charge is independent of those two final charges. Neither ending traps Noya; confirmation happens at the lower street exit, not inside an inaccessible recording room.

## Machine-checked evidence

Run `node --test tests/game.test.js` (also included by `npm test`). The suite checks the authored introductory sequence, strict capacity, reachable-only interaction, gate accessibility from both sides, closure/restoration, optional routes, explicit final confirmation, immutable snapshots, corrupt-save rejection, and full finite-state reachability.

| Chapter | Reachable states (statistics omitted) | Complete states | Every state can reach completion |
| ------- | ------------------------------------: | --------------: | -------------------------------- |
| I       |                                    16 |               2 | Yes                              |
| II      |                                    42 |               2 | Yes                              |
| III     |                                    78 |               2 | Yes                              |
| IV      |                                   891 |               2 | Yes                              |

The search enumerates **1,027 states** and checks integer nonnegative charges, case capacity ≤2, lamp capacity, exact per-chapter conservation, valid node positions, and legal story/ending values in every state. Reverse graph reachability proves that no reachable state is an irreversible dead end. In chapter IV, each of the two endings remains reachable from **every unconfirmed state**. This is stronger than retaining an undo button alone.

The proof concerns puzzle logic. It does not establish visual clarity, translation quality, hardware performance, or enjoyment; those require the browser/visual/playtest validation described by the application report.
