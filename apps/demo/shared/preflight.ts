/**
 * Tailwind v4 Preflight excerpt for the demo's host-reset toggle.
 *
 * The demos otherwise run with no aggressive host reset, so a regression like
 * issue #666 (editor styles relying on User-Agent defaults a reset strips) is
 * invisible in them. Toggling this reset reproduces a Tailwind Preflight host:
 * it lives in `@layer base`, mirroring Preflight, so Vizel's unlayered CSS must
 * win for the editor to stay correct.
 */
export const DEMO_PREFLIGHT_CSS = `@layer base {
  *, ::after, ::before, ::backdrop, ::file-selector-button {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    border: 0 solid;
  }
  hr { height: 0; color: inherit; border-top-width: 1px; }
  h1, h2, h3, h4, h5, h6 { font-size: inherit; font-weight: inherit; }
  a { color: inherit; text-decoration: inherit; }
  ol, ul, menu { list-style: none; }
  table { text-indent: 0; border-color: inherit; border-collapse: collapse; }
  button, input, select, optgroup, textarea {
    font: inherit;
    color: inherit;
    background-color: transparent;
    border-radius: 0;
  }
  img, svg, video, canvas, audio, iframe, embed, object {
    display: block;
    vertical-align: middle;
  }
  img, video { max-width: 100%; height: auto; }
}`;

const DEMO_PREFLIGHT_STYLE_ID = "vizel-demo-preflight";

/**
 * Inject or remove the Preflight reset stylesheet. The injected `<style>`
 * element itself is the source of truth, so the helper stays idempotent without
 * module-level mutable state.
 */
export function applyDemoPreflight(enabled: boolean): void {
  if (typeof document === "undefined") return;
  const existing = document.getElementById(DEMO_PREFLIGHT_STYLE_ID);
  if (enabled && existing === null) {
    const style = document.createElement("style");
    style.id = DEMO_PREFLIGHT_STYLE_ID;
    style.textContent = DEMO_PREFLIGHT_CSS;
    document.head.appendChild(style);
    return;
  }
  if (!enabled && existing !== null) {
    existing.remove();
  }
}
