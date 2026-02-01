/**
 * Mathematics Extension
 *
 * Provides LaTeX math expression support using KaTeX for rendering.
 * Supports both inline ($...$) and block ($$...$$) math expressions.
 *
 * ## Markdown Support (GitHub Compatible)
 *
 * - Inline math: `$E=mc^2$` renders as inline math
 * - Block math: `$$\int_0^1 x^2 dx$$` renders as display math
 *
 * @see https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/writing-mathematical-expressions
 */
import type { JSONContent, MarkdownToken, MarkdownTokenizer } from "@tiptap/core";
import { InputRule, mergeAttributes, Node } from "@tiptap/core";
import type { NodeType } from "@tiptap/pm/model";
import type katex from "katex";
import { createLazyLoader } from "../utils/lazy-import.ts";

/**
 * Lazy loader for katex (optional dependency)
 */
const loadKatex = createLazyLoader("katex", async () => {
  const mod = await import("katex");
  return mod.default;
});

/**
 * Options for the Mathematics extension
 */
export interface VizelMathematicsOptions {
  /**
   * KaTeX rendering options
   * @see https://katex.org/docs/options.html
   */
  katexOptions?: katex.KatexOptions;
  /**
   * Enable inline math input rules ($...$)
   * @default true
   */
  inlineInputRules?: boolean;
  /**
   * Enable block math input rules ($$...$$)
   * @default true
   */
  blockInputRules?: boolean;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    mathematics: {
      /**
       * Insert an inline math expression
       */
      insertMath: (options: { latex: string }) => ReturnType;
      /**
       * Insert a block math expression
       */
      insertMathBlock: (options: { latex: string }) => ReturnType;
    };
  }
}

/**
 * Render LaTeX to HTML using KaTeX.
 * Loads the katex module dynamically on first use.
 */
