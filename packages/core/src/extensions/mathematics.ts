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
import { InputRule, mergeAttributes, Node } from "@tiptap/core";
import type { NodeType, Node as PMNode } from "@tiptap/pm/model";
import type katex from "katex";
import type MarkdownIt from "markdown-it";
import type StateBlock from "markdown-it/lib/rules_block/state_block.mjs";
import type { MarkdownSerializerState } from "prosemirror-markdown";
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
 * Register a markdown-it inline rule that recognizes `$...$` math.
 *
 * The rule emits HTML matching `VizelMathInline.parseHTML` so that
 * markdown round-trip restores math expressions to typed nodes.
 */
function registerMathInlineRule(md: MarkdownIt): void {
  md.inline.ruler.before("escape", "vizel_math_inline", (state, silent) => {
    if (state.src.charCodeAt(state.pos) !== 0x24) return false;
    if (state.src.charCodeAt(state.pos + 1) === 0x24) return false;
    const end = state.src.indexOf("$", state.pos + 1);
    if (end === -1) return false;
    const latex = state.src.slice(state.pos + 1, end);
    if (!latex || /\n/.test(latex)) return false;
    if (!silent) {
      const token = state.push("vizel_math_inline", "span", 0);
      token.content = latex;
    }
    state.pos = end + 1;
    return true;
  });

  md.renderer.rules.vizel_math_inline = (tokens, idx) => {
    const latex = tokens[idx]?.content ?? "";
    const escaped = latex.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
    return `<span data-type="math-inline" data-latex="${escaped}" class="vizel-math vizel-math-inline"></span>`;
  };
}

/**
 * Register a markdown-it block rule that recognizes `$$...$$` math.
 */
function readMathLine(state: StateBlock, lineIndex: number): string {
  const pos = (state.bMarks[lineIndex] ?? 0) + (state.tShift[lineIndex] ?? 0);
  const max = state.eMarks[lineIndex] ?? state.src.length;
  return state.src.slice(pos, max);
}

function findMathBlockClose(state: StateBlock, startLine: number, endLine: number): number {
  let nextLine = startLine + 1;
  while (nextLine < endLine) {
    if (readMathLine(state, nextLine).trim() === "$$") {
      return nextLine;
    }
    nextLine++;
  }
  return -1;
}

function registerMathBlockRule(md: MarkdownIt): void {
  md.block.ruler.before(
    "fence",
    "vizel_math_block",
    (state, startLine, endLine, silent) => {
      const firstLine = readMathLine(state, startLine);
      if (!firstLine.startsWith("$$")) return false;

      const singleLineMatch = /^\$\$([\s\S]+)\$\$\s*$/.exec(firstLine);
      if (singleLineMatch) {
        if (silent) return true;
        emitMathBlock(state, singleLineMatch[1]?.trim() ?? "", startLine, startLine);
        state.line = startLine + 1;
        return true;
      }

      if (firstLine.slice(2).trim().length > 0) return false;
      const closingLine = findMathBlockClose(state, startLine, endLine);
      if (closingLine === -1) return false;
      if (silent) return true;
      const content = state.getLines(
        startLine + 1,
        closingLine,
        state.tShift[startLine] ?? 0,
        false
      );
      emitMathBlock(state, content.trim(), startLine, closingLine);
      state.line = closingLine + 1;
      return true;
    },
    { alt: ["paragraph"] }
  );

  md.renderer.rules.vizel_math_block = (tokens, idx) => {
    const latex = tokens[idx]?.content ?? "";
    const escaped = latex.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
    return `<div data-type="math-block" data-latex="${escaped}" class="vizel-math vizel-math-block"></div>`;
  };
}

function emitMathBlock(state: StateBlock, latex: string, startLine: number, endLine: number): void {
  const token = state.push("vizel_math_block", "div", 0);
  token.content = latex;
  token.block = true;
  token.map = [startLine, endLine + 1];
}

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

  addStorage() {
    return {
      markdown: {
        serialize(state: MarkdownSerializerState, node: PMNode) {
          const latex = String(node.attrs?.latex ?? "");
          state.write(`$${latex}$`);
        },
        parse: {
          setup(md: MarkdownIt) {
            registerMathInlineRule(md);
          },
        },
      },
    };
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

  addStorage() {
    return {
      markdown: {
        serialize(state: MarkdownSerializerState, node: PMNode) {
          const latex = String(node.attrs?.latex ?? "");
          state.write(`$$\n${latex}\n$$`);
          state.closeBlock(node);
        },
        parse: {
          setup(md: MarkdownIt) {
            registerMathBlockRule(md);
          },
        },
      },
    };
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
