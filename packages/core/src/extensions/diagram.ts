/**
 * Diagram Extension
 *
 * Provides diagram rendering support using Mermaid and GraphViz.
 * Supports flowcharts, sequence diagrams, class diagrams, DOT graphs, and more.
 *
 * ## Markdown Support (GitHub Compatible)
 *
 * - Mermaid: ```mermaid ... ```
 * - GraphViz: ```dot ... ``` or ```graphviz ... ```
 *
 * @see https://mermaid.js.org/
 * @see https://graphviz.org/
 * @see https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/creating-diagrams
 */

import { Graphviz } from "@hpcc-js/wasm-graphviz";
import type { JSONContent, MarkdownToken, MarkdownTokenizer } from "@tiptap/core";
import { mergeAttributes, Node } from "@tiptap/core";
import type { MermaidConfig } from "mermaid";
import mermaid from "mermaid";

/**
 * Supported diagram types
 */
export type DiagramType = "mermaid" | "graphviz";

/**
 * GraphViz layout engine options
 */
export type GraphvizEngine = "dot" | "neato" | "fdp" | "sfdp" | "twopi" | "circo";

/**
 * Options for the Diagram extension
 */
export interface VizelDiagramOptions {
  /**
   * Mermaid configuration options
   * @see https://mermaid.js.org/config/setup/modules/config.html
   */
  mermaidConfig?: MermaidConfig;
  /**
   * Default GraphViz layout engine
   * @default "dot"
   */
  graphvizEngine?: GraphvizEngine;
  /**
   * Default diagram type when creating new diagrams
   * @default "mermaid"
   */
  defaultType?: DiagramType;
  /**
   * Default diagram code for new diagrams (for mermaid)
   * @default "flowchart TD\n  A[Start] --> B[End]"
   */
  defaultCode?: string;
  /**
   * Default diagram code for new GraphViz diagrams
   * @default "digraph G {\n  A -> B\n}"
   */
  defaultGraphvizCode?: string;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    diagram: {
      /**
       * Insert a diagram block
       */
      insertDiagram: (options: { code: string; type?: DiagramType }) => ReturnType;
    };
  }
}

/**
 * Unique counter for generating diagram IDs
 */
let diagramIdCounter = 0;

/**
 * Generate a unique ID for diagram rendering
 */
function generateDiagramId(): string {
  return `vizel-diagram-${Date.now()}-${++diagramIdCounter}`;
}

/**
 * Markdown tokenizer for Mermaid diagrams: ```mermaid ... ```
 * GitHub Markdown compatible syntax
 */
const mermaidTokenizer: MarkdownTokenizer = {
  name: "diagram",
  start: "```mermaid",
  tokenize(src: string): MarkdownToken | undefined {
    // Match ```mermaid ... ``` (can span multiple lines)
    const match = src.match(/^```mermaid\n([\s\S]*?)```/);
    if (match?.[1] !== undefined) {
      return {
        type: "diagram",
        raw: match[0],
        code: match[1].trim(),
        diagramType: "mermaid",
      };
    }
    return undefined;
  },
};

/**
 * Markdown tokenizer for GraphViz diagrams: ```dot ... ``` or ```graphviz ... ```
 */
const graphvizTokenizer: MarkdownTokenizer = {
  name: "diagram-graphviz",
  start: "```dot",
  tokenize(src: string): MarkdownToken | undefined {
    // Match ```dot ... ``` or ```graphviz ... ```
    const dotMatch = src.match(/^```dot\n([\s\S]*?)```/);
    if (dotMatch?.[1] !== undefined) {
      return {
        type: "diagram",
        raw: dotMatch[0],
        code: dotMatch[1].trim(),
        diagramType: "graphviz",
      };
    }
    const graphvizMatch = src.match(/^```graphviz\n([\s\S]*?)```/);
    if (graphvizMatch?.[1] !== undefined) {
      return {
        type: "diagram",
        raw: graphvizMatch[0],
        code: graphvizMatch[1].trim(),
        diagramType: "graphviz",
      };
    }
    return undefined;
  },
};

