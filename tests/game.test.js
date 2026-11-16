import test from "node:test";
import assert from "node:assert/strict";
import {
  LEVELS,
  createState,
  actions,
  apply,
  solve,
  height,
  nodeHeight,
  connections,
  isComplete,
  validateState,
  stateKey,
} from "../src/game.js";

const play = (chapter, path) =>
  path.reduce((s, id) => {
    assert.ok(
      actions(s).some((a) => a.id === id),
      `Illegal action ${id} in ${JSON.stringify(s)}`,
    );
    const next = apply(s, id);
    assert.ok(validateState(next));
    return next;
  }, createState(chapter));

function graph(chapter) {
  const states = [createState(chapter)],
    indexes = new Map([[stateKey(states[0]), 0]]),
    incoming = [[]];
  for (let i = 0; i < states.length; i++)
    for (const action of actions(states[i])) {
      const next = apply(states[i], action.id),
        key = stateKey(next);
      let j = indexes.get(key);
      if (j === undefined) {
        j = states.length;
        indexes.set(key, j);
        states.push(next);
        incoming.push([]);
      }
      incoming[j].push(i);
    }
  return { states, incoming };
}

test("the introductory sequence matches the authored (2,1) example exactly", () => {
  let s = createState();
  assert.equal(height(s, 0, 0), 0);
  assert.equal(height(s, 0, 1), 3);
  assert.equal(apply(s, "walk:aR"), s, "cannot walk across unequal cradles");
  s = apply(s, "take");
  assert.deepEqual(s.counts, [[1, 1]]);
  assert.equal(s.carry, 1);
  assert.equal(height(s, 0, 0), 1.5);
  s = apply(s, "walk:aR");
  s = apply(s, "give");
  assert.deepEqual(s.counts, [[1, 2]]);
  assert.equal(s.carry, 0);
  assert.equal(s.node, "aR", "Noya remains aboard her moving cradle");
  s = apply(s, "walk:exit");
  assert.ok(isComplete(s));
  assert.equal(s.moves, 2);
});

test("chapter II uses both case slots and supplies the isolated kitchen lamp", () => {
  const s = play(1, [
    "take",
    "take",
    "walk:aR",
    "give",
    "walk:home",
    "light:home",
    "walk:exit",
  ]);
  assert.ok(isComplete(s));
  assert.equal(s.lamps.home, 1);
  assert.equal(s.carry, 0);
  assert.deepEqual(s.counts, [[1, 2]]);
  const full = play(1, ["take", "take"]);
  assert.equal(apply(full, "take"), full, "case capacity is strictly two");
});

test("chapter III gate is usable from either low landing and closes on retrieval", () => {
  const s = play(2, [
    "take",
    "take",
    "walk:aR",
    "give",
    "walk:balcony",
    "light:gate",
    "walk:bL",
  ]);
  assert.ok(connections(s).find((e) => e.gate === "gate").open);
  const reclaimed = apply(s, "reclaim:gate");
  assert.equal(reclaimed.lamps.gate, 0);
  assert.equal(reclaimed.carry, 1);
  assert.ok(!connections(reclaimed).find((e) => e.gate === "gate").open);
  assert.equal(apply(reclaimed, "walk:balcony"), reclaimed);
  const restored = apply(reclaimed, "light:gate");
  assert.ok(actions(restored).some((a) => a.id === "walk:balcony"));
  const mid = apply(s, "take");
  assert.ok(
    !actions(mid).some((a) => a.id === "reclaim:gate"),
    "cannot reach a low lamp from mid-height",
  );
});

test("all three optional traces are reachable and chapter III changes the route", () => {
  for (let c = 0; c < 3; c++) {
    const regular = solve(createState(c)),
      detour = solve(createState(c), "trace");
    assert.ok(detour.length > regular.length);
    const s = play(c, detour);
    assert.ok(isComplete(s));
    assert.deepEqual(s.collected, [`trace${c + 1}`]);
  }
  const s = play(2, solve(createState(2), "trace"));
  assert.equal(
    s.moves,
    12,
    "optional letter costs four extra transfers over the direct route",
  );
});

