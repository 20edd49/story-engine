import type { CanonRule, Character, Continuity, Entity, Location, Lore, Quote, Relationship, Scene, SearchResult, Tag, TimelineEvent, Universe, Vehicle } from "../domain";
import { createClient } from "../supabase/server";

type Row = Record<string, unknown>;
type Table = "universes" | "continuities" | "characters" | "relationships" | "relationship_members" | "locations" | "location_characters" | "location_residents" | "timeline_events" | "event_characters" | "event_scenes" | "event_tags" | "scenes" | "scene_characters" | "scene_pov_characters" | "scene_tags" | "canon_rules" | "lore_entries" | "vehicles" | "vehicle_scenes" | "vehicle_events" | "quotes" | "tags" | "character_tags";

async function rows(table: Table, universeId?: string, continuityId?: string): Promise<Row[]> {
  const client = await createClient();
  let query = client.from(table).select("*");
  if (universeId) query = query.eq("universe_id", universeId);
  if (continuityId) query = query.eq("continuity_id", continuityId);
  const { data, error } = await query;
  if (error) throw new Error(`Supabase ${table}: ${error.message}`);
  return (data ?? []) as Row[];
}
function domain<T>(row: Row): T {
  return Object.fromEntries(Object.entries(row)
    .filter(([key, value]) => value !== null && !["created_at", "updated_at"].includes(key))
    .map(([key, value]) => [key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase()), value])) as T;
}
const ids = (links: Row[], parentKey: string, parentId: string, childKey: string) =>
  links.filter((link) => link[parentKey] === parentId).map((link) => link[childKey] as string);
const tagNames = (links: Row[], tags: Row[], parentKey: string, parentId: string) =>
  ids(links, parentKey, parentId, "tag_id")
    .map((id) => tags.find((tag) => tag.id === id)?.name as string | undefined)
    .filter((name): name is string => !!name);

