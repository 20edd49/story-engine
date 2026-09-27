import type {
  DraftCanonRule, DraftCharacter, DraftRelationship, DraftScene, DraftTag,
  DraftTimelineEvent, ImportDraft, ImportKind, ImportParser, ImportReference,
} from "./types";

type Line = { text: string; start: number; end: number; number: number };
const openPattern = /^\[\[(scene|character|event|relationship|canon|tag)\]\]$/i;
const fieldPattern = /^([a-z][a-z -]*):\s*(.*)$/i;

function linesOf(text: string): Line[] {
  return Array.from(text.matchAll(/[^\r\n]*(?:\r\n|\n|\r|$)/g))
    .filter((match) => match[0].length > 0)
    .map((match, index) => ({
      text: match[0].replace(/\r\n$|\n$|\r$/, ""),
      start: match.index,
      end: match.index + match[0].length,
      number: index + 1,
    }));
}

function refs(value?: string): ImportReference[] {
  return (value ?? "").split(",").map((item) => item.trim()).filter(Boolean)
    .map((input) => ({ input, state: "unresolved" }));
}

export const parseImportText: ImportParser = (
  rawText: string,
  universeId: string,
  continuityId: string,
): ImportDraft => {
  const draft: ImportDraft = {
    universeId, continuityId, scenes: [], characters: [], timelineEvents: [],
    relationships: [], canonRules: [], tags: [], unresolvedText: [],
    warnings: [], validationErrors: [],
  };
  const lines = linesOf(rawText);
  const warn = (code: string, message: string, path: string) =>
    draft.warnings.push({ code, message, path });

  function parseBlock(kind: ImportKind, content: string, sourceLine: number) {
    const blockLines = linesOf(content);
    const fields = new Map<string, string>();
    const known = new Set(["id", "slug", "title", "name", "description", "summary",
      "storyorder", "date", "characters", "pov", "scenes", "tags", "type", "category"]);
    let body: string | undefined;
    for (const line of blockLines) {
      if (body !== undefined) break;
      if (!line.text.trim()) continue;
      const match = fieldPattern.exec(line.text);
      if (!match) {
        draft.unresolvedText.push(content.slice(line.start, line.end));
        warn("unparsed-line", "Unrecognized line was kept unresolved.", `${kind} at line ${sourceLine}`);
        continue;
      }
      const key = match[1].toLowerCase().replace(/[ -]/g, "");
      if (key === "body") {
        // Slice the original block; never trim or reformat scene prose.
        body = match[2] ? content.slice(line.start + line.text.indexOf(":") + 1) : content.slice(line.end);
        break;
      }
      if (!known.has(key)) {
        draft.unresolvedText.push(content.slice(line.start, line.end));
        warn("unknown-field", `Unknown field "${key}" was kept unresolved.`, `${kind} at line ${sourceLine}`);
        continue;
      }
      if (fields.has(key)) {
        draft.unresolvedText.push(content.slice(line.start, line.end));
        warn("duplicate-field", `Repeated ${match[1]} field; first value retained.`, `${kind} at line ${sourceLine}`);
      } else fields.set(key, match[2].trim());
    }
    const common = {
      id: fields.get("id") || undefined,
      slug: fields.get("slug") || undefined,
      disposition: "new" as const,
      sourceLine,
    };
    const title = fields.get("title") ?? fields.get("name") ?? "";
    const storyOrderRaw = fields.get("storyorder");
    const storyOrder = storyOrderRaw === undefined ? undefined : Number(storyOrderRaw);
    if (storyOrderRaw !== undefined && (!Number.isInteger(storyOrder) || storyOrder! < 0)) {
      warn("invalid-story-order", "Story order must be a non-negative integer.", `${kind} at line ${sourceLine}`);
    }
    switch (kind) {
      case "scene":
        draft.scenes.push({
          ...common, title, body: body ?? "", dateText: fields.get("date"),
          storyOrder: Number.isInteger(storyOrder) && storyOrder! >= 0 ? storyOrder : undefined,
          characterRefs: refs(fields.get("characters")), povCharacterRefs: refs(fields.get("pov")),
          tagRefs: refs(fields.get("tags")),
        } satisfies DraftScene);
        break;
      case "character":
        draft.characters.push({
          ...common, name: title, description: fields.get("description"), tagRefs: refs(fields.get("tags")),
        } satisfies DraftCharacter);
        break;
      case "event":
        draft.timelineEvents.push({
          ...common, title, description: fields.get("description"), dateText: fields.get("date"),
          sceneRefs: refs(fields.get("scenes")), characterRefs: refs(fields.get("characters")),
          tagRefs: refs(fields.get("tags")),
        } satisfies DraftTimelineEvent);
        break;
      case "relationship":
        draft.relationships.push({
          ...common, title, relationshipType: fields.get("type"),
          summary: fields.get("summary"), characterRefs: refs(fields.get("characters")),
        } satisfies DraftRelationship);
        break;
      case "canon":
        draft.canonRules.push({
          ...common, title, category: fields.get("category"), body: body ?? "",
        } satisfies DraftCanonRule);
        break;
      case "tag":
        draft.tags.push({ ...common, name: title } satisfies DraftTag);
        break;
    }
  }

  for (let index = 0; index < lines.length;) {
    const line = lines[index];
    if (!line.text.trim()) { index++; continue; }
    const opener = openPattern.exec(line.text.trim());
    if (opener) {
      const kind = opener[1].toLowerCase() as ImportKind;
      const close = `[[/${kind}]]`;
      const end = lines.findIndex((candidate, i) => i > index && candidate.text.trim().toLowerCase() === close);
      if (end < 0) {
        draft.unresolvedText.push(rawText.slice(line.start));
        warn("unclosed-block", `Missing ${close}; text was kept unresolved.`, `line ${line.number}`);
        break;
      }
      parseBlock(kind, rawText.slice(line.end, lines[end].start), line.number);
      index = end + 1;
      continue;
    }
    // Simple pasted scene notes: a literal "Scene: Title" line starts a scene.
    const sceneHeading = /^Scene:\s*(.+)$/i.exec(line.text);
    if (sceneHeading) {
      let end = index + 1;
      while (end < lines.length && !/^Scene:\s*.+$/i.test(lines[end].text) && !openPattern.test(lines[end].text.trim())) end++;
      draft.scenes.push({
        title: sceneHeading[1].trim(), body: rawText.slice(line.end, end < lines.length ? lines[end].start : rawText.length),
        disposition: "new", sourceLine: line.number, characterRefs: [], povCharacterRefs: [], tagRefs: [],
      });
      index = end;
      continue;
    }
    let end = index + 1;
    while (end < lines.length && !openPattern.test(lines[end].text.trim()) && !/^Scene:\s*.+$/i.test(lines[end].text)) end++;
    const unresolved = rawText.slice(line.start, end < lines.length ? lines[end].start : rawText.length);
    draft.unresolvedText.push(unresolved);
    warn("unstructured-text", "Text without an explicit record marker was kept unresolved.", `line ${line.number}`);
    index = end;
  }
  return draft;
};
