export type ImportKind = "scene" | "character" | "event" | "relationship" | "canon" | "tag";
export type ImportDisposition = "existing" | "new";
export type ReferenceState = "resolved" | "unresolved" | "cross-universe" | "wrong-continuity";

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
  characterRefs: ImportReference[];
  povCharacterRefs: ImportReference[];
  tagRefs: ImportReference[];
};

export type DraftCharacter = DraftBase & {
  name: string;
  description?: string;
  tagRefs: ImportReference[];
};

export type DraftTimelineEvent = DraftBase & {
  title: string;
  description?: string;
  dateText?: string;
  sceneRefs: ImportReference[];
  characterRefs: ImportReference[];
  tagRefs: ImportReference[];
};

export type DraftRelationship = DraftBase & {
  title: string;
  relationshipType?: string;
  summary?: string;
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

export type ImportDraft = {
  universeId: string;
  continuityId: string;
  scenes: DraftScene[];
  characters: DraftCharacter[];
  timelineEvents: DraftTimelineEvent[];
  relationships: DraftRelationship[];
  canonRules: DraftCanonRule[];
  tags: DraftTag[];
  unresolvedText: string[];
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
};
