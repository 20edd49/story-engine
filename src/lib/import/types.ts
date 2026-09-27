export type ImportKind = "scene" | "character" | "event" | "relationship" | "canon" | "tag";
export const MAX_SMART_IMPORT_CHARS = 16_000;
export type ImportDisposition = "existing" | "new";
export type ReferenceState = "resolved" | "proposed" | "unresolved" | "cross-universe" | "wrong-continuity";

export type ImportIssue = {
  code: string;
  message: string;
  path: string;
};

export type ImportReference = {
  input: string;
  id?: string;
  state: ReferenceState;
};

export type SourceRange = { start: number; end: number };
export type ImportChapter = {
  title?: string;
  number?: string;
  sourceRange?: SourceRange;
};
export type ImportUnresolved = {
  input: string;
  reason: string;
  sourceRange?: SourceRange;
};
export type ImportMetadataNote = {
  kind: "timeline" | "canon" | "tag" | "character" | "location" | "chapter" | "other";
  text: string;
  sourceRange: SourceRange;
};
export type ImportSourceSpan = { sourceRange: SourceRange; text: string };
export type ResolvedEntity = { kind: string; id: string; label: string };

export type DraftBase = {
  id?: string;
  slug?: string;
  disposition: ImportDisposition;
  sourceLine: number;
};

export type DraftScene = DraftBase & {
  title: string;
  body: string;
  storyOrder?: number;
  dateText?: string;
  date?: string;
  dateDisplay?: string;
  datePrecision?: "exact" | "approximate" | "year" | "narrative";
  sourceRange?: SourceRange;
  bodyRanges?: SourceRange[];
  boundaryReason?: string;
  generatedTitle?: boolean;
  locationRef?: ImportReference;
  characterRefs: ImportReference[];
  povCharacterRefs: ImportReference[];
  tagRefs: ImportReference[];
};

export type DraftCharacter = DraftBase & {
  name: string;
  description?: string;
  facts?: string[];
  tagRefs: ImportReference[];
};

export type DraftTimelineEvent = DraftBase & {
  title: string;
  description?: string;
  dateText?: string;
  date?: string;
  dateDisplay?: string;
  datePrecision?: "exact" | "approximate" | "year" | "narrative";
  sourceRange?: SourceRange;
  locationRef?: ImportReference;
  sceneRefs: ImportReference[];
  characterRefs: ImportReference[];
  tagRefs: ImportReference[];
};

export type DraftRelationship = DraftBase & {
  title: string;
  relationshipType?: string;
  summary?: string;
  facts?: string[];
  characterRefs: ImportReference[];
};

export type DraftCanonRule = DraftBase & {
  title: string;
  category?: string;
  body: string;
};

export type DraftTag = DraftBase & {
  name: string;
};

export type DraftLocation = DraftBase & {
  name: string;
  description?: string;
};

export type ImportDraft = {
  universeId: string;
  continuityId: string;
  chapter?: ImportChapter;
  scenes: DraftScene[];
  characters: DraftCharacter[];
  timelineEvents: DraftTimelineEvent[];
  relationships: DraftRelationship[];
  canonRules: DraftCanonRule[];
  tags: DraftTag[];
  locations?: DraftLocation[];
  unresolvedReferences?: ImportUnresolved[];
  metadataNotes?: ImportMetadataNote[];
  unresolvedText: string[];
  unresolvedSpans?: ImportSourceSpan[];
  resolvedEntities?: ResolvedEntity[];
  warnings: ImportIssue[];
  validationErrors: ImportIssue[];
};

// A future AI-assisted parser can implement this contract, then use the same
// normalization and validation pipeline. No parser is allowed to write data.
export type ImportParser = (
  rawText: string,
  universeId: string,
  continuityId: string,
) => ImportDraft;

export type CatalogRecord = {
  id: string;
  slug: string;
  label: string;
  universeId: string;
  continuityId?: string;
  storyOrder?: number;
};

export type ImportCatalog = {
  universes: { id: string; name: string }[];
  continuities: { id: string; universeId: string; name: string }[];
  scenes: CatalogRecord[];
  characters: CatalogRecord[];
  timelineEvents: CatalogRecord[];
  relationships: CatalogRecord[];
  canonRules: CatalogRecord[];
  tags: CatalogRecord[];
  locations?: CatalogRecord[];
};
