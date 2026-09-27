import type { CSSProperties } from "react";
import type { UniverseTheme } from "./domain";

/** Lift the existing pigments for legibility on ink, without changing source themes. */
export function editorialTheme(theme: UniverseTheme): CSSProperties {
  return {
    "--accent": `color-mix(in srgb, ${theme.accent} 45%, ${theme.backgroundTone})`,
    "--accent-secondary": `color-mix(in srgb, ${theme.accentSecondary} 80%, ${theme.backgroundTone})`,
    "--universe-tone": `color-mix(in srgb, ${theme.accent} 12%, #171918)`,
  } as CSSProperties;
}
