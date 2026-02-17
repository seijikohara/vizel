import type { VizelLocale } from "./types.ts";

/**
 * Default English locale for Vizel editor.
 */
export const vizelEnLocale = {
  toolbar: {
    undo: "Undo",
    redo: "Redo",
    bold: "Bold",
    italic: "Italic",
    strikethrough: "Strikethrough",
    underline: "Underline",
    code: "Code",
    heading1: "Heading 1",
    heading2: "Heading 2",
    heading3: "Heading 3",
    bulletList: "Bullet List",
    numberedList: "Numbered List",
    taskList: "Task List",
    quote: "Quote",
    codeBlock: "Code Block",
    horizontalRule: "Horizontal Rule",
  },

  nodeTypes: {
    text: "Text",
    heading1: "Heading 1",
    heading2: "Heading 2",
    heading3: "Heading 3",
    heading4: "Heading 4",
    heading5: "Heading 5",
    heading6: "Heading 6",
    bulletList: "Bullet List",
    numberedList: "Numbered List",
    taskList: "Task List",
    quote: "Quote",
    code: "Code",
  },

  blockMenu: {
    label: "Block menu",
    delete: "Delete",
    duplicate: "Duplicate",
    copy: "Copy",
    cut: "Cut",
    turnInto: "Turn into",
  },

  slashMenu: {
    noResults: "No results",
    groups: {
      text: "Text",
      lists: "Lists",
      blocks: "Blocks",
      media: "Media",
      navigation: "Navigation",
      advanced: "Advanced",
    },
    items: {
      heading1: { title: "Heading 1", description: "Large section heading" },
      heading2: { title: "Heading 2", description: "Medium section heading" },
      heading3: { title: "Heading 3", description: "Small section heading" },
      heading4: { title: "Heading 4", description: "Extra-small heading" },
      heading5: { title: "Heading 5", description: "Paragraph heading" },
      heading6: { title: "Heading 6", description: "Smallest heading" },
      bulletList: { title: "Bullet List", description: "Create a simple bullet list" },
      numberedList: { title: "Numbered List", description: "Create a numbered list" },
      taskList: { title: "Task List", description: "Create a task list with checkboxes" },
      quote: { title: "Quote", description: "Capture a quote" },
      divider: { title: "Divider", description: "Insert a horizontal divider" },
      details: { title: "Details", description: "Collapsible content block" },
      callout: { title: "Callout", description: "Insert a callout block (info, tip, warning)" },
      codeBlock: { title: "Code Block", description: "Insert a code snippet" },
      table: { title: "Table", description: "Insert a table" },
      image: { title: "Image", description: "Insert an image from URL" },
      uploadImage: { title: "Upload Image", description: "Upload an image from your device" },
      embed: { title: "Embed", description: "Embed a URL (YouTube, Twitter, etc.)" },
      tableOfContents: {
        title: "Table of Contents",
        description: "Auto-generated list of headings",
      },
      mathEquation: { title: "Math Equation", description: "Insert a mathematical expression" },
      inlineMath: { title: "Inline Math", description: "Insert an inline math expression" },
      mermaidDiagram: { title: "Mermaid Diagram", description: "Insert a Mermaid diagram" },
      graphvizDiagram: {
        title: "GraphViz Diagram",
        description: "Insert a GraphViz (DOT) diagram",
      },
    },
    enterImageUrl: "Enter image URL:",
    enterUrl: "Enter URL:",
    enterEmbedUrl: "Enter URL to embed:",
  },

  findReplace: {
    label: "Find and Replace",
    findPlaceholder: "Find...",
    replacePlaceholder: "Replace with...",
    noResults: "No results",
    findTextAriaLabel: "Find text",
    replaceTextAriaLabel: "Replace text",
    findPreviousAriaLabel: "Find previous",
    findPreviousTitle: "Find previous (Shift+Enter)",
    findNextAriaLabel: "Find next",
    findNextTitle: "Find next (Enter)",
    replaceAriaLabel: "Replace",
    replaceTitle: "Replace current match",
    replaceAllAriaLabel: "Replace all",
    replaceAllTitle: "Replace all matches",
    caseSensitive: "Case sensitive",
    closeAriaLabel: "Close",
    closeTitle: "Close (Escape)",
  },

  codeBlock: {
    languagePlaceholder: "language",
    hideLineNumbers: "Hide line numbers",
    showLineNumbers: "Show line numbers",
    copyCode: "Copy code",
    copied: "Copied!",
  },

  dragHandle: {
    ariaLabel: "Drag to reorder block, click for menu",
  },

  saveIndicator: {
    saved: "Saved",
    saving: "Saving...",
    unsaved: "Unsaved",
    error: "Error saving",
  },

  nodeSelector: {
    changeBlockType: "Change block type",
    blockTypes: "Block types",
    currentBlockType: "Current block type: {type}",
  },

  relativeTime: {
    justNow: "Just now",
    secondsAgo: "{n}s ago",
    minutesAgo: "{n}m ago",
    hoursAgo: "{n}h ago",
    daysAgo: "{n}d ago",
  },
} satisfies VizelLocale;
