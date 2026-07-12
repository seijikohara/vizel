/**
 * Embed provider catalogue and oEmbed fetch logic.
 *
 * Pure, DOM-free, server-callable helpers extracted from the embed
 * extension so provider detection and oEmbed fetching can be tested and
 * reused independently of the Tiptap node. The `extensions/embed.ts` node
 * re-exports the public symbols, so the consumer import path is unchanged.
 */

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
 * Default oEmbed providers.
 *
 * The exported array is readonly so consumers cannot mutate the shared
 * defaults. To extend the list, spread it into a new array.
 */
export const vizelDefaultEmbedProviders: readonly VizelEmbedProvider[] = [
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
  providers: readonly VizelEmbedProvider[] = vizelDefaultEmbedProviders
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
 * oEmbed response from provider (snake_case is standard oEmbed format)
 */
interface OEmbedResponse {
  type?: string;
  html?: string;
  width?: number;
  height?: number;
  title?: string;
  description?: string;
  thumbnail_url?: string;
  provider_name?: string;
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
  providers: readonly VizelEmbedProvider[] = vizelDefaultEmbedProviders
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
