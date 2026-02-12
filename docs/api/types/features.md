# Feature Options

Configuration types for all editor features.

## VizelFeatureOptions

Main configuration for all editor features.

```typescript
interface VizelFeatureOptions {
  /** Slash command menu (type "/" to open) */
  slashCommand?: VizelSlashCommandOptions | boolean;

  /** Table support with column/row controls */
  table?: VizelTableOptions | boolean;

  /** Link extension with autolink and paste support */
  link?: VizelLinkOptions | boolean;

  /** Image upload and resize */
  image?: VizelImageFeatureOptions | boolean;

  /** Markdown import/export support */
  markdown?: VizelMarkdownOptions | boolean;

  /** Task list (checkbox) support */
  taskList?: VizelTaskListExtensionsOptions | boolean;

  /** Character and word count tracking */
  characterCount?: VizelCharacterCountOptions | boolean;

  /** Text color and highlight support */
  textColor?: VizelTextColorOptions | boolean;

  /** Code block with syntax highlighting */
  codeBlock?: VizelCodeBlockOptions | boolean;

  /** Mathematics (LaTeX) support with KaTeX rendering */
  mathematics?: VizelMathematicsOptions | boolean;

  /** Drag handle for block reordering */
  dragHandle?: VizelDragHandleOptions | boolean;

  /** URL embedding with oEmbed/OGP support */
  embed?: VizelEmbedOptions | boolean;

  /** Collapsible content blocks (accordion) */
  details?: VizelDetailsOptions | boolean;

  /** Callout/admonition blocks (info, warning, danger, tip, note) */
  callout?: VizelCalloutOptions | boolean;

  /** Diagram support (Mermaid, GraphViz) */
  diagram?: VizelDiagramOptions | boolean;

  /** Wiki links ([[page-name]], [[page|display text]]) */
  wikiLink?: VizelWikiLinkOptions | boolean;

  /** @mention autocomplete (disabled by default) */
  mention?: VizelMentionOptions | boolean;

  /** Table of Contents block that auto-collects headings */
  tableOfContents?: VizelTableOfContentsOptions | boolean;

  /** Superscript text formatting */
  superscript?: boolean;

  /** Subscript text formatting */
  subscript?: boolean;

  /** Typography transformations (smart quotes, em dashes) */
  typography?: boolean;

  /** Comment/annotation marks for collaborative review */
  comment?: VizelCommentMarkOptions | boolean;

  /** Real-time collaboration mode (disables History extension) */
  collaboration?: boolean;
}
```

## Slash Command

```typescript
interface VizelSlashCommandOptions {
  /** Custom slash command items */
  items?: VizelSlashCommandItem[];
  
  /** Suggestion configuration */
  suggestion?: Partial<SuggestionOptions<VizelSlashCommandItem>>;
}

interface VizelSlashCommandItem {
  /** Display title */
  title: string;
  
  /** Description text */
  description: string;
  
  /** Icon identifier (Iconify format) */
  icon: VizelSlashCommandIconName;
  
  /** Command to execute */
  command: (props: { editor: Editor; range: VizelSlashCommandRange }) => void;
  
  /** Search keywords */
  keywords?: string[];
  
  /** Group identifier */
  group?: string;
}

type VizelSlashCommandIconName =
  | 'lucide:heading-1'
  | 'lucide:heading-2'
  | 'lucide:heading-3'
  | 'lucide:pilcrow'
  | 'lucide:list'
  | 'lucide:list-ordered'
  | 'lucide:list-todo'
  | 'lucide:quote'
  | 'lucide:code'
  | 'lucide:image'
  | 'lucide:minus'
  | 'lucide:table'
  | 'lucide:chevrons-down-up'
  | 'lucide:link'
  | 'lucide:sigma'
  | 'lucide:git-branch'
  | string; // Any Iconify icon
```

## Image

```typescript
interface VizelImageFeatureOptions {
  /** Enable image resizing */
  resize?: boolean;
  
  /** Custom upload handler */
  onUpload?: (file: File) => Promise<string>;
  
  /** Maximum file size in bytes */
  maxFileSize?: number;
  
  /** Allowed MIME types */
  allowedTypes?: string[];
  
  /** Validation error callback */
  onValidationError?: (error: VizelImageValidationError) => void;
  
  /** Upload error callback */
  onUploadError?: (error: Error, file: File) => void;
}

interface VizelImageValidationError {
  type: 'file_too_large' | 'invalid_type';
  message: string;
  file: File;
}
```

## Link

```typescript
interface VizelLinkOptions {
  /** Open links on click */
  openOnClick?: boolean;
  
  /** Auto-link URLs while typing */
  autolink?: boolean;
  
  /** Link pasted URLs */
  linkOnPaste?: boolean;
  
  /** Default protocol for links */
  defaultProtocol?: string;
  
  /** HTML attributes for links */
  HTMLAttributes?: Record<string, string>;
}
```

## Markdown

```typescript
interface VizelMarkdownOptions {
  /** Indentation settings */
  indentation?: {
    style: 'space' | 'tab';
    size: number;
  };
  
  /** Enable GitHub Flavored Markdown */
  gfm?: boolean;
  
  /** Convert newlines to <br> */
  breaks?: boolean;
}
```

## Character Count

```typescript
interface VizelCharacterCountOptions {
  /** Maximum characters (null = unlimited) */
  limit?: number | null;
  
  /** Counting mode */
  mode?: 'textSize' | 'nodeSize';
  
  /** Custom word counter function */
  wordCounter?: (text: string) => number;
}
```

