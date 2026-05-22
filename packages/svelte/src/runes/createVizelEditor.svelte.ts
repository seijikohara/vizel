import {
  createVizelEditorInstance,
  type Editor,
  registerVizelUploadEventHandler,
  type VizelCreateEditorOptions,
  wrapAsVizelError,
} from "@vizel/core";
import { createVizelSlashMenuRenderer } from "./createVizelSlashMenuRenderer.svelte.js";

/**
 * Options for createVizelEditor rune.
 * @see VizelCreateEditorOptions for available options.
 */
export type CreateVizelEditorOptions = VizelCreateEditorOptions;

/**
 * Svelte 5 rune to create and manage a Vizel editor instance.
 * Returns a reactive editor state that works with EditorContent component.
 *
 * ## Reactive vs mount-time options
 *
 * The Tiptap editor instance is created once on mount. To avoid expensive
 * teardowns, most options are read once at mount and ignored on subsequent
 * renders. The following option is an exception:
 *
 * - `editable` — propagated through `editor.setEditable()` whenever the prop
 *   value changes.
 *
 * Changing `initialContent`, `initialMarkdown`, `placeholder`, `features`,
 * `extensions`, `flavor`, `locale`, or `autofocus` after mount has no effect.
 * Use `editor.current.commands.setContent(...)` (or the corresponding feature
 * command) to update the document after mount.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 * import { createVizelEditor, EditorContent, BubbleMenu } from '@vizel/svelte';
 *
 * const editor = createVizelEditor({
 *   placeholder: "Start typing...",
 *   onUpdate: ({ editor }) => {
 *     console.log(editor.getJSON());
 *   },
 * });
 * </script>
 *
 * <EditorContent editor={editor.current} />
 * {#if editor.current}
 *   <BubbleMenu editor={editor.current} />
 * {/if}
 * ```
 *
 * @example
 * ```svelte
 * <script lang="ts">
 * // With initial markdown content
 * const editor = createVizelEditor({
 *   initialMarkdown: "# Hello World\n\nThis is **bold** text.",
 * });
 * </script>
 * ```
 */
export function createVizelEditor(options: CreateVizelEditorOptions = {}) {
  const { features, extensions: additionalExtensions = [], ...editorOptions } = options;

  // Store image upload options for event handler
  const imageOptions = typeof features?.content?.image === "object" ? features.content.image : {};

  let editor = $state<Editor | null>(null);

  // Create editor on mount and cleanup on destroy (async - optional deps loaded dynamically)
  $effect(() => {
    let isMounted = true;
    let instance: Editor | null = null;
    let cleanupHandler: (() => void) | null = null;

    void (async () => {
      try {
        const result = await createVizelEditorInstance({
          ...editorOptions,
          ...(features !== undefined && { features }),
          extensions: additionalExtensions,
          createSlashMenuRenderer: createVizelSlashMenuRenderer,
        });

        if (!isMounted) {
          result.editor.destroy();
          return;
        }

        instance = result.editor;
        editor = instance;

        // Handle vizel:upload-image custom event from slash command
        cleanupHandler = registerVizelUploadEventHandler({
          getEditor: () => editor,
          getImageOptions: () => imageOptions,
        });
      } catch (error) {
        const vizelError = wrapAsVizelError(error, {
          context: "Editor initialization failed",
          code: "INVALID_CONFIG",
        });
        // Always emit to the consumer handler so observability sinks
        // (Sentry, log pipes) see configuration failures, *and* always
        // rethrow so global handlers can react. Earlier v2.0.0 suppressed
        // the rethrow when a handler was set, which silently blanked the
        // editor when an `onError` was wired up purely for telemetry — a
        // real consumer-review footgun.
        editorOptions.onError?.(vizelError);
        throw vizelError;
      }
    })();

    return () => {
      isMounted = false;
      cleanupHandler?.();
      instance?.destroy();
    };
  });

  // Mirror the `editable` option into the underlying editor. The constructor
  // option is captured at mount; without this effect consumers cannot toggle
  // read-only mode after the editor exists. Matches the React hook behavior.
  $effect(() => {
    const desired = editorOptions.editable ?? true;
    if (editor && editor.isEditable !== desired) {
      editor.setEditable(desired);
    }
  });

  return {
    get current() {
      return editor;
    },
  };
}