export const universeRepository = {
  list: async (): Promise<Universe[]> => (await rows("universes")).map((r) => domain<Universe>(r)),
  bySlug: async (slug: string) => (await universeRepository.list()).find((u) => u.slug === slug),
  byId: async (id: string) => (await universeRepository.list()).find((u) => u.id === id),
};
export const continuityRepository = {
  list: async (u: string): Promise<Continuity[]> => (await rows("continuities", u)).map((r) => domain<Continuity>(r)),
  byId: async (u: string, id: string) => (await continuityRepository.list(u)).find((c) => c.id === id),
};
export const tagRepository = {
  list: async (u: string): Promise<Tag[]> => (await rows("tags", u)).map((r) => domain<Tag>(r)),
};
export const characterRepository = {
  list: async (u: string): Promise<Character[]> => {
    const [base, links, tags] = await Promise.all([rows("characters", u), rows("character_tags", u), rows("tags", u)]);
    return base.map((r) => ({ ...domain<Character>(r), tags: tagNames(links, tags, "character_id", r.id as string) }));
  },
  bySlug: async (u: string, slug: string) => (await characterRepository.list(u)).find((c) => c.slug === slug),
  byId: async (u: string, id: string) => (await characterRepository.list(u)).find((c) => c.id === id),
};
export const timelineRepository = {
  list: async (u: string, c: string): Promise<TimelineEvent[]> => {
    const [base, characters, scenes, continuityScenes, links, tags] = await Promise.all([
      rows("timeline_events", u, c), rows("event_characters", u), rows("event_scenes", u),
      rows("scenes", u, c), rows("event_tags", u), rows("tags", u),
    ]);
    return base.map((r) => ({
      ...domain<TimelineEvent>(r),
      characterIds: ids(characters, "event_id", r.id as string, "character_id"),
      sceneIds: ids(scenes, "event_id", r.id as string, "scene_id")
        .filter((id) => continuityScenes.some((scene) => scene.id === id)),
      tags: tagNames(links, tags, "event_id", r.id as string),
    })).sort((a, b) => (a.sortDate ?? "9999").localeCompare(b.sortDate ?? "9999") || a.narrativeOrder - b.narrativeOrder);
  },
};
export const sceneRepository = {
  list: async (u: string, c?: string): Promise<Scene[]> => {
    const [base, characters, pov, links, tags] = await Promise.all([
      rows("scenes", u, c), rows("scene_characters", u), rows("scene_pov_characters", u), rows("scene_tags", u), rows("tags", u),
    ]);
    const ordered = (source: Row[], sceneId: string) =>
      source.filter((link) => link.scene_id === sceneId)
        .sort((a, b) => (a.position as number) - (b.position as number))
        .map((link) => link.character_id as string);
    return base.map((r) => ({
      ...domain<Scene>(r), characterIds: ordered(characters, r.id as string),
      povCharacterIds: ordered(pov, r.id as string), tags: tagNames(links, tags, "scene_id", r.id as string),
    }));
  },
  bySlug: async (u: string, slug: string) => (await sceneRepository.list(u)).find((s) => s.slug === slug),
  byId: async (u: string, id: string) => (await sceneRepository.list(u)).find((s) => s.id === id),
};
// TODO: Persist progress per user once Supabase Auth is introduced.
const lastActiveSceneIds: Record<string, string> = { "u-reyes": "sc-u-reyes", "u-elias": "sc-u-elias" };
export const progressRepository = {
  continueHref: async (u: string): Promise<string | undefined> => {
    const [universe, scene] = await Promise.all([
      universeRepository.byId(u),
      lastActiveSceneIds[u] ? sceneRepository.byId(u, lastActiveSceneIds[u]) : Promise.resolve(undefined),
    ]);
    return universe && scene ? `/${universe.slug}/scenes/${scene.slug}` : undefined;
  },
};
export const archiveRepository = {
  relationships: async (u: string, c?: string): Promise<Relationship[]> => {
    const [base, links] = await Promise.all([rows("relationships", u, c), rows("relationship_members", u)]);
    return base.map((r) => {
      const members = links.filter((link) => link.relationship_id === r.id)
        .sort((a, b) => (a.position as number) - (b.position as number))
        .map((link) => ({
          characterId: link.character_id as string, role: link.role as "parent" | "child" | "member",
          ...(link.label ? { label: link.label as string } : {}),
        }));
      return {
        ...domain<Relationship>(r), characterIds: members.map((member) => member.characterId),
        ...(members.some((member) => member.role !== "member") ? { members } : {}),
      };
    });
  },
  locations: async (u: string): Promise<Location[]> => {
    const [base, characters, residents] = await Promise.all([
      rows("locations", u), rows("location_characters", u), rows("location_residents", u),
    ]);
    return base.map((r) => ({
      ...domain<Location>(r),
      characterIds: ids(characters, "location_id", r.id as string, "character_id"),
      residentIds: ids(residents, "location_id", r.id as string, "character_id"),
    }));
  },
  canon: async (u: string, c?: string): Promise<CanonRule[]> =>
    (await rows("canon_rules", u, c)).map((r) => domain<CanonRule>(r)),
  lore: async (u: string, c?: string): Promise<Lore[]> =>
    (await rows("lore_entries", u, c)).map((r) => domain<Lore>(r)),
  vehicles: async (u: string): Promise<Vehicle[]> => {
    const [base, scenes, events, sceneRecords, eventRecords] = await Promise.all([
      rows("vehicles", u), rows("vehicle_scenes", u), rows("vehicle_events", u),
      rows("scenes", u), rows("timeline_events", u),
    ]);
    return base.map((r) => ({
      ...domain<Vehicle>(r),
      sceneIds: ids(scenes, "vehicle_id", r.id as string, "scene_id")
        .filter((id) => sceneRecords.some((scene) => scene.id === id && scene.continuity_id === r.continuity_id)),
      eventIds: ids(events, "vehicle_id", r.id as string, "event_id")
        .filter((id) => eventRecords.some((event) => event.id === id && event.continuity_id === r.continuity_id)),
    }));
  },
  quotes: async (u: string, c: string): Promise<Quote[]> =>
    (await rows("quotes", u, c)).map((r) => domain<Quote>(r)),
};
export async function searchArchive(query = "", universeId?: string): Promise<SearchResult[]> {
  const universes = (await universeRepository.list()).filter((u) => !universeId || u.id === universeId);
  const groups = await Promise.all(universes.map(async (u) => {
    const [continuities, characters, scenes, locations, events, relationships, lore] = await Promise.all([
      continuityRepository.list(u.id), characterRepository.list(u.id), sceneRepository.list(u.id),
      archiveRepository.locations(u.id), rows("timeline_events", u.id), archiveRepository.relationships(u.id),
      archiveRepository.lore(u.id),
    ]);
    const results: SearchResult[] = [];
    const add = (entity: Entity | Universe, title: string, description: string, kind: string,
      path: string, continuityId?: string) => results.push({
        id: entity.id, universeId: u.id, universeName: u.shortName, title, description,
        kind, href: `/${u.slug}${path}`, continuityId,
        continuityLabel: continuities.find((c) => c.id === continuityId)?.name,
        ...("placeholder" in entity ? { placeholder: entity.placeholder } : {}),
      });
    add(u, u.shortName, u.description, "Universe", "");
    characters.forEach((x) => add(x, x.name, x.description, "Character", `/characters/${x.slug}`));
    scenes.forEach((x) => add(x, x.title, x.summary, "Scene", `/scenes/${x.slug}`, x.continuityId));
    locations.forEach((x) => add(x, x.name, x.description, "Location", `/locations/${x.slug}`));
    events.forEach((x) => add(domain<TimelineEvent>(x), x.title as string, x.description as string,
      "Event", `/timeline?continuity=${x.continuity_id}#${x.id}`, x.continuity_id as string));
    relationships.forEach((x) => add(x, x.title, x.summary, "Relationship", `/relationships/${x.slug}`, x.continuityId));
    lore.forEach((x) => add(x, x.title, x.description, "Lore", `/lore/${x.slug}`, x.continuityId));
    return results;
  }));
  const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  return groups.flat().filter((r) => terms.every((term) =>
    `${r.title} ${r.description} ${r.universeName} ${r.kind}`.toLowerCase().includes(term)));
}
