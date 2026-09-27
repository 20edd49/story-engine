"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Search,
  X,
  ArrowUpRight,
  Library,
  ChevronDown,
  Menu,
} from "lucide-react";
import type { SearchResult, Universe } from "@/lib/domain";
import { editorialTheme } from "@/lib/editorial-theme";
export function Shell({
  universes,
  index,
}: {
  universes: Universe[];
  index: SearchResult[];
}) {
  const path = usePathname();
  const router = useRouter();
  const current = universes.find((u) => path.split("/")[1] === u.slug);
  const currentId = current?.id;
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState("");
  const [active, setActive] = useState(0);
  const [mobile, setMobile] = useState(false);
  const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  const results = index
    .filter(
      (r) =>
        (!scope || r.universeId === scope) &&
        terms.every((t) =>
          `${r.title} ${r.description} ${r.universeName}`
            .toLowerCase()
            .includes(t),
        ),
    )
    .slice(0, 30);
  function open() {
    setQuery("");
    setScope(current?.id || "");
    setActive(0);
    dialog.current?.showModal();
    input.current?.focus();
  }
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        setQuery("");
        setScope(currentId || "");
        setActive(0);
        dialog.current?.showModal();
        input.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [currentId]);
  useEffect(() => {
    document
      .getElementById(`command-result-${active}`)
      ?.scrollIntoView({ block: "nearest" });
  }, [active]);
  const close = () => {
    dialog.current?.close();
    setMobile(false);
  };
  return (
    <div className="archive-shell" style={current ? editorialTheme(current.theme) : undefined}>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <header className="global-header">
        <Link href="/" className="wordmark" onClick={close}>
          <Library size={23} strokeWidth={1.3} />
          <span>
            THE ARCHIVES
            <span className="wordmark-sub">A COLLECTION OF WORLDS</span>
          </span>
        </Link>
        <nav className="global-links" aria-label="Global navigation">
          <Link href="/" aria-current={path === "/" ? "page" : undefined}>
            The archive
          </Link>
          <Link
            href="/universes"
            aria-current={path === "/universes" ? "page" : undefined}
          >
            Universes
          </Link>
          <Link
            href="/search"
            aria-current={path === "/search" ? "page" : undefined}
          >
            Discover
          </Link>
        </nav>
        <div className="header-actions">
          <span className="private-label">
            <span />
            PERSONAL COLLECTION
          </span>
          <button
            className="search-trigger"
            onClick={open}
            aria-label="Search the archive"
          >
            <Search size={17} />
            <span>Search</span>
            <kbd>⌘ K</kbd>
          </button>
          <button
            className="mobile-toggle icon-button"
            aria-label="Toggle navigation"
            aria-expanded={mobile}
            onClick={() => setMobile(!mobile)}
          >
            {mobile ? <X /> : <Menu />}
          </button>
        </div>
      </header>
      {mobile && (
        <nav className="mobile-menu" aria-label="Mobile global navigation">
          <Link onClick={close} href="/">
            The archive
          </Link>
          <Link onClick={close} href="/universes">
            All universes
          </Link>
          <Link onClick={close} href="/search">
            Search the archive
          </Link>
        </nav>
      )}
      {current && (
        <div className="universe-navigation">
          <div className="universe-nav-top">
            <label className="switcher">
              <span className="sr-only">Switch universe</span>
              <select
                aria-label="Switch universe"
                value={current.slug}
                onChange={(e) => {
                  router.push(`/${e.target.value}`);
                }}
              >
                {universes.map((u) => (
                  <option key={u.id} value={u.slug}>
                    {u.shortName}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} />
            </label>
            <Link className="text-link" href={`/search?universe=${current.id}`}>
              Search this universe <Search size={14} />
            </Link>
          </div>
          <nav aria-label="Universe navigation">
            {current.navigation.map((n) => {
              const href = `/${current.slug}${n.module === "overview" ? "" : `/${n.module}`}`;
              return (
                <Link
                  key={n.module}
                  href={href}
                  aria-current={
                    (
                      n.module === "overview"
                        ? path === href
                        : path.startsWith(href)
                    )
                      ? "page"
                      : undefined
                  }
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
      <dialog
        ref={dialog}
        aria-label="Search the archives"
        className="command-dialog"
        onClick={(e) => {
          if (e.target === e.currentTarget) dialog.current?.close();
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((a) => Math.min(a + 1, results.length - 1));
          }
          if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => Math.max(0, a - 1));
          }
          if (e.key === "Enter" && e.target === input.current) {
            e.preventDefault();
            document.getElementById(`command-result-${active}`)?.click();
          }
        }}
      >
        <div className="command-top">
          <Search size={21} />
          <input
            ref={input}
            aria-label="Search all archive records"
            placeholder="Find a person, a place, a moment…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
          />
          <button
            className="icon-button"
            onClick={close}
            aria-label="Close search"
          >
            <X size={20} />
          </button>
        </div>
        <div className="command-controls">
          <label>
            Search in{" "}
            <select
              value={scope}
              onChange={(e) => {
                setScope(e.target.value);
                setActive(0);
              }}
            >
              <option value="">All universes</option>
              {universes.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.shortName}
                </option>
              ))}
            </select>
          </label>
          <small>↑ ↓ navigate · Enter open · Esc close</small>
        </div>
        <div className="command-results">
          {results.length ? (
            results.map((r, i) => (
              <Link
                id={`command-result-${i}`}
                className={active === i ? "command-active" : ""}
                key={r.id}
                href={r.href}
                onClick={close}
              >
                <div>
                  <small>
                    {r.universeName} · {r.kind}
                    {r.continuityLabel ? ` · ${r.continuityLabel}` : ""}
                    {r.placeholder ? " · Placeholder" : ""}
                  </small>
                  <strong>{r.title}</strong>
                </div>
                <ArrowUpRight size={18} />
              </Link>
            ))
          ) : (
            <p className="no-results">
              No matching records. Try another name or universe.
            </p>
          )}
        </div>
        <div className="command-footer">
          THE ARCHIVES <span>Every story, in its place.</span>
        </div>
      </dialog>
    </div>
  );
}
