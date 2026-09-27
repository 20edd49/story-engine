import type { ImportCatalog } from "./types";
import {
  archiveRepository, characterRepository, continuityRepository,
  sceneRepository, tagRepository, timelineRepository, universeRepository,
} from "../repositories/archive";

// Build on the server. The browser receives only compact identifiers and labels.
export async function loadImportCatalog(): Promise<ImportCatalog> {
  const universes = await universeRepository.list();
  const groups = await Promise.all(universes.map(async (universe) => {
    const u = universe.id;
    const continuities = await continuityRepository.list(u);
    const [characters, scenes, relationships, canonRules, tags, locations, eventGroups] = await Promise.all([
      characterRepository.list(u), sceneRepository.list(u), archiveRepository.relationships(u),
      archiveRepository.canon(u), tagRepository.list(u), archiveRepository.locations(u),
      Promise.all(continuities.map((c) => timelineRepository.list(u, c.id))),
    ]);
    return {
      universe, continuities, characters, scenes, relationships, canonRules, tags, locations,
      events: eventGroups.flat(),
    };
  }));
  return {
    universes: groups.map(({ universe }) => ({ id: universe.id, name: universe.shortName })),
    continuities: groups.flatMap(({ continuities }) =>
      continuities.map((item) => ({ id: item.id, universeId: item.universeId, name: item.name }))),
    characters: groups.flatMap(({ characters }) =>
      characters.map((item) => ({ id: item.id, slug: item.slug, label: item.name, universeId: item.universeId }))),
    scenes: groups.flatMap(({ scenes }) =>
      scenes.map((item) => ({ id: item.id, slug: item.slug, label: item.title,
        universeId: item.universeId, continuityId: item.continuityId, storyOrder: item.storyOrder }))),
    timelineEvents: groups.flatMap(({ events }) =>
      events.map((item) => ({ id: item.id, slug: item.slug, label: item.title,
        universeId: item.universeId, continuityId: item.continuityId }))),
    relationships: groups.flatMap(({ relationships }) =>
      relationships.map((item) => ({ id: item.id, slug: item.slug, label: item.title,
        universeId: item.universeId, continuityId: item.continuityId }))),
    canonRules: groups.flatMap(({ canonRules }) =>
      canonRules.map((item) => ({ id: item.id, slug: item.slug, label: item.title,
        universeId: item.universeId, continuityId: item.continuityId }))),
    tags: groups.flatMap(({ tags }) =>
      tags.map((item) => ({ id: item.id, slug: item.slug, label: item.name, universeId: item.universeId }))),
    locations: groups.flatMap(({ locations }) =>
      locations.map((item) => ({ id: item.id, slug: item.slug, label: item.name, universeId: item.universeId }))),
  };
}
