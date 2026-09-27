import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  archiveRepository as archive,
  characterRepository as chars,
  continuityRepository as continuity,
  sceneRepository,
  timelineRepository,
  universeRepository,
} from "@/lib/repositories/archive";
import {
  Badge,
  EmptyState,
  PageIntro,
  RecordCard,
  SectionHeading,
} from "@/components/primitives";
import { CharacterDirectory, SceneDirectory } from "@/components/directories";
import { ContinuityFilter, Timeline } from "@/components/timeline";
const descriptions: Record<string, string> = {
  characters:
    "The people who make this world their own. Every name, a place in the story.",
  timeline:
    "A history told in turning points. Known dates are preserved; unknown dates stay open.",
  relationships: "The ties between people, and the ways their stories meet.",
  locations: "Places that hold a story. A record of where life unfolds.",
  scenes:
    "Return to a moment. Follow a perspective. Let the story take its time.",
  canon:
    "The authoritative reference. Established details, carefully preserved.",
  lore: "The ideas, institutions, and language that give this world its shape.",
  continuities:
    "One universe can hold many versions of a story. Each has a place of its own.",
  family: "A family in view. Only confirmed connections appear in this record.",
  vehicles:
    "Objects in motion. The vehicles that become part of the family story.",
};
export default async function Section({
  params,
  searchParams,
}: {
  params: Promise<{ universeSlug: string; section: string }>;
  searchParams: Promise<{ continuity?: string; category?: string }>;
}) {
  const { universeSlug, section } = await params;
  const u = await universeRepository.bySlug(universeSlug);
  if (!u) notFound();
  if (section === "overview") redirect(`/${u.slug}`);
  const nav = u.navigation.find((n) => n.module === section);
  if (!nav) notFound();
  const filters = await searchParams;
  const cs = await continuity.list(u.id);
  const selected = ["family", "vehicles"].includes(section)
    ? u.defaultContinuityId
    : filters.continuity || u.defaultContinuityId;
  const c = await continuity.byId(u.id, selected);
  if (!c) notFound();
  const [characters, events, scenes, locations, relationships, rules, loreItems, vehicles] = await Promise.all([
    chars.list(u.id),
    timelineRepository.list(u.id, c.id),
    sceneRepository.list(u.id),
    archive.locations(u.id),
    ["family", "relationships"].includes(section) ? archive.relationships(u.id, c.id) : Promise.resolve([]),
    section === "canon" ? archive.canon(u.id, c.id) : Promise.resolve([]),
    section === "lore" ? archive.lore(u.id, c.id) : Promise.resolve([]),
    section === "vehicles" ? archive.vehicles(u.id) : Promise.resolve([]),
  ]);
  const families = relationships
    .filter((r) => r.members?.some((m) => m.role === "parent"));
  return (
    <div className="page-width content-page">
      <PageIntro
        eyebrow={`${u.shortName} / THE ARCHIVE`}
        title={
          nav.label === "Continuities"
            ? "The many ways a story unfolds."
            : nav.label
        }
        description={descriptions[section]}
      >
        {[
          "timeline",
          "canon",
          "relationships",
          "lore",
          "family",
          "vehicles",
        ].includes(section) && <Badge continuity={c} />}
      </PageIntro>
      {section === "characters" && (
        <CharacterDirectory characters={characters} universe={u} />
      )}
      {section === "scenes" && (
        <SceneDirectory
          scenes={scenes}
          universe={u}
          continuities={cs}
          characters={characters}
          initialContinuity={c.id}
        />
      )}
      {section === "timeline" && (
        <>
          <ContinuityFilter
            continuities={cs}
            selected={c.id}
            category={filters.category}
            categories={[...new Set(events.map((e) => e.category))]}
          />
          <Timeline
            events={events.filter(
              (e) => !filters.category || e.category === filters.category,
            )}
            universe={u}
            characters={characters}
            locations={locations}
            scenes={scenes}
          />
        </>
      )}
      {section === "relationships" && (
        <>
          <ContinuityFilter continuities={cs} selected={c.id} />
          <div className="record-grid">
            {relationships.map((r) => (
              <RecordCard
                key={r.id}
                href={`/${u.slug}/relationships/${r.slug}`}
                kicker={r.relationshipType}
                title={r.title}
                description={r.summary}
              />
            ))}
          </div>
          {!relationships.length && (
            <EmptyState
              title="Connections, yet to be mapped."
              description="Relationships will appear here when their details are confirmed."
            />
          )}
        </>
      )}
      {section === "locations" && (
        <>
          <div className="record-grid">
            {locations.map((l) => (
              <RecordCard
                key={l.id}
                href={`/${u.slug}/locations/${l.slug}`}
                kicker={l.locationType}
                title={l.name}
                description={l.description}
              />
            ))}
          </div>
          {!locations.length && (
            <EmptyState
              title="A world with room to grow."
              description="No locations have been supplied. No addresses or residences have been inferred."
            />
          )}
        </>
      )}
      {section === "canon" && (
        <>
          <ContinuityFilter continuities={cs} selected={c.id} />
          {[...new Set(rules.map((r) => r.category))].map(
            (category) => (
              <section className="canon-section" key={category}>
                <SectionHeading title={category} />
                {rules
                  .filter((r) => r.category === category)
                  .map((r, i) => (
                    <article className="canon-rule" key={r.id}>
                      <span className="eyebrow">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <h3>{r.title}</h3>
                        <p>{r.body}</p>
                      </div>
                    </article>
                  ))}
              </section>
            ),
          )}
          {!rules.length && (
            <EmptyState
              title="A foundation awaiting its first records."
              description="Canon rules have not yet been supplied for this continuity. Archive placeholders do not establish story canon."
            />
          )}
        </>
      )}
      {section === "lore" && (
        <>
          <ContinuityFilter continuities={cs} selected={c.id} />
          <div className="record-grid">
            {loreItems.map((l) => (
              <RecordCard
                key={l.id}
                href={`/${u.slug}/lore/${l.slug}`}
                kicker={`${l.category}${l.placeholder ? " · Placeholder" : ""}`}
                title={l.title}
                description={l.description}
              />
            ))}
          </div>
          {!loreItems.length && <EmptyState />}
        </>
      )}
      {section === "continuities" && (
        <div className="continuity-grid">
          {cs.map((cont) => (
            <Link
              className="continuity-card"
              key={cont.id}
              href={`/${u.slug}/continuities/${cont.slug}`}
            >
              <Badge continuity={cont} />
              <h2>{cont.name}</h2>
              <p>{cont.description}</p>
              <span className="text-link">Explore this continuity ↗</span>
            </Link>
          ))}
        </div>
      )}
      {section === "vehicles" && (
        <div className="record-grid">
          {vehicles.map((v) => (
            <RecordCard
              key={v.id}
              href={`/${u.slug}/vehicles/${v.slug}`}
              kicker={v.model}
              title={v.name}
              description={v.significance}
            />
          ))}
        </div>
      )}
      {section === "family" && (
        <>
          {families.map((family) => (
            <div key={family.id}>
              <div className="family-tree">
                <div className="family-generation">
                  {characters
                    .filter((ch) =>
                      family.members?.some(
                        (m) => m.characterId === ch.id && m.role === "parent",
                      ),
                    )
                    .map((ch) => (
                      <Link
                        href={`/${u.slug}/characters/${ch.slug}`}
                        key={ch.id}
                      >
                        <span className="eyebrow">PARENT</span>
                        <h3>{ch.name}</h3>
                      </Link>
                    ))}
                </div>
                <div className="family-connector">
                  <span>Confirmed parent / child connections</span>
                </div>
                <div className="family-generation children">
                  {characters
                    .filter((ch) =>
                      family.members?.some(
                        (m) => m.characterId === ch.id && m.role === "child",
                      ),
                    )
                    .map((ch) => (
                      <Link
                        href={`/${u.slug}/characters/${ch.slug}`}
                        key={ch.id}
                      >
                        <span className="eyebrow">
                          {family.members?.find((m) => m.characterId === ch.id)
                            ?.label || "Child"}
                        </span>
                        <h3>{ch.name}</h3>
                      </Link>
                    ))}
                </div>
              </div>
              <p className="archive-disclosure">{family.notes}</p>
            </div>
          ))}
          {!families.length && (
            <EmptyState title="Family connections await confirmation." />
          )}
          <Link className="text-link" href={`/${u.slug}/relationships`}>
            Open the relationship archive ↗
          </Link>
        </>
      )}
    </div>
  );
}
