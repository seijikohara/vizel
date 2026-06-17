/**
 * Universal URL Embed Extension
 *
 * Provides URL embedding with graceful fallback:
 * 1. oEmbed - Rich embed (video player, tweet, etc.)
 * 2. OGP - Link preview card (title, description, image)
 * 3. Title - Title as link text
 * 4. Link - Plain URL as link
 */

import { mergeAttributes, Node } from "@tiptap/core";
import type { Node as PMNode } from "@tiptap/pm/model";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import type MarkdownIt from "markdown-it";
import type { MarkdownSerializerState } from "prosemirror-markdown";
import {
  createVizelDefaultFetchEmbedData,
  detectVizelEmbedProvider,
  type VizelEmbedData,
  type VizelEmbedProvider,
  type VizelEmbedType,
  type VizelFetchEmbedDataFn,
  vizelDefaultEmbedProviders,
} from "../utils/embed-providers.ts";
import { emitVizelError, VizelError } from "../utils/errorHandling.ts";
import { escapeMetadataCommentValue } from "../utils/metadata-comment.ts";
import { registerEmbedRule } from "./embed-markdown.ts";
import { renderLink, renderLoading, renderOembed, renderOgpCard } from "./embed-renderers.ts";

export {
  createVizelDefaultFetchEmbedData,
  detectVizelEmbedProvider,
  type VizelEmbedData,
  type VizelEmbedProvider,
  type VizelEmbedType,
  type VizelFetchEmbedDataFn,
  vizelDefaultEmbedProviders,
} from "../utils/embed-providers.ts";
export { loadVizelEmbedScripts } from "./embed-renderers.ts";

/**
 * Plugin key for embed paste handler
 */
export const vizelEmbedPastePluginKey = new PluginKey("vizelEmbedPaste");

/**
 * Embed extension options
 */
export interface VizelEmbedOptions {
  /**
   * Function to fetch embed data from URL
   *
   * By default, uses createVizelDefaultFetchEmbedData() which fetches oEmbed data
   * for CORS-enabled providers (YouTube, Vimeo, Spotify, etc.)
   *
   * For full OGP/metadata support, provide a custom function that uses
   * a server-side proxy to fetch page metadata.
   */
  fetchEmbedData?: VizelFetchEmbedDataFn;
  /** Custom providers to add or override */
  providers?: readonly VizelEmbedProvider[];
  /** HTML attributes for the embed wrapper */
  HTMLAttributes?: Record<string, unknown>;
  /** Enable paste handler for URL detection */
  pasteHandler?: boolean;
  /** Inline embeds (rendered inline with text) vs block embeds */
  inline?: boolean;
  /**
   * Called when embed data fetch fails.
   * If not provided, errors are logged to console.
   *
   * @param error - The error that occurred
   * @param url - The URL that failed to fetch
   */
  onFetchError?: (error: Error, url: string) => void;
  /**
   * Markdown encoding mode.
   *
   * - `"default"` emits the lossy form `[title || url](url)`. Metadata
   *   such as `type` and `provider` is lost on round-trip.
   * - `"metadata-comment"` emits the lossless form
   *   `[title || url](url)<!-- vizel:embed type="..." provider="..." -->`
   *   so the metadata survives round-trips through plain markdown.
   *
   * @default "default"
   */
  encoding?: import("../markdown/types.ts").VizelMarkdownLossyEncodingMode;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    embed: {
      /**
       * Set an embed from URL
       */
      setEmbed: (options: { url: string }) => ReturnType;
      /**
       * Update embed data
       */
      updateEmbed: (data: Partial<VizelEmbedData>) => ReturnType;
    };
  }
}

/**
 * Check if URL is a valid embed URL
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Embed node extension
 */
