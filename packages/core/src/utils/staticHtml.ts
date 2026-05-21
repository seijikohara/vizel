/**
 * Static HTML rendering for Vizel content.
 *
 * `generateVizelStaticHtml` produces server-renderable HTML from a
 * Markdown source. It is the building block for Section 12 Mode 1 —
 * the read-only `VizelStaticView` component that consumers embed in
 * blog pages, CMS view pages, and documentation sites where the
 * editor itself never mounts.
 *
 * The function is callable on both the browser and Node / edge
 * runtimes:
 *
 * - On the browser it uses the native `document` straight away.
 * - On Node it dynamically imports `linkedom` and installs a minimal
 *   DOM shim on `globalThis` so the Tiptap / ProseMirror DOM
 *   serializers can run without a real browser. `linkedom` is declared
 *   as an optional peer dependency; when it is missing the function
 *   throws `VizelError("SSR_DOM_SHIM_MISSING")` so consumers learn
 *   exactly what to install.
 *
 * Diagram-style nodes (`mermaid`, `graphviz`) are not rendered on the
 * server — the source content survives as a fenced code block with
 * the language tag, matching the v2.0 spec. Client-side hydration
 * later transforms those code blocks into live diagrams.
 */

import { generateHTML, generateJSON } from "@tiptap/core";
import MarkdownIt from "markdown-it";
import { createVizelExtensions } from "../extensions/base.ts";
import {
  vizelCommonMarkFlavor,
  vizelDocusaurusFlavor,
  vizelGfmFlavor,
  vizelObsidianFlavor,
  vizelPandocFlavor,
} from "../markdown/flavors/index.ts";
import type { VizelMarkdownFlavor, VizelMarkdownItInstance } from "../markdown/types.ts";
import type { VizelFeatureOptions } from "../types.ts";
import { vizelDefaultFeatures } from "./default-features.ts";
import { createVizelError } from "./errorHandling.ts";

/**
 * Options accepted by {@link generateVizelStaticHtml}.
 */
export interface VizelGenerateStaticHtmlOptions {
  /** Markdown source to render. Required. */
  readonly markdown: string;
  /** Flavor controlling parser tuning. Required (no implicit default). */
  readonly flavor: VizelMarkdownFlavor;
  /** Feature opt-ins; falls back to {@link vizelDefaultFeatures} when omitted. */
  readonly features?: VizelFeatureOptions;
}

/**
 * Render Markdown into a static, hydration-friendly HTML string.
 *
 * The result is wrapped in `<div class="vizel-static"
 * data-vizel-static="true">…</div>` so consumers can target the
 * server-rendered tree from CSS or hydration logic without
 * conflating it with the editable surface.
 *
 * @example Basic usage
 * ```ts
 * const html = await generateVizelStaticHtml({
 *   markdown: "# Hello\n\nWorld.",
 *   flavor: vizelGfmFlavor,
 * });
 * ```
 *
 * @throws {@link VizelError} with code `SSR_DOM_SHIM_MISSING` when the
 *   function runs on Node and the optional `linkedom` peer dependency
 *   is not installed.
 */
export async function generateVizelStaticHtml(
  options: VizelGenerateStaticHtmlOptions
): Promise<string> {
  const { markdown, flavor, features } = options;

  // Install the DOM shim before touching Tiptap or markdown-it.
  // The shim is a no-op on the browser; on Node it loads linkedom and
  // exposes `document`, `window`, and DOMParser on globalThis.
  await ensureVizelSsrDomShim();

  const resolvedFeatures = features ?? vizelDefaultFeatures();
  const extensions = await createVizelExtensions({
    features: resolvedFeatures,
    flavor,
  });

  const md = buildVizelStaticMarkdownIt(flavor);
  const renderedHTML = md.render(markdown);
  const json = generateJSON(`<div>${renderedHTML}</div>`, extensions);
  const innerHTML = generateHTML(json, extensions);

  return `<div class="vizel-static" data-vizel-static="true">${innerHTML}</div>`;
}

/**
 * Build a markdown-it instance configured with every built-in
 * flavor's plugins plus the consumer's selected flavor plugins.
 *
 * Parses are intentionally tolerant — the parser recognizes syntax
 * from any built-in flavor so static rendering matches what the
 * editable surface would parse. The serializer side (which would
 * narrow output to the chosen flavor) is unused here because the
 * function returns HTML, not Markdown.
 */
function buildVizelStaticMarkdownIt(selected: VizelMarkdownFlavor): MarkdownIt {
  const md = new MarkdownIt({
    html: true,
    linkify: true,
    breaks: false,
  });

  const allFlavors: readonly VizelMarkdownFlavor[] = [
    vizelCommonMarkFlavor,
    vizelGfmFlavor,
    vizelObsidianFlavor,
    vizelDocusaurusFlavor,
    vizelPandocFlavor,
    selected,
  ];
  // Deduplicate by name so applying the selected flavor on top of
  // its built-in twin does not double-register identical plugins.
  const applied = new Set<string>();
  for (const candidate of allFlavors) {
    if (applied.has(candidate.name)) continue;
    applied.add(candidate.name);
    const plugins = candidate.markdownItPlugins ?? [];
    for (const plugin of plugins) {
      plugin(md as unknown as VizelMarkdownItInstance);
    }
  }

  return md;
}

/**
 * Globals that the Tiptap / ProseMirror DOM serializers reach for. The
 * shim copies these from linkedom onto `globalThis` so server-side
 * rendering does not need a global `document` patch elsewhere.
 */
