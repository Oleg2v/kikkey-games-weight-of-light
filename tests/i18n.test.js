import test from "node:test";
import assert from "node:assert/strict";
import { dictionaries, languages, t, number, plural } from "../src/i18n.js";
import { LEVELS, createState, actions, apply, solve } from "../src/game.js";

const placeholders = (value) =>
  [...value.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();

test("all three languages contain the complete key and parameter set", () => {
  const reference = Object.keys(dictionaries.ru).sort();
  assert.ok(reference.length > 100, "the narrative and UI must be included");
  for (const lang of languages) {
    assert.deepEqual(Object.keys(dictionaries[lang]).sort(), reference, lang);
    for (const key of reference) {
      assert.ok(dictionaries[lang][key].trim(), `${lang}/${key}`);
      assert.deepEqual(
        placeholders(dictionaries[lang][key]),
        placeholders(dictionaries.ru[key]),
        `${lang}/${key}`,
      );
    }
  }
});

test("formatting works for localized numbers and all requested plural counts", () => {
  for (const lang of languages) {
    for (const n of [0, 1, 2, 3, 5, 11, 21, 101]) {
      assert.ok(t(lang, "transfers", { n }).includes(number(lang, n)));
      assert.ok(t(lang, "carry", { n }).includes(number(lang, n)));
      assert.equal(
        typeof plural(lang, n, {
          one: "one",
          two: "two",
          few: "few",
          many: "many",
          other: "other",
        }),
        "string",
      );
    }
  }
  assert.equal(
    plural("ru", 21, {
      one: "заряд",
      few: "заряда",
      many: "зарядов",
      other: "заряда",
    }),
    "заряд",
  );
  assert.equal(plural("en", 1, { one: "charge", other: "charges" }), "charge");
  assert.equal(
    plural("he", 2, { one: "one", two: "two", other: "other" }),
    "two",
  );
});

test("missing strings and parameters fail explicitly rather than fall back to English", () => {
  assert.throws(() => t("he", "not-a-key"), /Missing translation/);
  assert.throws(() => t("fr", "title"), /Missing translation/);
  assert.throws(() => t("ru", "carry"), /Missing translation parameter/);
  assert.equal(
    t("he", "hintNext", { action: "לקחת אור" }),
    "כדאי לנסות: לקחת אור",
  );
});

test("each chapter has its own title, goal and narrative in each language", () => {
  for (const lang of languages) {
    for (let chapter = 0; chapter < 4; chapter++) {
      for (const field of ["title", "subtitle", "goal", "story"]) {
        assert.ok(t(lang, `chapter.${chapter}.${field}`).length >= 3);
      }
    }
    for (const ending of ["memorial", "homes"]) {
      assert.ok(t(lang, `ending.${ending}.body`).length > 80);
    }
  }
});

test("authored level labels and reachable action parameters all translate", () => {
  for (const lang of languages) {
    for (const [chapter, level] of LEVELS.entries()) {
      for (const key of [
        level.titleKey,
        level.subtitleKey,
        ...level.nodes.map((n) => n.labelKey),
        ...level.lamps.map((l) => l.labelKey),
      ]) {
        assert.ok(t(lang, key), `${lang}/${key}`);
      }
      for (const goal of chapter === 3 ? ["memorial", "homes"] : ["trace"]) {
        let state = createState(chapter);
        const path = solve(state, goal);
        assert.ok(path, `chapter ${chapter} / ${goal}`);
        for (const id of path) {
          const action = actions(state).find((a) => a.id === id);
          const params = { ...action.params };
          if (params.place) params.place = t(lang, params.place);
          assert.ok(t(lang, action.labelKey, params));
          state = apply(state, id);
        }
      }
    }
  }
});