export const VizelEmbed = Node.create<VizelEmbedOptions>({
  name: "embed",

  group() {
    return this.options.inline ? "inline" : "block";
  },

  inline() {
    return this.options.inline ?? false;
  },

  atom: true,

  draggable: true,

  addOptions(): VizelEmbedOptions {
    return {
      fetchEmbedData: createVizelDefaultFetchEmbedData(),
      providers: vizelDefaultEmbedProviders,
      HTMLAttributes: {
        class: "vizel-embed",
      },
      pasteHandler: true,
      inline: false,
      encoding: "default",
    };
  },

  addStorage() {
    return {
      markdown: {
        serialize(state: MarkdownSerializerState, node: PMNode) {
          const ctx = this as unknown as { options: VizelEmbedOptions };
          const encoding = ctx.options.encoding ?? "default";
          const url = String(node.attrs?.url ?? "");
          const titleAttr = node.attrs?.title;
          const title = typeof titleAttr === "string" && titleAttr.length > 0 ? titleAttr : url;
          const linkText = `[${title}](${url})`;
          if (encoding === "metadata-comment") {
            const type = node.attrs?.type;
            const provider = node.attrs?.provider;
            const parts: string[] = [];
            if (typeof type === "string" && type.length > 0) {
              parts.push(`type="${escapeMetadataCommentValue(type)}"`);
            }
            if (typeof provider === "string" && provider.length > 0) {
              parts.push(`provider="${escapeMetadataCommentValue(provider)}"`);
            }
            const attrsSrc = parts.length > 0 ? ` ${parts.join(" ")} ` : " ";
            state.write(`${linkText}<!-- vizel:embed${attrsSrc}-->`);
          } else {
            state.write(linkText);
          }
          state.closeBlock(node);
        },
        parse: {
          setup(md: MarkdownIt) {
            registerEmbedRule(md);
          },
        },
      },
    };
  },

  addAttributes() {
    return {
      url: {
        default: null,
        parseHTML: (element: HTMLElement) =>
          element.getAttribute("data-embed-url") ?? element.getAttribute("data-url") ?? null,
      },
      type: {
        default: "link" as VizelEmbedType,
        parseHTML: (element: HTMLElement) =>
          (element.getAttribute("data-embed-type") as VizelEmbedType | null) ?? "link",
      },
      provider: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute("data-embed-provider"),
      },
      html: {
        default: null,
      },
      width: {
        default: null,
      },
      height: {
        default: null,
      },
      title: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute("data-embed-title"),
      },
      description: {
        default: null,
      },
      image: {
        default: null,
      },
      siteName: {
        default: null,
      },
      favicon: {
        default: null,
      },
      loading: {
        default: false,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-vizel-embed="true"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const attrs = mergeAttributes(this.options.HTMLAttributes ?? {}, HTMLAttributes, {
      "data-vizel-embed": "true",
      "data-embed-type": HTMLAttributes.type,
      "data-embed-provider": HTMLAttributes.provider,
    });

    // For server-side rendering, output basic structure
    // Client-side rendering is handled by NodeView in framework packages
    if (HTMLAttributes.type === "oembed" && HTMLAttributes.html) {
      return ["div", attrs, ["div", { class: "vizel-embed-content" }]];
    }

    if (HTMLAttributes.type === "ogp") {
      return [
        "div",
        attrs,
        [
          "a",
          {
            href: HTMLAttributes.url,
            target: "_blank",
            rel: "noopener noreferrer",
            class: "vizel-embed-card",
          },
          HTMLAttributes.title || HTMLAttributes.url,
        ],
      ];
    }

    // Fallback to link
    return [
      "div",
      attrs,
      [
        "a",
        {
          href: HTMLAttributes.url,
          target: "_blank",
          rel: "noopener noreferrer",
          class: "vizel-embed-link",
        },
        HTMLAttributes.title || HTMLAttributes.url,
      ],
    ];
  },

  addCommands() {
    return {
      setEmbed:
        ({ url }) =>
        ({ commands, editor }) => {
          if (!isValidUrl(url)) {
            return false;
          }

          const provider = detectVizelEmbedProvider(url, this.options.providers);
          const attrs: { url: string; type: VizelEmbedType; provider?: string; loading: boolean } =
            {
              url,
              type: "link",
              loading: true,
            };
          if (provider) {
            attrs.provider = provider.name;
          }

          const result = commands.insertContent({
            type: this.name,
            attrs,
          });

          // Fetch embed data if fetchEmbedData is provided
          if (this.options.fetchEmbedData) {
            this.options
              .fetchEmbedData(url)
              .then((data) => {
                // Find and update the embed node
                editor.state.doc.descendants((node, pos) => {
                  if (
                    node.type.name === this.name &&
                    node.attrs.url === url &&
                    node.attrs.loading
                  ) {
                    editor
                      .chain()
                      .focus()
                      .command(({ tr }) => {
                        tr.setNodeMarkup(pos, undefined, {
                          ...node.attrs,
                          ...data,
                          loading: false,
                        });
                        return true;
                      })
                      .run();
                    return false; // Stop iteration
                  }
                  return true;
                });
              })
              .catch((error) => {
                const err = error instanceof Error ? error : new Error(String(error));
                try {
                  emitVizelError(
                    new VizelError("EMBED_LOAD_FAILED", `Failed to fetch embed data for ${url}`, {
                      cause: err,
                      context: { url },
                    }),
                    this.options.onFetchError
                      ? () => this.options.onFetchError?.(err, url)
                      : undefined
                  );
                } catch {
                  // Ensure fallback update always executes even if callback throws
                }
                // Update node to remove loading state and fallback to link
                editor.state.doc.descendants((node, pos) => {
                  if (
                    node.type.name === this.name &&
                    node.attrs.url === url &&
                    node.attrs.loading
                  ) {
                    editor
                      .chain()
                      .focus()
                      .command(({ tr }) => {
                        tr.setNodeMarkup(pos, undefined, {
                          ...node.attrs,
                          type: "link",
                          loading: false,
                        });
                        return true;
                      })
                      .run();
                    return false;
                  }
                  return true;
                });
              });
          }

          return result;
        },

      updateEmbed:
        (data) =>
        ({ state, tr }) => {
          const { selection } = state;
          const node = state.doc.nodeAt(selection.from);

          if (node?.type.name !== this.name) {
            return false;
          }

          tr.setNodeMarkup(selection.from, undefined, {
            ...node.attrs,
            ...data,
          });

          return true;
        },
    };
  },

  addNodeView() {
    return ({ node, HTMLAttributes }) => {
      const dom = document.createElement("div");
      const contentDOM = document.createElement("div");
      contentDOM.className = "vizel-embed-content";

      // Apply merged attributes
      const attrs = mergeAttributes(this.options.HTMLAttributes ?? {}, HTMLAttributes, {
        "data-vizel-embed": "true",
        "data-embed-type": node.attrs.type,
        "data-embed-provider": node.attrs.provider,
        contenteditable: "false",
        draggable: "true",
      });

      for (const [key, value] of Object.entries(attrs)) {
        if (value !== null && value !== undefined) {
          dom.setAttribute(key, String(value));
        }
      }

      dom.appendChild(contentDOM);

      // Render based on type
      const renderContent = () => {
        contentDOM.innerHTML = "";

        if (node.attrs.loading) {
          renderLoading(contentDOM);
          return;
        }

        if (node.attrs.type === "oembed" && node.attrs.html) {
          renderOembed(contentDOM, node.attrs.html);
          return;
        }

        if (node.attrs.type === "ogp") {
          renderOgpCard(contentDOM, {
            url: node.attrs.url,
            image: node.attrs.image,
            title: node.attrs.title,
            description: node.attrs.description,
            favicon: node.attrs.favicon,
            siteName: node.attrs.siteName,
          });
          return;
        }

        // Fallback - simple link
        renderLink(contentDOM, node.attrs.url, node.attrs.title);
      };

      renderContent();

      return {
        dom,
        contentDOM: null, // atom node, no editable content
        update(updatedNode) {
          if (updatedNode.type.name !== node.type.name) {
            return false;
          }
          node = updatedNode;
          // Update data attributes
          dom.setAttribute("data-embed-type", node.attrs.type);
          dom.setAttribute("data-embed-provider", node.attrs.provider ?? "");
          // Re-render content
          renderContent();
          return true;
        },
      };
    };
  },

  addProseMirrorPlugins() {
    if (!this.options.pasteHandler) {
      return [];
    }

    const extension = this;

    return [
      new Plugin({
        key: vizelEmbedPastePluginKey,
        props: {
          handlePaste(view, event) {
            const text = event.clipboardData?.getData("text/plain");
            if (!text) return false;

            // Check if it's a valid URL
            const trimmedText = text.trim();
            if (!isValidUrl(trimmedText)) return false;

            // Check if there's a known provider
            const provider = detectVizelEmbedProvider(trimmedText, extension.options.providers);
            if (!provider) return false;

            // Only handle if it's a recognized embed provider
            event.preventDefault();

            const { state } = view;
            const { selection } = state;

            // If there's selected text, wrap it as a link instead
            if (!selection.empty) {
              return false;
            }

            // Insert embed
            const nodeType = state.schema.nodes[extension.name];
            if (!nodeType) {
              return false;
            }
            view.dispatch(
              state.tr.replaceSelectionWith(
                nodeType.create({
                  url: trimmedText,
                  type: "link",
                  provider: provider.name,
                  loading: true,
                })
              )
            );

            // Fetch embed data
            if (extension.options.fetchEmbedData) {
              extension.options
                .fetchEmbedData(trimmedText)
                .then((data) => {
                  view.state.doc.descendants((node, pos) => {
                    if (
                      node.type.name === extension.name &&
                      node.attrs.url === trimmedText &&
                      node.attrs.loading
                    ) {
                      view.dispatch(
                        view.state.tr.setNodeMarkup(pos, undefined, {
                          ...node.attrs,
                          ...data,
                          loading: false,
                        })
                      );
                      return false;
                    }
                    return true;
                  });
                })
                .catch((error) => {
                  const err = error instanceof Error ? error : new Error(String(error));
                  try {
                    emitVizelError(
                      new VizelError(
                        "EMBED_LOAD_FAILED",
                        `Failed to fetch embed data for ${trimmedText}`,
                        { cause: err, context: { url: trimmedText } }
                      ),
                      extension.options.onFetchError
                        ? () => extension.options.onFetchError?.(err, trimmedText)
                        : undefined
                    );
                  } catch {
                    // Ensure fallback update always executes even if callback throws
                  }
                  // Update node to remove loading state and fallback to link
                  view.state.doc.descendants((node, pos) => {
                    if (
                      node.type.name === extension.name &&
                      node.attrs.url === trimmedText &&
                      node.attrs.loading
                    ) {
                      view.dispatch(
                        view.state.tr.setNodeMarkup(pos, undefined, {
                          ...node.attrs,
                          type: "link",
                          loading: false,
                        })
                      );
                      return false;
                    }
                    return true;
                  });
                });
            }

            return true;
          },
        },
      }),
    ];
  },
});