/**
 * Initialize Mermaid with the provided configuration
 */
let mermaidInitialized = false;

function initializeMermaid(config?: MermaidConfig): void {
  if (mermaidInitialized) return;

  mermaid.initialize({
    startOnLoad: false,
    securityLevel: "loose",
    theme: "default",
    fontFamily: "var(--vizel-font-sans)",
    ...config,
  });

  mermaidInitialized = true;
}

/**
 * GraphViz instance (lazy loaded)
 */
let graphvizInstance: Graphviz | null = null;
let graphvizInitializing = false;
let graphvizInitPromise: Promise<Graphviz> | null = null;

/**
 * Initialize GraphViz WASM
 */
function initializeGraphviz(): Promise<Graphviz> {
  if (graphvizInstance) return Promise.resolve(graphvizInstance);

  if (graphvizInitializing && graphvizInitPromise) {
    return graphvizInitPromise;
  }

  graphvizInitializing = true;
  graphvizInitPromise = Graphviz.load().then((instance) => {
    graphvizInstance = instance;
    graphvizInitializing = false;
    return instance;
  });

  return graphvizInitPromise;
}

/**
 * Render a Mermaid diagram to SVG
 */
async function renderMermaid(code: string): Promise<{ svg: string; error: string | null }> {
  if (!code.trim()) {
    return { svg: "", error: null };
  }

  try {
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
async function renderGraphviz(
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
const DEFAULT_MERMAID_CODE = `flowchart TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Action 1]
    B -->|No| D[Action 2]
    C --> E[End]
    D --> E`;

/**
 * Default diagram code for new GraphViz diagrams
 */
const DEFAULT_GRAPHVIZ_CODE = `digraph G {
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
function getDiagramTypeName(type: DiagramType): string {
  switch (type) {
    case "mermaid":
      return "Mermaid";
    case "graphviz":
      return "GraphViz";
    default:
      return "Diagram";
  }
}

/**
 * Diagram extension for block diagrams
 */
export const Diagram = Node.create<VizelDiagramOptions>({
  name: "diagram",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addOptions() {
    return {
      mermaidConfig: {},
      graphvizEngine: "dot",
      defaultType: "mermaid",
      defaultCode: DEFAULT_MERMAID_CODE,
      defaultGraphvizCode: DEFAULT_GRAPHVIZ_CODE,
    };
  },

  addAttributes() {
    return {
      code: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-code") || "",
        renderHTML: (attributes) => ({
          "data-code": attributes.code,
        }),
      },
      type: {
        default: "mermaid",
        parseHTML: (element) =>
          (element.getAttribute("data-diagram-type") as DiagramType) || "mermaid",
        renderHTML: (attributes) => ({
          "data-diagram-type": attributes.type,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="diagram"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "diagram",
        "data-vizel-diagram": "",
        class: "vizel-diagram",
      }),
    ];
  },

  addNodeView() {
    return ({ node, getPos, editor }) => {
      // Initialize Mermaid on first use
      initializeMermaid(this.options.mermaidConfig);

      const dom = document.createElement("div");
      dom.classList.add("vizel-diagram");
      dom.setAttribute("data-type", "diagram");
      dom.setAttribute("data-vizel-diagram", "");
      dom.setAttribute("contenteditable", "false");

      // Type indicator
      const typeIndicator = document.createElement("div");
      typeIndicator.classList.add("vizel-diagram-type");
      typeIndicator.textContent = getDiagramTypeName(node.attrs.type);
      dom.appendChild(typeIndicator);

      // Render container
      const renderContainer = document.createElement("div");
      renderContainer.classList.add("vizel-diagram-render");
      dom.appendChild(renderContainer);

      // Edit container (hidden by default)
      const editContainer = document.createElement("div");
      editContainer.classList.add("vizel-diagram-edit-container");
      editContainer.style.display = "none";

      const editTextarea = document.createElement("textarea");
      editTextarea.classList.add("vizel-diagram-textarea");
      editTextarea.value = node.attrs.code;
      editTextarea.placeholder = "Enter diagram code...";
      editTextarea.spellcheck = false;
      editContainer.appendChild(editTextarea);

      // Preview container for live preview during editing
      const previewContainer = document.createElement("div");
      previewContainer.classList.add("vizel-diagram-preview");
      editContainer.appendChild(previewContainer);

      // Error container
      const errorContainer = document.createElement("div");
      errorContainer.classList.add("vizel-diagram-error");
      errorContainer.style.display = "none";
      editContainer.appendChild(errorContainer);

      dom.appendChild(editContainer);

      let isEditing = false;
      let currentCode = node.attrs.code;
      let currentType: DiagramType = node.attrs.type;

      const renderDiagram = async (
        code: string,
        type: DiagramType,
        container: HTMLElement
      ): Promise<void> => {
        if (!code.trim()) {
          container.innerHTML =
            '<div class="vizel-diagram-placeholder">Click to add diagram code</div>';
          return;
        }

        let result: { svg: string; error: string | null };

        if (type === "graphviz") {
          result = await renderGraphviz(code, this.options.graphvizEngine);
        } else {
          result = await renderMermaid(code);
        }

        if (result.error) {
          container.innerHTML = `<div class="vizel-diagram-error-display">${result.error}</div>`;
        } else {
          container.innerHTML = result.svg;
        }
      };

      const startEditing = () => {
        if (!editor.isEditable) return;
        isEditing = true;
        dom.classList.add("vizel-diagram-editing");
        renderContainer.style.display = "none";
        typeIndicator.style.display = "none";
        editContainer.style.display = "";
        editTextarea.value = currentCode;
        void renderDiagram(currentCode, currentType, previewContainer);
        editTextarea.focus();
      };

      const stopEditing = () => {
        if (!isEditing) return;
        isEditing = false;
        dom.classList.remove("vizel-diagram-editing");
        renderContainer.style.display = "";
        typeIndicator.style.display = "";
        editContainer.style.display = "none";

        const newCode = editTextarea.value.trim();
        const pos = typeof getPos === "function" ? getPos() : null;

        if (pos !== null && pos !== undefined) {
          if (newCode === "" && currentCode !== "") {
            // If user clears the code, delete the node
            editor
              .chain()
              .focus()
              .deleteRange({ from: pos, to: pos + node.nodeSize })
              .run();
          } else if (newCode !== currentCode) {
            currentCode = newCode;
            editor.chain().focus().updateAttributes("diagram", { code: newCode }).run();
          }
        }
      };

      // Event listeners
      const handleDomClick = (e: MouseEvent) => {
        if (!isEditing && e.target === dom) {
          e.preventDefault();
          e.stopPropagation();
          startEditing();
        }
      };

      const handleRenderClick = (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        startEditing();
      };

      const handleTextareaBlur = (e: FocusEvent) => {
        // Don't stop editing if clicking within the edit container
        const relatedTarget = e.relatedTarget;
        if (relatedTarget instanceof HTMLElement && editContainer.contains(relatedTarget)) {
          return;
        }
        stopEditing();
      };

      const handleTextareaKeydown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          e.preventDefault();
          editTextarea.value = currentCode;
          stopEditing();
        }
        // Allow Ctrl/Cmd + Enter to save
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          stopEditing();
        }
      };

      // Debounce preview updates
      let previewTimeout: ReturnType<typeof setTimeout> | null = null;
      const handleTextareaInput = () => {
        if (previewTimeout) {
          clearTimeout(previewTimeout);
        }
        previewTimeout = setTimeout(() => {
          void renderDiagram(editTextarea.value, currentType, previewContainer);
        }, 300);
      };

      dom.addEventListener("click", handleDomClick);
      renderContainer.addEventListener("click", handleRenderClick);
      editTextarea.addEventListener("blur", handleTextareaBlur);
      editTextarea.addEventListener("keydown", handleTextareaKeydown);
      editTextarea.addEventListener("input", handleTextareaInput);

      // Initial render
      void renderDiagram(currentCode, currentType, renderContainer);

      return {
        dom,
        update(updatedNode) {
          if (updatedNode.type.name !== "diagram") {
            return false;
          }
          const typeChanged = updatedNode.attrs.type !== currentType;
          const codeChanged = updatedNode.attrs.code !== currentCode;

          if (typeChanged) {
            currentType = updatedNode.attrs.type;
            typeIndicator.textContent = getDiagramTypeName(currentType);
          }

          if (!isEditing && (codeChanged || typeChanged)) {
            currentCode = updatedNode.attrs.code;
            void renderDiagram(currentCode, currentType, renderContainer);
          }

          return true;
        },
        selectNode() {
          dom.classList.add("vizel-diagram-selected");
        },
        deselectNode() {
          dom.classList.remove("vizel-diagram-selected");
        },
        destroy() {
          if (previewTimeout) {
            clearTimeout(previewTimeout);
          }
          dom.removeEventListener("click", handleDomClick);
          renderContainer.removeEventListener("click", handleRenderClick);
          editTextarea.removeEventListener("blur", handleTextareaBlur);
          editTextarea.removeEventListener("keydown", handleTextareaKeydown);
          editTextarea.removeEventListener("input", handleTextareaInput);
        },
      };
    };
  },

  addCommands() {
    return {
      insertDiagram:
        ({ code, type = "mermaid" }) =>
        ({ commands }) => {
          const defaultCode =
            type === "graphviz" ? this.options.defaultGraphvizCode : this.options.defaultCode;
          return commands.insertContent({
            type: this.name,
            attrs: {
              code: code || defaultCode,
              type,
            },
          });
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      Backspace: () => {
        const { selection } = this.editor.state;
        const { $anchor } = selection;
        const node = $anchor.node();

        // If we're in a diagram and it's selected, delete it
        if (node.type.name === "diagram") {
          return this.editor.commands.deleteSelection();
        }

        return false;
      },
    };
  },

  // Markdown support (GitHub compatible)
  // Note: Only mermaidTokenizer is used as the primary tokenizer.
  // GraphViz tokenizer is registered separately in the extension.
  markdownTokenizer: mermaidTokenizer,

  parseMarkdown(token: MarkdownToken): JSONContent {
    return {
      type: "diagram",
      attrs: {
        code: token.code || "",
        type: (token.diagramType as DiagramType) || "mermaid",
      },
    };
  },

  renderMarkdown(node: JSONContent): string {
    const code = node.attrs?.code || "";
    const type = node.attrs?.type || "mermaid";

    if (type === "mermaid") {
      return `\`\`\`mermaid\n${code}\n\`\`\``;
    }

    if (type === "graphviz") {
      return `\`\`\`dot\n${code}\n\`\`\``;
    }

    return `\`\`\`${type}\n${code}\n\`\`\``;
  },
});

/**
 * Create the Diagram extension
 *
 * @example Basic usage
 * ```ts
 * const extensions = [
 *   createDiagramExtension(),
 * ];
 * ```
 *
 * @example With custom Mermaid config
 * ```ts
 * const extensions = [
 *   createDiagramExtension({
 *     mermaidConfig: {
 *       theme: 'dark',
 *     },
 *   }),
 * ];
 * ```
 *
 * @example With custom GraphViz engine
 * ```ts
 * const extensions = [
 *   createDiagramExtension({
 *     graphvizEngine: 'neato',
 *   }),
 * ];
 * ```
 */
export function createDiagramExtension(
  options: VizelDiagramOptions = {}
): ReturnType<typeof Diagram.configure> {
  return Diagram.configure(options);
}

// Export for advanced usage
export { mermaid, graphvizTokenizer, mermaidTokenizer };