## Text Color

```typescript
interface VizelTextColorOptions {
  /** Custom text color palette */
  textColors?: VizelColorDefinition[];
  
  /** Custom highlight color palette */
  highlightColors?: VizelColorDefinition[];
  
  /** Enable multicolor highlights */
  multicolor?: boolean;
}

interface VizelColorDefinition {
  name: string;
  color: string;
}
```

## Code Block

```typescript
interface VizelCodeBlockOptions {
  /** Default language for new code blocks */
  defaultLanguage?: string;
  
  /** Show line numbers */
  lineNumbers?: boolean;
  
  /** Custom Lowlight instance */
  lowlight?: ReturnType<typeof createLowlight>;
}
```

## Mathematics

```typescript
interface VizelMathematicsOptions {
  /** KaTeX rendering options */
  katexOptions?: KatexOptions;
  
  /** Enable $...$ input rules */
  inlineInputRules?: boolean;
  
  /** Enable $$...$$ input rules */
  blockInputRules?: boolean;
}
```

## Embed

```typescript
interface VizelEmbedOptions {
  /** Custom fetch function for embed data */
  fetchEmbedData?: VizelFetchEmbedDataFn;
  
  /** Custom or additional providers */
  providers?: VizelEmbedProvider[];
  
  /** HTML attributes for embed wrapper */
  HTMLAttributes?: Record<string, unknown>;
  
  /** Enable paste handler */
  pasteHandler?: boolean;
  
  /** Inline embeds vs block embeds */
  inline?: boolean;
}

interface VizelEmbedProvider {
  /** Provider name (e.g., 'youtube', 'twitter') */
  name: string;
  /** URL patterns to match */
  patterns: RegExp[];
  /** oEmbed API endpoint (optional) */
  oEmbedEndpoint?: string;
  /** Whether the oEmbed endpoint supports CORS */
  supportsCors?: boolean;
  /** Transform function for URL (e.g., extract video ID) */
  transform?: (url: string) => string;
}
```

## Diagram

```typescript
interface VizelDiagramOptions {
  /** Mermaid configuration */
  mermaidConfig?: MermaidConfig;
  
  /** GraphViz layout engine */
  graphvizEngine?: 'dot' | 'neato' | 'fdp' | 'sfdp' | 'twopi' | 'circo';
  
  /** Default diagram type */
  defaultType?: 'mermaid' | 'graphviz';
  
  /** Default Mermaid code */
  defaultCode?: string;
  
  /** Default GraphViz code */
  defaultGraphvizCode?: string;
}
```

## Other Feature Options

```typescript
interface VizelDragHandleOptions {
  /** Whether to show the drag handle */
  enabled?: boolean;
}

interface VizelDetailsOptions {
  /** Details container options */
  details?: DetailsNodeOptions;
  
  /** Content area options */
  detailsContent?: DetailsContentOptions;
  
  /** Summary/header options */
  detailsSummary?: DetailsSummaryOptions;
}

interface VizelTaskListExtensionsOptions {
  /** Options for the task list extension */
  taskList?: VizelTaskListOptions;

  /** Options for the task item extension */
  taskItem?: VizelTaskItemOptions;
}
```

## Wiki Link

```typescript
interface VizelWikiLinkOptions {
  /** Resolve a page name to a URL (default: (p) => '#' + p) */
  resolveLink?: (pageName: string) => string;

  /** Check if a page exists for visual differentiation (default: () => true) */
  pageExists?: (pageName: string) => boolean;

  /** Get page suggestions for autocomplete */
  getPageSuggestions?: (query: string) => VizelWikiLinkSuggestion[];

  /** Callback when a wiki link is clicked */
  onLinkClick?: (pageName: string, event: MouseEvent) => void;

  /** CSS class for existing page links (default: 'vizel-wiki-link--existing') */
  existingClass?: string;

  /** CSS class for non-existing page links (default: 'vizel-wiki-link--new') */
  newClass?: string;

  /** Additional HTML attributes */
  HTMLAttributes?: Record<string, unknown>;
}

interface VizelWikiLinkSuggestion {
  /** Page name */
  name: string;

  /** Optional display label (defaults to name) */
  label?: string;
}
```

## Comment Mark

```typescript
interface VizelCommentMarkOptions {
  /** Additional HTML attributes for comment marks */
  HTMLAttributes?: Record<string, string>;
  /** Callback when a comment mark is clicked */
  onCommentClick?: (commentId: string) => void;
}
```

::: tip
Comment mark options control the editor extension for highlighting commented text. For full comment management (storage, replies, resolution), use the framework-specific hooks/composables/runes: `useVizelComment` (React/Vue) or `createVizelComment` (Svelte).
:::

## Collaboration

The `collaboration` feature option is a boolean flag. Setting it to `true` disables the built-in History extension (since Yjs handles undo/redo via `y-undo`).

```typescript
// Enable collaboration mode
const editor = useVizelEditor({
  features: {
    collaboration: true, // disables History extension
  },
  extensions: [
    Collaboration.configure({ document: ydoc }),
    CollaborationCursor.configure({ provider, user }),
  ],
});
```

::: warning
You must install and configure `yjs`, a Yjs provider, `@tiptap/extension-collaboration`, and `@tiptap/extension-collaboration-cursor` separately. See the [Collaboration Guide](/guide/collaboration) for details.
:::
