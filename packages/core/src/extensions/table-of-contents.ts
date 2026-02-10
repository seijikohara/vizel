/**
 * Table of Contents Extension
 *
 * Provides a Table of Contents (TOC) block that automatically collects
 * headings from the document and renders navigation links with
 * click-to-scroll behavior.
 */

import { type Editor, Node } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    tableOfContents: {
      /** Insert a Table of Contents block */
      insertTableOfContents: () => ReturnType;
    };
  }
}

/**
 * A heading entry in the Table of Contents.
 */
export interface VizelTOCHeading {
  /** Heading text content */
  text: string;
  /** Heading level (1-6) */
  level: number;
  /** Position in the document */
  pos: number;
}

/**
 * Options for the Table of Contents extension.
 */
export interface VizelTableOfContentsOptions {
  /**
   * Maximum heading depth to include.
   * @default 6
   */
  maxDepth?: 1 | 2 | 3 | 4 | 5 | 6;

  /**
   * Custom HTML attributes for the TOC container.
   */
  HTMLAttributes?: Record<string, string>;
}

/**
 * Collect all headings from the editor document.
 */
function collectHeadings(editor: Editor, maxDepth: number): VizelTOCHeading[] {
  const headings: VizelTOCHeading[] = [];
  const { doc } = editor.state;

  doc.descendants((node, pos) => {
    if (node.type.name === "heading") {
      const level = node.attrs.level as number;
      if (level <= maxDepth) {
        headings.push({
          text: node.textContent,
          level,
          pos,
        });
      }
    }
  });

  return headings;
}

/**
 * Scroll to a heading at the given document position.
 */
function scrollToHeading(editor: Editor, pos: number): void {
  try {
    const domAtPos = editor.view.domAtPos(pos + 1);
    const node = domAtPos.node;
    const element = node instanceof HTMLElement ? node : node.parentElement;
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      editor.commands.setTextSelection(pos + 1);
    }
  } catch {
    // Position may be invalid if document changed
  }
}

/**
 * Remove all child nodes from an element.
 */
function clearElement(element: HTMLElement): void {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

/**
 * Render the TOC list into a DOM element.
 */
function renderTOC(dom: HTMLElement, editor: Editor, maxDepth: number): void {
  clearElement(dom);

  const headings = collectHeadings(editor, maxDepth);

  if (headings.length === 0) {
    const empty = document.createElement("p");
    empty.className = "vizel-toc-empty";
    empty.textContent = "No headings found";
    dom.appendChild(empty);
    return;
  }

  const nav = document.createElement("nav");
  nav.setAttribute("aria-label", "Table of contents");

  const list = document.createElement("ul");
  list.className = "vizel-toc-list";

  for (const heading of headings) {
    const li = document.createElement("li");
    li.className = `vizel-toc-item vizel-toc-item--h${heading.level}`;

    const link = document.createElement("a");
    link.className = "vizel-toc-link";
    link.textContent = heading.text;
    link.href = "#";
    link.addEventListener("click", (e) => {
      e.preventDefault();
      scrollToHeading(editor, heading.pos);
    });

    li.appendChild(link);
    list.appendChild(li);
  }

  nav.appendChild(list);
  dom.appendChild(nav);
}

/**
 * Create the Vizel Table of Contents extension.
 *
 * @param options - TOC configuration options
 * @returns Configured Tiptap Node extension
 *
 * @example
 * ```ts
 * const toc = createVizelTableOfContentsExtension({ maxDepth: 3 });
 * ```
 */
export function createVizelTableOfContentsExtension(options: VizelTableOfContentsOptions = {}) {
  const { maxDepth = 6, HTMLAttributes = {} } = options;

  return Node.create({
    name: "tableOfContents",

    group: "block",

    atom: true,

    draggable: true,

    parseHTML() {
      return [{ tag: 'div[data-type="table-of-contents"]' }];
    },

    renderHTML({ HTMLAttributes: attrs }) {
      return [
        "div",
        {
          ...HTMLAttributes,
          ...attrs,
          "data-type": "table-of-contents",
          class: `vizel-toc ${HTMLAttributes.class ?? ""}`.trim(),
        },
        ["p", "Table of Contents"],
      ];
    },

    addNodeView() {
      return ({ editor: nodeEditor }) => {
        const dom = document.createElement("div");
        dom.className = `vizel-toc ${HTMLAttributes.class ?? ""}`.trim();
        dom.setAttribute("data-type", "table-of-contents");
        dom.setAttribute("data-vizel-toc", "");
        dom.contentEditable = "false";

        const render = () => renderTOC(dom, nodeEditor, maxDepth);

        render();

        const handleUpdate = () => render();
        nodeEditor.on("update", handleUpdate);

        return {
          dom,
          update: () => {
            render();
            return true;
          },
          destroy: () => {
            nodeEditor.off("update", handleUpdate);
          },
        };
      };
    },

    addCommands() {
      return {
        insertTableOfContents:
          () =>
          ({ commands }) => {
            return commands.insertContent({
              type: this.name,
            });
          },
      };
    },
  });
}
