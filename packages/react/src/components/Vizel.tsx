import {
  type Editor,
  type Extensions,
  getVizelMarkdown,
  type JSONContent,
  setVizelMarkdown,
  type VizelError,
  type VizelFeatureOptions,
  type VizelMarkdownFlavor,
} from "@vizel/core";
import type { ReactNode, Ref } from "react";
import { useEffect, useImperativeHandle, useRef } from "react";
import { useVizelEditor } from "../hooks/useVizelEditor.ts";
import { VizelBlockMenu } from "./VizelBlockMenu.tsx";
import { VizelBubbleMenu } from "./VizelBubbleMenu.tsx";
import { VizelEditor } from "./VizelEditor.tsx";
import { VizelToolbar } from "./VizelToolbar.tsx";

export interface VizelProps {
  /** Ref to access editor instance */
  ref?: Ref<VizelRef>;
  /** Initial content in JSON format */
  initialContent?: JSONContent;
  /**
   * Initial content in Markdown format.
   * If both initialContent and initialMarkdown are provided, initialMarkdown takes precedence.
   * @example
   * ```tsx
   * <Vizel initialMarkdown="# Hello World\n\nThis is **bold** text." />
   * ```
   */
  initialMarkdown?: string;
  /**
   * Automatically transform diagram code blocks (mermaid, graphviz) to diagram nodes
   * when importing markdown content. Only applies when initialMarkdown is provided.
   * @default true
   */
  transformDiagramsOnImport?: boolean;
  /** Placeholder text when editor is empty */
  placeholder?: string;
  /** Whether the editor is editable (default: true) */
  editable?: boolean;
  /** Auto focus on mount */
  autofocus?: boolean | "start" | "end" | "all" | number;
  /** Feature configuration */
  features?: VizelFeatureOptions;
  /**
   * Markdown output flavor.
   * Controls how Markdown is serialized when exporting content.
   * @default "gfm"
   */
  flavor?: VizelMarkdownFlavor;
  /** Additional Tiptap extensions */
  extensions?: Extensions;
  /** Custom class name for the editor container */
  className?: string;
  /** Whether to show the toolbar (default: false) */
  showToolbar?: boolean;
  /** Custom toolbar content */
  toolbarContent?: ReactNode;
  /** Whether to show the bubble menu (default: true) */
  showBubbleMenu?: boolean;
  /** Enable embed option in bubble menu link editor (requires Embed extension) */
  enableEmbed?: boolean;
  /** Custom bubble menu content */
  bubbleMenuContent?: ReactNode;
  /** Additional children to render inside the editor root */
  children?: ReactNode;
  /**
   * Controlled markdown content.
   * When set, the editor content will be synchronized with this value.
   * Use together with `onMarkdownChange` for controlled mode.
   * @example
   * ```tsx
   * const [md, setMd] = useState("# Hello");
   * <Vizel markdown={md} onMarkdownChange={setMd} />
   * ```
   */
  markdown?: string;
  /**
   * Callback when markdown content changes.
   * Called with the current markdown string when the editor content is updated.
   * Use together with `markdown` for controlled mode.
   */
  onMarkdownChange?: (markdown: string) => void;
  /** Callback when content changes */
  onUpdate?: (props: { editor: Editor }) => void;
  /** Callback when editor is created */
  onCreate?: (props: { editor: Editor }) => void;
  /** Callback when editor is destroyed */
  onDestroy?: () => void;
  /** Callback when selection changes */
  onSelectionUpdate?: (props: { editor: Editor }) => void;
  /** Callback when editor gets focus */
  onFocus?: (props: { editor: Editor }) => void;
  /** Callback when editor loses focus */
  onBlur?: (props: { editor: Editor }) => void;
  /**
   * Callback when an error occurs during editor operations.
   * Provides structured error information for logging or user feedback.
   */
  onError?: (error: VizelError) => void;
}

export interface VizelRef {
  /** The underlying Tiptap editor instance */
  editor: Editor | null;
}

