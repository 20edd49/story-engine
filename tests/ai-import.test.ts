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
  assert.deepEqual(draft.unresolvedSpans?.[0].sourceRange, { start: 1, end: 1 });
  assert.ok(draft.warnings.some((issue) => issue.code === "unmapped-source-text"));
});

test("live-style Smart Import resolves existing entities and preserves source structure", () => {
  const prose = [
    "Mateo came home later than usual.", "", "Marisol was at the table folding laundry while Camila sat on the floor doing homework.",
    "", "Comiste? Marisol asked.", "", "Sí.", "", "Camila looked up. Hes lying.", "",
    "Mateo dropped his backpack beside the couch.", "", "Can you not?", "",
    "You always say yes when you didnt eat.", "", "Marisol looked at him again.", "",
    "Qué pasa?", "", "Mateo hesitated.", "", "Nothing.", "",
    "She stared at him long enough that he looked away.", "", "The front door opened.", "",
    "Roberto stepped inside, tired from work, and immediately noticed the room was too quiet.", "",
    "Qué pasó?", "", "Nada, Mateo said.", "", "Camila muttered, Definitely something.", "",
    "Mateo glared at her.", "", "Roberto sat down.", "", "Entonces habla.", "",
    "Mateo took a breath.", "", "Theres something I need to tell you.", "", "He stopped.", "",
    "Then corrected himself.", "", "Hay algo que necesito decirles.", "",
  ].join("\n") + "\n";
  const chronology = "This happens after Mateo already knows Amelia is pregnant, but before the whole family has fully processed what comes next.";
  const raw = "UNIVERSE: Reyes-Bennett\nCONTINUITY: Main Canon\nLOCATION: Reyes apartment, Los Angeles\nCHARACTERS: Mateo, Marisol, Roberto, Camila\n\n" +
    prose + "---\n\nTIMELINE NOTE:\n" + chronology + "\n\nCANON NOTE:\nRoberto and Marisol speak Spanish only.\n\nTAG IDEAS:\nfamily, pregnancy, confrontation, Los Angeles";
  const lines = raw.split("\n");
  const lineOf = (value: string) => lines.indexOf(value) + 1;
  const bodyRange = { start: lineOf("Mateo came home later than usual."), end: lineOf("Hay algo que necesito decirles.") + 1 };
  const note = (kind: "timeline" | "canon" | "tag", label: string, end: string) => ({
    kind, text: `${label}\n${end}\n`, sourceRange: { start: lineOf(label), end: lineOf(end) },
  });
  const existing: ImportCatalog = {
    ...catalog,
    characters: ["Mateo", "Marisol", "Roberto", "Camila"].map((name) => ({
      id: `ch-${name.toLowerCase()}`, slug: name.toLowerCase(), label: name, universeId: "u-one",
    })),
    locations: [{ id: "loc-reyes", slug: "reyes-apartment-los-angeles", label: "Reyes apartment, Los Angeles", universeId: "u-one" }],
    canonRules: [{ id: "canon-spanish", slug: "spanish-only", label: "Spanish only", universeId: "u-one", continuityId: "c-main" }],
    tags: [{ id: "tag-family", slug: "family", label: "family", universeId: "u-one" }],
  };
  const proposal = output({
    scenes: [scene({ title: null, generatedTitle: false,
      sourceRange: bodyRange, bodyRanges: [bodyRange], body: "AI rewrote this prose.",
      dateDisplay: chronology, datePrecision: "narrative", storyOrder: null,
      locationRef: "reyes-apartment-los-angeles",
      characterRefs: ["ch-mateo", "ch-marisol", "ch-roberto", "ch-camila"],
      tagRefs: ["family", "pregnancy"] })],
    proposedCharacters: existing.characters.map((item) => ({ id: item.id, slug: item.slug,
      name: item.label, description: null, facts: [], tagRefs: [] })),
    proposedLocations: [{ id: "loc-reyes", slug: "reyes-apartment-los-angeles",
      name: "Reyes apartment, Los Angeles", description: null }],
    proposedCanonRules: [{ id: "canon-spanish", slug: "spanish-only", title: "Spanish only",
      category: null, body: "Roberto and Marisol speak Spanish only.", sourceRange: null }],
    proposedTags: [{ id: "tag-family", slug: "family", name: "family" },
      { id: null, slug: "pregnancy", name: "pregnancy" }],
    metadataNotes: [
      { ...note("timeline", "TIMELINE NOTE:", chronology), text: chronology },
      note("canon", "CANON NOTE:", "Roberto and Marisol speak Spanish only."),
      { kind: "tag", text: "TAG IDEAS:\nfamily, pregnancy, confrontation, Los Angeles",
        sourceRange: { start: lineOf("TAG IDEAS:"), end: lineOf("family, pregnancy, confrontation, Los Angeles") } },
    ],
  });
  const draft = validateImportDraft(normalizeImportDraft(map(proposal, raw), existing), existing);
  assert.equal(draft.scenes[0].body, prose);
  assert.equal(draft.scenes[0].generatedTitle, true);
  assert.match(draft.scenes[0].title, /^Proposed scene 1/);
  assert.equal(draft.scenes[0].dateDisplay, undefined);
  assert.equal(draft.scenes[0].dateText, undefined);
  assert.deepEqual(draft.characters, []);
  assert.deepEqual(draft.locations, []);
  assert.deepEqual(draft.canonRules, []);
  assert.deepEqual(draft.tags.map((item) => item.name), ["pregnancy"]);
  assert.equal(draft.scenes[0].locationRef?.id, "loc-reyes");
  assert.equal(draft.scenes[0].tagRefs[0].id, "tag-family");
  assert.equal(draft.resolvedEntities?.length, 7);
  assert.deepEqual(draft.unresolvedText, []);
  assert.ok(!draft.warnings.some((item) => item.code === "metadata-reconstructed" || item.code === "metadata-fidelity-mismatch" || item.code === "unmapped-source-text"));
  assert.deepEqual(draft.validationErrors, []);
});

