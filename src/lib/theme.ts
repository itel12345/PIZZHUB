// src/lib/theme.ts
//
// There was no existing theme system in this codebase to reuse —
// globals.css defined exactly one hardcoded dark palette in :root, with
// no light variant, no data-theme attribute, and nothing persisting a
// preference anywhere. This file (plus the `[data-theme="light"]`
// block added to globals.css and components/theme/) is that system,
// built from scratch but deliberately minimal: it reuses the app's
// existing CSS-custom-property tokens as the actual mechanism (every
// component already reads var(--color-*) exclusively — see the audit
// notes — so redefining those tokens under an attribute selector is
// enough to reskin the whole app; no component needed to change).
//
// Persisted in localStorage, not on User in the database: this is a
// per-device display preference, not account data — nothing else in
// the app needs to know it, and it costs nothing to lose if storage is
// cleared. Same reasoning AuthContext already uses for its own
// localStorage-only state.

export type Theme = "light" | "dark";

const THEME_STORAGE_KEY = "pizzhub-theme";

export function getStoredTheme(): Theme | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(THEME_STORAGE_KEY);
    return value === "light" || value === "dark" ? value : null;
  } catch {
    return null;
  }
}

export function storeTheme(theme: Theme): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Ignore storage errors (private browsing, quota, etc.) — the
    // theme still applies for this page load via the DOM attribute,
    // it just won't be remembered next visit.
  }
}

/** Sets the DOM attribute globals.css keys its light-theme overrides
 * off of. The one function that actually changes what's on screen —
 * everything else here is just persistence bookkeeping. */
export function applyTheme(theme: Theme): void {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = theme;
}

/** Inlined into <head> in layout.tsx and run synchronously before
 * first paint, so a returning visitor who chose "light" never sees a
 * flash of the default dark theme while React hydrates. Returned as a
 * string (not a real function) because it has to be serialized into a
 * <script> tag — this is the one place in the app a raw inline script
 * is the correct tool, for exactly the reason next-themes and every
 * other no-flash theme loader uses the same technique: anything that
 * waits for React/useEffect to run necessarily paints once with the
 * wrong theme first. */
export function noFlashThemeScript(): string {
  return `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t==="light"||t==="dark"){document.documentElement.dataset.theme=t;}}catch(e){}})();`;
}
