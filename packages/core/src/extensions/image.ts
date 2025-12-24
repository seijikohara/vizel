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

  const imageExtension = createImageExtension(options);

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
