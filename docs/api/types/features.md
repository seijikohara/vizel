# Feature Options

Configuration types for all editor features.

## VizelFeatureOptions

Main configuration for all editor features.

```typescript
interface VizelFeatureOptions {
  /** Slash command menu */
  slashCommand?: VizelSlashCommandOptions | false;
  
  /** Table editing */
  table?: boolean;
  
  /** Link support */
  link?: VizelLinkOptions | boolean;
  
  /** Image upload and resize */
  image?: VizelImageFeatureOptions | false;
  
  /** Markdown import/export */
  markdown?: VizelMarkdownOptions | boolean;
  
  /** Task list support */
  taskList?: VizelTaskListOptions | boolean;
  
  /** Character counting */
  characterCount?: VizelCharacterCountOptions | boolean;
  
  /** Text color and highlight */
  textColor?: VizelTextColorOptions | boolean;
  
  /** Code block with syntax highlighting */
  codeBlock?: VizelCodeBlockOptions | boolean;
  
  /** Mathematics (LaTeX) */
  mathematics?: VizelMathematicsOptions | boolean;
  
  /** Drag handle for blocks */
  dragHandle?: VizelDragHandleOptions | boolean;
  
  /** URL embeds */
  embed?: VizelEmbedOptions | boolean;
  
  /** Collapsible details */
  details?: VizelDetailsOptions | boolean;
  
  /** Diagram support */
  diagram?: VizelDiagramOptions | boolean;

  /** Wiki-style internal links ([[page-name]]) */
  wikiLink?: VizelWikiLinkOptions | boolean;

  /** Comment/annotation marks */
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
  suggestion?: Record<string, unknown>;
}

interface VizelSlashCommandItem {
  /** Display title */
  title: string;
  
  /** Description text */
  description: string;
  
  /** Icon identifier (Iconify format) */
  icon: VizelSlashCommandIconName;
  
  /** Command to execute */
  command: (props: { editor: Editor; range: VizelRange }) => void;
  
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
  onValidationError?: (error: ImageValidationError) => void;
  
  /** Upload error callback */
  onUploadError?: (error: Error, file: File) => void;
}

interface ImageValidationError {
  type: 'file-too-large' | 'invalid-type';
  file: File;
  maxSize?: number;
  allowedTypes?: string[];
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
  name: string;
  pattern: RegExp;
  transform: (url: string, match: RegExpMatchArray) => VizelEmbedData;
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

interface VizelTaskListOptions {
  /** Task list container options */
  taskList?: TaskListOptions;

  /** Task item options */
  taskItem?: TaskItemOptions;
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
  /** Enable comment marks (default: true) */
  enabled?: boolean;
}
```

::: tip
Comment mark options control the editor extension for highlighting commented text. For full comment management (storage, replies, resolution), use the `createVizelCommentHandlers` function from `@vizel/core` or the framework-specific hooks/composables/runes.
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
