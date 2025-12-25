import type { Editor } from "@tiptap/core";
import type { EditorView } from "@tiptap/pm/view";
import { createImageUploader } from "../extensions/image.ts";
import type { VizelFeatureOptions, VizelImageFeatureOptions } from "../types.ts";

/**
 * Options for resolving features with a custom slash menu renderer.
 */
export interface ResolveFeaturesOptions {
  /** The features configuration */
  features?: VizelFeatureOptions;
  /** Factory function to create the slash menu renderer */
  createSlashMenuRenderer: () => unknown;
}

/**
 * Resolves feature options with default slash menu renderer.
 * If slashCommand is enabled but no suggestion renderer is provided,
 * automatically adds the provided renderer.
 */
export function resolveFeatures(options: ResolveFeaturesOptions): VizelFeatureOptions | undefined {
  const { features, createSlashMenuRenderer } = options;

  if (!features) {
    // No features specified, use defaults with auto slash menu
    return {
      slashCommand: {
        suggestion: createSlashMenuRenderer() as Record<string, unknown>,
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
      suggestion: createSlashMenuRenderer() as Record<string, unknown>,
    },
  };
}

/** Type guard for vizel upload image custom event */
const isVizelUploadImageEvent = (
  event: Event
): event is CustomEvent<{ file: File; editor: Editor }> =>
  event instanceof CustomEvent &&
  typeof event.detail === "object" &&
  event.detail !== null &&
  "file" in event.detail &&
  "editor" in event.detail;

/**
 * Options for creating an image upload event handler.
 */
export interface CreateUploadEventHandlerOptions {
  /** Function to get the current editor instance */
  getEditor: () => Editor | null | undefined;
  /** Function to get the current image options */
  getImageOptions: () => VizelImageFeatureOptions;
}

/**
 * Creates an event handler for the vizel:upload-image custom event.
 * This handler is used by the slash command to trigger image uploads.
 */
export function createUploadEventHandler(
  options: CreateUploadEventHandlerOptions
): (event: Event) => void {
  return (event: Event) => {
    const editor = options.getEditor();
    if (!editor) return;

    if (!isVizelUploadImageEvent(event)) return;
    const { file } = event.detail;
    const pos = editor.state.selection.from;
    const imageOptions = options.getImageOptions();

    // Create upload function with configured options
    const uploadFn = createImageUploader({
      onUpload:
        imageOptions.onUpload ??
        ((f: File) =>
          new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => {
              if (typeof reader.result === "string") {
                resolve(reader.result);
              }
            };
            reader.readAsDataURL(f);
          })),
      ...(imageOptions.maxFileSize !== undefined && { maxFileSize: imageOptions.maxFileSize }),
      ...(imageOptions.allowedTypes !== undefined && { allowedTypes: imageOptions.allowedTypes }),
      ...(imageOptions.onValidationError !== undefined && {
        onValidationError: imageOptions.onValidationError,
      }),
      ...(imageOptions.onUploadError !== undefined && {
        onUploadError: imageOptions.onUploadError,
      }),
    });

    uploadFn(file, editor.view as EditorView, pos);
  };
}

/**
 * The custom event name for image uploads from slash commands.
 */
export const VIZEL_UPLOAD_IMAGE_EVENT = "vizel:upload-image";

/**
 * Registers the image upload event handler.
 * Returns a cleanup function to remove the event listener.
 */
export function registerUploadEventHandler(options: CreateUploadEventHandlerOptions): () => void {
  const handler = createUploadEventHandler(options);
  document.addEventListener(VIZEL_UPLOAD_IMAGE_EVENT, handler);
  return () => {
    document.removeEventListener(VIZEL_UPLOAD_IMAGE_EVENT, handler);
  };
}

/**
 * Default editor props for Vizel editors.
 */
export const defaultEditorProps = {
  attributes: {
    class: "vizel-editor",
  },
};
