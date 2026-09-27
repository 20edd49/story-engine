"use client";

import { useState } from "react";
import { MAX_SMART_IMPORT_CHARS } from "@/lib/import/types";
import { normalizeImportDraft } from "@/lib/import/normalize";
import { parseImportText } from "@/lib/import/parse";
import type {
  ImportCatalog, ImportDisposition, ImportDraft, ImportIssue, ImportReference,
} from "@/lib/import/types";
import { validateImportDraft } from "@/lib/import/validate";

type PreviewItem = {
  title: string;
  id?: string;
  slug?: string;
  disposition: ImportDisposition;
  sourceLine: number;
  details?: string[];
  refs?: { kind: string; reference: ImportReference }[];
  body?: string;
};

const labeled = (refs: ImportReference[], kind: string) =>
  refs.map((reference) => ({ kind, reference }));

function PreviewSection({ title, items, expandBody }: {
  title: string; items: PreviewItem[]; expandBody: boolean;
}) {
  return (
    <section className="import-preview-section">
      <div className="import-section-heading">
        <h3>{title}</h3>
        <span>{items.length}</span>
      </div>
      {items.length === 0 ? <p className="import-muted">No {title.toLowerCase()} proposed.</p> : (
        <div className="import-card-list">
          {items.map((item, index) => (
            <article className="import-card" key={`${title}-${item.sourceLine}-${index}`}>
              <div className="import-card-top">
                <h4>{item.title || "Untitled record"}</h4>
                <span className={`import-status ${item.disposition}`}>
                  {item.disposition === "existing" ? "Existing entity" : "New proposed entity"}
                </span>
              </div>
              <p className="import-record-meta">
                {item.id ? `ID: ${item.id}` : "ID pending"} · {item.slug ? `Slug: ${item.slug}` : "Slug pending"}
                {item.sourceLine ? ` · line ${item.sourceLine}` : ""}
              </p>
              {item.details?.filter(Boolean).map((detail, i) => <p className="import-detail" key={i}>{detail}</p>)}
              {!!item.refs?.length && (
                <ul className="import-ref-list">
                  {item.refs.map(({ kind, reference: ref }, i) => (
                    <li key={i}>
                      <span className="import-ref-kind">{kind}</span>
                      <span className={`import-ref-state ${ref.state}`}>{ref.state.replace("-", " ")}</span>
                      <span>{ref.input}</span>
                      {ref.id && <small>{ref.id}</small>}
                    </li>
                  ))}
                </ul>
              )}
              {item.body !== undefined && (
                <details className="import-prose" open={expandBody}>
                  <summary>Full text preview</summary>
                  <pre>{item.body || "(empty)"}</pre>
                </details>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function IssueList({ title, items, type }: { title: string; items: ImportIssue[]; type: "error" | "warning" }) {
  return (
    <section className={`import-issues ${type}`} aria-label={title}>
      <h3>{title} <span>{items.length}</span></h3>
      {items.length ? (
        <ul>{items.map((item, index) => (
          <li key={`${item.code}-${item.path}-${index}`}>
            <strong>{item.message}</strong><small>{item.path} · {item.code}</small>
          </li>
        ))}</ul>
      ) : <p>None.</p>}
    </section>
  );
}

export function ImportWorkspace({ catalog }: { catalog: ImportCatalog }) {
  const [universeId, setUniverseId] = useState(catalog.universes[0]?.id ?? "");
  const [continuityId, setContinuityId] = useState(
    catalog.continuities.find((item) => item.universeId === catalog.universes[0]?.id)?.id ?? "",
  );
  const [rawText, setRawText] = useState("");
  const [draft, setDraft] = useState<ImportDraft | null>(null);
  const [previewSource, setPreviewSource] = useState<"quick" | "smart" | null>(null);
  const [busy, setBusy] = useState(false);
  const [requestError, setRequestError] = useState("");
  const continuities = catalog.continuities.filter((item) => item.universeId === universeId);
  const parse = () => {
    const parsed = parseImportText(rawText, universeId, continuityId);
    setDraft(validateImportDraft(normalizeImportDraft(parsed, catalog), catalog));
    setPreviewSource("quick");
    setRequestError("");
  };
  const smartParse = async () => {
    setRequestError("");
    setDraft(null);
    setPreviewSource(null);
    if (rawText.length > MAX_SMART_IMPORT_CHARS) {
      setRequestError(`Smart Import accepts up to ${MAX_SMART_IMPORT_CHARS.toLocaleString()} characters.`);
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/admin/import/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText, universeId, continuityId }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error?.message ?? "Smart Import failed.");
      setDraft(payload.draft as ImportDraft);
      setPreviewSource("smart");
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : "Smart Import failed.");
    } finally {
      setBusy(false);
    }
  };
  const resetPreview = () => { setDraft(null); setPreviewSource(null); setRequestError(""); };
  const sections: { title: string; items: PreviewItem[] }[] = draft ? [
    { title: "Scenes", items: draft.scenes.map((item) => ({
      ...item, details: [item.dateDisplay ?? item.dateText ?? item.date ?? "Date unresolved",
        item.storyOrder === undefined ? "Story order pending" : `Story order: ${item.storyOrder}`,
        item.sourceRange ? `Source lines: ${item.sourceRange.start}–${item.sourceRange.end}` : "",
        item.boundaryReason ? `Boundary: ${item.boundaryReason}` : "",
        item.generatedTitle ? "AI-generated title metadata" : ""],
      refs: [
        ...labeled(item.characterRefs, "Character"), ...labeled(item.povCharacterRefs, "POV"),
        ...(item.locationRef ? labeled([item.locationRef], "Location") : []),
        ...labeled(item.tagRefs, "Tag"),
      ],
    })) },
    { title: "Characters", items: draft.characters.map((item) => ({
      ...item, title: item.name, details: [item.description ?? "", ...(item.facts ?? [])],
      refs: labeled(item.tagRefs, "Tag"),
    })) },
    { title: "Timeline Events", items: draft.timelineEvents.map((item) => ({
      ...item, details: [item.dateDisplay ?? item.dateText ?? item.date ?? "Date unresolved",
        item.description ?? "",
        item.sourceRange ? `Source lines: ${item.sourceRange.start}–${item.sourceRange.end}` : ""],
      refs: [
        ...labeled(item.characterRefs, "Character"), ...labeled(item.sceneRefs, "Scene"),
        ...(item.locationRef ? labeled([item.locationRef], "Location") : []),
        ...labeled(item.tagRefs, "Tag"),
      ],
    })) },
    { title: "Relationships", items: draft.relationships.map((item) => ({
      ...item, details: [item.relationshipType ?? "Type unresolved", item.summary ?? "", ...(item.facts ?? [])],
      refs: labeled(item.characterRefs, "Character"),
    })) },
    { title: "Canon rules", items: draft.canonRules.map((item) => ({
      ...item, details: [item.category ?? "Category unresolved"], body: item.body,
    })) },
    { title: "Tags", items: draft.tags.map((item) => ({ ...item, title: item.name })) },
    { title: "Locations", items: (draft.locations ?? []).map((item) => ({
      ...item, title: item.name, details: [item.description ?? ""],
    })) },
  ] : [];

  return (
    <div className="page-width import-page">
      <header className="import-heading">
        <p className="eyebrow">ADMIN · DRAFT PREVIEW</p>
        <h1>Story import</h1>
        <p>Turn explicit notes into a reviewable draft. Nothing on this page writes to the archive.</p>
      </header>
      <div className="import-layout">
        <section className="import-editor" aria-label="Import input">
          <div className="import-fields">
            <label>Universe
              <select value={universeId} onChange={(event) => {
                const next = event.target.value;
                setUniverseId(next);
                setContinuityId(catalog.continuities.find((item) => item.universeId === next)?.id ?? "");
                resetPreview();
              }}>
                {catalog.universes.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
              </select>
            </label>
            <label>Continuity
              <select value={continuityId} onChange={(event) => {
                setContinuityId(event.target.value);
                resetPreview();
              }}>
                {continuities.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
              </select>
            </label>
          </div>
          <label className="import-text-label" htmlFor="import-text">Raw story notes</label>
          <textarea
            id="import-text"
            value={rawText}
            onChange={(event) => { setRawText(event.target.value); resetPreview(); }}
            placeholder={"Scene: A quiet morning\nFull scene prose goes here, unchanged."}
            spellCheck={false}
          />
          <div className="import-actions">
            <button className="button" type="button" onClick={parse} disabled={!rawText.trim() || busy}>
              Quick Import
            </button>
            <button className="button import-smart-button" type="button" onClick={smartParse}
              disabled={!rawText.trim() || busy}>
              {busy ? "Parsing…" : "Smart Import"}
            </button>
          </div>
          <p className="import-action-note">Quick Import uses labeled text. Smart Import sends the text to the AI parser. Both stop at preview.</p>
          {requestError && <p className="import-request-error" role="alert">{requestError}</p>}
          <details className="import-format">
            <summary>Accepted plain text format</summary>
            <p>A <code>Scene: Title</code> line starts a simple scene. For explicit fields, use a labeled block. Full body text is kept exactly as pasted.</p>
            <pre>{`[[scene]]
title: A quiet morning
storyOrder: 2
characters: ch-mateo, Amelia Bennett-Reyes
tags: Family
body:
Full scene prose goes here.
[[/scene]]

[[event]]
title: A later event
scenes: a-quiet-morning
[[/event]]`}</pre>
            <p>Other block names: <code>character</code>, <code>relationship</code>, <code>canon</code>, and <code>tag</code>. Unmarked text stays unresolved.</p>
          </details>
        </section>
        <aside className="import-sidebar" aria-label="Validation">
          <h2>Validation summary</h2>
          {!draft ? <p>Choose Quick Import or Smart Import to inspect proposed records and issues.</p> : (
            <>
              <div className="import-summary-grid">
                <div><strong>{sections.reduce((sum, section) => sum + section.items.length, 0)}</strong><span>records</span></div>
                <div><strong>{draft.validationErrors.length}</strong><span>errors</span></div>
                <div><strong>{draft.warnings.length}</strong><span>warnings</span></div>
              </div>
              <IssueList title="Validation errors" items={draft.validationErrors} type="error" />
              <IssueList title="Warnings" items={draft.warnings} type="warning" />
            </>
          )}
        </aside>
      </div>
      {draft && (
        <div className="import-results" aria-live="polite">
          <div className="import-results-heading">
            <h2>Structured preview</h2>
            <p><strong>{previewSource === "smart" ? "AI proposal" : "Quick Import draft"}</strong> · Existing entities are matched by ID or exact slug. New entities are proposals only.</p>
          </div>
          {draft.chapter && <section className="import-chapter">
            <h3>Chapter metadata</h3>
            <p>{draft.chapter.number ? `Chapter ${draft.chapter.number} · ` : ""}
              {draft.chapter.title ?? "Title unresolved"}
              {draft.chapter.sourceRange ? ` · source lines ${draft.chapter.sourceRange.start}–${draft.chapter.sourceRange.end}` : ""}
            </p>
          </section>}
          {draft.unresolvedText.length > 0 && (
            <section className="import-unresolved">
              <h3>Unresolved source text</h3>
              <p>Review these notes manually; no canon was inferred from them.</p>
              {draft.unresolvedText.map((text, index) => <pre key={index}>{text}</pre>)}
            </section>
          )}
          {!!draft.unresolvedReferences?.length && <section className="import-unresolved">
            <h3>Unresolved references</h3>
            <ul>{draft.unresolvedReferences.map((item, index) =>
              <li key={index}><strong>{item.input}</strong> — {item.reason}</li>)}</ul>
          </section>}
          {!!draft.metadataNotes?.length && <section className="import-unresolved">
            <h3>Extracted metadata notes</h3>
            <p>These source lines are separate from scene prose.</p>
            {draft.metadataNotes.map((item, index) =>
              <article key={index}><strong>{item.kind}</strong> · lines {item.sourceRange.start}–{item.sourceRange.end}
                <pre>{item.text}</pre></article>)}
          </section>}
          {sections.map((section) =>
            <PreviewSection key={section.title} {...section} expandBody={previewSource === "smart"} />)}
        </div>
      )}
    </div>
  );
}
