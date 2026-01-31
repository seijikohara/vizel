/**
 * Code Block with Syntax Highlighting Extension
 *
 * Provides syntax highlighting for code blocks using lowlight (highlight.js wrapper).
 * Supports programming languages with automatic and manual language detection.
 *
 * lowlight is an optional dependency. Install it to enable syntax highlighting:
 * ```
 * npm install lowlight
 * ```
 */
import CodeBlockLowlight, {
  type CodeBlockLowlightOptions,
} from "@tiptap/extension-code-block-lowlight";
import { renderVizelIcon } from "../icons/types.ts";

/**
 * Language definition for the code block language selector
 */
export interface VizelCodeBlockLanguage {
  /** Language identifier (e.g., "javascript", "python") */
  id: string;
  /** Display name (e.g., "JavaScript", "Python") */
  name: string;
}

/**
 * Options for creating the code block lowlight extension
 */
export interface VizelCodeBlockOptions {
  /**
   * Default language for code blocks
   * @default "plaintext"
   */
  defaultLanguage?: string;
  /**
   * Enable line numbers by default
   * @default false
   */
  lineNumbers?: boolean;
  /**
   * Custom lowlight instance. If provided, the `languages` option is ignored.
   */
  lowlight?: ReturnType<typeof import("lowlight").createLowlight>;
  /**
   * Language loading strategy (ignored if `lowlight` option is provided).
   * - "common": Load ~37 common languages (default, recommended)
   * - "all": Load all 190+ languages (larger bundle)
   * @default "common"
   */
  languages?: "common" | "all";
}

/**
 * Module-level cached lowlight instance.
 * Set when the extension is created, used by utility functions.
 */
let activeLowlightInstance: ReturnType<typeof import("lowlight").createLowlight> | null = null;

/**
 * Get the list of all registered languages (sorted alphabetically).
 * Returns an empty array if the code block extension has not been initialized yet.
 */
export function getVizelRegisteredLanguages(): VizelCodeBlockLanguage[] {
  if (!activeLowlightInstance) return [];

  const registeredNames = activeLowlightInstance.listLanguages();

  return registeredNames
    .sort((a, b) => a.localeCompare(b))
    .map((id) => ({
      id,
      // Capitalize first letter for display name
      name: id.charAt(0).toUpperCase() + id.slice(1),
    }));
}

/**
 * Get all language IDs.
 * Returns an empty array if the code block extension has not been initialized yet.
 */
export function getAllVizelLanguageIds(): string[] {
  return getVizelRegisteredLanguages().map((lang) => lang.id);
}

/**
 * Find a language by ID.
 * Returns undefined if the code block extension has not been initialized yet.
 */
export function findVizelLanguage(id: string): VizelCodeBlockLanguage | undefined {
  const normalized = id.toLowerCase();
  return getVizelRegisteredLanguages().find((lang) => lang.id === normalized);
}

/**
 * Load a lowlight instance with the specified language set.
 */
