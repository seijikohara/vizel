# Type Definitions

Complete TypeScript type reference for Vizel.

## Editor Types

### VizelEditorOptions

Main configuration options for creating an editor.

```typescript
interface VizelEditorOptions {
  /** Initial content in JSON format */
  initialContent?: JSONContent;
  
  /** Placeholder text when editor is empty */
  placeholder?: string;
  
  /** Whether the editor is editable */
  editable?: boolean;
  
  /** Auto focus behavior on mount */
  autofocus?: boolean | 'start' | 'end' | 'all' | number;
  
  /** Feature configuration */
  features?: VizelFeatureOptions;
  
  /** Additional Tiptap extensions */
  extensions?: Extensions;
  
  /** Called when content changes */
  onUpdate?: (props: { editor: Editor }) => void;
  
  /** Called when editor is created */
  onCreate?: (props: { editor: Editor }) => void;
  
  /** Called when editor is destroyed */
  onDestroy?: () => void;
  
  /** Called when selection changes */
  onSelectionUpdate?: (props: { editor: Editor }) => void;
  
  /** Called when editor receives focus */
  onFocus?: (props: { editor: Editor }) => void;
  
  /** Called when editor loses focus */
  onBlur?: (props: { editor: Editor }) => void;
}
```

### JSONContent

Tiptap's JSON content format.

```typescript
interface JSONContent {
  type: string;
  attrs?: Record<string, unknown>;
  content?: JSONContent[];
  marks?: {
    type: string;
    attrs?: Record<string, unknown>;
  }[];
  text?: string;
}
```

### VizelEditorState

Editor state object.

```typescript
interface VizelEditorState {
  /** Whether the editor is currently focused */
  isFocused: boolean;
  
  /** Whether the editor content is empty */
  isEmpty: boolean;
  
  /** Whether undo is available */
  canUndo: boolean;
  
  /** Whether redo is available */
  canRedo: boolean;
  
  /** Current character count */
  characterCount: number;
  
  /** Current word count */
  wordCount: number;
}
```

---

## Feature Options

### VizelFeatureOptions

Configuration for all editor features.

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
}
```

### VizelSlashCommandOptions

```typescript
interface VizelSlashCommandOptions {
  /** Custom slash command items */
  items?: SlashCommandItem[];
  
  /** Suggestion configuration */
  suggestion?: Record<string, unknown>;
}
```

### VizelImageFeatureOptions

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

### VizelCharacterCountOptions

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

### VizelCodeBlockOptions

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

### VizelMarkdownOptions

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

### VizelTextColorOptions

```typescript
interface VizelTextColorOptions {
  /** Custom text color palette */
  textColors?: ColorDefinition[];
  
  /** Custom highlight color palette */
  highlightColors?: ColorDefinition[];
  
  /** Enable multicolor highlights */
  multicolor?: boolean;
}

interface ColorDefinition {
  name: string;
  color: string;
}
```

### VizelMathematicsOptions

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

### VizelLinkOptions

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

### VizelEmbedOptions

```typescript
interface VizelEmbedOptions {
  /** Custom fetch function for embed data */
  fetchEmbedData?: FetchEmbedDataFn;
  
  /** Custom or additional providers */
  providers?: EmbedProvider[];
  
  /** HTML attributes for embed wrapper */
  HTMLAttributes?: Record<string, unknown>;
  
  /** Enable paste handler */
  pasteHandler?: boolean;
  
  /** Inline embeds vs block embeds */
  inline?: boolean;
}

interface EmbedProvider {
  name: string;
  pattern: RegExp;
  transform: (url: string, match: RegExpMatchArray) => EmbedData;
}
```

### VizelDiagramOptions

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

### VizelDragHandleOptions

```typescript
interface VizelDragHandleOptions {
  /** Whether to show the drag handle */
  enabled?: boolean;
}
```

### VizelDetailsOptions

```typescript
interface VizelDetailsOptions {
  /** Details container options */
  details?: DetailsNodeOptions;
  
  /** Content area options */
  detailsContent?: DetailsContentOptions;
  
  /** Summary/header options */
  detailsSummary?: DetailsSummaryOptions;
}
```

### VizelTaskListOptions

```typescript
interface VizelTaskListOptions {
  /** Task list container options */
  taskList?: TaskListOptions;
  
  /** Task item options */
  taskItem?: TaskItemOptions;
}
```

---

## Auto-Save Types

### AutoSaveOptions

```typescript
interface AutoSaveOptions {
  /** Enable auto-save */
  enabled?: boolean;
  
  /** Debounce delay in milliseconds */
  debounceMs?: number;
  
