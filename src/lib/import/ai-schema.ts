// Exact strict Responses API schema. Every object forbids extra fields and
// every property is required; unavailable facts are represented by null.
const string = { type: "string" } as const;
const nullableString = { type: ["string", "null"] } as const;
const nullableInteger = { type: ["integer", "null"] } as const;
const boolean = { type: "boolean" } as const;
const array = (items: unknown) => ({ type: "array", items });
const object = (properties: Record<string, unknown>) => ({
  type: "object", properties, required: Object.keys(properties), additionalProperties: false,
});
const range = object({ start: { type: "integer" }, end: { type: "integer" } });
const nullableRange = { anyOf: [range, { type: "null" }] };
const references = array(string);
const nullablePrecision = {
  type: ["string", "null"],
  enum: ["exact", "approximate", "year", "narrative", null],
};
const dated = {
  date: nullableString,
  dateDisplay: nullableString,
  datePrecision: nullablePrecision,
};
const named = { id: nullableString, slug: nullableString };

export const SMART_IMPORT_SCHEMA = object({
  chapter: { anyOf: [object({
    title: nullableString,
    number: nullableString,
    sourceRange: nullableRange,
  }), { type: "null" }] },
  scenes: array(object({
    ...named,
    title: nullableString,
    generatedTitle: boolean,
    sourceRange: range,
    bodyRanges: array(range),
    body: string,
    boundaryReason: nullableString,
    storyOrder: nullableInteger,
    ...dated,
    locationRef: nullableString,
    characterRefs: references,
    povCharacterRefs: references,
    tagRefs: references,
  })),
  proposedCharacters: array(object({
    ...named, name: string, description: nullableString,
    facts: array(string), tagRefs: references,
  })),
  proposedLocations: array(object({
    ...named, name: string, description: nullableString,
  })),
  proposedEvents: array(object({
    ...named, title: string, description: nullableString, sourceRange: nullableRange,
    ...dated, locationRef: nullableString, sceneRefs: references,
    characterRefs: references, tagRefs: references,
  })),
  proposedRelationships: array(object({
    ...named, title: string, relationshipType: nullableString,
    summary: nullableString, facts: array(string), characterRefs: references,
  })),
  proposedCanonRules: array(object({
    ...named, title: string, category: nullableString,
    body: string, sourceRange: nullableRange,
  })),
  proposedTags: array(object({ ...named, name: string })),
  metadataNotes: array(object({
    kind: { type: "string", enum: ["timeline", "canon", "tag", "character", "location", "chapter", "other"] },
    text: string, sourceRange: range,
  })),
  unresolvedReferences: array(object({
    input: string, reason: string, sourceRange: nullableRange,
  })),
  warnings: array(object({ code: string, message: string, path: string })),
});
