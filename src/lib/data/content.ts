import type {
  Location,
  Scene,
  CanonRule,
  Lore,
  Vehicle,
  Quote,
  CollectionItem,
  Tag,
} from "../domain";
export const locations: Location[] = [
  {
    id: "loc-london",
    universeId: "u-reyes",
    slug: "london",
    name: "London",
    city: "London",
    country: "United Kingdom",
    locationType: "City",
    description:
      "An important place in the Reyes-Bennett story, including Amelia’s immigrant visa interview around mid-2023.",
    residentIds: [],
    characterIds: ["ch-amelia"],
  },
  {
    id: "loc-hudson",
    universeId: "u-reyes",
    slug: "hudson-household",
    name: "The Hudson household",
    locationType: "Household",
    description:
      "A named household in the supplied continuity. Roberto, Marisol, and Camila never move in permanently. The precise location is not recorded.",
    residentIds: [],
    characterIds: [],
  },
];
export const scenes: Scene[] = [
  ...[
    {
      id: "u-reyes",
      continuity: "c-reyes-main",
      title: "A space for the everyday",
      slug: "a-space-for-the-everyday",
    },
    {
      id: "u-elias",
      continuity: "c-elias-main",
      title: "The record begins here",
      slug: "the-record-begins-here",
    },
  ].map((u) => ({
    id: `sc-${u.id}`,
    universeId: u.id,
    continuityId: u.continuity,
    slug: u.slug,
    title: u.title,
    subtitle: "Reader preview",
    dateDisplay: "Undated · placeholder",
    datePrecision: "narrative" as const,
    narrativeOrder: 0,
    chronologicalOrder: 0,
    storyOrder: 0,
    povCharacterIds: [],
    characterIds: [],
    body: "This page is reserved for a story yet to be archived.\n\nIn time, the words will live here: a complete scene, with its own rhythm, perspective, and place in the wider continuity.\n\nThis is a reader preview, not a story event. No dialogue, action, setting, or outcome is established by this placeholder.",
    bodyFormat: "plain-text" as const,
    summary:
      "A clearly labeled preview of the reading experience. Original scene prose has not yet been supplied.",
    tags: ["Reader preview"],
    status: "draft" as const,
    placeholder: true,
    notes:
      "Placeholder only. Assigned to this continuity for organization; not an assertion of canon.",
  })),
];
const rules: [string, string, string][] = [
  ["Dialogue Rules", "Spanish only", "Roberto and Marisol speak Spanish only."],
  [
    "Character Rules",
    "Mum and Dad",
    "Amelia addresses her parents as Mum and Dad.",
  ],
  [
    "Continuity Notes",
    "The Hudson household",
    "Roberto, Marisol, and Camila never permanently move into the Hudson household.",
  ],
  [
    "Dialogue Rules",
    "Let conversations breathe",
    "Avoid repetitive reminders of already-established information. Dialogue should not devolve into repetitive one-word replies.",
  ],
  [
    "Character Rules",
    "Music in Mateo’s life",
    "Mateo plays guitar and occasionally sings.",
  ],
  [
    "Timeline Rules",
    "The opening anchor",
    "The main storyline begins around July 2019.",
  ],
  [
    "Relationship Rules",
    "The children",
    "Sofia is born first. Luca and Isla are later children. Unspecified dates and ordering must remain unassigned.",
  ],
  [
    "Canon Rules",
    "Separate continuities",
    "Starbucks AU, Speedster AU, and Divine AU remain separate from Main Canon.",
  ],
];
export const canonRules: CanonRule[] = rules.map(
  ([category, title, body], i) => ({
    id: `rule-reyes-${i + 1}`,
    slug: `rule-${i + 1}`,
    universeId: "u-reyes",
    continuityId: "c-reyes-main",
    category,
    title,
    body,
  }),
);
export const lore: Lore[] = [
  {
    id: "lore-northstar",
    universeId: "u-elias",
    continuityId: "c-elias-main",
    slug: "northstar",
    title: "Northstar",
    category: "Concept · classification pending",
    description:
      "Northstar is a known name associated with this universe. Its nature, structure, and relationship to the characters have not been supplied.",
  },
  {
    id: "lore-phases",
    universeId: "u-elias",
    continuityId: "c-elias-main",
    slug: "story-phases",
    title: "Story phases & parts",
    category: "Archive note",
    description:
      "The universe has distinct story phases and substantial long-term continuity. Names, boundaries, and ordering are awaiting supplied material.",
    placeholder: true,
  },
];
export const vehicles: Vehicle[] = [
  {
    id: "v-gls",
    universeId: "u-reyes",
    continuityId: "c-reyes-main",
    slug: "mercedes-benz-gls",
    name: "The family GLS",
    model: "Mercedes-Benz GLS",
    color: "Eventually green",
    significance:
      "The family vehicle. Sofia later causes it to become green through a paint or wrap-related event.",
    sceneIds: [],
    eventIds: ["ev-gls", "ev-green-gls"],
  },
  {
    id: "v-taycan",
    universeId: "u-reyes",
    continuityId: "c-reyes-main",
    slug: "porsche-taycan-turbo-gt",
    name: "Mateo’s Taycan",
    model: "Porsche Taycan Turbo GT",
    ownerId: "ch-mateo",
    acquisition: "Preordered in early 2024",
    significance: "Eventually Mateo’s daily driver.",
    sceneIds: [],
    eventIds: ["ev-taycan-preorder"],
  },
  {
    id: "v-highlander",
    universeId: "u-reyes",
    continuityId: "c-reyes-main",
    slug: "toyota-highlander",
    name: "Roberto’s Highlander",
    model: "Toyota Highlander",
    ownerId: "ch-roberto",
    configuration: "Fully specced; individual options not recorded",
    significance: "Purchased by Mateo for Roberto.",
    sceneIds: [],
    eventIds: ["ev-highlander"],
  },
];
export const quotes: Quote[] = [];
export const collections: CollectionItem[] = [];
export const tags: Tag[] = [];
