/**
 * File Handler Extension
 *
 * Provides unified file drop and paste handling using @tiptap/extension-file-handler.
 * Integrates with the image upload system for seamless file processing.
 */
import type { Editor } from "@tiptap/core";
import { FileHandler } from "@tiptap/extension-file-handler";

/**
 * Options for file handler extension
 */
export interface VizelFileHandlerOptions {
  /**
   * Allowed MIME types for files
   * @default ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"]
   */
  allowedMimeTypes?: string[];

  /**
   * Handler called when files are pasted
   * @param editor - The editor instance
   * @param files - Array of pasted files
   * @param htmlContent - HTML content from clipboard (useful for external images)
   */
  onPaste?: (editor: Editor, files: File[], htmlContent: string | undefined) => void;

  /**
   * Handler called when files are dropped
   * @param editor - The editor instance
   * @param files - Array of dropped files
   * @param pos - Drop position in the document
   */
  onDrop?: (editor: Editor, files: File[], pos: number) => void;

  /**
   * Handler for validation errors (file type not allowed, etc.)
   */
  onError?: (error: FileHandlerError) => void;
}

/**
 * File handler error types
 */
export type FileHandlerErrorType = "invalid_mime_type" | "no_files";

/**
 * File handler error
 */
export interface FileHandlerError {
  type: FileHandlerErrorType;
  message: string;
  files?: File[];
}

/**
 * Default allowed MIME types (images only)
 */
export const DEFAULT_FILE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
];

/**
 * Filter files by allowed MIME types
 */
export function filterFilesByMimeType(files: File[], allowedMimeTypes: string[]): File[] {
  return files.filter((file) => {
    // Check exact match first
    if (allowedMimeTypes.includes(file.type)) {
      return true;
    }

    // Check wildcard patterns (e.g., "image/*")
    const wildcardMatch = allowedMimeTypes.some((type) => {
      if (type.endsWith("/*")) {
        const category = type.slice(0, -2);
        return file.type.startsWith(`${category}/`);
      }
      return false;
    });

    return wildcardMatch;
  });
}

/**
 * Create a file handler extension with unified drop/paste handling.
 *
 * This extension uses @tiptap/extension-file-handler to provide
 * consistent file handling across paste and drop operations.
 *
 * @example Basic usage with image upload
 * ```ts
 * const extensions = [
 *   ...createVizelExtensions(),
 *   createFileHandlerExtension({
 *     onDrop: (editor, files, pos) => {
 *       files.forEach(file => {
 *         // Handle dropped file (e.g., upload image)
 *         uploadImage(file).then(url => {
 *           editor.chain().focus().setImage({ src: url }).run();
 *         });
 *       });
 *     },
 *     onPaste: (editor, files) => {
 *       files.forEach(file => {
 *         // Handle pasted file
 *         uploadImage(file).then(url => {
 *           editor.chain().focus().setImage({ src: url }).run();
 *         });
 *       });
 *     },
 *   }),
 * ];
 * ```
 *
 * @example With custom MIME types
 * ```ts
 * createFileHandlerExtension({
 *   allowedMimeTypes: ['image/*', 'application/pdf'],
 *   onDrop: (editor, files, pos) => { ... },
 *   onPaste: (editor, files) => { ... },
 * });
 * ```
 */
export function createFileHandlerExtension(options: VizelFileHandlerOptions = {}) {
  const { allowedMimeTypes = DEFAULT_FILE_MIME_TYPES, onPaste, onDrop, onError } = options;

  return FileHandler.configure({
    allowedMimeTypes,

    onPaste: (currentEditor, files, htmlContent) => {
      if (files.length === 0) {
        return;
      }

      // Filter files by allowed MIME types
      const validFiles = filterFilesByMimeType(files, allowedMimeTypes);

      if (validFiles.length === 0) {
        onError?.({
          type: "invalid_mime_type",
          message: `No files with allowed MIME types. Allowed: ${allowedMimeTypes.join(", ")}`,
          files,
        });
        return;
      }

      onPaste?.(currentEditor, validFiles, htmlContent);
    },

    onDrop: (currentEditor, files, pos) => {
      if (files.length === 0) {
        return;
      }

      // Filter files by allowed MIME types
      const validFiles = filterFilesByMimeType(files, allowedMimeTypes);

      if (validFiles.length === 0) {
        onError?.({
          type: "invalid_mime_type",
          message: `No files with allowed MIME types. Allowed: ${allowedMimeTypes.join(", ")}`,
          files,
        });
        return;
      }

      onDrop?.(currentEditor, validFiles, pos);
    },
  });
}

/**
 * Create file handler handlers for image upload integration.
 *
 * This is a convenience function that creates onPaste and onDrop handlers
 * that integrate with the image upload system.
 *
 * @example
 * ```ts
 * const { onPaste, onDrop } = createImageFileHandlers({
 *   onUpload: async (file) => {
 *     const formData = new FormData();
 *     formData.append("file", file);
 *     const res = await fetch("/api/upload", { method: "POST", body: formData });
 *     return (await res.json()).url;
 *   },
 *   onError: (error) => console.error(error),
 * });
 *
 * const extension = createFileHandlerExtension({ onPaste, onDrop });
 * ```
 */
export interface ImageFileHandlerOptions {
  /**
   * Upload function that receives a file and returns a URL
   */
  onUpload: (file: File) => Promise<string>;

  /**
   * Called when an upload error occurs
   */
  onUploadError?: (error: Error, file: File) => void;

  /**
   * Called during upload progress (if supported)
   */
  onUploadProgress?: (progress: number, file: File) => void;
}

export interface ImageFileHandlers {
  onPaste: NonNullable<VizelFileHandlerOptions["onPaste"]>;
  onDrop: NonNullable<VizelFileHandlerOptions["onDrop"]>;
}

export function createImageFileHandlers(options: ImageFileHandlerOptions): ImageFileHandlers {
  const { onUpload, onUploadError } = options;

  const handleFiles = async (editor: Editor, files: File[]): Promise<void> => {
    for (const file of files) {
      try {
        const url = await onUpload(file);
        editor.chain().focus().setImage({ src: url }).run();
      } catch (error) {
        onUploadError?.(error instanceof Error ? error : new Error(String(error)), file);
      }
    }
  };

  return {
    onPaste: (editor, files, _htmlContent) => {
      void handleFiles(editor, files);
    },
    onDrop: (editor, files, _pos) => {
      void handleFiles(editor, files);
    },
  };
}

// Re-export the base FileHandler for advanced usage
export { FileHandler };
