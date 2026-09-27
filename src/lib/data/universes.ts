import type { Universe, Continuity, Module } from "../domain";
const nav = (items: Module[]) =>
  items.map((module) => ({
    module,
    label:
      module === "continuities"
        ? "Continuities"
        : module.charAt(0).toUpperCase() + module.slice(1),
  }));
export const universes: Universe[] = [
  {
    id: "u-reyes",
    slug: "reyes-bennett",
    name: "Reyes-Bennett Universe",
    shortName: "Reyes-Bennett",
    tagline: "A life built together.",
    description:
      "The intimate architecture of a family. A living record of love, parenthood, and the small things that become a lifetime.",
    theme: {
      accent: "#59613f",
      accentSecondary: "#b38c59",
      backgroundTone: "#f5f3eb",
      texture: "arches",
    },
    defaultContinuityId: "c-reyes-main",
    explorer: { x: 29, y: 40, depth: 0.7, scale: 1, variant: "warm-orbital", orbitCount: 3, bodyCount: 5 },
    navigation: nav([
      "overview",
      "characters",
      "timeline",
      "family",
      "relationships",
      "locations",
      "scenes",
      "vehicles",
      "canon",
      "continuities",
    ]),
    keywords: ["Family", "Generations", "Belonging"],
  },
  {
    id: "u-elias",
    slug: "elias-navarro",
    name: "Elias / Navarro Universe",
    shortName: "Elias / Navarro",
    tagline: "Every legacy has its foundations.",
    description:
      "The Navarro family. Northstar. A world of personal and institutional power, unfolding across a long and intricate continuity.",
    theme: {
      accent: "#445e68",
      accentSecondary: "#8f9f9d",
      backgroundTone: "#eef1f0",
      texture: "columns",
    },
    defaultContinuityId: "c-elias-main",
    explorer: { x: 73, y: 57, depth: 1, scale: 1.16, variant: "cold-architectural", orbitCount: 3, bodyCount: 3 },
    navigation: nav([
      "overview",
      "characters",
      "timeline",
      "relationships",
      "locations",
      "scenes",
      "lore",
      "canon",
      "continuities",
    ]),
    keywords: ["Legacy", "Power", "Continuity"],
  },
];
export const continuities: Continuity[] = [
  {
    id: "c-reyes-main",
    universeId: "u-reyes",
    slug: "main-canon",
    name: "Main Canon",
    type: "main-canon",
    description:
      "The authoritative Reyes-Bennett continuity. Only supplied canon anchors are recorded here.",
    badgeLabel: "Main Canon",
  },
  ...["Starbucks", "Speedster", "Divine"].map((name) => ({
    id: `c-reyes-${name.toLowerCase()}`,
    universeId: "u-reyes",
    slug: `${name.toLowerCase()}-au`,
    name: `${name} AU`,
    type: "alternate-universe" as const,
    description:
      "A separate alternate continuity. Story details have not yet been supplied.",
    badgeLabel: "Alternate Universe",
  })),
  {
    id: "c-elias-main",
    universeId: "u-elias",
    slug: "main-canon",
    name: "Main Canon",
    type: "main-canon",
    description:
      "The primary Elias / Navarro continuity. Detailed canon is awaiting archival.",
    badgeLabel: "Main Canon",
  },
];