/**
 * Create embed extension with options
 */
export function createVizelEmbedExtension(options: VizelEmbedOptions = {}) {
  return VizelEmbed.configure(options);
}

// =============================================================================
// Embed View Helpers
// =============================================================================

/**
 * Discriminated view-model for the framework `VizelEmbedView` components.
 *
 * Each variant maps to one of the four render branches (oEmbed,
 * OGP, title-link, plain-link) plus the loading state. Framework
 * components consume the resolved variant and only have to render
 * each branch's tree once.
 */
export type VizelEmbedViewModel =
  | { kind: "loading"; provider: string | undefined }
  | {
      kind: "oembed";
      provider: string | undefined;
      html: string;
      isVideo: boolean;
    }
  | {
      kind: "ogp";
      provider: string | undefined;
      url: string;
      title: string | undefined;
      description: string | undefined;
      image: string | undefined;
      favicon: string | undefined;
      siteName: string | undefined;
      hostname: string;
    }
  | { kind: "title"; provider: string | undefined; url: string; title: string }
  | { kind: "link"; provider: string | undefined; url: string };

const VIDEO_PROVIDERS: readonly string[] = ["youtube", "vimeo", "loom", "tiktok"];

/**
 * Resolve an {@link VizelEmbedData} into the variant-shaped view-model.
 *
 * Encodes the same fallback chain previously hand-coded in each framework's
 * `VizelEmbedView`: loading → oEmbed → OGP → title-link → plain-link.
 */
export function resolveVizelEmbedView(data: VizelEmbedData): VizelEmbedViewModel {
  if (data.loading) {
    return { kind: "loading", provider: data.provider };
  }
  if (data.type === "oembed" && data.html) {
    return {
      kind: "oembed",
      provider: data.provider,
      html: data.html,
      isVideo: VIDEO_PROVIDERS.includes(data.provider ?? ""),
    };
  }
  if (data.type === "ogp") {
    return {
      kind: "ogp",
      provider: data.provider,
      url: data.url,
      title: data.title,
      description: data.description,
      image: data.image,
      favicon: data.favicon,
      siteName: data.siteName,
      hostname: safeHostname(data.url),
    };
  }
  if (data.type === "title" && data.title) {
    return { kind: "title", provider: data.provider, url: data.url, title: data.title };
  }
  return { kind: "link", provider: data.provider, url: data.url };
}

function safeHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}
