import test from "node:test";
import assert from "node:assert/strict";
import {
  mapSmartImportOutput, parseSmartImport, SmartImportError,
} from "../src/lib/import/ai-parse";
import { normalizeImportDraft } from "../src/lib/import/normalize";
import { validateImportDraft } from "../src/lib/import/validate";
import type { ImportCatalog } from "../src/lib/import/types";

const catalog: ImportCatalog = {
  universes: [{ id: "u-one", name: "One" }, { id: "u-two", name: "Two" }],
  continuities: [{ id: "c-main", universeId: "u-one", name: "Main" }],
  scenes: [], timelineEvents: [], relationships: [], canonRules: [], tags: [],
  locations: [{ id: "loc-home", slug: "home", label: "Home", universeId: "u-one" }],
  characters: [
    { id: "ch-local", slug: "mateo", label: "Mateo Reyes", universeId: "u-one" },
    { id: "ch-foreign", slug: "foreign", label: "Foreign", universeId: "u-two" },
  ],
};
const scene = (overrides: Record<string, unknown> = {}) => ({
  id: null, slug: null, title: "Opening", generatedTitle: false,
  sourceRange: { start: 1, end: 1 }, bodyRanges: [{ start: 1, end: 1 }],
  body: "Original prose.\n", boundaryReason: "Explicit scene heading",
  storyOrder: 1, date: null, dateDisplay: null, datePrecision: null,
  locationRef: "loc-home", characterRefs: ["ch-local"], povCharacterRefs: [],
  tagRefs: [], ...overrides,
});
const output = (overrides: Record<string, unknown> = {}) => ({
  chapter: null, scenes: [scene()], proposedCharacters: [], proposedLocations: [],
  proposedEvents: [], proposedRelationships: [], proposedCanonRules: [],
  proposedTags: [], metadataNotes: [], unresolvedReferences: [], warnings: [],
  ...overrides,
});
const map = (value: unknown, rawText = "Original prose.\n") =>
  mapSmartImportOutput(JSON.stringify(value), rawText, "u-one", "c-main");

test("maps strict output and reconstructs authored prose verbatim", () => {
  const draft = map(output({ scenes: [scene({ body: "Rewritten prose." })] }));
  assert.equal(draft.scenes[0].body, "Original prose.\n");
  assert.deepEqual(draft.scenes[0].sourceRange, { start: 1, end: 1 });
  assert.equal(draft.scenes[0].locationRef?.input, "loc-home");
  assert.ok(draft.warnings.some((issue) => issue.code === "prose-reconstructed"));
  const validated = validateImportDraft(normalizeImportDraft(draft, catalog), catalog);
  assert.equal(validated.scenes[0].characterRefs[0].state, "resolved");
  assert.equal(validated.scenes[0].locationRef?.state, "resolved");
  assert.deepEqual(validated.validationErrors, []);
});

test("extracts metadata outside scene bodies and respects explicit separators", () => {
  const raw = "CHAPTER 1\r\nFirst scene.\r\n---\r\nTIMELINE NOTE\r\nTwo days later.\r\nSecond scene.\r\n";
  const proposal = output({
    chapter: { title: null, number: "1", sourceRange: { start: 1, end: 1 } },
    scenes: [
      scene({ title: "First", sourceRange: { start: 2, end: 2 },
        bodyRanges: [{ start: 2, end: 2 }], body: "First scene.\r\n" }),
      scene({ title: "Second", sourceRange: { start: 6, end: 6 },
        bodyRanges: [{ start: 6, end: 6 }], body: "Second scene.\r\n",
        storyOrder: 2, boundaryReason: "Explicit separator and timeline note" }),
    ],
    metadataNotes: [{ kind: "timeline", text: "TIMELINE NOTE\r\nTwo days later.\r\n",
      sourceRange: { start: 4, end: 5 } }],
    proposedEvents: [{
      id: null, slug: null, title: "Two days later", description: "Two days later.",
      sourceRange: { start: 4, end: 5 }, date: null, dateDisplay: null, datePrecision: null,
      locationRef: null, sceneRefs: [], characterRefs: [], tagRefs: [],
    }],
  });
  const draft = map(proposal, raw);
  assert.equal(draft.scenes[0].body, "First scene.\r\n");
  assert.equal(draft.scenes[1].body, "Second scene.\r\n");
  assert.equal(draft.timelineEvents.length, 1);
  assert.equal(draft.metadataNotes?.[0].kind, "timeline");
  assert.ok(!draft.scenes.some((item) => item.body.includes("TIMELINE NOTE") || item.body.includes("---")));
});

test("unknown characters and cross-universe references still fail deterministic validation", () => {
  const proposal = output({ scenes: [scene({ characterRefs: ["Nobody", "ch-foreign"] })] });
  const draft = validateImportDraft(normalizeImportDraft(map(proposal), catalog), catalog);
  assert.ok(draft.validationErrors.some((issue) => issue.code === "unknown-character-reference"));
  assert.ok(draft.validationErrors.some((issue) => issue.code === "cross-universe-reference"));
});

test("unsupported dates are omitted with a warning", () => {
  const draft = map(output({ scenes: [scene({
    date: "2035-01-01", dateDisplay: "January 1, 2035", datePrecision: "exact",
  })] }));
  assert.equal(draft.scenes[0].date, undefined);
  assert.equal(draft.scenes[0].dateDisplay, undefined);
  assert.equal(draft.scenes[0].datePrecision, undefined);
  assert.ok(draft.warnings.some((issue) => issue.code === "unsupported-date"));
});

test("unmapped authored text is retained for review", () => {
  const draft = map(output({ scenes: [] }), "A fragment with no selected scene.\n");
  assert.deepEqual(draft.unresolvedText, ["A fragment with no selected scene.\n"]);
  assert.ok(draft.warnings.some((issue) => issue.code === "unmapped-source-text"));
});

test("rejects invalid AI output and metadata overlapping prose", () => {
  assert.throws(() => map({ scenes: [] }), (error: unknown) =>
    error instanceof SmartImportError && error.code === "invalid-ai-output");
  assert.throws(() => map(output({ scenes: [scene({ bodyRanges: [{ start: 3, end: 3 }] })] })),
    (error: unknown) => error instanceof SmartImportError && error.code === "invalid-ai-output");
  assert.throws(() => map(output({
    metadataNotes: [{ kind: "canon", text: "Original prose.", sourceRange: { start: 1, end: 1 } }],
  })), (error: unknown) => error instanceof SmartImportError && error.code === "metadata-in-scene-body");
});

test("oversized input is rejected before an API call", async () => {
  let called = false;
  await assert.rejects(
    parseSmartImport({
      rawText: "x".repeat(16_001), universeId: "u-one", continuityId: "c-main", catalog,
    }, async () => { called = true; return JSON.stringify(output()); }),
    (error: unknown) => error instanceof SmartImportError && error.code === "input-too-large" && error.status === 413,
  );
  assert.equal(called, false);
});

test("API failures produce a clear bounded error", async () => {
  await assert.rejects(
    parseSmartImport({ rawText: "Original prose.\n", universeId: "u-one", continuityId: "c-main", catalog },
      async () => { throw new Error("private upstream details"); }),
    (error: unknown) => error instanceof SmartImportError && error.code === "api-failure" &&
      !error.message.includes("private upstream details"),
  );
});
