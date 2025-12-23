import Image from "@tiptap/extension-image";

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

export { Image };
