"use client";
import Link from "next/link";
import { useState } from "react";
import { Search, ArrowUpRight } from "lucide-react";
import type {
  Character,
  Continuity,
  Scene,
  SearchResult,
  Universe,
} from "@/lib/domain";
import { CharacterCard, SceneCard, EmptyState } from "./primitives";
export function CharacterDirectory({
  characters,
  universe,
}: {
  characters: Character[];
  universe: Universe;
}) {
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState("");
  const tags = [...new Set(characters.flatMap((c) => c.tags))];
  const filtered = characters.filter(
    (c) =>
      `${c.name} ${c.description} ${c.role}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (!tag || c.tags.includes(tag)),
  );
  return (
    <>
      <div className="filters">
        <label className="search-field">
          <Search size={18} />
          <input
            aria-label="Search characters"
            placeholder="Find a character…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <label>
          Tag{" "}
          <select value={tag} onChange={(e) => setTag(e.target.value)}>
            <option value="">All tags</option>
            {tags.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
        <span className="result-count" aria-live="polite">
          {filtered.length} records
        </span>
      </div>
      {filtered.length ? (
        <div className="character-grid">
          {filtered.map((c) => (
            <CharacterCard key={c.id} character={c} universe={universe} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No characters found."
          description="Try a different name or tag."
        />
      )}
    </>
  );
}
export function SceneDirectory({
  scenes,
  universe,
  continuities,
  characters,
  initialContinuity,
}: {
  scenes: Scene[];
  universe: Universe;
  continuities: Continuity[];
  characters: Character[];
  initialContinuity: string;
}) {
  const [query, setQuery] = useState("");
  const [continuity, setContinuity] = useState(initialContinuity);
  const [character, setCharacter] = useState("");
  const [tag, setTag] = useState("");
  const [order, setOrder] = useState("chronologicalOrder");
  const filtered = scenes
    .filter(
      (s) =>
        (!continuity || s.continuityId === continuity) &&
        (!character || s.characterIds.includes(character)) &&
        (!tag || s.tags.includes(tag)) &&
        `${s.title} ${s.summary}`.toLowerCase().includes(query.toLowerCase()),
    )
    .sort((a, b) =>
      order === "storyOrder"
        ? a.storyOrder - b.storyOrder
        : a.chronologicalOrder - b.chronologicalOrder,
    );
  return (
    <>
      <div className="filters">
        <label className="search-field">
          <Search size={18} />
          <input
            aria-label="Search scenes"
            placeholder="Search the scene library…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <label>
          Continuity
          <select
            value={continuity}
            onChange={(e) => setContinuity(e.target.value)}
          >
            {continuities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Character
          <select
            value={character}
            onChange={(e) => setCharacter(e.target.value)}
          >
            <option value="">All characters</option>
            {characters.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Order
          <select value={order} onChange={(e) => setOrder(e.target.value)}>
            <option value="chronologicalOrder">Chronological</option>
            <option value="storyOrder">Story order</option>
          </select>
        </label>
        <label>
          Tag
          <select value={tag} onChange={(e) => setTag(e.target.value)}>
            <option value="">All tags</option>
            {[...new Set(scenes.flatMap((s) => s.tags))].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
      </div>
      <p className="eyebrow" aria-live="polite">
        {filtered.length} scenes ·{" "}
        {continuities.find((c) => c.id === continuity)?.name}
      </p>
      {filtered.length ? (
        <div className="record-grid">
          {filtered.map((s) => (
            <SceneCard
              key={s.id}
              scene={s}
              universe={universe}
              continuity={continuities.find((c) => c.id === s.continuityId)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="The next page is still open."
          description="No scenes match this selection. Try another filter or continuity."
        />
      )}
    </>
  );
}
export function SearchDirectory({
  index,
  universes,
  initialUniverse = "",
  initialQuery = "",
  initialKind = "",
}: {
  index: SearchResult[];
  universes: Universe[];
  initialUniverse?: string;
  initialQuery?: string;
  initialKind?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [universe, setUniverse] = useState(initialUniverse);
  const [kind, setKind] = useState(initialKind);
  const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  const results = index.filter(
    (r) =>
      (!universe || r.universeId === universe) &&
      (!kind || r.kind === kind) &&
      terms.every((t) =>
        `${r.title} ${r.description} ${r.universeName}`
          .toLowerCase()
          .includes(t),
      ),
  );
  return (
    <>
      <div className="filters">
        <label className="search-field">
          <Search size={19} />
          <input
            aria-label="Search archive"
            placeholder="A name, a place, a turning point…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <label>
          Universe
          <select
            value={universe}
            onChange={(e) => setUniverse(e.target.value)}
          >
            <option value="">All universes</option>
            {universes.map((u) => (
              <option key={u.id} value={u.id}>
                {u.shortName}
              </option>
            ))}
          </select>
        </label>
        <label>
          Record type
          <select value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="">All records</option>
            {[...new Set(index.map((r) => r.kind))].map((k) => (
              <option key={k}>{k}</option>
            ))}
          </select>
        </label>
      </div>
      <p className="eyebrow" aria-live="polite">
        {results.length} records found
      </p>
      <div className="search-results">
        {results.map((r) => (
          <Link key={r.id} href={r.href}>
            <div>
              <p className="eyebrow">
                {r.universeName} <span> / </span> {r.kind}
                {r.continuityLabel ? ` / ${r.continuityLabel}` : ""}
                {r.placeholder ? " / Placeholder · not canon" : ""}
              </p>
              <h2>{r.title}</h2>
              <p>{r.description}</p>
            </div>
            <ArrowUpRight size={22} />
          </Link>
        ))}
      </div>
      {!results.length && (
        <EmptyState
          title="No matching records."
          description="Try a broader search or a different universe."
        />
      )}
    </>
  );
}
