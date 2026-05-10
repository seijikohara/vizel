import {
  type Editor,
  getVizelMarkdown,
  setVizelMarkdown,
  type VizelEditorOptions,
} from "@vizel/core";
import type { ReactNode, Ref } from "react";
import { useEffect, useImperativeHandle, useRef } from "react";
import { type UseVizelEditorOptions, useVizelEditor } from "../hooks/useVizelEditor.ts";
import { VizelBlockMenu } from "./VizelBlockMenu.tsx";
import { VizelBubbleMenu } from "./VizelBubbleMenu.tsx";
import { VizelEditor } from "./VizelEditor.tsx";
import { VizelToolbar } from "./VizelToolbar.tsx";

export interface VizelProps extends UseVizelEditorOptions {
  /** Ref to access editor instance */
  ref?: Ref<VizelRef>;
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
}

// Compile-time check: VizelProps must keep covering every field of
// VizelEditorOptions, so the all-in-one component never silently lags behind
// the underlying hook.
type AssertVizelPropsCoversEditorOptions =
  Required<VizelEditorOptions> extends Pick<VizelProps, keyof VizelEditorOptions> ? true : never;
const ASSERT_VIZEL_PROPS_COVERS_EDITOR_OPTIONS = true satisfies AssertVizelPropsCoversEditorOptions;
void ASSERT_VIZEL_PROPS_COVERS_EDITOR_OPTIONS;

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
  ...editorOptions
}: VizelProps): ReactNode {
  const { locale, transformDiagramsOnImport = true } = editorOptions;
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
    ...editorOptions,
    onUpdate: (e) => {
      onUpdateRef.current?.(e);
      // Update markdown if not updating from external change
      if (!isUpdatingFromMarkdownRef.current && markdownRef.current !== undefined) {
        onMarkdownChangeRef.current?.(getVizelMarkdown(e.editor));
      }
    },
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

  const localeProps = locale === undefined ? {} : { locale };

  return (
    <div className={`vizel-root ${className ?? ""}`} data-vizel-root="">
      {showToolbar &&
        editor &&
        (toolbarContent ? (
          <VizelToolbar editor={editor} {...localeProps}>
            {toolbarContent}
          </VizelToolbar>
        ) : (
          <VizelToolbar editor={editor} {...localeProps} />
        ))}
      <VizelEditor editor={editor} />
      {showBubbleMenu &&
        editor &&
        (bubbleMenuContent ? (
          <VizelBubbleMenu editor={editor} enableEmbed={enableEmbed} {...localeProps}>
            {bubbleMenuContent}
          </VizelBubbleMenu>
        ) : (
          <VizelBubbleMenu editor={editor} enableEmbed={enableEmbed} {...localeProps} />
        ))}
      <VizelBlockMenu {...localeProps} />
      {children}
    </div>
  );
}
