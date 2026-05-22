import type { VizelMinimapSpec } from "../builders/minimap.ts";

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
 * Every numeric field on the spec lives in the same coordinate
 * system (editor DOM pixels). The renderer projects each value to
 * canvas Y with the same formula — `pixel / contentHeight *
 * canvasHeight` — so the block rectangles and the viewport overlay
 * stay aligned by construction.
 *
 * SSR / degraded-environment safe: bails when `canvas` is null /
 * undefined or `getContext` is unavailable, never throws.
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

  if (spec.contentHeight <= 0) return;

  const scale = height / spec.contentHeight;

  for (const block of spec.blocks) {
    // Clamp depth to >= 1 to guarantee a non-zero rectangle width.
    const safeDepth = Math.max(1, block.depth);
    const rectWidth = Math.max(2, Math.floor(width / safeDepth));
    const rectTop = Math.floor(block.offsetTop * scale);
    const rectHeight = Math.max(1, Math.floor(block.height * scale));

    ctx.fillStyle = isHeadingLike(block.type) ? headingColor : blockColor;
    ctx.fillRect(0, rectTop, rectWidth, rectHeight);
  }

  const { top: viewTop, bottom: viewBottom } = spec.viewport;
  if (viewBottom > viewTop) {
    const overlayTop = Math.max(0, Math.floor(viewTop * scale));
    const overlayBottom = Math.min(height, Math.ceil(viewBottom * scale));
    const overlayHeight = Math.max(2, overlayBottom - overlayTop);
    ctx.fillStyle = viewportColor;
    ctx.fillRect(0, overlayTop, width, overlayHeight);
  }
}
