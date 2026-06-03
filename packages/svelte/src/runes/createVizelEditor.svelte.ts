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
 *
 * `editable` accepts either a literal boolean or a getter `() => boolean`
 * so the rune can mirror the value through `editor.setEditable()` when it
 * changes. Other options are captured once at mount and ignored
 * thereafter — Tiptap does not support runtime swapping of
 * `initialContent`, `extensions`, etc.
 *
 * @see VizelCreateEditorOptions for available options.
 */
export type CreateVizelEditorOptions = Omit<VizelCreateEditorOptions, "editable"> & {
  /**
   * Whether the editor accepts user input. Pass `() => boolean` to drive
   * it from a `$state` rune; the effect resolves the getter on every
   * change.
   */
  editable?: boolean | (() => boolean);
};

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
 * Use `editor.current?.commands.setContent(...)` (or the corresponding
 * feature command) to update the document after mount.
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
  const { features, extensions: additionalExtensions = [], editable, ...editorOptions } = options;
  // Resolve `editable` whether it was passed as a literal or a getter; the
  // effect below reads the resolver each tick so a `() => $state` source
  // becomes reactive without changing the underlying type at every call site.
  const resolveEditable = (): boolean =>
    typeof editable === "function" ? editable() : (editable ?? true);

  // Store image upload options for event handler
  const imageOptions = typeof features?.content?.image === "object" ? features.content.image : {};

  // Hold the editor in `$state.raw`: the Tiptap `Editor` is an opaque,
  // mutable class instance, so deep proxying buys nothing and the rune
  // tracks identity, not field mutation. Re-assignment on create triggers
  // reactivity; in-place edits do not, which matches Tiptap's transaction
  // model. ADR-0004 mandates this idiom, mirroring React `useState` and
  // Vue `shallowRef`.
  let editor = $state.raw<Editor | null>(null);

  // Create editor on mount and cleanup on destroy (async - optional deps loaded dynamically)
  $effect(() => {
    let isMounted = true;
    let instance: Editor | null = null;
    let cleanupHandler: (() => void) | null = null;

    void (async () => {
      try {
        const result = await createVizelEditorInstance({
          ...editorOptions,
          editable: resolveEditable(),
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
          // Reach the editor-level `onError` so an upload rejection emits a
          // `VizelError` (`UPLOAD_FAILED`) to observability sinks.
          getOnError: () => editorOptions.onError,
        });
      } catch (error) {
        const vizelError = wrapAsVizelError(error, {
          context: "Editor initialization failed",
          code: "INVALID_CONFIG",
        });
        // Always emit to the consumer handler so observability sinks
        // (Sentry, log pipes) see configuration failures, *and* always
        // rethrow so global handlers can react. Suppressing the rethrow
        // when a handler is set silently blanks the editor whenever an
        // `onError` is wired up purely for telemetry, so the rethrow runs
        // unconditionally.
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
  // read-only mode after the editor exists. `resolveEditable()` reads the
  // caller-supplied getter (or literal), so passing `() => $state` makes
  // the effect rerun when the state changes. Matches the React hook behavior.
  $effect(() => {
    const desired = resolveEditable();
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
