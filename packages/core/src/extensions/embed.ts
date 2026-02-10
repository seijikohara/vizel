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
import { Plugin, PluginKey } from "@tiptap/pm/state";

/**
 * Embed type based on available metadata
 */
export type VizelEmbedType = "oembed" | "ogp" | "title" | "link";

/**
 * oEmbed provider definition
 */
export interface VizelEmbedProvider {
  /** Provider name (e.g., 'youtube', 'twitter') */
  name: string;
  /** URL patterns to match */
  patterns: RegExp[];
  /** oEmbed API endpoint (optional - some providers don't support oEmbed) */
  oEmbedEndpoint?: string;
  /** Whether the oEmbed endpoint supports CORS (can be fetched from browser) */
  supportsCors?: boolean;
  /** Transform function for URL (e.g., extract video ID) */
  transform?: (url: string) => string;
}

/**
 * Embed metadata returned from fetch
 */
export interface VizelEmbedData {
  /** Original URL */
  url: string;
  /** Type of embed based on available data */
  type: VizelEmbedType;
  /** Provider name if detected */
  provider?: string;
  /** oEmbed HTML content */
  html?: string;
  /** oEmbed width */
  width?: number;
  /** oEmbed height */
  height?: number;
  /** OGP/oEmbed title */
  title?: string;
  /** OGP/oEmbed description */
  description?: string;
  /** OGP/oEmbed image URL */
  image?: string;
  /** OGP site name */
  siteName?: string;
  /** Favicon URL */
  favicon?: string;
  /** Whether the embed is currently loading */
  loading?: boolean;
}

/**
 * Function to fetch embed data from URL
 * This should be provided by the user to handle CORS
 */
export type VizelFetchEmbedDataFn = (url: string) => Promise<VizelEmbedData>;

/**
 * Default oEmbed providers
 */
export const vizelDefaultEmbedProviders: VizelEmbedProvider[] = [
  // Video - these providers support CORS on their oEmbed endpoints
  {
    name: "youtube",
    patterns: [
      /^https?:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]+/,
      /^https?:\/\/youtu\.be\/[\w-]+/,
      /^https?:\/\/(www\.)?youtube\.com\/embed\/[\w-]+/,
      /^https?:\/\/(www\.)?youtube\.com\/shorts\/[\w-]+/,
    ],
    oEmbedEndpoint: "https://www.youtube.com/oembed",
    supportsCors: true,
  },
  {
    name: "vimeo",
    patterns: [/^https?:\/\/(www\.)?vimeo\.com\/\d+/],
    oEmbedEndpoint: "https://vimeo.com/api/oembed.json",
    supportsCors: true,
  },
  {
    name: "loom",
    patterns: [/^https?:\/\/(www\.)?loom\.com\/share\/[\w-]+/],
    oEmbedEndpoint: "https://www.loom.com/v1/oembed",
    supportsCors: true,
  },
  {
    name: "tiktok",
    patterns: [/^https?:\/\/(www\.)?tiktok\.com\/@[\w.-]+\/video\/\d+/],
    oEmbedEndpoint: "https://www.tiktok.com/oembed",
    supportsCors: true,
  },
  // Social - these do NOT support CORS, require server-side proxy
  {
    name: "twitter",
    patterns: [
      /^https?:\/\/(twitter\.com|x\.com)\/\w+\/status\/\d+/,
      /^https?:\/\/(twitter\.com|x\.com)\/\w+\/moments\/\d+/,
    ],
    oEmbedEndpoint: "https://publish.twitter.com/oembed",
    supportsCors: false,
  },
  {
    name: "instagram",
    patterns: [
      /^https?:\/\/(www\.)?instagram\.com\/(p|reel)\/[\w-]+/,
      /^https?:\/\/instagr\.am\/(p|reel)\/[\w-]+/,
    ],
    oEmbedEndpoint: "https://graph.facebook.com/v10.0/instagram_oembed",
    supportsCors: false,
  },
  // Dev - CodePen and CodeSandbox support CORS
  {
    name: "codepen",
    patterns: [/^https?:\/\/(www\.)?codepen\.io\/[\w-]+\/pen\/[\w-]+/],
    oEmbedEndpoint: "https://codepen.io/api/oembed",
    supportsCors: true,
  },
  {
    name: "codesandbox",
    patterns: [/^https?:\/\/(www\.)?codesandbox\.io\/s\/[\w-]+/],
    oEmbedEndpoint: "https://codesandbox.io/oembed",
    supportsCors: true,
  },
  {
    name: "github-gist",
    patterns: [/^https?:\/\/gist\.github\.com\/[\w-]+\/[\w]+/],
    supportsCors: false,
  },
  // Design
  {
    name: "figma",
    patterns: [
      /^https?:\/\/(www\.)?figma\.com\/(file|design)\/[\w-]+/,
      /^https?:\/\/(www\.)?figma\.com\/proto\/[\w-]+/,
    ],
    oEmbedEndpoint: "https://www.figma.com/api/oembed",
    supportsCors: true,
  },
  {
    name: "dribbble",
    patterns: [/^https?:\/\/(www\.)?dribbble\.com\/shots\/[\w-]+/],
    supportsCors: false,
  },
  // Music - Spotify and SoundCloud support CORS
  {
    name: "spotify",
    patterns: [/^https?:\/\/open\.spotify\.com\/(track|album|playlist|episode|show)\/[\w]+/],
    oEmbedEndpoint: "https://open.spotify.com/oembed",
    supportsCors: true,
  },
  {
    name: "soundcloud",
    patterns: [/^https?:\/\/(www\.)?soundcloud\.com\/[\w-]+\/[\w-]+/],
    oEmbedEndpoint: "https://soundcloud.com/oembed",
    supportsCors: true,
  },
  // Other
  {
    name: "slideshare",
    patterns: [/^https?:\/\/(www\.)?slideshare\.net\/[\w-]+\/[\w-]+/],
    oEmbedEndpoint: "https://www.slideshare.net/api/oembed/2",
    supportsCors: false,
  },
];

