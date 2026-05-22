import {
  createVizelEditorInstance,
  type Editor,
  registerVizelUploadEventHandler,
  type VizelCreateEditorOptions,
  wrapAsVizelError,
} from "@vizel/core";
import type { ShallowRef } from "vue";
import { onBeforeUnmount, onMounted, shallowRef, watch } from "vue";
import { createVizelSlashMenuRenderer } from "./createVizelSlashMenuRenderer.ts";

/**
 * Options for useVizelEditor composable.
 * @see VizelCreateEditorOptions for available options.
 */
export type UseVizelEditorOptions = VizelCreateEditorOptions;

/**
 * Vue composable to create and manage a Vizel editor instance.
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
 * Use `editor.value.commands.setContent(...)` (or the corresponding feature
 * command) to update the document after mount.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useVizelEditor, EditorContent } from '@vizel/vue';
 *
 * const editor = useVizelEditor({
 *   placeholder: "Start typing...",
 *   onUpdate: ({ editor }) => {
 *     console.log(editor.getJSON());
 *   },
 * });
 * </script>
 *
 * <template>
 *   <EditorContent :editor="editor" />
 * </template>
 * ```
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * // With initial markdown content
 * const editor = useVizelEditor({
 *   initialMarkdown: "# Hello World\n\nThis is **bold** text.",
 * });
 * </script>
 * ```
 */
export function useVizelEditor(options: UseVizelEditorOptions = {}): ShallowRef<Editor | null> {
  const { features, extensions: additionalExtensions = [], ...editorOptions } = options;

  // Store image upload options for event handler
  const imageOptions = typeof features?.content?.image === "object" ? features.content.image : {};

  const editor = shallowRef<Editor | null>(null);

  // Handle vizel:upload-image custom event from slash command
  const cleanup: { handler: (() => void) | null } = { handler: null };

  onMounted(() => {
    // Run async editor creation inside an IIFE so a throw becomes a quiet
    // unhandled rejection on the IIFE's promise rather than bubbling out of
    // `onMounted`'s awaited callback (which would mark the whole root
    // component as failed). Mirrors the React/Svelte hook shape.
    void (async () => {
      try {
        const result = await createVizelEditorInstance({
          ...editorOptions,
          ...(features !== undefined && { features }),
          extensions: additionalExtensions,
          createSlashMenuRenderer: createVizelSlashMenuRenderer,
        });

        editor.value = result.editor;

        cleanup.handler = registerVizelUploadEventHandler({
          getEditor: () => editor.value,
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
        // editor when an `@error` listener was wired up purely for
        // telemetry — a real consumer-review footgun.
        editorOptions.onError?.(vizelError);
        throw vizelError;
      }
    })();
  });

  // Mirror the `editable` option into the underlying editor. The constructor
  // option is captured at mount; without this watcher consumers cannot toggle
  // read-only mode after the editor exists. Matches the React hook behavior.
  watch(
    [editor, () => editorOptions.editable],
    ([editorValue, editable]) => {
      const desired = editable ?? true;
      if (editorValue && editorValue.isEditable !== desired) {
        editorValue.setEditable(desired);
      }
    },
    { immediate: true }
  );

  onBeforeUnmount(() => {
    cleanup.handler?.();
    editor.value?.destroy();
  });

  return editor;
}
