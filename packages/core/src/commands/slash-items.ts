import type { Editor } from "@tiptap/core";
import type { IFuseOptions } from "fuse.js";
import Fuse from "fuse.js";
import type { VizelSlashCommandIconName } from "../icons/types.ts";

/**
 * Range for slash command execution
 */
export interface SlashCommandRange {
  from: number;
  to: number;
}

/**
 * Extended slash command item with enhanced features
 */
export interface SlashCommandItem {
  /** Display title */
  title: string;
  /** Description of the command */
  description: string;
  /** Icon name (semantic name, rendered by framework packages) */
  icon: VizelSlashCommandIconName;
  /** Command to execute */
  command: (props: { editor: Editor; range: SlashCommandRange }) => void;
  /** Keyboard shortcut hint (e.g., "⌘B") */
  shortcut?: string;
  /** Additional keywords for fuzzy search */
  keywords?: string[];
  /** Group name for categorization */
  group?: string;
}

/**
 * Command group for categorized display
 */
export interface SlashCommandGroup {
  /** Group name */
  name: string;
  /** Commands in this group */
  items: SlashCommandItem[];
}

/**
 * Fuzzy search result with match highlighting
 */
export interface SlashCommandSearchResult {
  /** The original item */
  item: SlashCommandItem;
  /** Match score (0 = perfect match, higher = worse) */
  score: number;
  /** Matched indices for title highlighting */
  titleMatches?: [number, number][] | undefined;
}

/**
 * Default slash commands with groups and keywords
 */
