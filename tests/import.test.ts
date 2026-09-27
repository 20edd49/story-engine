import test from "node:test";
import assert from "node:assert/strict";
import { parseImportText } from "../src/lib/import/parse";
import { normalizeImportDraft } from "../src/lib/import/normalize";
import { validateImportDraft } from "../src/lib/import/validate";
import type { ImportCatalog } from "../src/lib/import/types";

const catalog: ImportCatalog = {
  universes: [{ id: "u-one", name: "One" }, { id: "u-two", name: "Two" }],
  continuities: [
    { id: "c-main", universeId: "u-one", name: "Main" },
    { id: "c-alt", universeId: "u-one", name: "Alternate" },
    { id: "c-other", universeId: "u-two", name: "Other" },
  ],
  characters: [
    { id: "ch-local", slug: "local", label: "Local", universeId: "u-one" },
    { id: "ch-foreign", slug: "foreign", label: "Foreign", universeId: "u-two" },
  ],
  scenes: [
    { id: "sc-main", slug: "main-scene", label: "Main scene", universeId: "u-one", continuityId: "c-main", storyOrder: 1 },
    { id: "sc-alt", slug: "alternate-scene", label: "Alternate scene", universeId: "u-one", continuityId: "c-alt", storyOrder: 1 },
  ],
  timelineEvents: [], relationships: [], canonRules: [],
  tags: [{ id: "tag-family", slug: "family", label: "Family", universeId: "u-one" }],
};
const run = (text: string, u = "u-one", c = "c-main") =>
  validateImportDraft(normalizeImportDraft(parseImportText(text, u, c), catalog), catalog);

test("scene prose is preserved exactly and no date or relationship is invented", () => {
  const prose = "  First line.\r\n\r\nScene: this is dialogue, not a heading.\r\nLast line.\r\n";
  const draft = run(`[[scene]]\r\ntitle: First scene\r\nbody:\r\n${prose}[[/scene]]`);
  assert.equal(draft.scenes[0].body, prose);
  assert.equal(draft.scenes[0].dateText, undefined);
  assert.deepEqual(draft.relationships, []);
  assert.equal(draft.validationErrors.length, 0);
});

test("simple pasted scene notes and unstructured text stay distinct", () => {
  const draft = run("Scene: Morning\nA paragraph.\n\n");
  assert.equal(draft.scenes[0].body, "A paragraph.\n\n");
  const unresolved = run("Amelia may arrive later.");
  assert.deepEqual(unresolved.scenes, []);
  assert.equal(unresolved.unresolvedText[0], "Amelia may arrive later.");
  assert.ok(unresolved.warnings.some((issue) => issue.code === "unstructured-text"));
});

test("references distinguish existing, proposed, unknown, cross-universe, and wrong continuity", () => {
  const draft = run(`[[character]]
name: New Person
[[/character]]
[[scene]]
title: New scene
characters: ch-local, New Person, ch-foreign, Nobody
tags: Family, New Tag
body:
Prose.
[[/scene]]
[[event]]
title: Event
scenes: sc-alt
[[/event]]`);
  assert.equal(draft.scenes[0].characterRefs[0].state, "resolved");
  assert.equal(draft.scenes[0].characterRefs[1].state, "resolved");
  assert.equal(draft.scenes[0].characterRefs[2].state, "cross-universe");
  assert.equal(draft.scenes[0].characterRefs[3].state, "unresolved");
  assert.equal(draft.timelineEvents[0].sceneRefs[0].state, "wrong-continuity");
  assert.ok(draft.tags.some((tag) => tag.name === "New Tag" && tag.disposition === "new"));
  assert.ok(draft.validationErrors.some((issue) => issue.code === "unknown-character-reference"));
  assert.ok(draft.validationErrors.some((issue) => issue.code === "cross-universe-reference"));
  assert.ok(draft.validationErrors.some((issue) => issue.code === "wrong-continuity-reference"));
});

test("duplicate identifiers, slugs, order, empty bodies, and scope are rejected", () => {
  const draft = run(`[[scene]]
id: sc-duplicate
slug: same
title: One
storyOrder: 1
body:
[[/scene]]
[[scene]]
id: sc-duplicate
slug: same
title: Two
storyOrder: 1
body:
Text.
[[/scene]]`, "u-one", "missing");
  const codes = new Set(draft.validationErrors.map((issue) => issue.code));
  for (const code of ["missing-continuity", "duplicate-id", "duplicate-slug",
    "empty-scene-body", "duplicate-story-order"]) assert.ok(codes.has(code), code);
  assert.ok(run("Scene: One\nText.", "missing", "c-main").validationErrors
    .some((issue) => issue.code === "missing-universe"));
});
