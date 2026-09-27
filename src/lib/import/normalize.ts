import type {
  CatalogRecord, DraftBase, ImportCatalog, ImportDraft, ImportIssue,
  ImportReference,
} from "./types";

export function slugify(value: string): string {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function candidate(
  item: DraftBase,
  label: string,
  universeId: string,
  continuityId?: string,
): CatalogRecord {
  return {
    id: item.id ?? "",
    slug: item.slug ?? "",
    label,
    universeId,
    continuityId,
  };
}

export function normalizeImportDraft(input: ImportDraft, catalog: ImportCatalog): ImportDraft {
  const draft = structuredClone(input);
  const warnings: ImportIssue[] = [];
  const { universeId: u, continuityId: c } = draft;
  const prepare = (
    items: (DraftBase & { title?: string; name?: string })[],
    existing: CatalogRecord[],
  ) => {
    for (const item of items) {
      const label = item.title ?? item.name ?? "";
      item.slug ||= slugify(label) || undefined;
      const matchedBySlug = !item.id;
      const match = item.id
        ? existing.find((record) => record.id === item.id)
        : existing.find((record) => record.universeId === u && record.slug === item.slug);
      if (match && match.universeId === u) {
        item.disposition = "existing";
        item.id = match.id;
        if (matchedBySlug) warnings.push({
          code: "matched-existing-slug",
          message: `"${label}" matched an existing slug; review before any future write.`,
          path: `line ${item.sourceLine}`,
        });
      }
    }
  };
  prepare(draft.scenes, catalog.scenes);
  prepare(draft.characters, catalog.characters);
  prepare(draft.timelineEvents, catalog.timelineEvents);
  prepare(draft.relationships, catalog.relationships);
  prepare(draft.canonRules, catalog.canonRules);
  prepare(draft.tags, catalog.tags);

  // Tag names are proposed only when explicitly named in a record's Tags field.
  const tagRefs = [
    ...draft.scenes.flatMap((item) => item.tagRefs),
    ...draft.characters.flatMap((item) => item.tagRefs),
    ...draft.timelineEvents.flatMap((item) => item.tagRefs),
  ];
  for (const ref of tagRefs) {
    const key = ref.input.toLowerCase();
    if (!draft.tags.some((tag) => tag.name.toLowerCase() === key || tag.slug === slugify(ref.input)) &&
      !catalog.tags.some((tag) => tag.universeId === u &&
        [tag.id.toLowerCase(), tag.slug.toLowerCase(), tag.label.toLowerCase()].includes(key))) {
      draft.tags.push({
        name: ref.input, slug: slugify(ref.input), disposition: "new", sourceLine: 0,
      });
    }
  }

  const characters = [
    ...catalog.characters,
    ...draft.characters.map((item) => candidate(item, item.name, u)),
  ];
  const scenes = [
    ...catalog.scenes,
    ...draft.scenes.map((item) => candidate(item, item.title, u, c)),
  ];
  const tags = [
    ...catalog.tags,
    ...draft.tags.map((item) => candidate(item, item.name, u)),
  ];
  const resolve = (refs: ImportReference[], choices: CatalogRecord[], path: string, needsContinuity = false) => {
    for (const ref of refs) {
      const key = ref.input.toLowerCase();
      const byId = choices.filter((item) => item.id && item.id.toLowerCase() === key);
      const bySlug = choices.filter((item) => item.slug && item.slug.toLowerCase() === key);
      const byLabel = choices.filter((item) => item.label.toLowerCase() === key);
      const matches = byId.length ? byId : bySlug.length ? bySlug : byLabel;
      // Catalog and draft copies of the same existing record count as one target.
      const distinct = matches.filter((item, index) =>
        matches.findIndex((other) => item.id && other.id === item.id && item.universeId === other.universeId) === index ||
        !item.id && matches.findIndex((other) => other === item) === index);
      if (distinct.length !== 1) {
        ref.state = "unresolved";
        warnings.push({
          code: distinct.length ? "ambiguous-reference" : "unresolved-reference",
          message: `Reference "${ref.input}" needs review.`,
          path,
        });
        continue;
      }
      const match = distinct[0];
      ref.id = match.id || undefined;
      ref.state = match.universeId !== u ? "cross-universe"
        : needsContinuity && match.continuityId !== c ? "wrong-continuity"
          : "resolved";
      if (ref.state !== "resolved") warnings.push({
        code: ref.state, message: `Reference "${ref.input}" points outside the selected scope.`, path,
      });
    }
  };
  draft.scenes.forEach((item, i) => {
    resolve(item.characterRefs, characters, `scenes[${i}].characterRefs`);
    resolve(item.povCharacterRefs, characters, `scenes[${i}].povCharacterRefs`);
    resolve(item.tagRefs, tags, `scenes[${i}].tagRefs`);
  });
  draft.characters.forEach((item, i) => resolve(item.tagRefs, tags, `characters[${i}].tagRefs`));
  draft.timelineEvents.forEach((item, i) => {
    resolve(item.characterRefs, characters, `timelineEvents[${i}].characterRefs`);
    resolve(item.sceneRefs, scenes, `timelineEvents[${i}].sceneRefs`, true);
    resolve(item.tagRefs, tags, `timelineEvents[${i}].tagRefs`);
  });
  draft.relationships.forEach((item, i) =>
    resolve(item.characterRefs, characters, `relationships[${i}].characterRefs`));
  draft.warnings.push(...warnings);
  return draft;
}