export const defaultSlashCommands: SlashCommandItem[] = [
  // Text group
  {
    title: "Heading 1",
    description: "Large section heading",
    icon: "heading1",
    group: "Text",
    keywords: ["h1", "title", "header", "big"],
    shortcut: "⌘⌥1",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode("heading", { level: 1 }).run();
    },
  },
  {
    title: "Heading 2",
    description: "Medium section heading",
    icon: "heading2",
    group: "Text",
    keywords: ["h2", "subtitle", "header"],
    shortcut: "⌘⌥2",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode("heading", { level: 2 }).run();
    },
  },
  {
    title: "Heading 3",
    description: "Small section heading",
    icon: "heading3",
    group: "Text",
    keywords: ["h3", "header", "section"],
    shortcut: "⌘⌥3",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode("heading", { level: 3 }).run();
    },
  },
  {
    title: "Heading 4",
    description: "Extra-small heading",
    icon: "heading4",
    group: "Text",
    keywords: ["h4", "header", "subsection"],
    shortcut: "⌘⌥4",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode("heading", { level: 4 }).run();
    },
  },
  {
    title: "Heading 5",
    description: "Paragraph heading",
    icon: "heading5",
    group: "Text",
    keywords: ["h5", "header", "minor"],
    shortcut: "⌘⌥5",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode("heading", { level: 5 }).run();
    },
  },
  {
    title: "Heading 6",
    description: "Smallest heading",
    icon: "heading6",
    group: "Text",
    keywords: ["h6", "header", "smallest"],
    shortcut: "⌘⌥6",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode("heading", { level: 6 }).run();
    },
  },
  // Lists group
  {
    title: "Bullet List",
    description: "Create a simple bullet list",
    icon: "bulletList",
    group: "Lists",
    keywords: ["ul", "unordered", "bullets", "points"],
    shortcut: "⌘⇧8",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run();
    },
  },
  {
    title: "Numbered List",
    description: "Create a numbered list",
    icon: "orderedList",
    group: "Lists",
    keywords: ["ol", "ordered", "numbers", "steps"],
    shortcut: "⌘⇧7",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run();
    },
  },
  {
    title: "Task List",
    description: "Create a task list with checkboxes",
    icon: "taskList",
    group: "Lists",
    keywords: ["todo", "checkbox", "checklist", "tasks"],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleTaskList().run();
    },
  },
  // Blocks group
  {
    title: "Quote",
    description: "Capture a quote",
    icon: "blockquote",
    group: "Blocks",
    keywords: ["blockquote", "citation", "cite"],
    shortcut: "⌘⇧B",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBlockquote().run();
    },
  },
  {
    title: "Divider",
    description: "Insert a horizontal divider",
    icon: "horizontalRule",
    group: "Blocks",
    keywords: ["hr", "horizontal", "line", "separator", "break"],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHorizontalRule().run();
    },
  },
  {
    title: "Details",
    description: "Collapsible content block",
    icon: "details",
    group: "Blocks",
    keywords: ["accordion", "toggle", "collapse", "expand", "summary", "details"],
    command: ({ editor, range }) => {
      // Check if details extension is available
      if (!editor.can().setDetails?.()) {
        return;
      }
      editor.chain().focus().deleteRange(range).setDetails().run();
    },
  },
  {
    title: "Code Block",
    description: "Insert a code snippet",
    icon: "codeBlock",
    group: "Blocks",
    keywords: ["pre", "code", "programming", "syntax", "snippet"],
    shortcut: "⌘⌥C",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
    },
  },
  {
    title: "Table",
    description: "Insert a table",
    icon: "table",
    group: "Blocks",
    keywords: ["grid", "spreadsheet", "columns", "rows"],
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
        .run();
    },
  },
  // Media group
  {
    title: "Image",
    description: "Insert an image from URL",
    icon: "image",
    group: "Media",
    keywords: ["picture", "photo", "img", "url"],
    command: ({ editor, range }) => {
      const url = window.prompt("Enter image URL:");
      if (url) {
        editor.chain().focus().deleteRange(range).setImage({ src: url }).run();
      }
    },
  },
  {
    title: "Upload Image",
    description: "Upload an image from your device",
    icon: "imageUpload",
    group: "Media",
    keywords: ["picture", "photo", "upload", "file"],
    command: ({ editor, range }) => {
      // Delete the slash command text first
      try {
        editor.chain().focus().deleteRange(range).run();
      } catch {
        // Ignore errors from editor operations to ensure file picker opens
      }

      // Open file picker dialog (must happen synchronously in user event handler)
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.onchange = () => {
        const file = input.files?.[0];
        if (file) {
          // Dispatch custom event for external handling
          const event = new CustomEvent("vizel:upload-image", {
            detail: { file, editor },
          });
          document.dispatchEvent(event);
        }
      };
      input.click();
    },
  },
  {
    title: "Embed",
    description: "Embed a URL (YouTube, Twitter, etc.)",
    icon: "embed",
    group: "Media",
    keywords: ["link", "url", "youtube", "video", "twitter", "embed", "iframe", "oembed"],
    command: ({ editor, range }) => {
      // Check if embed extension is available by checking if setEmbed command exists
      const hasEmbedExtension = typeof editor.commands.setEmbed === "function";
      if (!hasEmbedExtension) {
        // Fallback to link if embed extension is not loaded
        const url = window.prompt("Enter URL:");
        if (url) {
          editor.chain().focus().deleteRange(range).setLink({ href: url }).run();
        }
        return;
      }

      const url = window.prompt("Enter URL to embed:");
      if (url) {
        editor.chain().focus().deleteRange(range).setEmbed({ url }).run();
      }
    },
  },
  // Advanced group
  {
    title: "Math Equation",
    description: "Insert a mathematical expression",
    icon: "mathBlock",
    group: "Advanced",
    keywords: ["latex", "formula", "equation", "katex", "math"],
    command: ({ editor, range }) => {
      // Check if mathematics extension is available
      if (!editor.can().insertMathBlock?.({ latex: "" })) {
        return;
      }
      editor.chain().focus().deleteRange(range).insertMathBlock({ latex: "" }).run();
    },
  },
  {
    title: "Inline Math",
    description: "Insert an inline math expression",
    icon: "mathInline",
    group: "Advanced",
    keywords: ["latex", "formula", "inline", "katex", "math"],
    command: ({ editor, range }) => {
      // Check if mathematics extension is available
      if (!editor.can().insertMath?.({ latex: "" })) {
        return;
      }
      editor.chain().focus().deleteRange(range).insertMath({ latex: "" }).run();
    },
  },
  {
    title: "Mermaid Diagram",
    description: "Insert a Mermaid diagram",
    icon: "mermaid",
    group: "Advanced",
    keywords: ["diagram", "chart", "flowchart", "mermaid", "sequence", "graph", "uml"],
    command: ({ editor, range }) => {
      // Check if diagram extension is available
      if (!editor.can().insertDiagram?.({ code: "" })) {
        return;
      }
      editor.chain().focus().deleteRange(range).insertDiagram({ code: "", type: "mermaid" }).run();
    },
  },
  {
    title: "GraphViz Diagram",
    description: "Insert a GraphViz (DOT) diagram",
    icon: "graphviz",
    group: "Advanced",
    keywords: ["diagram", "graphviz", "dot", "graph", "network", "nodes", "edges"],
    command: ({ editor, range }) => {
      // Check if diagram extension is available
      if (!editor.can().insertDiagram?.({ code: "" })) {
        return;
      }
      editor.chain().focus().deleteRange(range).insertDiagram({ code: "", type: "graphviz" }).run();
    },
  },
];

