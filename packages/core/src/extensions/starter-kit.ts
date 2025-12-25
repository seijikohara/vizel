import type { Extensions } from "@tiptap/core";
import Placeholder from "@tiptap/extension-placeholder";
import StarterKit from "@tiptap/starter-kit";
import type { VizelFeatureOptions } from "../types.ts";
import { createImageUploadExtension, defaultImageResizeOptions } from "./image.ts";
import { createLinkExtension } from "./link.ts";
import { defaultSlashCommands, SlashCommand, type SlashCommandItem } from "./slash-command.ts";
import { createTableExtensions } from "./table.ts";

export interface VizelStarterKitOptions {
  /** Placeholder text when editor is empty */
  placeholder?: string;
  /** Configure heading levels (default: [1, 2, 3]) */
  headingLevels?: (1 | 2 | 3 | 4 | 5 | 6)[];
  /**
   * Feature configuration. All features are enabled by default.
   * Set to false to disable a feature, or pass options to configure it.
   */
  features?: VizelFeatureOptions;
}

/**
 * Default base64 image uploader (converts file to data URL)
 */
function defaultBase64Upload(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

/**
 * Create the default set of extensions for Vizel editor.
 * All features (SlashCommand, Table, Link, Image) are enabled by default.
 *
 * @example Basic usage (all features enabled)
 * ```ts
 * const extensions = createVizelExtensions();
 * ```
 *
 * @example Disable specific features
 * ```ts
 * const extensions = createVizelExtensions({
 *   features: {
 *     table: false,
 *     slashCommand: false,
 *   },
 * });
 * ```
 *
 * @example Custom image upload
 * ```ts
 * const extensions = createVizelExtensions({
 *   features: {
 *     image: {
 *       onUpload: async (file) => {
 *         const formData = new FormData();
 *         formData.append('file', file);
 *         const res = await fetch('/api/upload', { method: 'POST', body: formData });
 *         return (await res.json()).url;
 *       },
 *     },
 *   },
 * });
 * ```
 */
export function createVizelExtensions(options: VizelStarterKitOptions = {}): Extensions {
  const {
    placeholder = "Type '/' for commands...",
    headingLevels = [1, 2, 3],
    features = {},
  } = options;

  const extensions: Extensions = [
    StarterKit.configure({
      heading: {
        levels: headingLevels,
      },
      dropcursor: {
        color: "#3b82f6",
        width: 2,
      },
      // Disable built-in Link to use our custom Link extension
      link: false,
    }),
    Placeholder.configure({
      placeholder,
      emptyEditorClass: "vizel-editor-empty",
      emptyNodeClass: "vizel-node-empty",
    }),
  ];

  // Slash Command (enabled by default)
  if (features.slashCommand !== false) {
    const slashOptions = typeof features.slashCommand === "object" ? features.slashCommand : {};
    const items: SlashCommandItem[] = slashOptions.items ?? defaultSlashCommands;
    extensions.push(
      SlashCommand.configure({
        items,
        suggestion: slashOptions.suggestion as Record<string, unknown> | undefined,
      })
    );
  }

  // Table (enabled by default)
  if (features.table !== false) {
    extensions.push(...createTableExtensions());
  }

  // Link (enabled by default)
  if (features.link !== false) {
    extensions.push(createLinkExtension());
  }

  // Image (enabled by default with base64 upload)
  if (features.image !== false) {
    const imageOptions = typeof features.image === "object" ? features.image : {};
    const onUpload = imageOptions.onUpload ?? defaultBase64Upload;
    const resizeEnabled = imageOptions.resize !== false;

    extensions.push(
      ...createImageUploadExtension({
        upload: {
          onUpload,
          maxFileSize: imageOptions.maxFileSize,
          allowedTypes: imageOptions.allowedTypes,
          onValidationError: imageOptions.onValidationError,
          onUploadError: imageOptions.onUploadError,
        },
        resize: resizeEnabled ? defaultImageResizeOptions : false,
      })
    );
  }

  return extensions;
}

export { StarterKit, Placeholder };
