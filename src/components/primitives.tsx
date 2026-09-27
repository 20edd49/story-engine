import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, BookOpen, ArrowRight } from "lucide-react";
import type { Character, Continuity, Scene, Universe } from "@/lib/domain";
export function Artwork({
  universe,
  small = false,
}: {
  universe: Universe;
  small?: boolean;
}) {
  return (
    <div
      aria-hidden="true"
      className={`artwork ${universe.theme.texture} ${small ? "artwork-small" : ""}`}
    >
      <div className="art-sun" />
      <div className="art-structure">
        <i />
        <i />
        <i />
        <i />
        <i />
      </div>
      <div className="art-horizon" />
      <span className="art-caption">
        {universe.theme.texture === "arches"
          ? "A STUDY IN BELONGING"
          : "A STUDY IN LEGACY"}
      </span>
    </div>
  );
}
export function Badge({
  continuity,
  placeholder,
}: {
  continuity?: Continuity;
  placeholder?: boolean;
}) {
  return (
    <span
      className={`badge ${placeholder || continuity?.type !== "main-canon" ? "badge-alt" : ""}`}
    >
      <span />
      {placeholder
        ? "Placeholder · not canon"
        : continuity?.badgeLabel || "Archive record"}
    </span>
  );
}
export function SectionHeading({
  eyebrow,
  title,
  href,
  label = "Explore all",
}: {
  eyebrow?: string;
  title: string;
  href?: string;
  label?: string;
}) {
  return (
    <div className="section-heading">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2>{title}</h2>
      </div>
      {href && (
        <Link className="text-link" href={href}>
          {label}
          <ArrowUpRight size={16} />
        </Link>
      )}
    </div>
  );
}
export function EmptyState({
  title = "A place for what comes next.",
  description = "No records have been archived here yet. New material will appear once the story details are supplied.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="empty-state">
      <BookOpen size={26} strokeWidth={1} />
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}
export function Portrait({ character }: { character: Character }) {
  return (
    <div className="portrait">
      {character.portrait ? (
        <Image
          src={character.portrait}
          alt={character.name}
          fill
          sizes="(max-width: 640px) 90vw, 25vw"
        />
      ) : (
        <>
          <div className="portrait-orbit" />
          <span>
            {character.name
              .split(" ")
              .slice(0, 2)
              .map((n) => n[0])
              .join("")}
          </span>
          <small>PORTRAIT TO COME</small>
        </>
      )}
    </div>
  );
}
export function CharacterCard({
  character,
  universe,
}: {
  character: Character;
  universe: Universe;
}) {
  return (
    <Link
      href={`/${universe.slug}/characters/${character.slug}`}
      className="character-card"
    >
      <Portrait character={character} />
      <div className="card-title">
        <h3>{character.name}</h3>
        <ArrowUpRight size={17} />
      </div>
      <p className="eyebrow">{character.role || "Character record"}</p>
      <p className="card-description">{character.description}</p>
    </Link>
  );
}
export function SceneCard({
  scene,
  universe,
  continuity,
}: {
  scene: Scene;
  universe: Universe;
  continuity?: Continuity;
}) {
  return (
    <Link
      className="scene-card"
      href={`/${universe.slug}/scenes/${scene.slug}`}
    >
      <div className="scene-card-top">
        <BookOpen size={22} strokeWidth={1} />
        <Badge continuity={continuity} placeholder={scene.placeholder} />
      </div>
      <p className="eyebrow">
        {scene.dateDisplay} · {continuity?.name}
      </p>
      <h3>{scene.title}</h3>
      <p>{scene.summary}</p>
      <div className="text-link">
        Open the reader <ArrowRight size={16} />
      </div>
    </Link>
  );
}
export function RecordCard({
  href,
  kicker,
  title,
  description,
}: {
  href: string;
  kicker: string;
  title: string;
  description: string;
}) {
  return (
    <Link className="record-card" href={href}>
      <p className="eyebrow">{kicker}</p>
      <h3>
        {title}
        <ArrowUpRight size={18} />
      </h3>
      <p>{description}</p>
    </Link>
  );
}
export function PageIntro({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="page-intro">
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <p className="intro-description">{description}</p>
      {children}
    </header>
  );
}