/**
 * Vizel - All-in-one editor component
 *
 * A complete editor component that includes VizelEditor and VizelBubbleMenu.
 * This is the recommended way to use Vizel for most use cases.
 *
 * @example
 * ```tsx
 * import { Vizel } from '@vizel/react';
 *
 * function App() {
 *   return <Vizel placeholder="Type '/' for commands..." />;
 * }
 * ```
 *
 * @example
 * ```tsx
 * import { Vizel, type VizelRef } from '@vizel/react';
 * import { useRef } from 'react';
 *
 * function App() {
 *   const vizelRef = useRef<VizelRef>(null);
 *
 *   const handleSave = () => {
 *     const content = vizelRef.current?.editor?.getJSON();
 *     console.log(content);
 *   };
 *
 *   return (
 *     <>
 *       <Vizel ref={vizelRef} onUpdate={({ editor }) => console.log(editor.getJSON())} />
 *       <button onClick={handleSave}>Save</button>
 *     </>
 *   );
 * }
 * ```
 */
export function Vizel({
  ref,
  initialContent,
  initialMarkdown,
  transformDiagramsOnImport = true,
  placeholder,
  editable = true,
  autofocus = false,
  features,
  flavor,
  extensions,
  className,
  showToolbar = false,
  toolbarContent,
  showBubbleMenu = true,
  enableEmbed = false,
  bubbleMenuContent,
  children,
  markdown,
  onMarkdownChange,
  onUpdate,
  onCreate,
  onDestroy,
  onSelectionUpdate,
  onFocus,
  onBlur,
  onError,
}: VizelProps): ReactNode {
  // Track whether we're currently updating from external markdown change
  const isUpdatingFromMarkdownRef = useRef(false);

  // Keep refs for values accessed in the onUpdate closure to avoid stale captures.
  // useVizelEditor only reads options once at mount time, so the onUpdate callback
  // would otherwise permanently capture the initial markdown/onMarkdownChange values.
  const markdownRef = useRef(markdown);
  markdownRef.current = markdown;
  const onMarkdownChangeRef = useRef(onMarkdownChange);
  onMarkdownChangeRef.current = onMarkdownChange;
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  const editor = useVizelEditor({
    ...(initialContent !== undefined && { initialContent }),
    ...(initialMarkdown !== undefined && { initialMarkdown }),
    transformDiagramsOnImport,
    ...(placeholder !== undefined && { placeholder }),
    editable,
    autofocus,
    ...(features !== undefined && { features }),
    ...(flavor !== undefined && { flavor }),
    ...(extensions !== undefined && { extensions }),
    onUpdate: (e) => {
      onUpdateRef.current?.(e);
      // Update markdown if not updating from external change
      if (!isUpdatingFromMarkdownRef.current && markdownRef.current !== undefined) {
        onMarkdownChangeRef.current?.(getVizelMarkdown(e.editor));
      }
    },
    ...(onCreate !== undefined && { onCreate }),
    ...(onDestroy !== undefined && { onDestroy }),
    ...(onSelectionUpdate !== undefined && { onSelectionUpdate }),
    ...(onFocus !== undefined && { onFocus }),
    ...(onBlur !== undefined && { onBlur }),
    ...(onError !== undefined && { onError }),
  });

  // Watch for external markdown changes (controlled mode)
  useEffect(() => {
    if (markdown === undefined || !editor) return;

    // Get current editor markdown
    const currentMarkdown = getVizelMarkdown(editor);
    if (markdown === currentMarkdown) return;

    // Set flag to prevent emitting onMarkdownChange during this update
    isUpdatingFromMarkdownRef.current = true;
    setVizelMarkdown(editor, markdown, {
      transformDiagrams: transformDiagramsOnImport,
    });
    isUpdatingFromMarkdownRef.current = false;
  }, [markdown, editor, transformDiagramsOnImport]);

  // Expose editor instance via ref
  useImperativeHandle(
    ref,
    () => ({
      editor,
    }),
    [editor]
  );

  return (
    <div className={`vizel-root ${className ?? ""}`} data-vizel-root="">
      {showToolbar && editor && toolbarContent && (
        <VizelToolbar editor={editor}>{toolbarContent}</VizelToolbar>
      )}
      {showToolbar && editor && !toolbarContent && <VizelToolbar editor={editor} />}
      <VizelEditor editor={editor} />
      {showBubbleMenu && editor && bubbleMenuContent && (
        <VizelBubbleMenu editor={editor} enableEmbed={enableEmbed}>
          {bubbleMenuContent}
        </VizelBubbleMenu>
      )}
      {showBubbleMenu && editor && !bubbleMenuContent && (
        <VizelBubbleMenu editor={editor} enableEmbed={enableEmbed} />
      )}
      <VizelBlockMenu />
      {children}
    </div>
  );
}
