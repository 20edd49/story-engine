import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import {
  universeRepository,
  characterRepository,
  continuityRepository,
  timelineRepository,
  sceneRepository,
  archiveRepository,
} from "@/lib/repositories/archive";
import {
  Artwork,
  Badge,
  CharacterCard,
  SectionHeading,
  SceneCard,
  RecordCard,
  EmptyState,
} from "@/components/primitives";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ universeSlug: string }>;
}) {
  return {
    title:
      (await universeRepository.bySlug((await params).universeSlug))?.shortName ||
      "Universe",
  };
}
export default async function Overview({
  params,
}: {
  params: Promise<{ universeSlug: string }>;
}) {
  const u = await universeRepository.bySlug((await params).universeSlug);
  if (!u) notFound();
  const [c, characters, events, scenes, relationships, locations, continuities] =
    await Promise.all([
      continuityRepository.byId(u.id, u.defaultContinuityId),
      characterRepository.list(u.id),
      timelineRepository.list(u.id, u.defaultContinuityId),
      sceneRepository.list(u.id, u.defaultContinuityId),
      archiveRepository.relationships(u.id, u.defaultContinuityId),
      archiveRepository.locations(u.id),
      continuityRepository.list(u.id),
    ]);
  return (
    <>
      <div className="universe-hero">
        <div className="hero-copy">
          <Link className="eyebrow" href="/universes">
            THE ARCHIVES / UNIVERSE
          </Link>
          <Badge continuity={c} />
          <h1>{u.shortName}</h1>
          <p className="hero-tagline">{u.tagline}</p>
          <p>{u.description}</p>
          <Link className="button" href={`/${u.slug}/characters`}>
            Meet the characters <ArrowRight size={16} />
          </Link>
        </div>
        <Artwork universe={u} />
      </div>
      <div className="page-width universe-content">
        <div className="universe-stats">
          <span>
            <strong>{characters.length.toString().padStart(2, "0")}</strong>{" "}
            Character records
          </span>
          <span>
            <strong>{events.length.toString().padStart(2, "0")}</strong>{" "}
            Timeline anchors
          </span>
          <span>
            <strong>
              {continuities.length.toString().padStart(2, "0")}
            </strong>{" "}
            Continuities
          </span>
          <span className="eyebrow">A WORLD, STILL UNFOLDING</span>
        </div>
        <section>
          <SectionHeading
            eyebrow="THE PEOPLE AT THE HEART OF IT"
            title="Familiar names. Lasting stories."
            href={`/${u.slug}/characters`}
          />
          <div className="character-grid">
            {characters.slice(0, 4).map((ch) => (
              <CharacterCard key={ch.id} universe={u} character={ch} />
            ))}
          </div>
        </section>
        <section className="overview-split">
          <div>
            <SectionHeading
              eyebrow="MOMENTS THAT MATTER"
              title="Through the years"
              href={`/${u.slug}/timeline`}
            />
            {events.length ? (
              <div className="timeline-preview">
                {events.slice(0, 3).map((e) => (
                  <Link href={`/${u.slug}/timeline#${e.id}`} key={e.id}>
                    <span className="eyebrow">{e.dateDisplay}</span>
                    <h3>{e.title}</h3>
                    <ArrowRight size={17} />
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState
                title="An unfolding history."
                description="Story phases and timeline anchors will be recorded when supplied."
              />
            )}
          </div>
          <div>
            <SectionHeading
              eyebrow="BETWEEN THE LINES"
              title="The scene library"
              href={`/${u.slug}/scenes`}
            />
            {scenes.map((s) => (
              <SceneCard key={s.id} scene={s} universe={u} continuity={c} />
            ))}
          </div>
        </section>
        <section>
          <SectionHeading
            eyebrow="THE TIES THAT SHAPE A WORLD"
            title="Relationships"
            href={`/${u.slug}/relationships`}
          />
          <div className="record-grid">
            {relationships.slice(0, 2).map((r) => (
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
              description="Known character names are preserved. Their relationships will be added only when confirmed."
            />
          )}
        </section>
        <section>
          <SectionHeading
            eyebrow="A SENSE OF PLACE"
            title="The places in the story"
            href={`/${u.slug}/locations`}
          />
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
              title="Room for a world."
              description="Locations have not yet been supplied for this universe."
            />
          )}
        </section>
        <Link className="canon-banner" href={`/${u.slug}/canon`}>
          <div>
            <span className="eyebrow">THE FOUNDATION OF THE STORY</span>
            <h2>Every detail. Kept in canon.</h2>
          </div>
          <ArrowRight size={25} />
        </Link>
      </div>
    </>
  );
}
