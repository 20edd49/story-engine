import type { ImportCatalog } from "@/lib/import/types";
import {
  archiveRepository, characterRepository, continuityRepository,
  sceneRepository, tagRepository, timelineRepository, universeRepository,
} from "@/lib/repositories/archive";
import { ImportWorkspace } from "./workspace";
import "./import.css";

export const metadata = { title: "Import preview" };

export default async function ImportPage() {
  const universes = await universeRepository.list();
  const groups = await Promise.all(universes.map(async (universe) => {
    const u = universe.id;
    const continuities = await continuityRepository.list(u);
    const [characters, scenes, relationships, canonRules, tags, eventGroups] = await Promise.all([
      characterRepository.list(u), sceneRepository.list(u), archiveRepository.relationships(u),
      archiveRepository.canon(u), tagRepository.list(u),
      Promise.all(continuities.map((c) => timelineRepository.list(u, c.id))),
    ]);
    return { universe, continuities, characters, scenes, relationships, canonRules, tags, events: eventGroups.flat() };
  }));
  const catalog: ImportCatalog = {
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
  };
  return <ImportWorkspace catalog={catalog} />;
}
