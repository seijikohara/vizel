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

/**
 * Language definition for the code block language selector
 */
export interface CodeBlockLanguage {
  /** Language identifier (e.g., "javascript", "python") */
  id: string;
  /** Display name (e.g., "JavaScript", "Python") */
  name: string;
  /** Common aliases for the language */
  aliases?: string[];
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

/** Helper to create the language input with datalist */
function createLanguageInput(
  currentLanguage: string,
  defaultLanguage: string,
  onLanguageChange: (newLanguage: string) => void
): { input: HTMLInputElement; datalist: HTMLDataListElement } {
  const languageInput = document.createElement("input");
  languageInput.type = "text";
  languageInput.classList.add("vizel-code-block-language-input");
  languageInput.value = currentLanguage || defaultLanguage;
  languageInput.placeholder = "language";

  const datalistId = `vizel-languages-${Math.random().toString(36).slice(2, 9)}`;
  const datalist = document.createElement("datalist");
  datalist.id = datalistId;
  languageInput.setAttribute("list", datalistId);

  const languages = getRegisteredLanguages();
  for (const lang of languages) {
    const option = document.createElement("option");
    option.value = lang.id;
    option.label = lang.name;
    datalist.appendChild(option);
  }

  const handleChange = () => {
    const newLanguage = languageInput.value.toLowerCase().trim() || defaultLanguage;
    onLanguageChange(newLanguage);
  };

  languageInput.addEventListener("change", handleChange);
  languageInput.addEventListener("blur", () => {
    const newLanguage = languageInput.value.toLowerCase().trim() || defaultLanguage;
    languageInput.value = newLanguage;
    onLanguageChange(newLanguage);
  });

  return { input: languageInput, datalist };
}

/** Helper to create the line numbers toggle button */
function createLineNumbersButton(initialState: boolean, onToggle: () => void): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.classList.add("vizel-code-block-line-numbers-toggle");
  button.title = initialState ? "Hide line numbers" : "Show line numbers";
  button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="5" y2="6"/><line x1="8" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="5" y2="12"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="5" y2="18"/><line x1="8" y1="18" x2="21" y2="18"/></svg>`;

  if (initialState) {
    button.classList.add("active");
  }

  button.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    onToggle();
  });

  return button;
}

/** Helper to update line numbers button state */
function updateLineNumbersButton(button: HTMLButtonElement, enabled: boolean): void {
  if (enabled) {
    button.classList.add("active");
    button.title = "Hide line numbers";
  } else {
    button.classList.remove("active");
    button.title = "Show line numbers";
  }
}

/**
 * Get the list of all registered languages
 */
export function getRegisteredLanguages(): CodeBlockLanguage[] {
  const languages: CodeBlockLanguage[] = [];
  const registeredNames = lowlightWithAllLanguages.listLanguages();

  // Popular languages with display names (sorted by popularity)
  const popularLanguages: Record<string, { name: string; aliases?: string[] }> = {
    javascript: { name: "JavaScript", aliases: ["js"] },
    typescript: { name: "TypeScript", aliases: ["ts"] },
    python: { name: "Python", aliases: ["py"] },
    java: { name: "Java" },
    c: { name: "C" },
    cpp: { name: "C++", aliases: ["cc", "cxx"] },
    csharp: { name: "C#", aliases: ["cs"] },
    go: { name: "Go", aliases: ["golang"] },
    rust: { name: "Rust", aliases: ["rs"] },
    ruby: { name: "Ruby", aliases: ["rb"] },
    php: { name: "PHP" },
    swift: { name: "Swift" },
    kotlin: { name: "Kotlin", aliases: ["kt"] },
    scala: { name: "Scala" },
    html: { name: "HTML", aliases: ["htm"] },
    css: { name: "CSS" },
    scss: { name: "SCSS" },
    less: { name: "Less" },
    json: { name: "JSON" },
    yaml: { name: "YAML", aliases: ["yml"] },
    xml: { name: "XML" },
    markdown: { name: "Markdown", aliases: ["md"] },
    sql: { name: "SQL" },
    graphql: { name: "GraphQL", aliases: ["gql"] },
    bash: { name: "Bash", aliases: ["sh", "shell", "zsh"] },
    powershell: { name: "PowerShell", aliases: ["ps1"] },
    dockerfile: { name: "Dockerfile", aliases: ["docker"] },
    nginx: { name: "Nginx" },
    apache: { name: "Apache" },
    makefile: { name: "Makefile", aliases: ["make"] },
    cmake: { name: "CMake" },
    lua: { name: "Lua" },
    perl: { name: "Perl", aliases: ["pl"] },
    r: { name: "R" },
    matlab: { name: "MATLAB" },
    julia: { name: "Julia" },
    elixir: { name: "Elixir", aliases: ["ex"] },
    erlang: { name: "Erlang", aliases: ["erl"] },
    haskell: { name: "Haskell", aliases: ["hs"] },
    clojure: { name: "Clojure", aliases: ["clj"] },
    fsharp: { name: "F#", aliases: ["fs"] },
    ocaml: { name: "OCaml", aliases: ["ml"] },
    dart: { name: "Dart" },
    objectivec: { name: "Objective-C", aliases: ["objc", "obj-c"] },
    assembly: { name: "Assembly", aliases: ["asm"] },
    wasm: { name: "WebAssembly" },
    solidity: { name: "Solidity", aliases: ["sol"] },
    toml: { name: "TOML" },
    ini: { name: "INI" },
    diff: { name: "Diff", aliases: ["patch"] },
    plaintext: { name: "Plain Text", aliases: ["text", "txt"] },
  };

  // Add popular languages first (in order)
  for (const id of Object.keys(popularLanguages)) {
    const lang = popularLanguages[id];
    if (registeredNames.includes(id) && lang) {
      languages.push({
        id,
        name: lang.name,
        ...(lang.aliases && { aliases: lang.aliases }),
      });
    }
  }

  // Add remaining registered languages
  for (const id of registeredNames) {
    if (!popularLanguages[id]) {
      // Capitalize first letter for display name
      const name = id.charAt(0).toUpperCase() + id.slice(1);
      languages.push({ id, name });
    }
  }

  return languages;
}

/**
 * Get all language IDs including aliases
 */
export function getAllLanguageIds(): string[] {
  const languages = getRegisteredLanguages();
  const ids: string[] = [];

  for (const lang of languages) {
    ids.push(lang.id);
    if (lang.aliases) {
      ids.push(...lang.aliases);
    }
  }

  return ids;
}

/**
 * Find a language by ID or alias
 */
export function findLanguage(idOrAlias: string): CodeBlockLanguage | undefined {
  const languages = getRegisteredLanguages();
  const normalized = idOrAlias.toLowerCase();

  return languages.find((lang) => lang.id === normalized || lang.aliases?.includes(normalized));
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
      return ({ node, HTMLAttributes, getPos, editor }) => {
        const dom = document.createElement("div");
        dom.classList.add("vizel-code-block");

        if (node.attrs.lineNumbers) {
          dom.classList.add("vizel-code-block-line-numbers");
        }

        // Language selector container
        const languageSelector = document.createElement("div");
        languageSelector.classList.add("vizel-code-block-language-selector");
        languageSelector.setAttribute("contenteditable", "false");

        // Create language input
        const { input: languageInput, datalist } = createLanguageInput(
          node.attrs.language,
          defaultLanguage,
          (newLanguage) => {
            const pos = typeof getPos === "function" ? getPos() : null;
            if (pos !== null && editor) {
              editor.chain().focus().updateAttributes("codeBlock", { language: newLanguage }).run();
            }
          }
        );

        languageSelector.appendChild(languageInput);
        languageSelector.appendChild(datalist);

        // Create line numbers toggle button
        let currentLineNumbers = node.attrs.lineNumbers;
        const lineNumbersButton = createLineNumbersButton(currentLineNumbers, () => {
          const pos = typeof getPos === "function" ? getPos() : null;
          if (pos !== null && editor) {
            currentLineNumbers = !currentLineNumbers;
            editor
              .chain()
              .focus()
              .updateAttributes("codeBlock", { lineNumbers: currentLineNumbers })
              .run();
          }
        });

        languageSelector.appendChild(lineNumbersButton);

        // Pre element for code
        const pre = document.createElement("pre");
        for (const [key, value] of Object.entries(HTMLAttributes)) {
          if (value !== null && value !== undefined) {
            pre.setAttribute(key, String(value));
          }
        }

        // Code element
        const code = document.createElement("code");
        code.classList.add(`language-${node.attrs.language || defaultLanguage}`);
        pre.appendChild(code);

        dom.appendChild(languageSelector);
        dom.appendChild(pre);

        return {
          dom,
          contentDOM: code,
          update: (updatedNode) => {
            if (updatedNode.type.name !== "codeBlock") {
              return false;
            }

            languageInput.value = updatedNode.attrs.language || defaultLanguage;
            code.className = `language-${updatedNode.attrs.language || defaultLanguage}`;

            currentLineNumbers = updatedNode.attrs.lineNumbers;
            dom.classList.toggle("vizel-code-block-line-numbers", currentLineNumbers);
            updateLineNumbersButton(lineNumbersButton, currentLineNumbers);

            return true;
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
