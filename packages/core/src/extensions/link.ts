import Link from "@tiptap/extension-link";

export interface VizelLinkOptions {
  /**
   * If enabled, links will be opened on click.
   * @default true
   */
  openOnClick?: boolean;

  /**
   * If enabled, URLs will be automatically linked while typing.
   * @default true
   */
  autolink?: boolean;

  /**
   * If enabled, pasted URLs will be linked.
   * @default true
   */
  linkOnPaste?: boolean;

  /**
   * Default protocol for links without one.
   * @default 'https'
   */
  defaultProtocol?: string;

  /**
   * Additional HTML attributes to add to links.
   */
  HTMLAttributes?: Record<string, string>;
}

/**
 * Create a link extension for Vizel editor.
 *
 * @example
 * ```ts
 * const editor = new Editor({
 *   extensions: [
 *     createVizelLinkExtension({
 *       openOnClick: true,
 *       autolink: true,
 *     }),
 *   ],
 * });
 *
 * // Add a link
 * editor.chain().focus().setLink({ href: 'https://example.com' }).run();
 *
 * // Remove a link
 * editor.chain().focus().unsetLink().run();
 * ```
 */
export function createVizelLinkExtension(options: VizelLinkOptions = {}) {
  return Link.configure({
    openOnClick: options.openOnClick ?? true,
    autolink: options.autolink ?? true,
    linkOnPaste: options.linkOnPaste ?? true,
    defaultProtocol: options.defaultProtocol ?? "https",
    HTMLAttributes: {
      class: "vizel-link",
      rel: "noopener noreferrer nofollow",
      target: "_blank",
      ...options.HTMLAttributes,
    },
  });
}

export { Link };
