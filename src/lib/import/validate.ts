import type {
  CatalogRecord, DraftBase, ImportCatalog, ImportDraft, ImportIssue,
  ImportReference,
} from "./types";

type NamedDraft = DraftBase & { title?: string; name?: string };

export function validateImportDraft(input: ImportDraft, catalog: ImportCatalog): ImportDraft {
  const draft = structuredClone(input);
  const errors: ImportIssue[] = [];
  const add = (code: string, message: string, path: string) => errors.push({ code, message, path });
  const u = catalog.universes.find((item) => item.id === draft.universeId);
  const c = catalog.continuities.find((item) => item.id === draft.continuityId);
  if (!u) add("missing-universe", "Select a known universe.", "universeId");
  if (!c || c.universeId !== draft.universeId)
    add("missing-continuity", "Select a continuity in the chosen universe.", "continuityId");

  const groups: { key: string; items: NamedDraft[]; existing: CatalogRecord[] }[] = [
    { key: "scenes", items: draft.scenes, existing: catalog.scenes },
    { key: "characters", items: draft.characters, existing: catalog.characters },
    { key: "timelineEvents", items: draft.timelineEvents, existing: catalog.timelineEvents },
    { key: "relationships", items: draft.relationships, existing: catalog.relationships },
    { key: "canonRules", items: draft.canonRules, existing: catalog.canonRules },
    { key: "tags", items: draft.tags, existing: catalog.tags },
  ];
  const seenIds = new Map<string, string>();
  for (const group of groups) {
    const seenSlugs = new Map<string, string>();
    group.items.forEach((item, index) => {
      const path = `${group.key}[${index}]`;
      if (!(item.title ?? item.name ?? "").trim()) add("missing-label", "A title or name is required.", path);
      if (item.id) {
        const previous = seenIds.get(item.id);
        if (previous) add("duplicate-id", `ID "${item.id}" is also used by ${previous}.`, path);
        else seenIds.set(item.id, path);
        const existingId = groups.flatMap((entry) => entry.existing)
          .find((record) => record.id === item.id);
        if (existingId && (item.disposition !== "existing" || !group.existing.includes(existingId)))
          add("duplicate-id", `ID "${item.id}" belongs to another existing record.`, path);
      }
      if (item.slug) {
        const previous = seenSlugs.get(item.slug);
        if (previous) add("duplicate-slug", `Slug "${item.slug}" is also used by ${previous}.`, path);
        else seenSlugs.set(item.slug, path);
        const collision = group.existing.find((record) =>
          record.universeId === draft.universeId && record.slug === item.slug && record.id !== item.id);
        if (collision) add("duplicate-slug", `Slug "${item.slug}" already exists.`, path);
      }
      const current = group.existing.find((record) => record.id === item.id);
      if (current && current.universeId !== draft.universeId)
        add("cross-universe-reference", "Existing record belongs to another universe.", path);
      if (current && current.continuityId && current.continuityId !== draft.continuityId)
        add("wrong-continuity-reference", "Existing record belongs to another continuity.", path);
    });
  }

  const validateRefs = (refs: ImportReference[], path: string, kind: "character" | "scene" | "tag") => {
    refs.forEach((ref, index) => {
      const refPath = `${path}[${index}]`;
      if (ref.state === "cross-universe")
        add("cross-universe-reference", `"${ref.input}" belongs to another universe.`, refPath);
      else if (ref.state === "wrong-continuity")
        add("wrong-continuity-reference", `"${ref.input}" belongs to another continuity.`, refPath);
      else if (ref.state === "unresolved")
        add(kind === "character" ? "unknown-character-reference" : "unresolved-reference",
          `"${ref.input}" could not be resolved uniquely.`, refPath);
    });
  };
  draft.scenes.forEach((scene, index) => {
    if (!scene.body.trim()) add("empty-scene-body", "Scene body cannot be empty.", `scenes[${index}].body`);
    validateRefs(scene.characterRefs, `scenes[${index}].characterRefs`, "character");
    validateRefs(scene.povCharacterRefs, `scenes[${index}].povCharacterRefs`, "character");
    validateRefs(scene.tagRefs, `scenes[${index}].tagRefs`, "tag");
    if (scene.storyOrder !== undefined) {
      const otherDraft = draft.scenes.findIndex((other, otherIndex) =>
        otherIndex !== index && other.storyOrder === scene.storyOrder);
      const otherExisting = catalog.scenes.find((other) =>
        other.universeId === draft.universeId && other.continuityId === draft.continuityId &&
        other.storyOrder === scene.storyOrder && other.id !== scene.id);
      if (otherDraft >= 0 || otherExisting)
        add("duplicate-story-order", `Story order ${scene.storyOrder} is already used in this continuity.`,
          `scenes[${index}].storyOrder`);
    }
  });
  draft.characters.forEach((item, index) =>
    validateRefs(item.tagRefs, `characters[${index}].tagRefs`, "tag"));
  draft.timelineEvents.forEach((item, index) => {
    validateRefs(item.characterRefs, `timelineEvents[${index}].characterRefs`, "character");
    validateRefs(item.sceneRefs, `timelineEvents[${index}].sceneRefs`, "scene");
    validateRefs(item.tagRefs, `timelineEvents[${index}].tagRefs`, "tag");
  });
  draft.relationships.forEach((item, index) => {
    validateRefs(item.characterRefs, `relationships[${index}].characterRefs`, "character");
    if (item.characterRefs.length < 2)
      add("unresolved-relationship", "A relationship needs at least two explicit character references.",
        `relationships[${index}].characterRefs`);
  });
  draft.validationErrors = errors;
  return draft;
}
