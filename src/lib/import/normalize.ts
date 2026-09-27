import type {
  CatalogRecord, DraftBase, ImportCatalog, ImportDraft, ImportIssue,
  ImportReference, ResolvedEntity,
} from "./types";

export function slugify(value: string): string {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

type Named = DraftBase & { title?: string; name?: string };
type Group = { kind: string; items: Named[]; existing: CatalogRecord[]; continuity: boolean; keepExisting?: boolean };

function candidate(item: Named, universeId: string, continuityId?: string): CatalogRecord {
  return { id: item.id ?? "", slug: item.slug ?? "", label: item.title ?? item.name ?? "",
    universeId, continuityId };
}

export function normalizeImportDraft(input: ImportDraft, catalog: ImportCatalog): ImportDraft {
  const draft = structuredClone(input);
  const warnings: ImportIssue[] = [];
  const resolvedEntities: ResolvedEntity[] = [...(draft.resolvedEntities ?? [])];
  const aliases = new Map<string, Map<string, string | null>>();
  const { universeId: u, continuityId: c } = draft;
  const groups: Group[] = [
    { kind: "scene", items: draft.scenes, existing: catalog.scenes, continuity: true, keepExisting: true },
    { kind: "character", items: draft.characters, existing: catalog.characters, continuity: false },
    { kind: "event", items: draft.timelineEvents, existing: catalog.timelineEvents, continuity: true },
    { kind: "relationship", items: draft.relationships, existing: catalog.relationships, continuity: true },
    { kind: "canon", items: draft.canonRules, existing: catalog.canonRules, continuity: true },
    { kind: "tag", items: draft.tags, existing: catalog.tags, continuity: false },
    { kind: "location", items: draft.locations ?? [], existing: catalog.locations ?? [], continuity: false },
  ];
  for (const group of groups) {
    const retained: Named[] = [];
    const groupAliases = new Map<string, string | null>();
    aliases.set(group.kind, groupAliases);
    for (const item of group.items) {
      const label = item.title ?? item.name ?? "";
      item.slug ||= slugify(label) || undefined;
      const originalId = item.id;
      const originalSlug = item.slug;
      const scoped = group.existing.filter((record) => record.universeId === u &&
        (!group.continuity || record.continuityId === c));
      // An ID already owned by a catalog record is authoritative, including
      // when it points outside the selected scope. Otherwise use the same
      // whole-slug/label normalization that reference resolution uses.
      const claimed = originalId && group.existing.find((record) => record.id === originalId);
      const matches = claimed
        ? scoped.filter((record) => record.id === originalId)
        : scoped.filter((record) =>
          (originalSlug && slugify(record.slug) === slugify(originalSlug)) ||
          (label && slugify(record.label) === slugify(label)) ||
          (group.kind === "location" && [originalSlug, label].some((value) =>
            value && slugify(record.id) === slugify(value))));
      const unique = [...new Map(matches.map((record) => [record.id, record])).values()];
      if (unique.length === 1) {
        const match = unique[0];
        item.id = match.id;
        item.slug = match.slug;
        item.disposition = "existing";
        for (const key of [originalId, originalSlug, label, match.slug, match.label, match.id]) {
          if (!key) continue;
          const normalized = slugify(key);
          const previous = groupAliases.get(normalized);
          groupAliases.set(normalized, previous === undefined || previous === match.id ? match.id : null);
        }
        if (group.keepExisting) retained.push(item);
        else if (!resolvedEntities.some((entry) => entry.kind === group.kind && entry.id === match.id))
          resolvedEntities.push({ kind: group.kind, id: match.id, label: match.label });
      } else {
        if (unique.length > 1) warnings.push({ code: "ambiguous-existing-match",
          message: `"${label}" matches multiple existing ${group.kind} records.`, path: `line ${item.sourceLine}` });
        retained.push(item);
      }
    }
    group.items.splice(0, group.items.length, ...retained);
  }
  const tagRefs = [
    ...draft.scenes.flatMap((item) => item.tagRefs),
    ...draft.characters.flatMap((item) => item.tagRefs),
    ...draft.timelineEvents.flatMap((item) => item.tagRefs),
  ];
  for (const ref of tagRefs) {
    const key = slugify(ref.input);
    if (!draft.tags.some((tag) => key === tag.slug || key === slugify(tag.name)) &&
      !aliases.get("tag")?.get(key) &&
      !catalog.tags.some((tag) => tag.universeId === u &&
        [tag.id, tag.slug, tag.label].some((value) => slugify(value) === key))) {
      draft.tags.push({ name: ref.input, slug: key, disposition: "new", sourceLine: 0 });
    }
  }
  const choices = (existing: CatalogRecord[], items: Named[], continuity = false) => [
    ...existing, ...items.map((item) => candidate(item, u, continuity ? c : undefined)),
  ];
  const characters = choices(catalog.characters, draft.characters);
  const scenes = choices(catalog.scenes, draft.scenes, true);
  const tags = choices(catalog.tags, draft.tags);
  const locations = choices(catalog.locations ?? [], draft.locations ?? []);
  const resolve = (refs: ImportReference[], records: CatalogRecord[], kind: string,
    path: string, needsContinuity = false) => {
    for (const ref of refs) {
      const key = slugify(ref.input);
      const aliasId = aliases.get(kind)?.get(key);
      const byId = records.filter((item) => item.id && item.id.toLowerCase() === ref.input.toLowerCase());
      const byAlias = aliasId ? records.filter((item) => item.id === aliasId) : [];
      const bySlug = records.filter((item) => item.slug && slugify(item.slug) === key);
      const byLabel = records.filter((item) => slugify(item.label) === key);
      const matches = byId.length ? byId : byAlias.length ? byAlias : bySlug.length ? bySlug : byLabel;
      const distinct = matches.filter((item, index) => matches.findIndex((other) =>
        item.id ? other.id === item.id && other.universeId === item.universeId : other === item) === index);
      if (distinct.length !== 1) {
        ref.id = undefined;
        ref.state = "unresolved";
        warnings.push({ code: distinct.length ? "ambiguous-reference" : "unresolved-reference",
          message: `Reference "${ref.input}" needs review.`, path });
        continue;
      }
      const match = distinct[0];
      ref.id = match.id || undefined;
      ref.state = match.universeId !== u ? "cross-universe"
        : needsContinuity && match.continuityId !== c ? "wrong-continuity"
          : (catalog[{
            character: "characters", scene: "scenes", tag: "tags", location: "locations",
          }[kind] as "characters" | "scenes" | "tags" | "locations"] ?? [])
            .some((record) => record.id === match.id) ? "resolved" : "proposed";
      if (ref.state === "cross-universe" || ref.state === "wrong-continuity") warnings.push({ code: ref.state,
        message: `Reference "${ref.input}" points outside the selected scope.`, path });
    }
  };
  draft.scenes.forEach((item, i) => {
    resolve(item.characterRefs, characters, "character", `scenes[${i}].characterRefs`);
    resolve(item.povCharacterRefs, characters, "character", `scenes[${i}].povCharacterRefs`);
    resolve(item.tagRefs, tags, "tag", `scenes[${i}].tagRefs`);
    if (item.locationRef) resolve([item.locationRef], locations, "location", `scenes[${i}].locationRef`);
  });
  draft.characters.forEach((item, i) => resolve(item.tagRefs, tags, "tag", `characters[${i}].tagRefs`));
  draft.timelineEvents.forEach((item, i) => {
    resolve(item.characterRefs, characters, "character", `timelineEvents[${i}].characterRefs`);
    resolve(item.sceneRefs, scenes, "scene", `timelineEvents[${i}].sceneRefs`, true);
    resolve(item.tagRefs, tags, "tag", `timelineEvents[${i}].tagRefs`);
    if (item.locationRef) resolve([item.locationRef], locations, "location", `timelineEvents[${i}].locationRef`);
  });
  draft.relationships.forEach((item, i) =>
    resolve(item.characterRefs, characters, "character", `relationships[${i}].characterRefs`));
  draft.resolvedEntities = resolvedEntities;
  draft.warnings.push(...warnings);
  return draft;
}
