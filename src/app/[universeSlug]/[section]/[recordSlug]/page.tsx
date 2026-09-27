import Link from "next/link";
import { notFound } from "next/navigation";
import {
  archiveRepository as archive,
  characterRepository as chars,
  continuityRepository,
  sceneRepository,
  timelineRepository,
  universeRepository,
} from "@/lib/repositories/archive";
import {
  Badge,
  CharacterCard,
  EmptyState,
  PageIntro,
  Portrait,
  RecordCard,
  SceneCard,
  SectionHeading,
} from "@/components/primitives";
import { Timeline } from "@/components/timeline";
export default async function Record({
  params,
}: {
  params: Promise<{
    universeSlug: string;
    section: string;
    recordSlug: string;
  }>;
}) {
  const { universeSlug, section, recordSlug } = await params;
  const u = universeRepository.bySlug(universeSlug);
  if (!u || !u.navigation.some((n) => n.module === section)) notFound();
  const characters = chars.list(u.id);
  const main = u.defaultContinuityId;
  const continuities = continuityRepository.list(u.id);
  const scenes = sceneRepository.list(u.id);
  const locations = archive.locations(u.id);
  const breadcrumb = (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <Link href={`/${u.slug}`}>{u.shortName}</Link>
      <span>/</span>
      <Link href={`/${u.slug}/${section}`}>{section}</Link>
      <span>/</span>
      <span>Record</span>
    </nav>
  );
  const eventView = (events: ReturnType<typeof timelineRepository.list>) => (
    <Timeline
      events={events}
      universe={u}
      characters={characters}
      locations={locations}
      scenes={scenes}
    />
  );
  const sceneView = (items: typeof scenes) =>
    items.length ? (
      <div className="record-grid">
        {items.map((s) => (
          <SceneCard
            key={s.id}
            scene={s}
            universe={u}
            continuity={continuities.find((c) => c.id === s.continuityId)}
          />
        ))}
      </div>
    ) : (
      <EmptyState title="No linked scenes yet." />
    );
  if (section === "characters") {
    const ch = chars.bySlug(u.id, recordSlug);
    if (!ch) notFound();
    const relationships = archive
      .relationships(u.id, main)
      .filter((r) => r.characterIds.includes(ch.id));
    const events = timelineRepository
      .list(u.id, main)
      .filter((e) => e.characterIds.includes(ch.id));
    const linkedScenes = scenes.filter(
      (s) => s.characterIds.includes(ch.id) && s.continuityId === main,
    );
    const quotes = archive
      .quotes(u.id, main)
      .filter((q) => q.characterId === ch.id);
    return (
      <div className="page-width content-page">
        {breadcrumb}
        <header className="profile-header">
          <Portrait character={ch} />
          <div>
            <PageIntro
              eyebrow={ch.role || "CHARACTER RECORD"}
              title={ch.name}
              description={ch.description}
            />
            <div className="tag-list">
              {ch.tags.map((t) => (
                <span key={t}>{t}</span>
              ))}
            </div>
            <Badge continuity={continuities.find((c) => c.id === main)} />
          </div>
        </header>
        <nav className="anchor-nav" aria-label="Character sections">
          {[
            "Biography",
            "Relationships",
            "Timeline",
            "Key moments",
            "Quotes",
            "Related scenes",
            "Notes",
          ].map((t) => (
            <a key={t} href={`#${t.toLowerCase().replaceAll(" ", "-")}`}>
              {t}
            </a>
          ))}
        </nav>
        <section id="biography">
          <SectionHeading title="Biography" />
          <p className="reading-copy">
            {ch.biography ||
              "A full biography has not yet been archived. The overview above contains the currently supplied details."}
          </p>
        </section>
        <section id="relationships">
          <SectionHeading title="Relationships" />
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
            <EmptyState title="No confirmed connections recorded." />
          )}
        </section>
        <section id="timeline">
          <SectionHeading title="In the timeline" />
          {eventView(events)}
        </section>
        <section id="key-moments">
          <SectionHeading title="Key moments" />
          {events.length ? (
            <div className="record-grid">
              {events.slice(0, 3).map((e) => (
                <RecordCard
                  key={e.id}
                  href={`/${u.slug}/timeline#${e.id}`}
                  kicker={e.dateDisplay}
                  title={e.title}
                  description={e.description}
                />
              ))}
            </div>
          ) : (
            <EmptyState title="Key moments await archival." />
          )}
        </section>
        <section id="quotes">
          <SectionHeading title="In their own words" />
          {quotes.length ? (
            quotes.map((q) => <blockquote key={q.id}>{q.text}</blockquote>)
          ) : (
            <p className="muted">No verified quotes have been supplied.</p>
          )}
        </section>
        <section id="related-scenes">
          <SectionHeading title="Related scenes" />
          {sceneView(linkedScenes)}
        </section>
        <section id="notes">
          <SectionHeading title="Archive notes" />
          <p className="archive-disclosure">
            {ch.notes ||
              "Unrecorded biographical details remain intentionally open."}
          </p>
        </section>
      </div>
    );
  }
  if (section === "scenes") {
    const s = sceneRepository.bySlug(u.id, recordSlug);
    if (!s) notFound();
    const c = continuities.find((c) => c.id === s.continuityId);
    const ordered = scenes
      .filter((x) => x.continuityId === s.continuityId)
      .sort((a, b) => a.storyOrder - b.storyOrder);
    const position = ordered.findIndex((x) => x.id === s.id);
    return (
      <div className="page-width content-page scene-page">
        {breadcrumb}
        <header className="reader-header">
          <Badge continuity={c} />
          {s.placeholder && <Badge placeholder />}
          <p className="eyebrow">
            {s.subtitle} / {s.dateDisplay} / {s.status}
          </p>
          <h1>{s.title}</h1>
          <p>{s.summary}</p>
          <div className="tag-list">
            {s.tags.map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>
        </header>
        <article className="scene-prose" aria-label="Scene text">
          {s.body.split("\n\n").map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
          <div className="reader-end">◆ ◆ ◆</div>
        </article>
        <aside className="reader-notes">
          <p className="eyebrow">ARCHIVE NOTES</p>
          <p>{s.notes}</p>
          {s.locationId && (
            <p>
              Location: {locations.find((l) => l.id === s.locationId)?.name}
            </p>
          )}
        </aside>
        <nav className="reader-pagination" aria-label="Scene navigation">
          {ordered[position - 1] ? (
            <Link href={`/${u.slug}/scenes/${ordered[position - 1].slug}`}>
              ← Previous scene
            </Link>
          ) : (
            <span>Beginning of this collection</span>
          )}
          <Link href={`/${u.slug}/scenes?continuity=${s.continuityId}`}>
            Scene library
          </Link>
          {ordered[position + 1] ? (
            <Link href={`/${u.slug}/scenes/${ordered[position + 1].slug}`}>
              Next scene →
            </Link>
          ) : (
            <span>More pages to come</span>
          )}
        </nav>
        <section>
          <SectionHeading title="People in this scene" />
          {s.characterIds.length ? (
            <div className="character-grid">
              {characters
                .filter((ch) => s.characterIds.includes(ch.id))
                .map((ch) => (
                  <CharacterCard key={ch.id} character={ch} universe={u} />
                ))}
            </div>
          ) : (
            <p className="muted">
              No characters are assigned to this reader preview.
            </p>
          )}
        </section>
        <section>
          <SectionHeading title="Continue reading" />
          {sceneView(ordered.filter((x) => x.id !== s.id).slice(0, 3))}
        </section>
      </div>
    );
  }
  if (section === "continuities") {
    const c = continuities.find((c) => c.slug === recordSlug);
    if (!c) notFound();
    return (
      <div className="page-width content-page">
        {breadcrumb}
        <PageIntro
          eyebrow="CONTINUITY RECORD"
          title={c.name}
          description={c.description}
        >
          <Badge continuity={c} />
        </PageIntro>
        <div className="inline-links">
          <Link href={`/${u.slug}/timeline?continuity=${c.id}`}>
            Open this timeline ↗
          </Link>
          <Link href={`/${u.slug}/scenes?continuity=${c.id}`}>
            Open this scene library ↗
          </Link>
          <Link href={`/${u.slug}/canon?continuity=${c.id}`}>
            Continuity canon ↗
          </Link>
        </div>
        <section>
          <SectionHeading title="Recorded moments" />
          {eventView(timelineRepository.list(u.id, c.id))}
        </section>
        <section>
          <SectionHeading title="Scenes in this continuity" />
          {sceneView(sceneRepository.list(u.id, c.id))}
        </section>
      </div>
    );
  }
  if (section === "relationships") {
    const r = archive.relationships(u.id).find((r) => r.slug === recordSlug);
    if (!r) notFound();
    const events = timelineRepository
      .list(u.id, r.continuityId)
      .filter(
        (e) =>
          r.characterIds.filter((id) => e.characterIds.includes(id)).length >=
          2,
      );
    return (
      <div className="page-width content-page">
        {breadcrumb}
        <PageIntro
          eyebrow={r.relationshipType}
          title={r.title}
          description={r.summary}
        >
          <Badge
            continuity={continuities.find((c) => c.id === r.continuityId)}
          />
        </PageIntro>
        <div className="character-grid">
          {characters
            .filter((ch) => r.characterIds.includes(ch.id))
            .map((ch) => (
              <CharacterCard key={ch.id} character={ch} universe={u} />
            ))}
        </div>
        <section>
          <SectionHeading title="Milestones & evolution" />
          {eventView(events)}
          <p className="archive-disclosure">
            {r.notes ||
              "Milestones show records involving at least two people in this relationship. Further evolution has not been supplied."}
          </p>
        </section>
        <section>
          <SectionHeading title="Shared scenes" />
          {sceneView(
            scenes.filter(
              (s) =>
                s.continuityId === r.continuityId &&
                r.characterIds.filter((id) => s.characterIds.includes(id))
                  .length >= 2,
            ),
          )}
        </section>
        <section>
          <SectionHeading title="Quotes" />
          <p className="muted">No relationship quotes have been supplied.</p>
        </section>
      </div>
    );
  }
  if (section === "locations") {
    const l = locations.find((l) => l.slug === recordSlug);
    if (!l) notFound();
    return (
      <div className="page-width content-page">
        {breadcrumb}
        <PageIntro
          eyebrow={l.locationType}
          title={l.name}
          description={l.description}
        />
        <div className="location-frame">
          <span className="eyebrow">
            {[l.city, l.country].filter(Boolean).join(" / ") ||
              "LOCATION RECORD"}
          </span>
          <h2>{l.name}</h2>
          <span className="eyebrow">GALLERY AWAITING IMAGES</span>
        </div>
        <section>
          <SectionHeading title="Associated people" />
          {l.characterIds.length ? (
            <div className="character-grid">
              {characters
                .filter((ch) => l.characterIds.includes(ch.id))
                .map((ch) => (
                  <CharacterCard key={ch.id} character={ch} universe={u} />
                ))}
            </div>
          ) : (
            <p className="muted">
              Associated characters have not been recorded.
            </p>
          )}
          <p className="archive-disclosure">
            {l.residentIds.length
              ? `Recorded residents: ${characters
                  .filter((ch) => l.residentIds.includes(ch.id))
                  .map((ch) => ch.name)
                  .join(", ")}`
              : "No residents have been confirmed in the supplied location record."}
          </p>
        </section>
        <section>
          <SectionHeading title="Moments in this place" />
          {eventView(
            timelineRepository
              .list(u.id, main)
              .filter((e) => e.locationId === l.id),
          )}
        </section>
        <section>
          <SectionHeading title="Scenes" />
          {sceneView(
            scenes.filter(
              (s) => s.locationId === l.id && s.continuityId === main,
            ),
          )}
        </section>
      </div>
    );
  }
  if (section === "vehicles") {
    const v = archive.vehicles(u.id).find((v) => v.slug === recordSlug);
    if (!v) notFound();
    const owner = characters.find((ch) => ch.id === v.ownerId);
    return (
      <div className="page-width content-page">
        {breadcrumb}
        <PageIntro
          eyebrow={v.model}
          title={v.name}
          description={v.significance}
        >
          <Badge
            continuity={continuities.find((c) => c.id === v.continuityId)}
          />
        </PageIntro>
        <dl className="metadata-list">
          {Object.entries({
            Model: v.model,
            "Model year": v.modelYear,
            Configuration: v.configuration,
            Color: v.color,
            Acquisition: v.acquisition,
          })
            .filter(([, value]) => value)
            .map(([key, value]) => (
              <div key={key}>
                <dt>{key}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          {owner && (
            <div>
              <dt>Owner</dt>
              <dd>
                <Link href={`/${u.slug}/characters/${owner.slug}`}>
                  {owner.name} ↗
                </Link>
              </dd>
            </div>
          )}
        </dl>
        <section>
          <SectionHeading title="In the story" />
          {eventView(
            timelineRepository
              .list(u.id, v.continuityId)
              .filter((e) => v.eventIds.includes(e.id)),
          )}
        </section>
        <section>
          <SectionHeading title="Related scenes" />
          {sceneView(scenes.filter((s) => v.sceneIds.includes(s.id)))}
        </section>
      </div>
    );
  }
  if (section === "lore") {
    const l = archive.lore(u.id).find((l) => l.slug === recordSlug);
    if (!l) notFound();
    return (
      <div className="page-width content-page">
        {breadcrumb}
        <PageIntro
          eyebrow={l.category}
          title={l.title}
          description={l.description}
        >
          <Badge
            continuity={continuities.find((c) => c.id === l.continuityId)}
            placeholder={l.placeholder}
          />
        </PageIntro>
        <EmptyState
          title="The record remains open."
          description="Further context, source scenes, and connections will appear when canon is supplied."
        />
      </div>
    );
  }
  notFound();
}
