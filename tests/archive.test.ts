import test from "node:test";
import assert from "node:assert/strict";
import { loadEnvConfig } from "@next/env";
import {
  archiveRepository, characterRepository, continuityRepository, sceneRepository,
  searchArchive, tagRepository, timelineRepository, universeRepository,
} from "../src/lib/repositories/archive";

loadEnvConfig(process.cwd());
process.env.SUPABASE_READ_TEST = "1";

test("live Supabase archive loads both universes with scoped records", async () => {
  const universes = await universeRepository.list();
  assert.deepEqual(new Set(universes.map((u) => u.id)), new Set(["u-reyes", "u-elias"]));
  for (const universe of universes) {
    const u = universe.id;
    const continuities = await continuityRepository.list(u);
    const [characters, scenes, locations, relationships, canon, lore, vehicles, tags] = await Promise.all([
      characterRepository.list(u), sceneRepository.list(u), archiveRepository.locations(u),
      archiveRepository.relationships(u), archiveRepository.canon(u), archiveRepository.lore(u),
      archiveRepository.vehicles(u), tagRepository.list(u),
    ]);
    const events = (await Promise.all(continuities.map((c) => timelineRepository.list(u, c.id)))).flat();
    const records = [...continuities, ...characters, ...scenes, ...locations, ...relationships,
      ...canon, ...lore, ...vehicles, ...tags, ...events];
    assert.ok(records.every((r) => r.universeId === u));
    assert.ok((await searchArchive("", u)).every((r) => r.universeId === u));
    for (const record of records) {
      if ("continuityId" in record) assert.ok(continuities.some((c) => c.id === record.continuityId));
      if ("characterIds" in record)
        assert.ok(record.characterIds.every((id) => characters.some((c) => c.id === id)));
    }
    assert.ok(scenes.every((s) => s.placeholder && s.status === "draft"));
  }
});

test("continuity and universe boundaries remain strict", async () => {
  assert.equal(await characterRepository.bySlug("u-elias", "mateo-reyes"), undefined);
  assert.equal(await sceneRepository.bySlug("u-elias", "a-space-for-the-everyday"), undefined);
  assert.equal(await continuityRepository.byId("u-elias", "c-reyes-main"), undefined);
  assert.deepEqual(await timelineRepository.list("u-elias", "c-reyes-main"), []);
  for (const c of (await continuityRepository.list("u-reyes")).filter((c) => c.type !== "main-canon")) {
    assert.deepEqual(await timelineRepository.list("u-reyes", c.id), []);
    assert.deepEqual(await sceneRepository.list("u-reyes", c.id), []);
    assert.deepEqual(await archiveRepository.relationships("u-reyes", c.id), []);
  }
});

test("normalized links and search labels are reconstructed", async () => {
  const events = await timelineRepository.list("u-reyes", "c-reyes-main");
  assert.ok(events.some((e) => e.characterIds.length > 0 && e.tags.length > 0));
  assert.ok(events.some((e) => e.datePrecision === "narrative" && !e.sortDate && !e.date));
  const family = (await archiveRepository.relationships("u-reyes")).find((r) => r.id === "rel-family");
  assert.equal(family?.members?.length, 5);
  assert.deepEqual(family?.characterIds, family?.members?.map((m) => m.characterId));
  const vehicles = await archiveRepository.vehicles("u-reyes");
  assert.ok(vehicles.some((v) => v.eventIds.length > 0));
  const results = await searchArchive("I-130", "u-reyes");
  assert.equal(results.length, 2);
  assert.ok(results.every((r) => r.continuityLabel === "Main Canon" && r.universeName === "Reyes-Bennett"));
});
