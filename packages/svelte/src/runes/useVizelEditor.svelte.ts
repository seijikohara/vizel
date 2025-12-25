import { Editor } from "@tiptap/core";
import type { VizelEditorOptions, VizelFeatureOptions } from "@vizel/core";
import { createImageUploader, createVizelExtensions, type Extensions } from "@vizel/core";
import { onDestroy, onMount } from "svelte";
import { createSlashMenuRenderer } from "../utils/createSlashMenuRenderer.ts";

export interface UseVizelEditorOptions extends VizelEditorOptions {
  /** Additional extensions to include */
  extensions?: Extensions;
}

/**
 * Resolves feature options with default slash menu renderer.
 * If slashCommand is enabled but no suggestion renderer is provided,
 * automatically adds the framework-specific renderer.
 */
function resolveFeatures(features?: VizelFeatureOptions): VizelFeatureOptions | undefined {
  if (!features) {
    // No features specified, use defaults with auto slash menu
    return {
      slashCommand: {
        suggestion: createSlashMenuRenderer(),
      },
    };
  }

  if (features.slashCommand === false) {
    // Slash command explicitly disabled
    return features;
  }

  const slashOptions = typeof features.slashCommand === "object" ? features.slashCommand : {};

  // If suggestion is already provided, use it; otherwise add default
  if (slashOptions.suggestion) {
    return features;
  }

  return {
    ...features,
    slashCommand: {
      ...slashOptions,
      suggestion: createSlashMenuRenderer(),
    },
  };
}

/**
 * Svelte 5 rune to create and manage a Vizel editor instance.
 * Returns a reactive editor state that works with EditorContent component.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 * import { useVizelEditor, EditorContent, BubbleMenu } from '@vizel/svelte';
 *
 * const editor = useVizelEditor({
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
 */
export function useVizelEditor(options: UseVizelEditorOptions = {}) {
  const {
    initialContent,
    placeholder,
    editable = true,
    autofocus = false,
    features,
    extensions: additionalExtensions = [],
    onUpdate,
    onCreate,
    onDestroy: onEditorDestroy,
    onSelectionUpdate,
    onFocus,
    onBlur,
  } = options;

  const resolvedFeatures = resolveFeatures(features);

  // Store image upload options for event handler
  const imageOptions = typeof features?.image === "object" ? features.image : {};

  let editor = $state<Editor | null>(null);

  // Create editor on initialization
  editor = new Editor({
    extensions: [
      ...createVizelExtensions({ placeholder, features: resolvedFeatures }),
      ...additionalExtensions,
    ],
    content: initialContent,
    editable,
    autofocus,
    onUpdate,
    onCreate,
    onDestroy: onEditorDestroy,
    onSelectionUpdate,
    onFocus,
    onBlur,
    // Add vizel-editor class for styling
    editorProps: {
      attributes: {
        class: "vizel-editor",
      },
    },
  });

  // Handle vizel:upload-image custom event from slash command
  const handleUploadEvent = (event: Event) => {
    if (!editor) return;
    const customEvent = event as CustomEvent<{ file: File; editor: Editor }>;
    const { file } = customEvent.detail;
    const pos = editor.state.selection.from;

    // Create upload function with configured options
    const uploadFn = createImageUploader({
      onUpload:
        imageOptions.onUpload ??
        ((f: File) =>
          new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(f);
          })),
      maxFileSize: imageOptions.maxFileSize,
      allowedTypes: imageOptions.allowedTypes,
      onValidationError: imageOptions.onValidationError,
      onUploadError: imageOptions.onUploadError,
    });

    uploadFn(file, editor.view, pos);
  };

  onMount(() => {
    document.addEventListener("vizel:upload-image", handleUploadEvent);
  });

  // Cleanup on component destroy
  onDestroy(() => {
    document.removeEventListener("vizel:upload-image", handleUploadEvent);
    editor?.destroy();
  });

  return {
    get current() {
      return editor;
    },
  };
}
