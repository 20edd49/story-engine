"use client";

import { useState } from "react";
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
  refs?: ImportReference[];
  body?: string;
};

function PreviewSection({ title, items }: { title: string; items: PreviewItem[] }) {
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
                  {item.refs.map((ref, i) => (
                    <li key={i}>
                      <span className={`import-ref-state ${ref.state}`}>{ref.state.replace("-", " ")}</span>
                      <span>{ref.input}</span>
                      {ref.id && <small>{ref.id}</small>}
                    </li>
                  ))}
                </ul>
              )}
              {item.body !== undefined && (
                <details className="import-prose">
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
  const continuities = catalog.continuities.filter((item) => item.universeId === universeId);
  const parse = () => {
    const parsed = parseImportText(rawText, universeId, continuityId);
    setDraft(validateImportDraft(normalizeImportDraft(parsed, catalog), catalog));
  };
  const resetPreview = () => setDraft(null);
  const sections: { title: string; items: PreviewItem[] }[] = draft ? [
    { title: "Scenes", items: draft.scenes.map((item) => ({
      ...item, details: [item.dateText ? `Date text: ${item.dateText}` : "No date supplied",
        item.storyOrder === undefined ? "Story order pending" : `Story order: ${item.storyOrder}`],
      refs: [...item.characterRefs, ...item.povCharacterRefs, ...item.tagRefs],
    })) },
    { title: "Characters", items: draft.characters.map((item) => ({
      ...item, title: item.name, details: item.description ? [item.description] : [], refs: item.tagRefs,
    })) },
    { title: "Events", items: draft.timelineEvents.map((item) => ({
      ...item, details: [item.dateText ? `Date text: ${item.dateText}` : "No date supplied",
        item.description ?? ""], refs: [...item.characterRefs, ...item.sceneRefs, ...item.tagRefs],
    })) },
    { title: "Relationships", items: draft.relationships.map((item) => ({
      ...item, details: [item.relationshipType ?? "Type unresolved", item.summary ?? ""], refs: item.characterRefs,
    })) },
    { title: "Canon rules", items: draft.canonRules.map((item) => ({
      ...item, details: [item.category ?? "Category unresolved"], body: item.body,
    })) },
    { title: "Tags", items: draft.tags.map((item) => ({ ...item, title: item.name })) },
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
            <button className="button" type="button" onClick={parse} disabled={!rawText.trim()}>
              Parse Draft
            </button>
            <span>Preview only · no database writes</span>
          </div>
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
          {!draft ? <p>Parse notes to inspect proposed records and issues.</p> : (
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
            <p>Existing entities are matched by ID or exact slug. New entities are proposals only.</p>
          </div>
          {draft.unresolvedText.length > 0 && (
            <section className="import-unresolved">
              <h3>Unresolved source text</h3>
              <p>Review these notes manually; no canon was inferred from them.</p>
              {draft.unresolvedText.map((text, index) => <pre key={index}>{text}</pre>)}
            </section>
          )}
          {sections.map((section) => <PreviewSection key={section.title} {...section} />)}
        </div>
      )}
    </div>
  );
}
