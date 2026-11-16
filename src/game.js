/** Pure, deterministic puzzle state. No clock, DOM, rendering or storage dependencies. */
const platform = (id, x, mechanism, side) => ({
  id,
  x,
  z: 0,
  y: 0,
  platform: [mechanism, side],
  kind: "platform",
  labelKey: `node.${id}`,
});
const node = (id, x, z, y, kind = "balcony", extra = {}) => ({
  id,
  x,
  z,
  y,
  kind,
  labelKey: `node.${id}`,
  ...extra,
});
const edge = (a, b, extra = {}) => ({ a, b, ...extra });
const lamp = (id, nodeId, extra = {}) => ({
  id,
  node: nodeId,
  capacity: 1,
  initial: 0,
  labelKey: `lamp.${id}`,
  ...extra,
});
const one = () => [platform("aL", -2, 0, 0), platform("aR", 2, 0, 1)];
const two = () => [
  platform("aL", -6, 0, 0),
  platform("aR", -2, 0, 1),
  platform("bL", 2, 1, 0),
  platform("bR", 6, 1, 1),
];
export const LEVELS = [
  {
    titleKey: "chapter.0.title",
    subtitleKey: "chapter.0.subtitle",
    initial: [[2, 1]],
    start: "aL",
    nodes: [
      ...one(),
      node("exit", 5, 0, 0, "exit"),
      node("trace", -4, -2, 3, "trace", { trace: "trace1" }),
    ],
    edges: [edge("aL", "aR"), edge("aR", "exit"), edge("aL", "trace")],
    lamps: [],
  },
  {
    titleKey: "chapter.1.title",
    subtitleKey: "chapter.1.subtitle",
    initial: [[3, 1]],
    start: "aL",
    nodes: [
      ...one(),
      node("home", 5, 0, 0, "home", { lamp: "home" }),
      node("exit", 7, 0, 0, "exit"),
      node("trace", 5, 2.5, 0, "trace", { trace: "trace2" }),
    ],
    edges: [
      edge("aL", "aR"),
      edge("aR", "home"),
      edge("home", "exit"),
      edge("home", "trace"),
    ],
    lamps: [lamp("home", "home")],
  },
  {
    titleKey: "chapter.2.title",
    subtitleKey: "chapter.2.subtitle",
    initial: [
      [3, 1],
      [2, 1],
    ],
    start: "aL",
    nodes: [
      ...two(),
      node("balcony", 0, 0, 0, "balcony", { lamp: "gate" }),
      node("exit", 9, 0, 0, "exit", { lamp: "door" }),
      node("trace", 2, -3, 3, "trace", { trace: "trace3" }),
    ],
    edges: [
      edge("aL", "aR"),
      edge("aR", "balcony"),
      edge("balcony", "bL", { gate: "gate" }),
      edge("bL", "bR"),
      edge("bR", "exit"),
      edge("bL", "trace"),
    ],
    lamps: [
      lamp("gate", "balcony", { access: ["balcony", "bL"] }),
      lamp("door", "exit"),
    ],
  },
  {
    titleKey: "chapter.3.title",
    subtitleKey: "chapter.3.subtitle",
    initial: [
      [3, 1],
      [2, 1],
    ],
    start: "aL",
    nodes: [
      ...two(),
      node("balcony", 0, 0, 0, "balcony", { lamp: "return" }),
      node("recording", 8, 0, 3, "recording", { lamp: "memorial" }),
      node("homeA", 2, 4, 0, "home", { lamp: "homeA" }),
      node("homeB", 5, 4, 0, "home", { lamp: "homeB" }),
      node("exit", 8, 4, 0, "exit"),
    ],
    edges: [
      edge("aL", "aR"),
      edge("aR", "balcony"),
      edge("balcony", "bL"),
      edge("bL", "bR"),
      edge("bR", "recording"),
      edge("recording", "balcony", {
        gate: "return",
        heard: true,
        stairs: true,
      }),
      edge("balcony", "homeA"),
      edge("homeA", "homeB"),
      edge("homeB", "exit"),
    ],
    lamps: [
      lamp("return", "balcony"),
      lamp("memorial", "recording", { capacity: 2 }),
      lamp("homeA", "homeA"),
      lamp("homeB", "homeB"),
    ],
  },
];
for (const level of LEVELS)
  level.total = level.initial.flat().reduce((a, b) => a + b, 0);

