import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Asterisk,
  BookOpen,
  Users,
  GitBranch,
} from "lucide-react";
import {
  universeRepository,
  characterRepository,
  continuityRepository,
} from "@/lib/repositories/archive";
import { Artwork } from "@/components/primitives";
export default function Home() {
  const universes = universeRepository.list();
  return (
    <div className="home page-width">
      <header className="home-intro">
        <div className="eyebrow">
          <span className="short-line" /> THE STORIES. THE PEOPLE. THE WORLDS.
        </div>
        <div className="home-title-row">
          <h1>
            Some worlds
            <br />
            stay <em>with us.</em>
          </h1>
          <div className="home-aside">
            <Asterisk size={37} strokeWidth={1} />
            <p>
              A living record of stories, families,
              <br className="desktop-break" /> histories, and everything in
              between.
            </p>
            <span className="eyebrow">WELCOME TO THE ARCHIVES</span>
          </div>
        </div>
      </header>
      <section aria-labelledby="worlds-heading">
        <div className="collection-heading">
          <h2 id="worlds-heading">
            Explore the universes <span>02</span>
          </h2>
          <p>INDEPENDENT WORLDS. ENDLESS CONNECTIONS.</p>
        </div>
        <div className="universe-grid">
          {universes.map((u, i) => (
            <Link
              className={`universe-card ${u.theme.texture}`}
              href={`/${u.slug}`}
              key={u.id}
            >
              <div className="universe-cover">
                <Artwork universe={u} />
                <span className="volume-label">
                  UNIVERSE {String(i + 1).padStart(2, "0")}
                </span>
                <span className="cover-arrow">
                  <ArrowUpRight size={23} />
                </span>
                <div className="cover-title">
                  <p>{u.keywords.join(" / ")}</p>
                  <h2>{u.shortName}</h2>
                </div>
              </div>
              <div className="universe-card-body">
                <p className="universe-tagline">{u.tagline}</p>
                <p className="universe-description">{u.description}</p>
                <div className="universe-card-bottom">
                  <span>
                    {characterRepository.list(u.id).length} characters <i />{" "}
                    {continuityRepository.list(u.id).length}{" "}
                    {continuityRepository.list(u.id).length === 1
                      ? "continuity"
                      : "continuities"}
                  </span>
                  <span className="text-link">
                    Enter universe <ArrowRight size={17} />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
      <section className="archive-note">
        <div>
          <span className="eyebrow">A HOME FOR THE WHOLE STORY</span>
          <h2>
            More than a collection.
            <br />
            <em>A living memory.</em>
          </h2>
        </div>
        <p>
          Follow the people. Trace the turning points. Return to a favorite
          scene. Every detail has its place, and every universe has room to
          grow.
        </p>
        <div className="archive-note-links">
          <Link href="/search?kind=Character">
            <Users size={18} /> Meet the characters <ArrowUpRight size={15} />
          </Link>
          <Link href="/search?kind=Scene">
            <BookOpen size={18} /> Open a story <ArrowUpRight size={15} />
          </Link>
          <Link href="/universes">
            <GitBranch size={18} /> Explore the continuities{" "}
            <ArrowUpRight size={15} />
          </Link>
        </div>
      </section>
      <div className="home-colophon">
        <span className="eyebrow">CAREFULLY KEPT. ALWAYS UNFOLDING.</span>
        <span className="small-star">✳</span>
      </div>
    </div>
  );
}
