import type { EditorState } from "@tiptap/pm/state";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet, type EditorView } from "@tiptap/pm/view";

/**
 * Image upload options
 */
export interface ImageUploadOptions {
  /**
   * Handler to upload file and return the uploaded image URL
   * @param file The file to upload
   * @returns Promise resolving to the uploaded image URL
   */
  onUpload: (file: File) => Promise<string>;

  /**
   * Maximum file size in bytes
   * @default 20MB (20 * 1024 * 1024)
   */
  maxFileSize?: number;

  /**
   * Allowed MIME types
   * @default ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"]
   */
  allowedTypes?: string[];

  /**
   * CSS class for the placeholder element
   * @default "vizel-image-placeholder"
   */
  placeholderClass?: string;

  /**
   * CSS class for the uploading image
   * @default "vizel-image-uploading"
   */
  imageClass?: string;

  /**
   * Callback for validation errors
   */
  onValidationError?: (error: VizelImageValidationError) => void;

  /**
   * Callback for upload errors
   */
  onUploadError?: (error: Error, file: File) => void;
}

/**
 * Image validation error types
 */
export type VizelImageValidationErrorType = "invalid_type" | "file_too_large";

/**
 * Image validation error
 */
export interface VizelImageValidationError {
  type: VizelImageValidationErrorType;
  message: string;
  file: File;
}

// Plugin key for identifying the plugin state
const imageUploadKey = new PluginKey<DecorationSet>("vizel-image-upload");

// Default values
const DEFAULT_MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const DEFAULT_ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
];

// Action types for plugin state management
interface ImageUploadAddAction {
  type: "add";
  id: object;
  pos: number;
  previewSrc: string;
}

interface ImageUploadRemoveAction {
  type: "remove";
  id: object;
}

type ImageUploadAction = ImageUploadAddAction | ImageUploadRemoveAction;

/** Type guard for ImageUploadAction */
const isImageUploadAction = (value: unknown): value is ImageUploadAction =>
  typeof value === "object" &&
  value !== null &&
  "type" in value &&
  (value.type === "add" || value.type === "remove");

/**
 * Create an image upload plugin with decoration-based placeholders
 */
export function createVizelImageUploadPlugin(options: ImageUploadOptions): Plugin {
  const { placeholderClass = "vizel-image-placeholder", imageClass = "vizel-image-uploading" } =
    options;

  return new Plugin({
    key: imageUploadKey,
    state: {
      init(): DecorationSet {
        return DecorationSet.empty;
      },
      apply(tr, currentSet: DecorationSet): DecorationSet {
        // Map decorations through document changes
        let decoSet = currentSet.map(tr.mapping, tr.doc);

        const meta = tr.getMeta(imageUploadKey);
        const action = isImageUploadAction(meta) ? meta : undefined;

        if (action?.type === "add") {
          const { id, pos, previewSrc } = action;

          // Create placeholder DOM element
          const placeholder = document.createElement("div");
          placeholder.setAttribute("class", placeholderClass);

          const image = document.createElement("img");
          image.setAttribute("class", imageClass);
          image.src = previewSrc;
          placeholder.appendChild(image);

          // Add spinner
          const spinner = document.createElement("div");
          spinner.setAttribute("class", "vizel-image-spinner");
          placeholder.appendChild(spinner);

          const deco = Decoration.widget(pos, placeholder, { id });
          decoSet = decoSet.add(tr.doc, [deco]);
        } else if (action?.type === "remove") {
          decoSet = decoSet.remove(
            decoSet.find(undefined, undefined, (spec) => spec.id === action.id)
          );
        }

        return decoSet;
      },
    },
    props: {
      decorations(state: EditorState): DecorationSet {
        return imageUploadKey.getState(state) ?? DecorationSet.empty;
      },
    },
  });
}

/**
 * Find placeholder position by ID
 */
function findPlaceholder(state: EditorState, id: object): number | null {
  const decos = imageUploadKey.getState(state);
  if (!decos) {
    return null;
  }
  const found = decos.find(undefined, undefined, (spec) => spec.id === id);
  return found.length > 0 ? (found[0]?.from ?? null) : null;
}

/**
 * Validate an image file
 */