test("both final arrangements require separate confirmation at a safe exit", () => {
  for (const ending of ["memorial", "homes"]) {
    const path = solve(createState(3), ending);
    assert.ok(path);
    assert.equal(path.at(-1), `finish:${ending}`);
    const before = play(3, path.slice(0, -1));
    assert.equal(before.ending, null);
    assert.equal(isComplete(before), false);
    assert.equal(before.node, "exit");
    assert.equal(before.heard, true);
    assert.equal(before.lamps.return, 1);
    assert.ok(
      actions(before).some((a) => a.id === "walk:homeB"),
      "can physically leave the exit before confirming",
    );
    const completed = apply(before, `finish:${ending}`);
    assert.ok(isComplete(completed));
    assert.equal(completed.ending, ending);
    assert.deepEqual(actions(completed), []);
    assert.equal(before.ending, null, "prior snapshot remains intact for undo");
  }
});

test("the return stair uses visible lamp and story prerequisites without mirroring physical directions", () => {
  const path = solve(createState(3), "homes");
  let s = createState(3);
  for (const id of path) {
    const stair = connections(s).find((e) => e.stairs);
    assert.equal(stair.open, Boolean(s.heard && s.lamps.return));
    s = apply(s, id);
  }
  assert.equal(LEVELS[3].nodes.find((n) => n.id === "aL").x, -6);
  assert.equal(LEVELS[3].nodes.find((n) => n.id === "aR").x, -2);
});

test("state updates are immutable and save validation rejects corruption", () => {
  const s = createState(2),
    snapshot = JSON.stringify(s),
    next = apply(s, "take");
  assert.equal(JSON.stringify(s), snapshot);
  assert.notEqual(next.counts, s.counts);
  for (const corrupt of [
    null,
    {},
    { ...s, carry: 3 },
    { ...s, carry: 1 },
    {
      ...s,
      counts: [
        [-1, 4],
        [2, 1],
      ],
    },
    { ...s, node: "missing" },
    { ...s, lamps: {} },
    { ...s, collected: ["injected"] },
    { ...s, heard: true },
    { ...s, moves: -1 },
    { ...s, ending: "homes" },
  ])
    assert.equal(validateState(corrupt), false);
  assert.ok(validateState(JSON.parse(JSON.stringify(s))));
});

for (let chapter = 0; chapter < LEVELS.length; chapter++)
  test(`chapter ${chapter + 1}: exhaustive conservation, reachability and no irreversible dead ends`, () => {
    const { states, incoming } = graph(chapter);
    const wins = [];
    states.forEach((s, i) => {
      assert.ok(validateState(s), `Invalid reachable state ${i}`);
      for (const n of LEVELS[chapter].nodes)
        assert.ok([0, 1.5, 3].includes(nodeHeight(s, n)));
      if (isComplete(s)) wins.push(i);
    });
    assert.ok(wins.length > 0);
    const reachable = new Set(wins),
      pending = [...wins];
    for (let i = 0; i < pending.length; i++)
      for (const parent of incoming[pending[i]])
        if (!reachable.has(parent)) {
          reachable.add(parent);
          pending.push(parent);
        }
    assert.equal(
      reachable.size,
      states.length,
      `${states.length - reachable.size} states could not reach any ending`,
    );
    console.log(
      `Chapter ${chapter + 1}: ${states.length} finite states; ${wins.length} completed; every state can reach completion.`,
    );
  });

test("both endings remain attainable from every unconfirmed final-chapter state", () => {
  const { states, incoming } = graph(3);
  for (const ending of ["memorial", "homes"]) {
    const winning = states.flatMap((s, i) => (s.ending === ending ? [i] : []));
    const reachable = new Set(winning);
    for (let i = 0; i < winning.length; i++)
      for (const parent of incoming[winning[i]])
        if (!reachable.has(parent)) {
          reachable.add(parent);
          winning.push(parent);
        }
    states.forEach((s, i) => {
      if (s.ending === null)
        assert.ok(
          reachable.has(i),
          `${ending} unreachable before confirmation from ${i}`,
        );
    });
  }
});