async function loadLowlightInstance(
  languages: "common" | "all" = "common"
): Promise<ReturnType<typeof import("lowlight").createLowlight>> {
  try {
    const lowlightMod = await import("lowlight");
    const grammars = languages === "all" ? lowlightMod.all : lowlightMod.common;
    return lowlightMod.createLowlight(grammars);
  } catch (error) {
    throw new Error(
      `[Vizel] Failed to load "lowlight". ` +
        `Please install it for code block syntax highlighting: npm install lowlight\n` +
        `Original error: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Create the CodeBlockLowlight extension with syntax highlighting.
 *
 * This function is async because lowlight is loaded dynamically as an optional dependency.
 *
 * @example Basic usage
 * ```ts
 * const extensions = [
 *   ...await createVizelCodeBlockExtension(),
 * ];
 * ```
 *
 * @example With options
 * ```ts
 * const extensions = [
 *   ...await createVizelCodeBlockExtension({
 *     defaultLanguage: 'typescript',
 *     lineNumbers: true,
 *     languages: 'all', // Load all 190+ languages
 *   }),
 * ];
 * ```
 *
 * @example With custom lowlight instance
 * ```ts
 * import { common, createLowlight } from 'lowlight';
 * import typescript from 'highlight.js/lib/languages/typescript';
 *
 * const lowlight = createLowlight(common);
 * lowlight.register('typescript', typescript);
 *
 * const extensions = [
 *   ...await createVizelCodeBlockExtension({ lowlight }),
 * ];
 * ```
 */
export async function createVizelCodeBlockExtension(
  options: VizelCodeBlockOptions = {}
): Promise<
  CodeBlockLowlightOptions["lowlight"] extends undefined
    ? never
    : ReturnType<typeof CodeBlockLowlight.configure>[]
> {
  const {
    defaultLanguage = "plaintext",
    lineNumbers = false,
    lowlight: customLowlight,
    languages = "common",
  } = options;

  // Resolve lowlight instance
  const lowlight = customLowlight ?? (await loadLowlightInstance(languages));

  // Cache the instance for utility functions
  activeLowlightInstance = lowlight;

  const extension = CodeBlockLowlight.extend({
    addAttributes() {
      return {
        ...this.parent?.(),
        language: {
          default: defaultLanguage,
          parseHTML: (element) =>
            element.getAttribute("data-language") ||
            element.querySelector("code")?.getAttribute("class")?.replace("language-", "") ||
            defaultLanguage,
          renderHTML: (attributes) => ({
            "data-language": attributes.language || defaultLanguage,
            class: `language-${attributes.language || defaultLanguage}`,
          }),
        },
        lineNumbers: {
          default: lineNumbers,
          parseHTML: (element) => element.getAttribute("data-line-numbers") === "true",
          renderHTML: (attributes) => {
            if (!attributes.lineNumbers) return {};
            return { "data-line-numbers": "true" };
          },
        },
      };
    },

    addNodeView() {
      return ({ node, getPos, editor }) => {
        // Create main container
        const dom = document.createElement("div");
        dom.classList.add("vizel-code-block");
        if (node.attrs.lineNumbers) {
          dom.classList.add("vizel-code-block-line-numbers");
        }

        // Create language selector toolbar
        const toolbar = document.createElement("div");
        toolbar.classList.add("vizel-code-block-language-selector");
        toolbar.setAttribute("contenteditable", "false");

        // Language input with datalist
        const languageInput = document.createElement("input");
        languageInput.type = "text";
        languageInput.classList.add("vizel-code-block-language-input");
        languageInput.value = node.attrs.language || defaultLanguage;
        languageInput.placeholder = "language";

        const datalistId = `vizel-languages-${Math.random().toString(36).slice(2, 9)}`;
        const datalist = document.createElement("datalist");
        datalist.id = datalistId;
        languageInput.setAttribute("list", datalistId);

        for (const lang of getVizelRegisteredLanguages()) {
          const option = document.createElement("option");
          option.value = lang.id;
          option.label = lang.name;
          datalist.appendChild(option);
        }

        const updateLanguage = () => {
          const pos = typeof getPos === "function" ? getPos() : null;
          if (pos !== null && pos !== undefined) {
            const newLanguage = languageInput.value.toLowerCase().trim() || defaultLanguage;
            languageInput.value = newLanguage;
            // Use setNodeMarkup to update the specific node at this position
            const { tr } = editor.state;
            const nodeAtPos = editor.state.doc.nodeAt(pos);
            if (nodeAtPos) {
              tr.setNodeMarkup(pos, undefined, {
                ...nodeAtPos.attrs,
                language: newLanguage,
              });
              editor.view.dispatch(tr);
            }
          }
        };

        languageInput.addEventListener("change", updateLanguage);
        languageInput.addEventListener("blur", updateLanguage);
        languageInput.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            e.stopPropagation();
            updateLanguage();
            languageInput.blur();
          }
        });

        // Line numbers toggle button
        const lineNumbersBtn = document.createElement("button");
        lineNumbersBtn.type = "button";
        lineNumbersBtn.classList.add("vizel-code-block-line-numbers-toggle");
        // Safe: renderVizelIcon generates trusted SVG from the internal @iconify system
        lineNumbersBtn.innerHTML = renderVizelIcon("listOrdered", { width: 16, height: 16 });
        if (node.attrs.lineNumbers) {
          lineNumbersBtn.classList.add("active");
        }
        lineNumbersBtn.title = node.attrs.lineNumbers ? "Hide line numbers" : "Show line numbers";

        // Append in order: toggle button, language input, datalist
        toolbar.appendChild(lineNumbersBtn);
        toolbar.appendChild(languageInput);
        toolbar.appendChild(datalist);

        // Code container with gutter and pre
        const codeContainer = document.createElement("div");
        codeContainer.classList.add("vizel-code-block-container");

        // Line numbers gutter
        const gutter = document.createElement("div");
        gutter.classList.add("vizel-code-block-gutter");
        gutter.setAttribute("contenteditable", "false");
        gutter.setAttribute("aria-hidden", "true");

        // Pre element
        const pre = document.createElement("pre");

        // Code element (contentDOM)
        const code = document.createElement("code");
        code.classList.add(`language-${node.attrs.language || defaultLanguage}`);
        pre.appendChild(code);

        codeContainer.appendChild(gutter);
        codeContainer.appendChild(pre);

        dom.appendChild(toolbar);
        dom.appendChild(codeContainer);

        // Function to update line numbers in gutter
        const updateLineNumbers = () => {
          const text = code.textContent || "";
          const lines = text.split("\n");
          const lineCount =
            text.endsWith("\n") && lines.length > 1 ? lines.length - 1 : Math.max(1, lines.length);

          if (gutter.children.length !== lineCount) {
            gutter.replaceChildren();
            for (let i = 1; i <= lineCount; i++) {
              const lineNum = document.createElement("div");
              lineNum.classList.add("vizel-code-block-line-number");
              lineNum.textContent = String(i);
              gutter.appendChild(lineNum);
            }
          }
        };

        // Initial update if line numbers enabled
        if (node.attrs.lineNumbers) {
          // Use setTimeout to ensure content is rendered
          setTimeout(updateLineNumbers, 0);
        }

        // Track current state
        let currentLanguage = node.attrs.language;
        let currentLineNumbers = node.attrs.lineNumbers;

        // Add click handler for line numbers toggle (using currentLineNumbers)
        lineNumbersBtn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          const pos = typeof getPos === "function" ? getPos() : null;
          if (pos !== null && pos !== undefined) {
            const newValue = !currentLineNumbers;
            // Use setNodeMarkup to update the specific node at this position
            const { tr } = editor.state;
            const nodeAtPos = editor.state.doc.nodeAt(pos);
            if (nodeAtPos) {
              tr.setNodeMarkup(pos, undefined, {
                ...nodeAtPos.attrs,
                lineNumbers: newValue,
              });
              editor.view.dispatch(tr);
            }
          }
        });

        // Helper functions for update
        const syncLanguage = (newLang: string) => {
          currentLanguage = newLang;
          languageInput.value = newLang || defaultLanguage;
          code.className = `language-${newLang || defaultLanguage}`;
        };

        const syncLineNumbers = (enabled: boolean) => {
          currentLineNumbers = enabled;
          dom.classList.toggle("vizel-code-block-line-numbers", enabled);
          lineNumbersBtn.classList.toggle("active", enabled);
          lineNumbersBtn.title = enabled ? "Hide line numbers" : "Show line numbers";
        };

        return {
          dom,
          contentDOM: code,

          update(updatedNode) {
            if (updatedNode.type.name !== "codeBlock") {
              return false;
            }

            // Sync language if changed
            if (updatedNode.attrs.language !== currentLanguage) {
              syncLanguage(updatedNode.attrs.language);
            }

            // Sync line numbers if changed
            if (updatedNode.attrs.lineNumbers !== currentLineNumbers) {
              syncLineNumbers(updatedNode.attrs.lineNumbers);
            }

            // Update gutter if line numbers enabled
            if (currentLineNumbers) {
              setTimeout(updateLineNumbers, 0);
            }

            return true;
          },

          ignoreMutation(mutation) {
            // Ignore mutations in non-editable parts
            return gutter.contains(mutation.target) || toolbar.contains(mutation.target);
          },
        };
      };
    },
  }).configure({
    lowlight,
    defaultLanguage,
  });

  return [extension] as ReturnType<typeof CodeBlockLowlight.configure>[];
}

// Re-export the base extension for advanced customization
export { CodeBlockLowlight };
