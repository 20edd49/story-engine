import type { Character, Relationship } from "../domain";
export const characters: Character[] = [
  {
    id: "ch-mateo",
    universeId: "u-reyes",
    slug: "mateo-reyes",
    name: "Mateo Reyes",
    role: "Central character",
    description:
      "Husband, father, and a life told through family. Plays guitar and occasionally sings.",
    tags: ["Family", "Music"],
    notes: "Full biography has not yet been supplied.",
  },
  {
    id: "ch-amelia",
    universeId: "u-reyes",
    slug: "amelia-bennett-reyes",
    name: "Amelia Bennett-Reyes",
    role: "Central character",
    description:
      "Marriage, motherhood, and a journey between London and the United States.",
    tags: ["Family", "Immigration"],
    notes: "Addresses her parents as Mum and Dad.",
  },
  {
    id: "ch-sofia",
    universeId: "u-reyes",
    slug: "sofia-reyes-bennett",
    name: "Sofia Reyes-Bennett",
    role: "Next generation",
    description:
      "The first of Mateo and Amelia’s children. Later connected to the family GLS becoming green.",
    tags: ["Family"],
  },
  {
    id: "ch-luca",
    universeId: "u-reyes",
    slug: "luca-reyes-bennett",
    name: "Luca Reyes-Bennett",
    role: "Next generation",
    description:
      "One of Mateo and Amelia’s later children. Further details await archival.",
    tags: ["Family"],
  },
  {
    id: "ch-isla",
    universeId: "u-reyes",
    slug: "isla-reyes-bennett",
    name: "Isla Reyes-Bennett",
    role: "Next generation",
    description:
      "One of Mateo and Amelia’s later children. Further details await archival.",
    tags: ["Family"],
  },
  {
    id: "ch-roberto",
    universeId: "u-reyes",
    slug: "roberto",
    name: "Roberto",
    description:
      "Speaks Spanish only. Mateo eventually buys Roberto and Marisol a home and retires them.",
    tags: ["Spanish-speaking"],
    notes: "Exact family connections are not specified in the supplied canon.",
  },
  {
    id: "ch-marisol",
    universeId: "u-reyes",
    slug: "marisol",
    name: "Marisol",
    description:
      "Speaks Spanish only. Does not permanently move into the Hudson household.",
    tags: ["Spanish-speaking"],
    notes: "Exact family connections are not specified in the supplied canon.",
  },
  {
    id: "ch-camila",
    universeId: "u-reyes",
    slug: "camila",
    name: "Camila",
    description:
      "A known character in the archive. Does not permanently move into the Hudson household.",
    tags: [],
    notes: "Exact family connections are awaiting confirmation.",
  },
  ...[
    ["elias-navarro", "Elias Navarro"],
    ["amara", "Amara"],
    ["maya", "Maya"],
    ["julian-mercer", "Julian Mercer"],
  ].map(([slug, name]) => ({
    id: `ch-${slug}`,
    universeId: "u-elias",
    slug,
    name,
    description:
      "A known name in the Elias / Navarro universe. Biography and relationships await supplied canon.",
    tags: [],
    notes:
      "No age, occupation, family connection, or medical details have been inferred.",
  })),
];
export const relationships: Relationship[] = [
  {
    id: "rel-marriage",
    universeId: "u-reyes",
    continuityId: "c-reyes-main",
    slug: "mateo-and-amelia",
    characterIds: ["ch-mateo", "ch-amelia"],
    relationshipType: "Marriage",
    title: "Mateo & Amelia",
    summary:
      "A marriage at the heart of the Reyes-Bennett story. Parenthood and Amelia’s immigration journey form part of their shared continuity.",
    notes: "Marriage date and additional milestones have not been supplied.",
  },
  {
    id: "rel-family",
    universeId: "u-reyes",
    continuityId: "c-reyes-main",
    slug: "reyes-bennett-family",
    characterIds: ["ch-mateo", "ch-amelia", "ch-sofia", "ch-luca", "ch-isla"],
    relationshipType: "Parent / child",
    members: [
      { characterId: "ch-mateo", role: "parent" },
      { characterId: "ch-amelia", role: "parent" },
      { characterId: "ch-sofia", role: "child", label: "First child" },
      { characterId: "ch-luca", role: "child", label: "Later child" },
      { characterId: "ch-isla", role: "child", label: "Later child" },
    ],
    notes:
      "This structure reflects only supplied connections. Luca and Isla’s relative birth order is not established. Roberto, Marisol, and Camila are not connected here because their exact family relationships were not specified.",
    title: "The Reyes-Bennett family",
    summary:
      "Mateo and Amelia with their children: Sofia, followed by Luca and Isla. Exact birth dates and the order between Luca and Isla are not supplied.",
  },
  {
    id: "rel-siblings",
    universeId: "u-reyes",
    continuityId: "c-reyes-main",
    slug: "sofia-luca-and-isla",
    characterIds: ["ch-sofia", "ch-luca", "ch-isla"],
    relationshipType: "Siblings",
    title: "Sofia, Luca & Isla",
    summary:
      "The next generation of the Reyes-Bennett family. Sofia is born first.",
  },
];
