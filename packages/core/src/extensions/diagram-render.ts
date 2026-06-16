/**
 * Diagram rendering for the diagram extension.
 *
 * Mermaid and GraphViz lazy loaders, SVG rendering, initialization, theme
 * resolution, and the diagram-type helpers. The only DOM access is the
 * read-only theme probe inside `resolveMermaidTheme`, executed lazily at
 * render time. The node spec in `diagram.ts` consumes the render functions.
 */

import type { Graphviz as GraphvizType } from "@hpcc-js/wasm-graphviz";
import type { MermaidConfig } from "mermaid";
import { createLazyLoader } from "../utils/lazy-import.ts";

/**
 * Lazy loader for mermaid (optional dependency)
 */
const loadMermaid = createLazyLoader("mermaid", async () => {
  const mod = await import("mermaid");
  return mod.default;
});

/**
 * Lazy loader for @hpcc-js/wasm-graphviz (optional dependency)
 */
const loadGraphvizModule = createLazyLoader("@hpcc-js/wasm-graphviz", async () => {
  const mod = await import("@hpcc-js/wasm-graphviz");
  return mod.Graphviz;
});

/**
 * Supported diagram types
 */
export type VizelDiagramType = "mermaid" | "graphviz";

/**
 * Valid diagram type values for type guard.
 */
const VALID_DIAGRAM_TYPES: readonly VizelDiagramType[] = ["mermaid", "graphviz"];

/**
 * Type guard to check if a value is a valid VizelDiagramType.
 */
export function isVizelDiagramType(value: unknown): value is VizelDiagramType {
  return typeof value === "string" && VALID_DIAGRAM_TYPES.includes(value as VizelDiagramType);
}

/**
 * GraphViz layout engine options
 */
export type GraphvizEngine = "dot" | "neato" | "fdp" | "sfdp" | "twopi" | "circo";

/**
 * Unique counter for generating diagram IDs
 */
const diagramIdState = { counter: 0 };

/**
 * Generate a unique ID for diagram rendering
 */
function generateDiagramId(): string {
  diagramIdState.counter += 1;
  return `vizel-diagram-${Date.now()}-${diagramIdState.counter}`;
}

/**
 * Resolve the Mermaid theme that matches the host page's current
 * `data-vizel-theme`. Mermaid's `"default"` theme assumes a light
 * canvas and renders nearly-invisible strokes against Vizel's dark
 * tokens, so the diagram extension re-initializes Mermaid whenever
 * the resolved theme changes.
 */
function resolveMermaidTheme(): "default" | "dark" {
  if (typeof document === "undefined") return "default";
  const attr = document.documentElement.getAttribute("data-vizel-theme");
  if (attr === "dark") return "dark";
  if (attr === "light") return "default";
  return typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "default";
}

/**
 * Initialize Mermaid with the provided configuration.
 *
 * Loads the mermaid module dynamically on first use and re-runs the
 * initializer whenever the host page flips between light and dark
 * themes (Mermaid's `initialize` is idempotent — repeated calls
 * overwrite the previous config, so the cost is bounded).
 */
export async function initializeMermaid(
  config: MermaidConfig | undefined,
  storage: { mermaidInitializedTheme: "default" | "dark" | null }
): Promise<void> {
  const resolvedTheme = config?.theme ?? resolveMermaidTheme();
  if (storage.mermaidInitializedTheme === resolvedTheme) return;

  const mermaid = await loadMermaid();
  mermaid.initialize({
    startOnLoad: false,
    theme: resolvedTheme,
    fontFamily: "var(--vizel-font-sans)",
    ...config,
    securityLevel: config?.securityLevel ?? "strict",
  });

  storage.mermaidInitializedTheme = resolvedTheme === "dark" ? "dark" : "default";
}

/**
 * Shared GraphViz WASM instance.
 * GraphViz WASM initialization is expensive, so the instance is shared across
 * all editor instances at the module level.
 */
const graphvizState: {
  instance: GraphvizType | null;
  initPromise: Promise<GraphvizType> | null;
} = { instance: null, initPromise: null };

/**
 * Initialize GraphViz WASM (shared singleton)
 */
function initializeGraphviz(): Promise<GraphvizType> {
  if (graphvizState.instance) return Promise.resolve(graphvizState.instance);
  if (graphvizState.initPromise) return graphvizState.initPromise;

  const promise = (async () => {
    const GraphvizClass = await loadGraphvizModule();
    const instance = await GraphvizClass.load();
    graphvizState.instance = instance;
    return instance;
  })();
  graphvizState.initPromise = promise;

  return promise;
}

/**
 * Render a Mermaid diagram to SVG.
 * Assumes mermaid has been initialized via initializeMermaid().
 */
export async function renderMermaid(code: string): Promise<{ svg: string; error: string | null }> {
  if (!code.trim()) {
    return { svg: "", error: null };
  }

  try {
    const mermaid = await loadMermaid();
    const id = generateDiagramId();
    const { svg } = await mermaid.render(id, code);
    return { svg, error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Invalid Mermaid syntax";
    return {
      svg: "",
      error: errorMessage,
    };
  }
}

/**
 * Render a GraphViz diagram to SVG
 */
export async function renderGraphviz(
  code: string,
  engine: GraphvizEngine = "dot"
): Promise<{ svg: string; error: string | null }> {
  if (!code.trim()) {
    return { svg: "", error: null };
  }

  try {
    const graphviz = await initializeGraphviz();
    const svg = graphviz.layout(code, "svg", engine);
    return { svg, error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Invalid DOT syntax";
    return {
      svg: "",
      error: errorMessage,
    };
  }
}

/**
 * Default diagram code for new Mermaid diagrams
 */
export const DEFAULT_MERMAID_CODE = `flowchart TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Action 1]
    B -->|No| D[Action 2]
    C --> E[End]
    D --> E`;

/**
 * Default diagram code for new GraphViz diagrams
 */
export const DEFAULT_GRAPHVIZ_CODE = `digraph G {
    rankdir=LR
    node [shape=box, style=rounded]
    
    A [label="Start"]
    B [label="Process"]
    C [label="End"]
    
    A -> B -> C
}`;

/**
 * Get display name for diagram type
 */
export function getDiagramTypeName(type: VizelDiagramType): string {
  switch (type) {
    case "mermaid":
      return "Mermaid";
    case "graphviz":
      return "GraphViz";
    default:
      return "Diagram";
  }
}