  /** Storage backend */
  storage?: StorageBackend;
  
  /** Storage key for localStorage/sessionStorage */
  key?: string;
  
  /** Callback after successful save */
  onSave?: (content: JSONContent) => void;
  
  /** Callback on save error */
  onError?: (error: Error) => void;
  
  /** Callback when content is restored */
  onRestore?: (content: JSONContent | null) => void;
}
```

### StorageBackend

```typescript
type StorageBackend =
  | 'localStorage'
  | 'sessionStorage'
  | {
      save: (content: JSONContent) => void | Promise<void>;
      load?: () => JSONContent | null | Promise<JSONContent | null>;
    };
```

### SaveStatus

```typescript
type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'error';
```

### AutoSaveResult

```typescript
interface AutoSaveResult {
  /** Current save status */
  status: SaveStatus;
  
  /** Whether there are unsaved changes */
  hasUnsavedChanges: boolean;
  
  /** Timestamp of last successful save */
  lastSaved: Date | null;
  
  /** Last error if status is "error" */
  error: Error | null;
  
  /** Manually trigger save */
  save: () => Promise<void>;
  
  /** Manually restore content */
  restore: () => Promise<JSONContent | null>;
}
```

---

## Theme Types

### Theme

```typescript
type Theme = 'light' | 'dark' | 'system';
```

### ResolvedTheme

```typescript
type ResolvedTheme = 'light' | 'dark';
```

### ThemeProviderOptions

```typescript
interface ThemeProviderOptions {
  /** Default theme */
  defaultTheme?: Theme;
  
  /** Storage key for persistence */
  storageKey?: string;
  
  /** Target element for theme attribute */
  targetSelector?: string;
  
  /** Disable transitions during theme change */
  disableTransitionOnChange?: boolean;
}
```

### ThemeState

```typescript
interface ThemeState {
  /** Current theme setting */
  theme: Theme;
  
  /** Resolved theme (light or dark) */
  resolvedTheme: ResolvedTheme;
  
  /** System preference */
  systemTheme: ResolvedTheme;
  
  /** Function to change theme */
  setTheme: (theme: Theme) => void;
}
```

---

## Slash Command Types

### SlashCommandItem

```typescript
interface SlashCommandItem {
  /** Display title */
  title: string;
  
  /** Description text */
  description: string;
  
  /** Icon identifier (Iconify format) */
  icon: SlashCommandIconName;
  
  /** Command to execute */
  command: (props: { editor: Editor; range: Range }) => void;
  
  /** Search keywords */
  keywords?: string[];
  
  /** Group identifier */
  group?: string;
}
```

### SlashCommandIconName

```typescript
type SlashCommandIconName =
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

---

## Component Props

### EditorContentProps

```typescript
interface EditorContentProps {
  /** Override editor from context */
  editor?: Editor | null;
  
  /** Custom class name */
  className?: string;
}
```

### BubbleMenuProps

```typescript
interface BubbleMenuProps {
  /** Override editor from context */
  editor?: Editor | null;
  
  /** Custom class name */
  className?: string;
  
  /** Custom menu items (React only) */
  children?: ReactNode;
  
  /** Show default toolbar */
  showDefaultToolbar?: boolean;
  
  /** Plugin key */
  pluginKey?: string;
  
  /** Update delay in ms */
  updateDelay?: number;
  
  /** Custom shouldShow function */
  shouldShow?: (props: ShouldShowProps) => boolean;
  
  /** Enable embed option in link editor */
  enableEmbed?: boolean;
}
```

### SaveIndicatorProps

```typescript
interface SaveIndicatorProps {
  /** Current save status */
  status: SaveStatus;
  
  /** Last save timestamp */
  lastSaved: Date | null;
  
  /** Custom class name */
  className?: string;
}
```

### ColorPickerProps

```typescript
interface ColorPickerProps {
  /** Color palette */
  colors: ColorDefinition[];
  
  /** Current selected color */
  value: string;
  
  /** Color change handler */
  onChange: (color: string) => void;
  
  /** Recent color history */
  recentColors?: string[];
}
```

### PortalProps

```typescript
interface PortalProps {
  /** Content to render */
  children: ReactNode;
  
  /** Target container */
  container?: HTMLElement;
}
```

---

## Utility Types

### Range

```typescript
interface Range {
  from: number;
  to: number;
}
```

### EmbedData

```typescript
interface EmbedData {
  type: 'iframe' | 'video' | 'image' | 'link';
  url: string;
  title?: string;
  description?: string;
  thumbnail?: string;
  width?: number;
  height?: number;
  html?: string;
}
```
