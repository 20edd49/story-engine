export type Module =
  | "overview"
  | "characters"
  | "timeline"
  | "family"
  | "relationships"
  | "locations"
  | "scenes"
  | "vehicles"
  | "canon"
  | "lore"
  | "continuities";
export type UniverseTheme = {
  accent: string;
  accentSecondary: string;
  backgroundTone: string;
  texture: "arches" | "columns";
};
export type Universe = {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  theme: UniverseTheme;
  explorer?: {
    x: number;
    y: number;
    depth: number;
    scale: number;
    variant: "warm-orbital" | "cold-architectural";
    orbitCount: number;
    bodyCount: number;
  };
  coverImage?: string;
  navigation: { module: Module; label: string }[];
  defaultContinuityId: string;
  keywords: string[];
};
export type Entity = {
  id: string;
  universeId: string;
  slug: string;
  placeholder?: boolean;
};
export type Continuity = Entity & {
  name: string;
  type: "main-canon" | "alternate-universe" | "what-if" | "non-canon";
  description: string;
  badgeLabel: string;
};
export type Character = Entity & {
  name: string;
  fullName?: string;
  aliases?: string[];
  role?: string;
  description: string;
  biography?: string;
  birthDate?: string;
  deathDate?: string;
  occupation?: string[];
  nationality?: string[];
  portrait?: string;
  tags: string[];
  status?: string;
  firstAppearance?: string;
  notes?: string;
};
export type Relationship = Entity & {
  continuityId: string;
  characterIds: string[];
  members?: {
    characterId: string;
    role: "parent" | "child" | "member";
    label?: string;
  }[];
  relationshipType: string;
  title: string;
  summary: string;
  notes?: string;
};
export type StoryDate = {
  date?: string;
  dateDisplay: string;
  sortDate?: string;
  datePrecision: "exact" | "approximate" | "year" | "narrative";
  narrativeOrder: number;
};
export type TimelineEvent = Entity &
  StoryDate & {
    continuityId: string;
    title: string;
    description: string;
    characterIds: string[];
    locationId?: string;
    sceneIds: string[];
    tags: string[];
    category: string;
  };
export type Scene = Entity &
  StoryDate & {
    continuityId: string;
    title: string;
    subtitle?: string;
    chronologicalOrder: number;
    storyOrder: number;
    povCharacterIds: string[];
    characterIds: string[];
    locationId?: string;
    body: string;
    bodyFormat: "plain-text";
    summary: string;
    tags: string[];
    status: "draft" | "canon" | "archived";
    notes?: string;
  };
export type Location = Entity & {
  name: string;
  city?: string;
  country?: string;
  locationType: string;
  description: string;
  residentIds: string[];
  characterIds: string[];
  image?: string;
};
export type CanonRule = Entity & {
  continuityId: string;
  category: string;
  title: string;
  body: string;
};
export type Quote = Entity & {
  continuityId: string;
  characterId?: string;
  sceneId?: string;
  text: string;
};
export type CollectionItem = Entity & {
  title: string;
  description: string;
  entityIds: string[];
};
export type Tag = Entity & { name: string };
export type Lore = Entity & {
  continuityId: string;
  title: string;
  category: string;
  description: string;
};
export type Vehicle = Entity & {
  continuityId: string;
  name: string;
  ownerId?: string;
  model: string;
  modelYear?: number;
  configuration?: string;
  color?: string;
  acquisition?: string;
  significance: string;
  sceneIds: string[];
  eventIds: string[];
};
// Separate extension models preserve distinct semantics for future relational tables.
export type Book = Entity & { title: string; continuityId: string };
export type Chapter = Entity & {
  bookId: string;
  title: string;
  order: number;
  sceneIds: string[];
};
export type StoryArc = Entity & {
  continuityId: string;
  title: string;
  eventIds: string[];
};
export type Organization = Entity & { name: string; memberIds: string[] };
export type Artifact = Entity & {
  name: string;
  ownerId?: string;
  description: string;
};
export type Power = Entity & {
  name: string;
  continuityId: string;
  description: string;
};
export type HistoricalPeriod = Entity & {
  name: string;
  continuityId: string;
  startLabel?: string;
  endLabel?: string;
};
export type SearchResult = {
  id: string;
  universeId: string;
  universeName: string;
  continuityId?: string;
  continuityLabel?: string;
  title: string;
  description: string;
  kind: string;
  href: string;
  placeholder?: boolean;
};