const VIZEL_SSR_DOM_GLOBALS: readonly string[] = [
  "Document",
  "DocumentFragment",
  "DOMParser",
  "Element",
  "Event",
  "CustomEvent",
  "HTMLDivElement",
  "HTMLDocument",
  "HTMLElement",
  "Node",
  "NodeList",
  "Text",
];

/**
 * Sentinel guarding against double initialization. The shim is
 * idempotent — calling it twice from concurrent renders only installs
 * the globals once.
 */
const ssrDomShimState: { installed: boolean } = { installed: false };

/**
 * Install the DOM shim required for SSR rendering when no native DOM
 * exists. On the browser the function is a no-op.
 */
async function ensureVizelSsrDomShim(): Promise<void> {
  if (typeof document !== "undefined" && typeof window !== "undefined") {
    return;
  }
  if (ssrDomShimState.installed) {
    return;
  }

  const linkedom = await loadVizelLinkedom();
  const { window: shimWindow, document: shimDocument } = linkedom.parseHTML(
    "<!doctype html><html><head></head><body></body></html>"
  );

  // Tiptap's `elementFromString` wraps its input in `<body>...</body>`
  // and reads `.body`. linkedom's DOMParser, on a "text/html" parse,
  // hoists the inner `<body>` out of the outer one and leaves `.body`
  // empty. The custom DOMParser strips the outermost `<body>` wrapper
  // before parsing so the result satisfies Tiptap's contract.
  const ShimDomParser = createVizelShimDomParser(linkedom);

  // ProseMirror calls `document.implementation.createHTMLDocument()`
  // from `getHTMLFromFragment`. linkedom 0.18 does not expose
  // `implementation`, so polyfill the single method the call site uses.
  if (!shimDocument.implementation) {
    Object.defineProperty(shimDocument, "implementation", {
      configurable: true,
      value: {
        createHTMLDocument(title?: string): Document {
          const titleMarkup = title ? `<title>${title}</title>` : "";
          return linkedom.parseHTML(
            `<!doctype html><html><head>${titleMarkup}</head><body></body></html>`
          ).document as unknown as Document;
        },
      },
    });
  }

  // linkedom returns a Proxy-backed window whose properties cannot be
  // reassigned (`window.DOMParser = ...` silently fails). Wrap the
  // window in a Proxy that returns the shim DOMParser while forwarding
  // every other property read to the real linkedom window. Tiptap's
  // `elementFromString` resolves `window.DOMParser` through this proxy.
  const windowProxy = new Proxy(shimWindow as object, {
    get(target, prop, receiver): unknown {
      if (prop === "DOMParser") return ShimDomParser;
      return Reflect.get(target, prop, receiver);
    },
  });

  const globals = globalThis as unknown as Record<string, unknown>;
  globals.window = windowProxy;
  globals.document = shimDocument;
  globals.DOMParser = ShimDomParser;
  for (const key of VIZEL_SSR_DOM_GLOBALS) {
    const value = (shimWindow as unknown as Record<string, unknown>)[key];
    if (value !== undefined && globals[key] === undefined) {
      globals[key] = value;
    }
  }

  ssrDomShimState.installed = true;
}

/**
 * Loose typing for the linkedom `window` / `document` returned by
 * `parseHTML`. The shim only reads a handful of fields; declaring the
 * full DOM surface would couple Vizel to a major linkedom type
 * version, so we treat each as `Record<string, unknown>` plus the
 * narrow properties we touch directly.
 */
interface VizelLinkedomWindow extends Record<string, unknown> {
  DOMParser?: unknown;
}

interface VizelLinkedomDocument {
  implementation?: unknown;
}

/**
 * Shape of the linkedom subset {@link ensureVizelSsrDomShim} consumes.
 */
interface VizelLinkedomModule {
  parseHTML(html: string): { window: VizelLinkedomWindow; document: VizelLinkedomDocument };
}

async function loadVizelLinkedom(): Promise<VizelLinkedomModule> {
  try {
    const mod = (await import("linkedom")) as unknown as VizelLinkedomModule;
    if (typeof mod.parseHTML !== "function") {
      throw createVizelError(
        "SSR_DOM_SHIM_MISSING",
        "The installed `linkedom` package does not expose a `parseHTML` export. Upgrade to linkedom ^0.18.0 or later.",
        { context: { dependency: "linkedom" } }
      );
    }
    return mod;
  } catch (cause) {
    throw createVizelError(
      "SSR_DOM_SHIM_MISSING",
      "generateVizelStaticHtml requires the optional `linkedom` peer dependency on Node. Install it with `pnpm add linkedom` (or `npm install linkedom`) in the host application.",
      { context: { dependency: "linkedom" }, cause }
    );
  }
}

/**
 * Build a `DOMParser`-shaped class backed by linkedom's `parseHTML`.
 *
 * The shim trims the outermost `<body>...</body>` wrapper that Tiptap
 * adds before delegating to linkedom, so the returned document's
 * `.body` element contains the original content unchanged.
 */
function createVizelShimDomParser(linkedom: VizelLinkedomModule): {
  new (): { parseFromString(html: string, type: string): unknown };
} {
  return class {
    parseFromString(html: string, _type: string): unknown {
      const inner = String(html).replace(/^<body>([\s\S]*)<\/body>$/i, "$1");
      return linkedom.parseHTML(`<!doctype html><html><body>${inner}</body></html>`).document;
    }
  };
}
