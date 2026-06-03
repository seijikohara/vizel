/**
 * Server-side rendering utilities.
 *
 * The helpers in this module are intentionally DOM-free so they remain
 * callable on Node, edge runtimes, and the browser alike. Anything
 * that depends on `document` / `window` lives in `controllers/` or the
 * framework packages, never here.
 */

/**
 * Options for {@link vizelThemeInitScript}.
 */
export interface VizelThemeInitScriptOptions {
  /**
   * Theme to fall back to when nothing is stored.
   * `"system"` resolves to `prefers-color-scheme: dark` at runtime.
   * @default "system"
   */
  readonly defaultTheme?: "light" | "dark" | "system";
  /**
   * `localStorage` key holding the persisted theme value.
   * @default "vizel-theme"
   */
  readonly storageKey?: string;
}

/**
 * Build a synchronous theme-initialization script for embedding in
 * the document `<head>`.
 *
 * The script reads the stored theme (falling back to the configured
 * default) and sets `data-vizel-theme` on `document.documentElement`
 * before the page paints. Inserting the result inline in a
 * server-rendered `<head>` eliminates the dark-mode flash that
 * otherwise appears on the first paint when the client mounts with
 * the wrong theme.
 *
 * The script touches only `document.documentElement` — Vizel's other
 * code stays scoped to the editor wrapper, per the theme policy. The
 * output is a self-contained IIFE that the framework adapter places
 * inside a `<script>` tag using the framework's idiomatic inline-script
 * mechanism.
 *
 * The script body is fully synthesized from typed options inside this
 * helper and never embeds consumer-supplied raw markup, so it carries
 * no XSS surface.
 */
export function vizelThemeInitScript(options: VizelThemeInitScriptOptions = {}): string {
  const defaultTheme = options.defaultTheme ?? "system";
  const storageKey = options.storageKey ?? "vizel-theme";
  const safeKey = JSON.stringify(storageKey);
  const safeDefault = JSON.stringify(defaultTheme);
  return `(function(){try{var k=${safeKey};var d=${safeDefault};var s=window.localStorage&&window.localStorage.getItem(k);var t=s||d;if(t==='system'){t=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.setAttribute('data-vizel-theme',t);}catch(e){}})();`;
}