/**
 * Detect provider from URL
 */
export function detectVizelEmbedProvider(
  url: string,
  providers: VizelEmbedProvider[] = vizelDefaultEmbedProviders
): VizelEmbedProvider | null {
  for (const provider of providers) {
    for (const pattern of provider.patterns) {
      if (pattern.test(url)) {
        return provider;
      }
    }
  }
  return null;
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
 * oEmbed response from provider (snake_case is standard oEmbed format)
 */
interface OEmbedResponse {
  type?: string;
  html?: string;
  width?: number;
  height?: number;
  title?: string;
  description?: string;
  // biome-ignore lint/style/useNamingConvention: oEmbed API uses snake_case
  thumbnail_url?: string;
  // biome-ignore lint/style/useNamingConvention: oEmbed API uses snake_case
  provider_name?: string;
  // biome-ignore lint/style/useNamingConvention: oEmbed API uses snake_case
  author_name?: string;
}

/**
 * Fetch oEmbed data from a provider endpoint
 */
async function fetchOEmbed(
  url: string,
  provider: VizelEmbedProvider
): Promise<OEmbedResponse | null> {
  if (!(provider.oEmbedEndpoint && provider.supportsCors)) {
    return null;
  }

  try {
    const oEmbedUrl = new URL(provider.oEmbedEndpoint);
    oEmbedUrl.searchParams.set("url", url);
    oEmbedUrl.searchParams.set("format", "json");

    const response = await fetch(oEmbedUrl.toString(), {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as OEmbedResponse;
  } catch {
    return null;
  }
}

/**
 * Convert oEmbed response to EmbedData
 * Uses conditional spreading to avoid assigning undefined to optional properties
 */
function oembedToEmbedData(
  oembed: OEmbedResponse,
  baseData: VizelEmbedData
): VizelEmbedData | null {
  // Check if we have HTML content (rich embed)
  if (oembed.html) {
    return {
      ...baseData,
      type: "oembed",
      html: oembed.html,
      ...(oembed.width !== undefined && { width: oembed.width }),
      ...(oembed.height !== undefined && { height: oembed.height }),
      ...(oembed.title !== undefined && { title: oembed.title }),
      ...(oembed.description !== undefined && { description: oembed.description }),
      ...(oembed.thumbnail_url !== undefined && { image: oembed.thumbnail_url }),
      ...(oembed.provider_name !== undefined && { siteName: oembed.provider_name }),
    };
  }

  // If we have title/thumbnail but no HTML, create OGP-like card
  if (oembed.title || oembed.thumbnail_url) {
    return {
      ...baseData,
      type: "ogp",
      ...(oembed.title !== undefined && { title: oembed.title }),
      ...(oembed.description !== undefined && { description: oembed.description }),
      ...(oembed.thumbnail_url !== undefined && { image: oembed.thumbnail_url }),
      ...(oembed.provider_name !== undefined && { siteName: oembed.provider_name }),
    };
  }

  return null;
}

/**
 * Create default fetchEmbedData function that works client-side
 *
 * This function fetches oEmbed data for providers that support CORS.
 * For providers that don't support CORS or when oEmbed fails, it falls back to link type.
 *
 * For full OGP support, you need to provide a custom fetchEmbedData function
 * that fetches data through a server-side proxy.
 *
 * @param providers - Custom providers to use (defaults to vizelDefaultEmbedProviders)
 * @returns A fetchEmbedData function
 *
 * @example
 * ```typescript
 * const editor = useVizelEditor({
 *   features: {
 *     embed: {
 *       // Use default client-side fetcher
 *       fetchEmbedData: createVizelDefaultFetchEmbedData(),
 *     },
 *   },
 * });
 * ```
 */
export function createVizelDefaultFetchEmbedData(
  providers: VizelEmbedProvider[] = vizelDefaultEmbedProviders
): VizelFetchEmbedDataFn {
  return async (url: string): Promise<VizelEmbedData> => {
    const provider = detectVizelEmbedProvider(url, providers);

    // Base embed data (conditionally include provider to avoid undefined)
    const baseData: VizelEmbedData = {
      url,
      type: "link",
      ...(provider?.name !== undefined && { provider: provider.name }),
    };

    // If no provider detected or doesn't support CORS, return as link
    if (!(provider?.oEmbedEndpoint && provider.supportsCors)) {
      return baseData;
    }

    // Try to fetch oEmbed
    const oembedData = await fetchOEmbed(url, provider);
    if (!oembedData) {
      return baseData;
    }

    // Convert oEmbed response to EmbedData
    const embedData = oembedToEmbedData(oembedData, baseData);
    return embedData ?? baseData;
  };
}

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
  providers?: VizelEmbedProvider[];
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
   * Custom HTML sanitizer for oEmbed content.
   *
   * By default, a built-in sanitizer strips `<script>`, `<style>`, event handlers,
   * and `javascript:` URLs while preserving `<iframe>` and other oEmbed elements.
   *
   * For maximum security, provide DOMPurify:
   *
   * @example
   * ```typescript
   * import DOMPurify from 'dompurify';
   *
   * sanitize: (html) => DOMPurify.sanitize(html, {
   *   ADD_TAGS: ['iframe'],
   *   ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder'],
   * })
   * ```
   *
   * Set to `false` to disable sanitization (not recommended).
   */
  sanitize?: ((html: string) => string) | false;
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

// ============================================================================
// HTML Sanitization
// ============================================================================

/** Elements removed entirely from oEmbed HTML */
const DANGEROUS_ELEMENTS =
  "script,style,link[rel=import],object,embed,applet,base,form,textarea,select,meta";

/** Attributes considered dangerous (protocol-bearing) */
const PROTOCOL_ATTRS = new Set(["href", "src", "action", "formaction", "xlink:href"]);

/** Protocol prefixes that indicate script injection */
const DANGEROUS_PROTOCOLS = ["javascript:", "data:text/html", "vbscript:"];

/**
 * Built-in HTML sanitizer for oEmbed content.
 *
 * Strips dangerous elements (`<script>`, `<style>`, `<object>`, etc.),
 * event handler attributes (`on*`), and `javascript:` / `data:text/html` URLs
 * while preserving `<iframe>` and other elements needed by oEmbed providers.
 *
 * For maximum security, use DOMPurify via the `sanitize` option.
 *
 * @param html - Raw HTML string from oEmbed response
 * @returns Sanitized HTML string
 *
 * @example
 * ```typescript
 * const clean = sanitizeVizelOembedHtml('<div onclick="alert(1)">Hello</div>');
 * // => '<div>Hello</div>'
 * ```
 */
export function sanitizeVizelOembedHtml(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  // Remove dangerous elements
  for (const el of doc.querySelectorAll(DANGEROUS_ELEMENTS)) {
    el.remove();
  }

  // Sanitize attributes on all remaining elements
  for (const el of doc.querySelectorAll("*")) {
    for (const attr of [...el.attributes]) {
      // Remove event handler attributes (onclick, onerror, etc.)
      if (attr.name.startsWith("on")) {
        el.removeAttribute(attr.name);
        continue;
      }

      // Remove dangerous protocol URLs
      if (PROTOCOL_ATTRS.has(attr.name)) {
        const value = attr.value.trim().toLowerCase();
        if (DANGEROUS_PROTOCOLS.some((p) => value.startsWith(p))) {
          el.removeAttribute(attr.name);
        }
      }
    }
  }

  return doc.body.innerHTML;
}

// ============================================================================
// NodeView Helper Functions
// ============================================================================

/**
 * Render loading state
 */
function renderLoading(container: HTMLElement): void {
  const loader = document.createElement("div");
  loader.className = "vizel-embed-loading";
  loader.textContent = "Loading...";
  container.appendChild(loader);
}

/**
 * Render sanitized oEmbed HTML content.
 *
 * Uses the built-in sanitizer by default, stripping scripts, event handlers,
 * and dangerous URLs. Users can provide a custom sanitizer (e.g., DOMPurify)
 * via the `sanitize` option, or set it to `false` to disable (not recommended).
 */
function renderOembed(
  container: HTMLElement,
  html: string,
  sanitize: ((html: string) => string) | false | undefined
): void {
  const sanitizer = sanitize === false ? null : (sanitize ?? sanitizeVizelOembedHtml);
  const safeHtml = sanitizer ? sanitizer(html) : html;
  // Sanitized HTML is safe to assign — the sanitizer strips dangerous content
  container.innerHTML = safeHtml; // eslint-disable-line no-unsanitized/property
}

/**
 * Render OGP link preview card
 */
function renderOgpCard(
  container: HTMLElement,
  attrs: {
    url: string;
    image?: string;
    title?: string;
    description?: string;
    favicon?: string;
    siteName?: string;
  }
): void {
  const card = document.createElement("a");
  card.href = attrs.url;
  card.target = "_blank";
  card.rel = "noopener noreferrer";
  card.className = "vizel-embed-card";

  if (attrs.image) {
    const img = document.createElement("img");
    img.src = attrs.image;
    img.alt = attrs.title ?? "";
    img.className = "vizel-embed-card-image";
    card.appendChild(img);
  }

  const content = document.createElement("div");
  content.className = "vizel-embed-card-content";

  if (attrs.title) {
    const title = document.createElement("div");
    title.className = "vizel-embed-card-title";
    title.textContent = attrs.title;
    content.appendChild(title);
  }

  if (attrs.description) {
    const desc = document.createElement("div");
    desc.className = "vizel-embed-card-description";
    desc.textContent = attrs.description;
    content.appendChild(desc);
  }

  const meta = document.createElement("div");
  meta.className = "vizel-embed-card-meta";

  if (attrs.favicon) {
    const favicon = document.createElement("img");
    favicon.src = attrs.favicon;
    favicon.alt = "";
    favicon.className = "vizel-embed-card-favicon";
    meta.appendChild(favicon);
  }

  if (attrs.siteName) {
    const site = document.createElement("span");
    site.textContent = attrs.siteName;
    meta.appendChild(site);
  }

  if (meta.hasChildNodes()) {
    content.appendChild(meta);
  }

  card.appendChild(content);
  container.appendChild(card);
}

/**
 * Render simple link fallback
 */
function renderLink(container: HTMLElement, url: string, title?: string): void {
  const link = document.createElement("a");
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.className = "vizel-embed-link";
  link.textContent = title ?? url;
  container.appendChild(link);
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
    };
  },

  addAttributes() {
    return {
      url: {
        default: null,
      },
      type: {
        default: "link" as VizelEmbedType,
      },
      provider: {
        default: null,
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
                  if (this.options.onFetchError) {
                    this.options.onFetchError(err, url);
                  } else {
                    console.error("Failed to fetch embed data:", err);
                  }
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
    const sanitizeOption = this.options.sanitize;
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
          renderOembed(contentDOM, node.attrs.html, sanitizeOption);
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
                    if (extension.options.onFetchError) {
                      extension.options.onFetchError(err, trimmedText);
                    } else {
                      console.error("Failed to fetch embed data:", err);
                    }
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
