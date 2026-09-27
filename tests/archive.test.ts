import test from "node:test";
import assert from "node:assert/strict";
import {
  archiveRepository,
  characterRepository,
  continuityRepository,
  sceneRepository,
  searchArchive,
  timelineRepository,
  universeRepository,
} from "../src/lib/repositories/archive";

test("repositories cannot return another universe’s records", () => {
  for (const universe of universeRepository.list()) {
    const records = [
      ...characterRepository.list(universe.id),
      ...sceneRepository.list(universe.id),
      ...archiveRepository.locations(universe.id),
      ...archiveRepository.relationships(universe.id),
      ...archiveRepository.lore(universe.id),
      ...archiveRepository.vehicles(universe.id),
      ...archiveRepository.canon(universe.id),
    ];
    assert.ok(records.every((record) => record.universeId === universe.id));
    assert.ok(
      searchArchive("", universe.id).every(
        (record) => record.universeId === universe.id,
      ),
    );
  }
  assert.equal(characterRepository.bySlug("u-elias", "mateo-reyes"), undefined);
  assert.equal(
    sceneRepository.bySlug("u-elias", "a-space-for-the-everyday"),
    undefined,
  );
  assert.equal(continuityRepository.byId("u-elias", "c-reyes-main"), undefined);
  assert.deepEqual(timelineRepository.list("u-elias", "c-reyes-main"), []);
});
test("alternate continuity timelines and scenes never inherit main canon", () => {
  for (const c of continuityRepository
    .list("u-reyes")
    .filter((c) => c.type !== "main-canon")) {
    assert.deepEqual(timelineRepository.list("u-reyes", c.id), []);
    assert.deepEqual(sceneRepository.list("u-reyes", c.id), []);
    assert.deepEqual(archiveRepository.relationships("u-reyes", c.id), []);
  }
});
test("foreign keys stay inside their universe and all ids are unique", () => {
  const ids = new Set<string>();
  for (const u of universeRepository.list()) {
    const characters = characterRepository.list(u.id);
    const cs = continuityRepository.list(u.id);
    const scenes = sceneRepository.list(u.id);
    const locations = archiveRepository.locations(u.id);
    const records = [
      ...characters,
      ...cs,
      ...scenes,
      ...locations,
      ...archiveRepository.relationships(u.id),
      ...archiveRepository.lore(u.id),
      ...archiveRepository.vehicles(u.id),
      ...archiveRepository.canon(u.id),
      ...cs.flatMap((c) => timelineRepository.list(u.id, c.id)),
    ];
    for (const r of records) {
      assert.ok(!ids.has(r.id), `Duplicate id ${r.id}`);
      ids.add(r.id);
      if ("continuityId" in r)
        assert.ok(cs.some((c) => c.id === r.continuityId));
      if ("characterIds" in r)
        for (const id of r.characterIds)
          assert.ok(
            characters.some((c) => c.id === id),
            `Invalid character ${id}`,
          );
      if ("locationId" in r && r.locationId)
        assert.ok(locations.some((l) => l.id === r.locationId));
    }
  }
});
test("uncertain chronology remains explicit and demo prose is never canon", () => {
  const events = timelineRepository.list("u-reyes", "c-reyes-main");
  assert.ok(
    events.some(
      (e) => e.datePrecision === "narrative" && !e.sortDate && !e.date,
    ),
  );
  assert.ok(
    events
      .filter((e) => e.datePrecision === "approximate")
      .every((e) => !e.date),
  );
  assert.deepEqual(timelineRepository.list("u-elias", "c-elias-main"), []);
  for (const u of universeRepository.list())
    assert.ok(
      sceneRepository
        .list(u.id)
        .every((s) => s.placeholder && s.status === "draft"),
    );
});
test("search resolves known text and retains universe and continuity labels", () => {
  const results = searchArchive("I-130", "u-reyes");
  assert.equal(results.length, 2);
  assert.ok(
    results.every(
      (r) =>
        r.continuityLabel === "Main Canon" &&
        r.universeName === "Reyes-Bennett",
    ),
  );
  assert.deepEqual(searchArchive("Mateo", "u-elias"), []);
});
