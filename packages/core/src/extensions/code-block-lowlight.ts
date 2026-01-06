/**
 * Code Block with Syntax Highlighting Extension
 *
 * Provides syntax highlighting for code blocks using lowlight (highlight.js wrapper).
 * Supports 190+ programming languages with automatic and manual language detection.
 */
import CodeBlockLowlight, {
  type CodeBlockLowlightOptions,
} from "@tiptap/extension-code-block-lowlight";
import { all, createLowlight } from "lowlight";
import { renderIcon } from "../icons/types.ts";

/**
 * Language definition for the code block language selector
 */
export interface CodeBlockLanguage {
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
   * Custom lowlight instance (if not provided, uses all languages)
   */
  lowlight?: ReturnType<typeof createLowlight>;
}

// Create a lowlight instance with all languages registered
const lowlightWithAllLanguages = createLowlight(all);

/**
 * Get the list of all registered languages (sorted alphabetically)
 */
export function getRegisteredLanguages(): CodeBlockLanguage[] {
  const registeredNames = lowlightWithAllLanguages.listLanguages();

  return registeredNames
    .sort((a, b) => a.localeCompare(b))
    .map((id) => ({
      id,
      // Capitalize first letter for display name
      name: id.charAt(0).toUpperCase() + id.slice(1),
    }));
}

/**
 * Get all language IDs
 */
export function getAllLanguageIds(): string[] {
  return getRegisteredLanguages().map((lang) => lang.id);
}

/**
 * Find a language by ID
 */
export function findLanguage(id: string): CodeBlockLanguage | undefined {
  const normalized = id.toLowerCase();
  return getRegisteredLanguages().find((lang) => lang.id === normalized);
}

/**
 * Create the CodeBlockLowlight extension with all languages registered
 *
 * @example Basic usage
 * ```ts
 * const extensions = [
 *   ...createCodeBlockLowlightExtension(),
 * ];
 * ```
 *
 * @example With options
 * ```ts
 * const extensions = [
 *   ...createCodeBlockLowlightExtension({
 *     defaultLanguage: 'typescript',
 *     lineNumbers: true,
 *   }),
 * ];
 * ```
 */
export function createCodeBlockLowlightExtension(
  options: VizelCodeBlockOptions = {}
): CodeBlockLowlightOptions["lowlight"] extends undefined
  ? never
  : ReturnType<typeof CodeBlockLowlight.configure>[] {
  const {
    defaultLanguage = "plaintext",
    lineNumbers = false,
    lowlight = lowlightWithAllLanguages,
  } = options;

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

        for (const lang of getRegisteredLanguages()) {
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
        lineNumbersBtn.innerHTML = renderIcon("listOrdered", { width: 16, height: 16 });
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
            gutter.innerHTML = "";
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

// Export the default lowlight instance for advanced usage
export { lowlightWithAllLanguages as lowlight };

// Re-export the base extension for advanced customization
export { CodeBlockLowlight };
