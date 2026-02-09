import type { Editor, Extensions, JSONContent, VizelFeatureOptions } from "@vizel/core";
import type { ReactNode, Ref } from "react";
import { useImperativeHandle } from "react";
import { useVizelEditor } from "../hooks/useVizelEditor.ts";
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
  extensions,
  className,
  showToolbar = false,
  toolbarContent,
  showBubbleMenu = true,
  enableEmbed = false,
  bubbleMenuContent,
  children,
  onUpdate,
  onCreate,
  onDestroy,
  onSelectionUpdate,
  onFocus,
  onBlur,
}: VizelProps): ReactNode {
  const editor = useVizelEditor({
    ...(initialContent !== undefined && { initialContent }),
    ...(initialMarkdown !== undefined && { initialMarkdown }),
    transformDiagramsOnImport,
    ...(placeholder !== undefined && { placeholder }),
    editable,
    autofocus,
    ...(features !== undefined && { features }),
    ...(extensions !== undefined && { extensions }),
    ...(onUpdate !== undefined && { onUpdate }),
    ...(onCreate !== undefined && { onCreate }),
    ...(onDestroy !== undefined && { onDestroy }),
    ...(onSelectionUpdate !== undefined && { onSelectionUpdate }),
    ...(onFocus !== undefined && { onFocus }),
    ...(onBlur !== undefined && { onBlur }),
  });

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
      {children}
    </div>
  );
}