test("existing events and relationships are removed from new proposals", () => {
  const existing: ImportCatalog = { ...catalog,
    timelineEvents: [{ id: "ev-one", slug: "return-home", label: "Return home", universeId: "u-one", continuityId: "c-main" }],
    relationships: [{ id: "rel-one", slug: "family-tie", label: "Family tie", universeId: "u-one", continuityId: "c-main" }],
  };
  const proposal = output({
    proposedEvents: [{ id: "ev-one", slug: "return-home", title: "Return home", description: null,
      sourceRange: null, date: null, dateDisplay: null, datePrecision: null,
      locationRef: null, sceneRefs: [], characterRefs: [], tagRefs: [] }],
    proposedRelationships: [{ id: "rel-one", slug: "family-tie", title: "Family tie",
      relationshipType: null, summary: null, facts: [], characterRefs: [] }],
  });
  const draft = normalizeImportDraft(map(proposal), existing);
  assert.deepEqual(draft.timelineEvents, []);
  assert.deepEqual(draft.relationships, []);
  assert.deepEqual(draft.resolvedEntities?.map((item) => item.id), ["ev-one", "rel-one"]);
});

test("final draft removes canonical locations and tags while retaining genuinely new proposals", () => {
  const existing: ImportCatalog = { ...catalog,
    locations: [{ id: "loc-reyes", slug: "reyes-apartment-los-angeles",
      label: "Reyes Apartment (Los Angeles)", universeId: "u-one" }],
    tags: [
      { id: "tag-pregnancy", slug: "pregnancy", label: "Pregnancy arc", universeId: "u-one" },
      { id: "tag-confrontation", slug: "confrontation", label: "Family confrontation", universeId: "u-one" },
      { id: "tag-los-angeles", slug: "los-angeles", label: "Los Angeles setting", universeId: "u-one" },
    ],
  };
  const proposal = output({
    scenes: [scene({
      locationRef: "reyes-apartment-los-angeles",
      tagRefs: ["pregnancy", "confrontation", "los-angeles", "new-family-tag"],
    })],
    proposedLocations: [
      { id: null, slug: "Reyes Apartment Los Angeles", name: "Reyes apartment, Los Angeles", description: null },
      { id: null, slug: "reyes-garden", name: "Reyes garden", description: null },
    ],
    proposedTags: [
      { id: null, slug: "Pregnancy", name: "pregnancy" },
      { id: null, slug: "Confrontation", name: "confrontation" },
      { id: null, slug: "Los Angeles", name: "Los Angeles" },
      { id: null, slug: "new-family-tag", name: "new family tag" },
      { id: null, slug: "pregnancy-arc-next", name: "Pregnancy arc next" },
    ],
  });
  const finalDraft = validateImportDraft(normalizeImportDraft(map(proposal), existing), existing);
  assert.equal(finalDraft.scenes[0].locationRef?.state, "resolved");
  assert.equal(finalDraft.scenes[0].locationRef?.id, "loc-reyes");
  assert.deepEqual(finalDraft.scenes[0].tagRefs.map((ref) => [ref.state, ref.id]), [
    ["resolved", "tag-pregnancy"], ["resolved", "tag-confrontation"],
    ["resolved", "tag-los-angeles"], ["proposed", undefined],
  ]);
  assert.deepEqual(finalDraft.locations?.map((item) => item.name), ["Reyes garden"]);
  assert.deepEqual(finalDraft.tags.map((item) => item.name), ["new family tag", "Pregnancy arc next"]);
  assert.deepEqual(finalDraft.resolvedEntities?.map((item) => item.id), [
    "tag-pregnancy", "tag-confrontation", "tag-los-angeles", "loc-reyes",
  ]);
  assert.deepEqual(finalDraft.validationErrors, []);
});

test("references to an AI proposal ID follow its safe canonical tag match", () => {
  const existing: ImportCatalog = { ...catalog, tags: [
    { id: "tag-pregnancy", slug: "pregnancy", label: "Pregnancy arc", universeId: "u-one" },
  ] };
  const proposal = output({
    scenes: [scene({ tagRefs: ["ai-pregnancy"] })],
    proposedTags: [{ id: "ai-pregnancy", slug: "Pregnancy", name: "pregnancy" }],
  });
  const draft = normalizeImportDraft(map(proposal), existing);
  assert.deepEqual(draft.tags, []);
  assert.equal(draft.scenes[0].tagRefs[0].id, "tag-pregnancy");
  assert.equal(draft.scenes[0].tagRefs[0].state, "resolved");
});

test("canonical location references remove the matching AI location proposal", () => {
  const existing: ImportCatalog = { ...catalog, locations: [{
    id: "reyes-apartment-los-angeles", slug: "reyes-home", label: "Reyes home",
    universeId: "u-one",
  }] };
  const proposal = output({
    scenes: [scene({ locationRef: "reyes-apartment-los-angeles" })],
    proposedLocations: [{ id: null, slug: null,
      name: "Reyes apartment, Los Angeles", description: null }],
  });
  const draft = normalizeImportDraft(map(proposal), existing);
  assert.equal(draft.scenes[0].locationRef?.state, "resolved");
  assert.equal(draft.scenes[0].locationRef?.id, "reyes-apartment-los-angeles");
  assert.deepEqual(draft.locations, []);
  assert.deepEqual(draft.resolvedEntities?.filter((item) => item.kind === "location"), [{
    kind: "location", id: "reyes-apartment-los-angeles", label: "Reyes home",
  }]);
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