/**
 * Default group order for display
 */
export const defaultGroupOrder = ["Text", "Lists", "Blocks", "Media", "Advanced"];

/**
 * Fuse.js configuration for fuzzy search
 */
const fuseOptions: IFuseOptions<SlashCommandItem> = {
  keys: [
    { name: "title", weight: 0.4 },
    { name: "description", weight: 0.2 },
    { name: "keywords", weight: 0.4 },
  ],
  threshold: 0.4,
  includeScore: true,
  includeMatches: true,
  minMatchCharLength: 1,
};

/**
 * WeakMap cache for Fuse instances to avoid recreating on every search
 */
const fuseCache = new WeakMap<SlashCommandItem[], Fuse<SlashCommandItem>>();

/**
 * Get or create a Fuse instance for the given items
 */
function getFuseInstance(items: SlashCommandItem[]): Fuse<SlashCommandItem> {
  let fuse = fuseCache.get(items);
  if (!fuse) {
    fuse = new Fuse(items, fuseOptions);
    fuseCache.set(items, fuse);
  }
  return fuse;
}

/**
 * Filter slash commands using fuzzy search
 * @param items - The items to filter
 * @param query - The search query
 * @returns Filtered and sorted items
 */
export function filterSlashCommands(items: SlashCommandItem[], query: string): SlashCommandItem[] {
  if (!query.trim()) {
    return items;
  }

  const fuse = getFuseInstance(items);
  const results = fuse.search(query);

  return results.map((result) => result.item);
}

/**
 * Filter slash commands with search result metadata
 * @param items - The items to filter
 * @param query - The search query
 * @returns Search results with score and match info
 */
export function searchSlashCommands(
  items: SlashCommandItem[],
  query: string
): SlashCommandSearchResult[] {
  if (!query.trim()) {
    return items.map((item) => ({ item, score: 0 }));
  }

  const fuse = getFuseInstance(items);
  const results = fuse.search(query);

  return results.map((result) => {
    const titleMatch = result.matches?.find((m) => m.key === "title");
    const titleMatches = titleMatch?.indices as [number, number][] | undefined;

    return {
      item: result.item,
      score: result.score ?? 0,
      titleMatches,
    };
  });
}

/**
 * Group slash commands by their group property
 * @param items - The items to group
 * @param groupOrder - Optional order for groups
 * @returns Grouped commands
 */
export function groupSlashCommands(
  items: SlashCommandItem[],
  groupOrder: string[] = defaultGroupOrder
): SlashCommandGroup[] {
  const groupMap = new Map<string, SlashCommandItem[]>();

  // Group items
  for (const item of items) {
    const groupName = item.group ?? "Other";
    const existing = groupMap.get(groupName) ?? [];
    existing.push(item);
    groupMap.set(groupName, existing);
  }

  // Sort groups by order
  const sortedGroups: SlashCommandGroup[] = [];

  // Add groups in specified order
  for (const name of groupOrder) {
    const groupItems = groupMap.get(name);
    if (groupItems && groupItems.length > 0) {
      sortedGroups.push({ name, items: groupItems });
      groupMap.delete(name);
    }
  }

  // Add remaining groups (Other, etc.)
  for (const [name, groupItems] of groupMap) {
    if (groupItems.length > 0) {
      sortedGroups.push({ name, items: groupItems });
    }
  }

  return sortedGroups;
}

/**
 * Flatten grouped commands back to a single array
 * @param groups - The groups to flatten
 * @returns Flat array of items
 */
export function flattenSlashCommandGroups(groups: SlashCommandGroup[]): SlashCommandItem[] {
  return groups.flatMap((group) => group.items);
}