async function renderKatex(
  latex: string,
  displayMode: boolean,
  options?: katex.KatexOptions
): Promise<{ html: string; error: string | null }> {
  try {
    const katexModule = await loadKatex();
    const html = katexModule.renderToString(latex, {
      displayMode,
      throwOnError: false,
      strict: false,
      ...options,
      trust: false, // Enforced: prevents external URL access via \url, \href commands
    });
    return { html, error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Invalid LaTeX";
    const escaped = errorMessage
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
    return {
      html: `<span class="vizel-math-error">${escaped}</span>`,
      error: errorMessage,
    };
  }
}

/**
 * Input rule regex for inline math: $...$
 * Matches $ followed by non-$ characters, ending with $
 */
const INLINE_MATH_REGEX = /\$([^$\n]+)\$$/;

/**
 * Input rule regex for block math: $$...$$
 * Matches $$ followed by content, ending with $$
 */
const BLOCK_MATH_REGEX = /\$\$([^$]+)\$\$$/;

/**
 * Custom input rule for math nodes that replaces the entire match including delimiters.
 * Unlike nodeInputRule which preserves delimiters, this completely replaces $...$  with the node.
 */
function mathInputRule(config: {
  find: RegExp;
  type: NodeType;
  getAttributes?: (match: RegExpMatchArray) => Record<string, unknown>;
}): InputRule {
  return new InputRule({
    find: config.find,
    handler: ({ state, range, match }) => {
      const attributes = config.getAttributes?.(match) ?? {};
      const { tr } = state;
      const node = config.type.create(attributes);

      // Replace the entire match (including delimiters) with the node
      tr.replaceWith(range.from, range.to, node);
    },
  });
}

/**
 * Markdown tokenizer for inline math: $...$
 * GitHub Markdown compatible syntax
 */
const mathInlineTokenizer: MarkdownTokenizer = {
  name: "mathInline",
  start: "$",
  tokenize(src: string): MarkdownToken | undefined {
    // Match $...$ but not $$
    const match = src.match(/^\$([^$\n]+?)\$/);
    if (match?.[1]) {
      return {
        type: "mathInline",
        raw: match[0],
        latex: match[1],
      };
    }
    return undefined;
  },
};

/**
 * Markdown tokenizer for block math: $$...$$
 * GitHub Markdown compatible syntax
 */
const mathBlockTokenizer: MarkdownTokenizer = {
  name: "mathBlock",
  start: "$$",
  tokenize(src: string): MarkdownToken | undefined {
    // Match $$...$$ (can span multiple lines)
    const match = src.match(/^\$\$([\s\S]+?)\$\$/);
    if (match?.[1]) {
      return {
        type: "mathBlock",
        raw: match[0],
        latex: match[1].trim(),
      };
    }
    return undefined;
  },
};

/**
 * Mathematics extension for inline math expressions
 */
export const VizelMathInline = Node.create<VizelMathematicsOptions>({
  name: "mathInline",
  group: "inline",
  inline: true,
  atom: true,
  selectable: true,
  draggable: false,

  addOptions() {
    return {
      katexOptions: {},
      inlineInputRules: true,
      blockInputRules: true,
    };
  },

  addAttributes() {
    return {
      latex: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-latex") || "",
        renderHTML: (attributes) => ({
          "data-latex": attributes.latex,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-type="math-inline"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes, {
        "data-type": "math-inline",
        class: "vizel-math vizel-math-inline",
      }),
    ];
  },

  addNodeView() {
    return ({ node, getPos, editor }) => {
      const dom = document.createElement("span");
      dom.classList.add("vizel-math", "vizel-math-inline");
      dom.setAttribute("data-type", "math-inline");
      dom.setAttribute("contenteditable", "false");

      // Render container
      const renderContainer = document.createElement("span");
      renderContainer.classList.add("vizel-math-render");
      dom.appendChild(renderContainer);

      // Edit input (hidden by default)
      const editInput = document.createElement("input");
      editInput.type = "text";
      editInput.classList.add("vizel-math-input");
      editInput.value = node.attrs.latex;
      editInput.style.display = "none";
      dom.appendChild(editInput);

      let isEditing = false;
      const katexOptions = this.options.katexOptions;

      const renderMath = (latex: string) => {
        // KaTeX renderToString produces safe HTML (trust: false is enforced)
        void renderKatex(latex, false, katexOptions).then(({ html }) => {
          renderContainer.innerHTML = html;
        });
      };

      const startEditing = () => {
        if (!editor.isEditable) return;
        isEditing = true;
        dom.classList.add("vizel-math-editing");
        renderContainer.style.display = "none";
        editInput.style.display = "inline";
        editInput.value = node.attrs.latex;
        editInput.focus();
        editInput.select();
      };

      const stopEditing = () => {
        if (!isEditing) return;
        isEditing = false;
        dom.classList.remove("vizel-math-editing");
        renderContainer.style.display = "";
        editInput.style.display = "none";

        const newLatex = editInput.value.trim();
        const pos = typeof getPos === "function" ? getPos() : null;

        if (pos !== null && pos !== undefined) {
          if (newLatex === "") {
            // Delete node if empty
            editor
              .chain()
              .focus()
              .deleteRange({ from: pos, to: pos + node.nodeSize })
              .run();
          } else if (newLatex !== node.attrs.latex) {
            editor.chain().focus().updateAttributes("mathInline", { latex: newLatex }).run();
          }
        }
      };

      // Event listeners - store references for proper cleanup
      const handleDomClick = (e: MouseEvent) => {
        if (!isEditing) {
          e.preventDefault();
          e.stopPropagation();
          startEditing();
        }
      };

      const handleInputBlur = () => stopEditing();

      const handleInputKeydown = (e: KeyboardEvent) => {
        if (e.key === "Enter") {
          e.preventDefault();
          stopEditing();
        } else if (e.key === "Escape") {
          e.preventDefault();
          editInput.value = node.attrs.latex;
          stopEditing();
        }
      };

      dom.addEventListener("click", handleDomClick);
      editInput.addEventListener("blur", handleInputBlur);
      editInput.addEventListener("keydown", handleInputKeydown);

      // Initial render
      renderMath(node.attrs.latex);

      return {
        dom,
        update(updatedNode) {
          if (updatedNode.type.name !== "mathInline") {
            return false;
          }
          if (!isEditing) {
            renderMath(updatedNode.attrs.latex);
          }
          return true;
        },
        selectNode() {
          dom.classList.add("vizel-math-selected");
        },
        deselectNode() {
          dom.classList.remove("vizel-math-selected");
        },
        destroy() {
          dom.removeEventListener("click", handleDomClick);
          editInput.removeEventListener("blur", handleInputBlur);
          editInput.removeEventListener("keydown", handleInputKeydown);
        },
      };
    };
  },

  addInputRules() {
    if (!this.options.inlineInputRules) {
      return [];
    }

    return [
      mathInputRule({
        find: INLINE_MATH_REGEX,
        type: this.type,
        getAttributes: (match) => ({ latex: match[1] }),
      }),
    ];
  },

  addCommands() {
    return {
      insertMath:
        ({ latex }) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: { latex },
          });
        },
    };
  },

  // Markdown support (GitHub compatible)
  markdownTokenizer: mathInlineTokenizer,

  parseMarkdown(token: MarkdownToken): JSONContent {
    return {
      type: "mathInline",
      attrs: {
        latex: token.latex || "",
      },
    };
  },

  renderMarkdown(node: JSONContent): string {
    const latex = node.attrs?.latex || "";
    return `$${latex}$`;
  },
});

