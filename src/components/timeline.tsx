import Link from "next/link";
import type {
  Character,
  Continuity,
  Location,
  Scene,
  TimelineEvent,
  Universe,
} from "@/lib/domain";
import { EmptyState } from "./primitives";
export function Timeline({
  events,
  universe,
  characters,
  locations,
  scenes,
}: {
  events: TimelineEvent[];
  universe: Universe;
  characters: Character[];
  locations: Location[];
  scenes: Scene[];
}) {
  if (!events.length)
    return (
      <EmptyState
        title="History is waiting to be recorded."
        description="No events have been supplied for this continuity. Its timeline remains separate from every other version of the story."
      />
    );
  const groups = Map.groupBy(
    events,
    (e) => e.sortDate?.slice(0, 4) || "Undated",
  );
  return (
    <div className="timeline">
      {[...groups].map(([year, items]) => (
        <section className="timeline-year" key={year}>
          <h2>
            {year}
            <span>
              {year === "Undated" ? "Narrative anchors" : "IN THE RECORD"}
            </span>
          </h2>
          <div>
            {items.map((e) => (
              <details id={e.id} className="timeline-event" key={e.id}>
                <summary>
                  <span className="timeline-point" />
                  <span className="eyebrow">
                    {e.dateDisplay}{" "}
                    <span className="event-category">{e.category}</span>
                  </span>
                  <h3>{e.title}</h3>
                  <span className="expand-label">View record +</span>
                </summary>
                <div className="event-details">
                  <p>{e.description}</p>
                  <p className="eyebrow">
                    {e.datePrecision} dating
                    {e.placeholder ? " · Demo placeholder" : ""}
                  </p>
                  <div className="inline-links">
                    {characters
                      .filter((c) => e.characterIds.includes(c.id))
                      .map((c) => (
                        <Link
                          key={c.id}
                          href={`/${universe.slug}/characters/${c.slug}`}
                        >
                          {c.name} ↗
                        </Link>
                      ))}
                    {locations
                      .filter((l) => e.locationId === l.id)
                      .map((l) => (
                        <Link
                          key={l.id}
                          href={`/${universe.slug}/locations/${l.slug}`}
                        >
                          {l.name} ↗
                        </Link>
                      ))}
                    {scenes
                      .filter((s) => e.sceneIds.includes(s.id))
                      .map((s) => (
                        <Link
                          key={s.id}
                          href={`/${universe.slug}/scenes/${s.slug}`}
                        >
                          {s.title} ↗
                        </Link>
                      ))}
                  </div>
                </div>
              </details>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
export function ContinuityFilter({
  continuities,
  selected,
  categories = [],
  category = "",
}: {
  continuities: Continuity[];
  selected: string;
  categories?: string[];
  category?: string;
}) {
  return (
    <form className="filters">
      <label>
        Continuity
        <select name="continuity" defaultValue={selected}>
          {continuities.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
              {c.type !== "main-canon" ? " · ALTERNATE UNIVERSE" : ""}
            </option>
          ))}
        </select>
      </label>
      {categories.length > 0 && (
        <label>
          Category
          <select name="category" defaultValue={category}>
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
      )}
      <button type="submit" className="button">
        Apply filters
      </button>
    </form>
  );
}