export function createState(chapter = 0) {
  const level = LEVELS[chapter];
  if (!level) throw new RangeError("Unknown chapter");
  return {
    chapter,
    counts: level.initial.map((pair) => [...pair]),
    carry: 0,
    node: level.start,
    lamps: Object.fromEntries(level.lamps.map((l) => [l.id, l.initial])),
    collected: [],
    heard: false,
    ending: null,
    moves: 0,
  };
}
export function height(state, mechanism, side) {
  const pair = state.counts[mechanism];
  return pair[0] === pair[1] ? 1.5 : pair[side] > pair[1 - side] ? 0 : 3;
}
export function nodeHeight(state, nodeOrId) {
  const n =
    typeof nodeOrId === "string"
      ? LEVELS[state.chapter].nodes.find((n) => n.id === nodeOrId)
      : nodeOrId;
  return n.platform ? height(state, ...n.platform) : n.y;
}
function edgeOpen(state, e) {
  if (e.gate && state.lamps[e.gate] === 0) return false;
  if (e.heard && !state.heard) return false;
  if (e.stairs) return true;
  return nodeHeight(state, e.a) === nodeHeight(state, e.b);
}
/** All visible connections, including unavailable paths, for route previews. */
export function connections(state) {
  return LEVELS[state.chapter].edges.map((e) => ({
    ...e,
    open: edgeOpen(state, e),
  }));
}
function lampAccessible(state, l) {
  if (!(l.access || [l.node]).includes(state.node)) return false;
  // Gate handle is reachable from both sides of its LOW stationary landing.
  return nodeHeight(state, state.node) === nodeHeight(state, l.node);
}
function endingReady(state, ending) {
  if (
    state.chapter !== 3 ||
    !state.heard ||
    state.node !== "exit" ||
    state.lamps.return !== 1
  )
    return false;
  if (ending === "memorial")
    return (
      state.lamps.memorial === 2 &&
      state.lamps.homeA === 0 &&
      state.lamps.homeB === 0
    );
  if (ending === "homes")
    return (
      state.lamps.memorial === 0 &&
      state.lamps.homeA === 1 &&
      state.lamps.homeB === 1
    );
  return false;
}
export function isComplete(state) {
  if (state.chapter === 3) return state.ending !== null;
  return (
    state.node === "exit" &&
    (state.chapter === 0 ||
      state.lamps[state.chapter === 1 ? "home" : "door"] === 1)
  );
}
export function actions(state) {
  if (state.ending !== null) return [];
  const level = LEVELS[state.chapter],
    current = level.nodes.find((n) => n.id === state.node),
    result = [];
  if (current.platform) {
    const [m, s] = current.platform;
    if (state.carry < 2 && state.counts[m][s] > 0)
      result.push({
        id: "take",
        type: "take",
        labelKey: "action.take",
        target: state.node,
      });
    if (state.carry > 0)
      result.push({
        id: "give",
        type: "give",
        labelKey: "action.give",
        target: state.node,
      });
  }
  for (const l of level.lamps)
    if (lampAccessible(state, l)) {
      if (state.carry > 0 && state.lamps[l.id] < l.capacity)
        result.push({
          id: `light:${l.id}`,
          type: "light",
          labelKey: "action.light",
          params: { place: l.labelKey },
          target: l.id,
        });
      if (state.carry < 2 && state.lamps[l.id] > 0)
        result.push({
          id: `reclaim:${l.id}`,
          type: "reclaim",
          labelKey: "action.reclaim",
          params: { place: l.labelKey },
          target: l.id,
        });
    }
  if (current.trace && !state.collected.includes(current.trace))
    result.push({
      id: `read:${current.trace}`,
      type: "read",
      labelKey: "action.read",
      target: current.trace,
    });
  if (state.chapter === 3 && state.node === "recording" && !state.heard)
    result.push({
      id: "listen",
      type: "listen",
      labelKey: "action.listen",
      target: "recording",
    });
  for (const e of level.edges) {
    const target = e.a === state.node ? e.b : e.b === state.node ? e.a : null;
    if (target && edgeOpen(state, e))
      result.push({
        id: `walk:${target}`,
        type: "walk",
        labelKey: "action.walk",
        params: { place: `node.${target}` },
        target,
      });
  }
  for (const ending of ["memorial", "homes"])
    if (endingReady(state, ending))
      result.push({
        id: `finish:${ending}`,
        type: "finish",
        labelKey: "action.finish",
        params: { place: `ending.${ending}.title` },
        target: ending,
      });
  return result;
}
export function apply(state, actionId) {
  const action = actions(state).find((a) => a.id === actionId);
  if (!action) return state;
  const next = structuredClone(state);
  const current = LEVELS[state.chapter].nodes.find((n) => n.id === state.node);
  switch (action.type) {
    case "take":
      next.counts[current.platform[0]][current.platform[1]]--;
      next.carry++;
      next.moves++;
      break;
    case "give":
      next.counts[current.platform[0]][current.platform[1]]++;
      next.carry--;
      next.moves++;
      break;
    case "light":
      next.lamps[action.target]++;
      next.carry--;
      next.moves++;
      break;
    case "reclaim":
      next.lamps[action.target]--;
      next.carry++;
      next.moves++;
      break;
    case "walk":
      next.node = action.target;
      break;
    case "read":
      next.collected.push(action.target);
      break;
    case "listen":
      next.heard = true;
      break;
    case "finish":
      next.ending = action.target;
      break;
  }
  return next;
}
/** Reject malformed/corrupt saves; never silently repair light conservation. */
export function validateState(s) {
  if (
    !s ||
    typeof s !== "object" ||
    !Number.isInteger(s.chapter) ||
    !LEVELS[s.chapter]
  )
    return false;
  const level = LEVELS[s.chapter];
  if (
    !Array.isArray(s.counts) ||
    s.counts.length !== level.initial.length ||
    s.counts.some(
      (p) =>
        !Array.isArray(p) ||
        p.length !== 2 ||
        p.some((n) => !Number.isInteger(n) || n < 0 || n > level.total),
    )
  )
    return false;
  if (
    !Number.isInteger(s.carry) ||
    s.carry < 0 ||
    s.carry > 2 ||
    !level.nodes.some((n) => n.id === s.node)
  )
    return false;
  if (
    !s.lamps ||
    typeof s.lamps !== "object" ||
    Object.keys(s.lamps).length !== level.lamps.length ||
    level.lamps.some(
      (l) =>
        !Number.isInteger(s.lamps[l.id]) ||
        s.lamps[l.id] < 0 ||
        s.lamps[l.id] > l.capacity,
    )
  )
    return false;
  if (
    s.counts.flat().reduce((a, b) => a + b, 0) +
      s.carry +
      Object.values(s.lamps).reduce((a, b) => a + b, 0) !==
    level.total
  )
    return false;
  const traceIds = level.nodes.filter((n) => n.trace).map((n) => n.trace);
  if (
    !Array.isArray(s.collected) ||
    new Set(s.collected).size !== s.collected.length ||
    s.collected.some((id) => !traceIds.includes(id))
  )
    return false;
  if (
    typeof s.heard !== "boolean" ||
    ![null, "memorial", "homes"].includes(s.ending) ||
    !Number.isInteger(s.moves) ||
    s.moves < 0
  )
    return false;
  if (s.chapter !== 3 && (s.heard || s.ending !== null)) return false;
  if (s.ending && !endingReady(s, s.ending)) return false;
  return true;
}
export function stateKey(state) {
  // Move count is a statistic, not part of the finite puzzle state.
  return JSON.stringify([
    state.chapter,
    state.counts,
    state.carry,
    state.node,
    state.lamps,
    [...state.collected].sort(),
    state.heard,
    state.ending,
  ]);
}
/** Breadth-first search. Accepts a predicate or 'heard', 'memorial', 'homes', 'trace'. */
export function solve(state, goal = isComplete) {
  const predicate =
    typeof goal === "function"
      ? goal
      : goal === "heard"
        ? (s) => s.heard
        : goal === "trace"
          ? (s) => s.collected.length > 0 && isComplete(s)
          : (s) => s.ending === goal;
  if (predicate(state)) return [];
  const queue = [{ state, parent: -1, action: null }],
    seen = new Set([stateKey(state)]);
  for (let i = 0; i < queue.length; i++) {
    const entry = queue[i];
    for (const action of actions(entry.state)) {
      const next = apply(entry.state, action.id),
        key = stateKey(next);
      if (seen.has(key)) continue;
      seen.add(key);
      queue.push({ state: next, parent: i, action: action.id });
      if (predicate(next)) {
        const path = [];
        for (
          let j = queue.length - 1;
          queue[j].parent !== -1;
          j = queue[j].parent
        )
          path.push(queue[j].action);
        return path.reverse();
      }
    }
  }
  return null;
}
