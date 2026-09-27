import { universes, continuities } from "../data/universes";
import { characters, relationships } from "../data/characters";
import { timelineEvents } from "../data/timeline";
import {
  scenes,
  locations,
  canonRules,
  lore,
  vehicles,
  quotes,
} from "../data/content";
import type { Entity, SearchResult } from "../domain";
const scoped = <T extends Entity>(items: T[], universeId: string) =>
  items.filter((item) => item.universeId === universeId);
export const universeRepository = {
  list: () => universes,
  bySlug: (slug: string) => universes.find((u) => u.slug === slug),
  byId: (id: string) => universes.find((u) => u.id === id),
};
export const continuityRepository = {
  list: (u: string) => scoped(continuities, u),
  byId: (u: string, id: string) =>
    scoped(continuities, u).find((c) => c.id === id),
};
export const characterRepository = {
  list: (u: string) => scoped(characters, u),
  bySlug: (u: string, slug: string) =>
    scoped(characters, u).find((c) => c.slug === slug),
  byId: (u: string, id: string) =>
    scoped(characters, u).find((c) => c.id === id),
};
export const timelineRepository = {
  list: (u: string, c: string) =>
    scoped(timelineEvents, u)
      .filter((e) => e.continuityId === c)
      .sort(
        (a, b) =>
          (a.sortDate ?? "9999").localeCompare(b.sortDate ?? "9999") ||
          a.narrativeOrder - b.narrativeOrder,
      ),
};
export const sceneRepository = {
  list: (u: string, c?: string) =>
    scoped(scenes, u).filter((s) => !c || s.continuityId === c),
  bySlug: (u: string, slug: string) =>
    scoped(scenes, u).find((s) => s.slug === slug),
};
export const archiveRepository = {
  relationships: (u: string, c?: string) =>
    scoped(relationships, u).filter((r) => !c || r.continuityId === c),
  locations: (u: string) => scoped(locations, u),
  canon: (u: string, c?: string) =>
    scoped(canonRules, u).filter((r) => !c || r.continuityId === c),
  lore: (u: string, c?: string) =>
    scoped(lore, u).filter((r) => !c || r.continuityId === c),
  vehicles: (u: string) => scoped(vehicles, u),
  quotes: (u: string, c: string) =>
    scoped(quotes, u).filter((q) => q.continuityId === c),
};
export function searchArchive(query = "", universeId?: string): SearchResult[] {
  const results: SearchResult[] = [];
  for (const u of universes.filter((u) => !universeId || u.id === universeId)) {
    const add = (
      id: string,
      title: string,
      description: string,
      kind: string,
      path: string,
      continuityId?: string,
      placeholder?: boolean,
    ) =>
      results.push({
        id,
        universeId: u.id,
        universeName: u.shortName,
        title,
        description,
        kind,
        href: `/${u.slug}${path}`,
        continuityId,
        continuityLabel: continuities.find((c) => c.id === continuityId)?.name,
        placeholder,
      });
    add(u.id, u.shortName, u.description, "Universe", "");
    scoped(characters, u.id).forEach((c) =>
      add(c.id, c.name, c.description, "Character", `/characters/${c.slug}`),
    );
    scoped(scenes, u.id).forEach((s) =>
      add(
        s.id,
        s.title,
        s.summary,
        "Scene",
        `/scenes/${s.slug}`,
        s.continuityId,
        s.placeholder,
      ),
    );
    scoped(locations, u.id).forEach((l) =>
      add(l.id, l.name, l.description, "Location", `/locations/${l.slug}`),
    );
    scoped(timelineEvents, u.id).forEach((e) =>
      add(
        e.id,
        e.title,
        e.description,
        "Event",
        `/timeline?continuity=${e.continuityId}#${e.id}`,
        e.continuityId,
      ),
    );
    scoped(relationships, u.id).forEach((r) =>
      add(
        r.id,
        r.title,
        r.summary,
        "Relationship",
        `/relationships/${r.slug}`,
        r.continuityId,
      ),
    );
    scoped(lore, u.id).forEach((l) =>
      add(
        l.id,
        l.title,
        l.description,
        "Lore",
        `/lore/${l.slug}`,
        l.continuityId,
        l.placeholder,
      ),
    );
  }
  const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  return results.filter((r) =>
    terms.every((t) =>
      `${r.title} ${r.description} ${r.universeName} ${r.kind}`
        .toLowerCase()
        .includes(t),
    ),
  );
}
