/**
 * Locale definition for all Vizel UI strings.
 *
 * Provide a custom locale object to translate the editor interface.
 * All properties are required — use `createVizelLocale()` to merge
 * partial translations with the default English locale.
 */
export interface VizelLocale {
  /** Toolbar button labels */
  toolbar: {
    undo: string;
    redo: string;
    bold: string;
    italic: string;
    strikethrough: string;
    underline: string;
    code: string;
    heading1: string;
    heading2: string;
    heading3: string;
    bulletList: string;
    numberedList: string;
    taskList: string;
    quote: string;
    codeBlock: string;
    horizontalRule: string;
  };

  /** Node type selector labels */
  nodeTypes: {
    text: string;
    heading1: string;
    heading2: string;
    heading3: string;
    heading4: string;
    heading5: string;
    heading6: string;
    bulletList: string;
    numberedList: string;
    taskList: string;
    quote: string;
    code: string;
  };

  /** Block context menu */
  blockMenu: {
    /** Menu aria-label */
    label: string;
    delete: string;
    duplicate: string;
    copy: string;
    cut: string;
    turnInto: string;
  };

  /** Slash command menu */
  slashMenu: {
    /** No results message */
    noResults: string;
    /** Group names */
    groups: {
      text: string;
      lists: string;
      blocks: string;
      media: string;
      navigation: string;
      advanced: string;
    };
    /** Item titles and descriptions */
    items: {
      heading1: SlashItemText;
      heading2: SlashItemText;
      heading3: SlashItemText;
      heading4: SlashItemText;
      heading5: SlashItemText;
      heading6: SlashItemText;
      bulletList: SlashItemText;
      numberedList: SlashItemText;
      taskList: SlashItemText;
      quote: SlashItemText;
      divider: SlashItemText;
      details: SlashItemText;
      callout: SlashItemText;
      codeBlock: SlashItemText;
      table: SlashItemText;
      image: SlashItemText;
      uploadImage: SlashItemText;
      embed: SlashItemText;
      tableOfContents: SlashItemText;
      mathEquation: SlashItemText;
      inlineMath: SlashItemText;
      mermaidDiagram: SlashItemText;
      graphvizDiagram: SlashItemText;
    };
    /** Prompt for image URL input */
    enterImageUrl: string;
    /** Prompt for generic URL input */
    enterUrl: string;
    /** Prompt for embed URL input */
    enterEmbedUrl: string;
  };

  /** Find and replace panel */
  findReplace: {
    /** Panel aria-label */
    label: string;
    findPlaceholder: string;
    replacePlaceholder: string;
    noResults: string;
    findTextAriaLabel: string;
    replaceTextAriaLabel: string;
    findPreviousAriaLabel: string;
    findPreviousTitle: string;
    findNextAriaLabel: string;
    findNextTitle: string;
    replaceAriaLabel: string;
    replaceTitle: string;
    replaceAllAriaLabel: string;
    replaceAllTitle: string;
    caseSensitive: string;
    closeAriaLabel: string;
    closeTitle: string;
  };

  /** Code block UI */
  codeBlock: {
    languagePlaceholder: string;
    hideLineNumbers: string;
    showLineNumbers: string;
    copyCode: string;
    copied: string;
  };

  /** Drag handle */
  dragHandle: {
    ariaLabel: string;
  };

  /** Save indicator */
  saveIndicator: {
    saved: string;
    saving: string;
    unsaved: string;
    error: string;
  };

  /** Node selector (block type dropdown) */
  nodeSelector: {
    /** Trigger button title */
    changeBlockType: string;
    /** Dropdown aria-label */
    blockTypes: string;
    /** Template for trigger aria-label. Use `{type}` for the current type name. */
    currentBlockType: string;
  };

  /**
   * Relative time strings.
   * Use `{n}` as placeholder for the numeric value.
   */
  relativeTime: {
    justNow: string;
    /** e.g. "{n}s ago" */
    secondsAgo: string;
    /** e.g. "{n}m ago" */
    minutesAgo: string;
    /** e.g. "{n}h ago" */
    hoursAgo: string;
    /** e.g. "{n}d ago" */
    daysAgo: string;
  };
}

/** Title and description for a slash menu item */
export interface SlashItemText {
  title: string;
  description: string;
}

/**
 * Recursive partial type for locale overrides.
 */
export type VizelLocalePartial = {
  [K in keyof VizelLocale]?: VizelLocale[K] extends object
    ? { [P in keyof VizelLocale[K]]?: VizelLocale[K][P] }
    : VizelLocale[K];
};
