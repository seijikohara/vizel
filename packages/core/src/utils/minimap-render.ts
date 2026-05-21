import type { VizelMinimapBlockSpec, VizelMinimapSpec } from "../builders/minimap.ts";

/**
 * Options accepted by {@link renderVizelMinimapToCanvas}.
 */
export interface VizelMinimapRenderOptions {
  /**
   * Theme hint that selects the fallback color palette when CSS
   * custom-property lookups fail (e.g. during initial paint or when the
   * canvas is detached from the live theme). Falls back to "light".
   */
  readonly theme?: "light" | "dark";
}

/** Fallback colors used when the corresponding CSS variable is missing. */
interface MinimapPalette {
  readonly background: string;
  readonly block: string;
  readonly heading: string;
  readonly viewport: string;
}

const LIGHT_FALLBACK: MinimapPalette = {
  background: "#f8fafc",
  block: "#cbd5e1",
  heading: "#475569",
  viewport: "rgba(99, 102, 241, 0.18)",
};

const DARK_FALLBACK: MinimapPalette = {
  background: "#0f172a",
  block: "#475569",
  heading: "#cbd5e1",
  viewport: "rgba(129, 140, 248, 0.22)",
};

/**
 * Resolve a CSS custom property value, returning `fallback` when the
 * lookup fails (no `getComputedStyle`, empty string, etc.).
 */
function resolveCssVar(canvas: HTMLCanvasElement, name: string, fallback: string): string {
  if (typeof window === "undefined" || typeof window.getComputedStyle !== "function") {
    return fallback;
  }
  try {
    const value = window.getComputedStyle(canvas).getPropertyValue(name);
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : fallback;
  } catch {
    return fallback;
  }
}

/** Classify a block type as "heading-like" so it gets the accent color. */
function isHeadingLike(type: string): boolean {
  return type === "heading" || type === "title";
}

/**
 * Render the minimap reduction of `spec` onto `canvas`.
 *
 * Each block becomes a rectangle whose vertical extent is proportional to
 * `block.approxHeight` (so the column fills the canvas), and whose
 * horizontal width is scaled by `1 / depth` to convey nesting. The viewport
 * range from the spec is overlaid as a translucent rectangle.
 *
 * SSR / degraded-environment safe: bails when `canvas` is null/undefined
 * or `getContext` is unavailable, never throws.
 */
export function renderVizelMinimapToCanvas(
  canvas: HTMLCanvasElement | null | undefined,
  spec: VizelMinimapSpec,
  options: VizelMinimapRenderOptions = {}
): void {
  if (!canvas) return;
  if (typeof canvas.getContext !== "function") return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const palette = options.theme === "dark" ? DARK_FALLBACK : LIGHT_FALLBACK;
  const background = resolveCssVar(canvas, "--vizel-minimap-background", palette.background);
  const blockColor = resolveCssVar(canvas, "--vizel-minimap-block", palette.block);
  const headingColor = resolveCssVar(canvas, "--vizel-minimap-heading", palette.heading);
  const viewportColor = resolveCssVar(canvas, "--vizel-minimap-viewport", palette.viewport);

  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, height);

  const blocks = spec.blocks;
  if (blocks.length === 0) return;

  // Sum of block heights drives the proportional rectangle layout. A
  // zero total (empty doc) renders only the background.
  const total = blocks.reduce(
    (sum: number, block: VizelMinimapBlockSpec) => sum + block.approxHeight,
    0
  );
  if (total <= 0) return;

  let yCursor = 0;
  for (const block of blocks) {
    const ratio = block.approxHeight / total;
    const rectHeight = Math.max(1, Math.floor(ratio * height));
    // Clamp depth to >= 1 to guarantee a non-zero rectangle width.
    const safeDepth = Math.max(1, block.depth);
    const rectWidth = Math.max(2, Math.floor(width / safeDepth));

    ctx.fillStyle = isHeadingLike(block.type) ? headingColor : blockColor;
    ctx.fillRect(0, yCursor, rectWidth, Math.max(1, rectHeight - 1));

    yCursor += rectHeight;
  }

  // Viewport overlay: translate the doc-level [viewport.top, viewport.bottom]
  // range into canvas Y coordinates by scaling against the cumulative height.
  const { top: viewTop, bottom: viewBottom } = spec.viewport;
  if (viewBottom > viewTop && total > 0) {
    const overlayTop = Math.max(0, Math.floor((viewTop / total) * height));
    const overlayBottom = Math.min(height, Math.ceil((viewBottom / total) * height));
    const overlayHeight = Math.max(2, overlayBottom - overlayTop);
    ctx.fillStyle = viewportColor;
    ctx.fillRect(0, overlayTop, width, overlayHeight);
  }
}