export function validateVizelImageFile(
  file: File,
  options: Pick<ImageUploadOptions, "maxFileSize" | "allowedTypes">
): VizelImageValidationError | null {
  const maxFileSize = options.maxFileSize ?? DEFAULT_MAX_FILE_SIZE;
  const allowedTypes = options.allowedTypes ?? DEFAULT_ALLOWED_TYPES;

  // Check MIME type
  if (!allowedTypes.includes(file.type)) {
    return {
      type: "invalid_type",
      message: `File type "${file.type}" is not allowed. Allowed types: ${allowedTypes.join(", ")}`,
      file,
    };
  }

  // Check file size
  if (file.size > maxFileSize) {
    const maxSizeMB = (maxFileSize / (1024 * 1024)).toFixed(1);
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
    return {
      type: "file_too_large",
      message: `File size (${fileSizeMB}MB) exceeds maximum allowed size (${maxSizeMB}MB)`,
      file,
    };
  }

  return null;
}

/**
 * Image upload function type
 */
export type VizelUploadImageFn = (file: File, view: EditorView, pos: number) => void;

/**
 * Create an image uploader function
 */
export function createVizelImageUploader(options: ImageUploadOptions): VizelUploadImageFn {
  const { onUpload, maxFileSize, allowedTypes, onValidationError, onUploadError } = options;

  return (file: File, view: EditorView, pos: number): void => {
    // Validate file
    const validationError = validateVizelImageFile(file, {
      ...(maxFileSize !== undefined && { maxFileSize }),
      ...(allowedTypes !== undefined && { allowedTypes }),
    });
    if (validationError) {
      onValidationError?.(validationError);
      return;
    }

    // Create unique ID for this upload
    const id = {};

    // Read file as data URL for preview
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = () => {
      if (typeof reader.result !== "string") return;
      const previewSrc = reader.result;

      // Add placeholder decoration
      const tr = view.state.tr;
      if (!tr.selection.empty) {
        tr.deleteSelection();
      }

      tr.setMeta(imageUploadKey, {
        type: "add",
        id,
        pos,
        previewSrc,
      } satisfies ImageUploadAddAction);

      view.dispatch(tr);

      // Execute upload
      onUpload(file)
        .then((uploadedSrc: string) => {
          const currentPos = findPlaceholder(view.state, id);

          // If placeholder was deleted, abort
          if (currentPos === null) {
            return;
          }

          // Insert image node and remove placeholder
          const { schema } = view.state;
          const imageNode = schema.nodes.image?.create({ src: uploadedSrc });

          if (!imageNode) {
            console.warn("Image node type not found in schema");
            return;
          }

          const transaction = view.state.tr
            .replaceWith(currentPos, currentPos, imageNode)
            .setMeta(imageUploadKey, {
              type: "remove",
              id,
            } satisfies ImageUploadRemoveAction);

          view.dispatch(transaction);
        })
        .catch((error: Error) => {
          onUploadError?.(error, file);

          // Remove placeholder on error
          const currentPos = findPlaceholder(view.state, id);
          if (currentPos !== null) {
            const transaction = view.state.tr.setMeta(imageUploadKey, {
              type: "remove",
              id,
            } satisfies ImageUploadRemoveAction);

            view.dispatch(transaction);
          }
        });
    };
  };
}

/**
 * Handle image paste from clipboard
 */
export function handleVizelImagePaste(
  view: EditorView,
  event: ClipboardEvent,
  uploadFn: VizelUploadImageFn
): boolean {
  const files = event.clipboardData?.files;

  if (!files || files.length === 0) {
    return false;
  }

  // Filter image files
  const imageFiles = Array.from(files).filter((file) => file.type.startsWith("image/"));

  if (imageFiles.length === 0) {
    return false;
  }

  event.preventDefault();

  const pos = view.state.selection.from;

  for (const file of imageFiles) {
    uploadFn(file, view, pos);
  }

  return true;
}

/**
 * Handle image drop from drag-and-drop
 */
export function handleVizelImageDrop(
  view: EditorView,
  event: DragEvent,
  moved: boolean,
  uploadFn: VizelUploadImageFn
): boolean {
  // Skip if this is an internal move
  if (moved) {
    return false;
  }

  const files = event.dataTransfer?.files;

  if (!files || files.length === 0) {
    return false;
  }

  // Filter image files
  const imageFiles = Array.from(files).filter((file) => file.type.startsWith("image/"));

  if (imageFiles.length === 0) {
    return false;
  }

  event.preventDefault();

  // Get drop position
  const coordinates = view.posAtCoords({
    left: event.clientX,
    top: event.clientY,
  });

  const pos = coordinates?.pos ?? view.state.selection.from;

  for (const file of imageFiles) {
    uploadFn(file, view, pos);
  }

  return true;
}

/**
 * Get the image upload plugin key (for external access)
 */
export function getVizelImageUploadPluginKey(): PluginKey<DecorationSet> {
  return imageUploadKey;
}
