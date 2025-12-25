import { Extension } from "@tiptap/core";
import Image from "@tiptap/extension-image";
import { Plugin } from "@tiptap/pm/state";
import {
  createImageUploader,
  createImageUploadPlugin,
  handleImageDrop,
  handleImagePaste,
  type ImageUploadOptions,
} from "../plugins/image-upload.ts";
import { ResizableImage } from "./image-resize.ts";

/**
 * Options for image resize functionality
 */
export interface VizelImageResizeOptions {
  /** Enable image resizing (default: true when resize options provided) */
  enabled?: boolean;
  /** Minimum width in pixels (default: 100) */
  minWidth?: number;
  /** Minimum height in pixels (default: 100) */
  minHeight?: number;
  /** Maximum width in pixels (default: undefined - uses container width) */
  maxWidth?: number;
}

/**
 * Default resize options for images
 */
export const defaultImageResizeOptions = {
  enabled: true,
  minWidth: 100,
  minHeight: 100,
} satisfies VizelImageResizeOptions;

export interface VizelImageOptions {
  /** Allow inline images */
  inline?: boolean;
  /** Allow base64 encoded images */
  allowBase64?: boolean;
  /** HTML attributes for the image element */
  HTMLAttributes?: Record<string, unknown>;
}

/**
 * Create a configured Image extension for Vizel editor.
 *
 * @example
 * ```ts
 * const extensions = [
 *   ...createVizelExtensions(),
 *   createImageExtension({ inline: true }),
 * ];
 * ```
 */
export function createImageExtension(options: VizelImageOptions = {}) {
  return Image.configure({
    inline: options.inline ?? false,
    allowBase64: options.allowBase64 ?? true,
    HTMLAttributes: {
      class: "vizel-image",
      ...options.HTMLAttributes,
    },
  });
}

/**
 * Options for image upload extension
 */
export interface VizelImageUploadOptions extends VizelImageOptions {
  /** Image upload configuration */
  upload: ImageUploadOptions;
  /** Image resize options (set to false to disable) */
  resize?: VizelImageResizeOptions | false;
}

/**
 * Create Image extension with upload support (drag-and-drop, paste, file picker).
 *
 * @example
 * ```ts
 * const extensions = [
 *   ...createVizelExtensions(),
 *   ...createImageUploadExtension({
 *     upload: {
 *       onUpload: async (file) => {
 *         const formData = new FormData();
 *         formData.append("image", file);
 *         const res = await fetch("/api/upload", { method: "POST", body: formData });
 *         return (await res.json()).url;
 *       },
 *       maxFileSize: 10 * 1024 * 1024, // 10MB
 *       onValidationError: (error) => console.error(error.message),
 *       onUploadError: (error) => console.error(`Upload failed: ${error.message}`),
 *     },
 *   }),
 * ];
 * ```
 */
export function createImageUploadExtension(options: VizelImageUploadOptions) {
  const uploadFn = createImageUploader(options.upload);

  // Use ResizableImage if resize is enabled, otherwise use standard Image
  const resizeEnabled = options.resize !== false;
  const resizeOptions = typeof options.resize === "object" ? options.resize : {};

  const imageExtension = resizeEnabled
    ? ResizableImage.configure({
        inline: options.inline ?? false,
        allowBase64: options.allowBase64 ?? true,
        minWidth: resizeOptions.minWidth ?? 100,
        minHeight: resizeOptions.minHeight ?? 100,
        ...(resizeOptions.maxWidth !== undefined && { maxWidth: resizeOptions.maxWidth }),
        HTMLAttributes: {
          class: "vizel-image",
          ...options.HTMLAttributes,
        },
      })
    : createImageExtension(options);

  const uploadExtension = Extension.create({
    name: "imageUpload",

    addProseMirrorPlugins() {
      return [createImageUploadPlugin(options.upload)];
    },
  });

  // Extension for handling drop/paste events
  const dropPasteExtension = Extension.create({
    name: "imageDropPaste",

    addProseMirrorPlugins() {
      return [
        new Plugin({
          props: {
            handlePaste: (view, event) => {
              return handleImagePaste(view, event, uploadFn);
            },
            handleDrop: (view, event, _slice, moved) => {
              return handleImageDrop(view, event, moved, uploadFn);
            },
          },
        }),
      ];
    },
  });

  return [imageExtension, uploadExtension, dropPasteExtension];
}

export { Image };

// Re-export plugin utilities for advanced usage
export {
  createImageUploader,
  createImageUploadPlugin,
  getImageUploadPluginKey,
  handleImageDrop,
  handleImagePaste,
  type ImageUploadOptions,
  type ImageValidationError,
  type ImageValidationErrorType,
  type UploadImageFn,
  validateImageFile,
} from "../plugins/image-upload.ts";
