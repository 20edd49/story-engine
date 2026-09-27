"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { Universe } from "@/lib/domain";
import "./explorer.css";

type Variables = CSSProperties & Record<`--${string}`, string | number>;

function StarField() {
  return <div className="explorer-stars" aria-hidden="true">{Array.from({ length: 26 }, (_, i) =>
    <i key={i} style={{ left: `${(i * 37 + 7) % 100}%`, top: `${(i * 61 + 13) % 100}%`, opacity: 0.15 + (i % 4) * 0.13, width: i % 7 === 0 ? 2 : 1, height: i % 7 === 0 ? 2 : 1 }} />
  )}</div>;
}

function UniverseFocusPanel({ universe, selected, onEnter }: { universe: Universe; selected: boolean; onEnter: () => void }) {
  return <div className="universe-focus-panel">
    <h2 className="explorer-title">{universe.shortName}</h2>
    <div className="explorer-details" aria-hidden={!selected} inert={!selected}>
      <p>{universe.tagline}</p>
      <Link href={`/${universe.slug}`} className="explorer-enter" aria-label={`ENTER ${universe.shortName}`} onNavigate={(event) => { event.preventDefault(); onEnter(); }}>ENTER</Link>
    </div>
  </div>;
}

function CelestialUniverse({ universe, index, total, selected, entering, onSelect, onEnter }: {
  universe: Universe; index: number; total: number; selected: boolean; entering: boolean;
  onSelect: () => void; onEnter: () => void;
}) {
  const config = universe.explorer ?? { x: (index + 1) * 100 / (total + 1), y: 48, depth: 1, scale: 1, variant: "warm-orbital", orbitCount: 3, bodyCount: 3 };
  return <div className={`celestial-placement ${config.variant}`} data-universe={universe.id} data-selected={selected} data-entering={entering} style={{
    "--x": `${config.x}%`, "--y": `${config.y}%`, "--depth": config.depth, "--scale": config.scale,
    "--celestial-accent": universe.theme.accent, "--celestial-light": universe.theme.accentSecondary,
    "--celestial-ivory": universe.theme.backgroundTone,
  } as Variables}>
    <button type="button" className="celestial-universe"
      aria-label={`Select ${universe.shortName}`}
      aria-pressed={selected}
      onClick={onSelect}>
      <span className="celestial-art" aria-hidden="true">
        <span className="celestial-atmosphere" />
        <svg className="celestial-orbits" viewBox="0 0 400 300" fill="none">
          {Array.from({ length: config.orbitCount }, (_, i) => <ellipse key={i} cx="200" cy="150" rx={91 + i * 43} ry={31 + i * 18} transform={`rotate(${-28 + i * (config.variant === "warm-orbital" ? 19 : 4)} 200 150)`} />)}
        </svg>
        <span className="celestial-core" />
        {Array.from({ length: config.bodyCount }, (_, i) => {
          const angle = i * 2.4 + 0.5;
          return <span className="celestial-body" key={i} style={{ left: `${50 + Math.cos(angle) * (29 + i * 2)}%`, top: `${50 + Math.sin(angle) * (19 + i * 2)}%`, "--body-size": `${i % 2 ? 7 : 11}px`, animationDelay: `${-i * 4}s` } as Variables} />;
        })}
      </span>
    </button>
    <UniverseFocusPanel universe={universe} selected={selected} onEnter={onEnter} />
  </div>;
}

