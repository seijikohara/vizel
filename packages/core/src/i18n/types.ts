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
    /** Aria label for the toolbar container */
    ariaLabel: string;
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
    moreActions: string;
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

  /** Bubble menu labels */
  bubbleMenu: {
    /** Aria label for the bubble menu container */
    ariaLabel: string;
    /** Tooltip for bold button */
    bold: string;
    /** Tooltip for italic button */
    italic: string;
    /** Tooltip for strikethrough button */
    strikethrough: string;
    /** Tooltip for underline button */
    underline: string;
    /** Tooltip for code button */
    code: string;
    /** Tooltip for link button */
    link: string;
    /** Tooltip for superscript button */
    superscript: string;
    /** Tooltip for subscript button */
    subscript: string;
  };

  /** Color picker labels used in bubble menu and standalone color picker */
  colorPicker: {
    /** Title for text color button */
    textColor: string;
    /** Title for highlight button */
    highlight: string;
    /** Aria label for text color palette */
    textColorPalette: string;
    /** Aria label for highlight palette */
    highlightPalette: string;
    /** "Recent" colors section label */
    recent: string;
    /** Hex input placeholder */
    hexPlaceholder: string;
    /** Apply button title */
    apply: string;
    /** Apply button aria label */
    applyAriaLabel: string;
  };

  /** Link editor popup labels */
  linkEditor: {
    /** URL input placeholder */
    urlPlaceholder: string;
    /** Apply link button title */
    apply: string;
    /** Apply link button aria label */
    applyAriaLabel: string;
    /** Remove link button title */
    removeLink: string;
    /** Remove link button aria label */
    removeLinkAriaLabel: string;
    /** Open in new tab label */
    openInNewTab: string;
    /** Visit link label */
    visit: string;
    /** Visit link tooltip */
    visitTitle: string;
    /** Embed toggle label */
    embedAsRichContent: string;
  };
}

/** Title and description for a slash menu item */
export interface SlashItemText {
  title: string;
  description: string;
}

/**
 * Deep partial type — all nested properties become optional.
 * Allows overriding individual strings at any nesting depth.
 *
 * @example
 * ```typescript
 * const partial: VizelLocalePartial = {
 *   slashMenu: { groups: { text: "テキスト" } }, // only override one group name
 * };
 * ```
 */
export type VizelLocalePartial = {
  [K in keyof VizelLocale]?: VizelLocale[K] extends object
    ? {
        [P in keyof VizelLocale[K]]?: VizelLocale[K][P] extends object
          ? { [Q in keyof VizelLocale[K][P]]?: VizelLocale[K][P][Q] }
          : VizelLocale[K][P];
      }
    : VizelLocale[K];
};