/**
 * Mathematics extension for block math expressions
 */
export const VizelMathBlock = Node.create<VizelMathematicsOptions>({
  name: "mathBlock",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addOptions() {
    return {
      katexOptions: {},
      inlineInputRules: true,
      blockInputRules: true,
    };
  },

  addAttributes() {
    return {
      latex: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-latex") || "",
        renderHTML: (attributes) => ({
          "data-latex": attributes.latex,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="math-block"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "math-block",
        class: "vizel-math vizel-math-block",
      }),
    ];
  },

  addNodeView() {
    return ({ node, getPos, editor }) => {
      const dom = document.createElement("div");
      dom.classList.add("vizel-math", "vizel-math-block");
      dom.setAttribute("data-type", "math-block");
      dom.setAttribute("contenteditable", "false");

      // Render container
      const renderContainer = document.createElement("div");
      renderContainer.classList.add("vizel-math-render");
      dom.appendChild(renderContainer);

      // Edit container (hidden by default)
      const editContainer = document.createElement("div");
      editContainer.classList.add("vizel-math-edit-container");
      editContainer.style.display = "none";

      const editTextarea = document.createElement("textarea");
      editTextarea.classList.add("vizel-math-textarea");
      editTextarea.value = node.attrs.latex;
      editTextarea.placeholder = "Enter LaTeX expression...";
      editContainer.appendChild(editTextarea);

      // Preview container for live preview during editing
      const previewContainer = document.createElement("div");
      previewContainer.classList.add("vizel-math-preview");
      editContainer.appendChild(previewContainer);

      dom.appendChild(editContainer);

      let isEditing = false;
      const katexBlockOptions = this.options.katexOptions;

      const renderMath = (latex: string) => {
        // KaTeX renderToString produces safe HTML (trust: false is enforced)
        void renderKatex(latex, true, katexBlockOptions).then(({ html }) => {
          renderContainer.innerHTML = html;
        });
      };

      const updatePreview = (latex: string) => {
        // KaTeX renderToString produces safe HTML (trust: false is enforced)
        void renderKatex(latex, true, katexBlockOptions).then(({ html }) => {
          previewContainer.innerHTML = html;
        });
      };

      const startEditing = () => {
        if (!editor.isEditable) return;
        isEditing = true;
        dom.classList.add("vizel-math-editing");
        renderContainer.style.display = "none";
        editContainer.style.display = "";
        editTextarea.value = node.attrs.latex;
        updatePreview(node.attrs.latex);
        editTextarea.focus();
      };

      const stopEditing = () => {
        if (!isEditing) return;
        isEditing = false;
        dom.classList.remove("vizel-math-editing");
        renderContainer.style.display = "";
        editContainer.style.display = "none";

        const newLatex = editTextarea.value.trim();
        const pos = typeof getPos === "function" ? getPos() : null;

        if (pos !== null && pos !== undefined) {
          if (newLatex === "") {
            // Delete node if empty
            editor
              .chain()
              .focus()
              .deleteRange({ from: pos, to: pos + node.nodeSize })
              .run();
          } else if (newLatex !== node.attrs.latex) {
            editor.chain().focus().updateAttributes("mathBlock", { latex: newLatex }).run();
          }
        }
      };

      // Event listeners (named handlers for proper cleanup in destroy())
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
          editTextarea.value = node.attrs.latex;
          stopEditing();
        }
        // Allow Ctrl/Cmd + Enter to save
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          stopEditing();
        }
      };

      const handleTextareaInput = () => {
        updatePreview(editTextarea.value);
      };

      dom.addEventListener("click", handleDomClick);
      renderContainer.addEventListener("click", handleRenderClick);
      editTextarea.addEventListener("blur", handleTextareaBlur);
      editTextarea.addEventListener("keydown", handleTextareaKeydown);
      editTextarea.addEventListener("input", handleTextareaInput);

      // Initial render
      renderMath(node.attrs.latex);

      return {
        dom,
        update(updatedNode) {
          if (updatedNode.type.name !== "mathBlock") {
            return false;
          }
          if (!isEditing) {
            renderMath(updatedNode.attrs.latex);
          }
          return true;
        },
        selectNode() {
          dom.classList.add("vizel-math-selected");
        },
        deselectNode() {
          dom.classList.remove("vizel-math-selected");
        },
        destroy() {
          dom.removeEventListener("click", handleDomClick);
          renderContainer.removeEventListener("click", handleRenderClick);
          editTextarea.removeEventListener("blur", handleTextareaBlur);
          editTextarea.removeEventListener("keydown", handleTextareaKeydown);
          editTextarea.removeEventListener("input", handleTextareaInput);
        },
      };
    };
  },

  addInputRules() {
    if (!this.options.blockInputRules) {
      return [];
    }

    return [
      mathInputRule({
        find: BLOCK_MATH_REGEX,
        type: this.type,
        getAttributes: (match) => ({ latex: match[1]?.trim() }),
      }),
    ];
  },

  addCommands() {
    return {
      insertMathBlock:
        ({ latex }) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: { latex },
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

        // If we're in a mathBlock and it's selected, delete it
        if (node.type.name === "mathBlock") {
          return this.editor.commands.deleteSelection();
        }

        return false;
      },
    };
  },

  // Markdown support (GitHub compatible)
  markdownTokenizer: mathBlockTokenizer,

  parseMarkdown(token: MarkdownToken): JSONContent {
    return {
      type: "mathBlock",
      attrs: {
        latex: token.latex || "",
      },
    };
  },

  renderMarkdown(node: JSONContent): string {
    const latex = node.attrs?.latex || "";
    return `$$\n${latex}\n$$`;
  },
});

/**
 * Create the Mathematics extensions
 *
 * @example Basic usage
 * ```ts
 * const extensions = [
 *   ...createVizelMathematicsExtensions(),
 * ];
 * ```
 *
 * @example With custom KaTeX options
 * ```ts
 * const extensions = [
 *   ...createVizelMathematicsExtensions({
 *     katexOptions: {
 *       macros: {
 *         '\\R': '\\mathbb{R}',
 *       },
 *     },
 *   }),
 * ];
 * ```
 */
export function createVizelMathematicsExtensions(
  options: VizelMathematicsOptions = {}
): [typeof VizelMathInline, typeof VizelMathBlock] {
  return [VizelMathInline.configure(options), VizelMathBlock.configure(options)];
}

// Export the lazy loader for advanced usage
export { loadKatex };