export function UniverseExplorer({ universes }: { universes: Universe[] }) {
  const router = useRouter();
  const scene = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recovery = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animations = useRef<Animation[]>([]);
  const veil = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [entering, setEntering] = useState<string | null>(null);
  useEffect(() => {
    const element = scene.current;
    if (!element) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const fine = window.matchMedia("(pointer: fine)");
    let frame = 0;
    const restore = () => {
      if (timer.current) clearTimeout(timer.current);
      if (recovery.current) clearTimeout(recovery.current);
      timer.current = null;
      recovery.current = null;
      animations.current.forEach(animation => animation.cancel());
      animations.current = [];
      setEntering(null);
      setSelected(null);
    };
    // Also reset when React restores this route from its back/forward cache.
    const restoreFrame = requestAnimationFrame(restore);
    window.addEventListener("popstate", restore);
    window.addEventListener("pageshow", restore);
    const move = (event: PointerEvent) => {
      if (timer.current || motion.matches || !fine.matches) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        element.style.setProperty("--pointer-x", `${(event.clientX / window.innerWidth - 0.5) * 12}px`);
        element.style.setProperty("--pointer-y", `${(event.clientY / window.innerHeight - 0.5) * 10}px`);
      });
    };
    const reset = () => { if (timer.current) return; cancelAnimationFrame(frame); element.style.setProperty("--pointer-x", "0px"); element.style.setProperty("--pointer-y", "0px"); };
    const visibility = () => { element.dataset.paused = String(document.hidden); };
    element.addEventListener("pointermove", move);
    element.addEventListener("pointerleave", reset);
    motion.addEventListener("change", reset);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(restoreFrame);
      if (timer.current) clearTimeout(timer.current);
      if (recovery.current) clearTimeout(recovery.current);
      animations.current.forEach(animation => animation.cancel());
      window.removeEventListener("popstate", restore);
      window.removeEventListener("pageshow", restore);
      element.removeEventListener("pointermove", move);
      element.removeEventListener("pointerleave", reset);
      motion.removeEventListener("change", reset);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, []);
  function enter(universe: Universe) {
    if (timer.current) return;
    const element = scene.current;
    const art = element?.querySelector<HTMLElement>(`[data-universe="${universe.id}"] .celestial-art`);
    const core = art?.querySelector<HTMLElement>(".celestial-core");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const duration = reduced ? 150 : 820;
    if (art && core && veil.current) {
      const bounds = core.getBoundingClientRect();
      const x = bounds.x + bounds.width / 2;
      const y = bounds.y + bounds.height / 2;
      const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
      const start = getComputedStyle(art).transform;
      const scale = new DOMMatrix(start).a;
      veil.current.style.background = `radial-gradient(circle at ${x}px ${y}px, color-mix(in srgb, ${universe.theme.accent} 32%, #151716), #151716 85%)`;
      if (!reduced) {
        animations.current.push(art.animate([
          { transform: start, filter: "brightness(1.15)" },
          { transform: `scale(${scale * radius * 2.3 / bounds.width})`, filter: "brightness(.22)" },
        ], { duration, easing: "cubic-bezier(.65, 0, .35, 1)", fill: "forwards" }));
      }
      animations.current.push(veil.current.animate([
        { opacity: 0 }, { opacity: reduced ? 0.5 : 0, offset: reduced ? 0.3 : 0.25 },
        { opacity: 1 },
      ], { duration, fill: "forwards", easing: "ease-in" }));
    }
    setSelected(universe.id);
    setEntering(universe.id);
    router.prefetch(`/${universe.slug}`);
    timer.current = setTimeout(() => {
      router.push(`/${universe.slug}`);
      // If a navigation is interrupted, restore usable controls rather than trapping the viewport.
      recovery.current = setTimeout(() => {
        animations.current.forEach(animation => animation.cancel());
        animations.current = [];
        timer.current = null;
        setEntering(null);
      }, 2500);
    }, duration);
  }
  return <div ref={scene} className="universe-explorer" data-transitioning={Boolean(entering)}
    onClick={(event) => {
      if (!(event.target as HTMLElement).closest(".celestial-placement") && !entering) {
        setSelected(null);
        if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
      }
    }}
    onKeyDown={(event) => {
      if (event.key === "Escape" && !entering) {
        setSelected(null);
        const placement = (event.target as HTMLElement).closest(".celestial-placement");
        placement?.querySelector<HTMLButtonElement>("button")?.focus();
      }
    }}>
    <h1 className="sr-only">The Archive — Explore a universe</h1>
    <StarField />
    <div className="explorer-dust" aria-hidden="true" />
    <div className="explorer-systems" aria-label="Choose a universe">
      {universes.map((universe, index) => <CelestialUniverse key={universe.id} universe={universe} index={index} total={universes.length} selected={selected === universe.id} entering={entering === universe.id} onSelect={() => { if (!timer.current) setSelected(universe.id); }} onEnter={() => enter(universe)} />)}
    </div>
    <div ref={veil} className="explorer-entry-veil" aria-hidden="true" />
    <span className="sr-only" role="status">{entering ? `Entering ${universes.find(u => u.id === entering)?.shortName}` : ""}</span>
  </div>;
}
