import type { EmbedData, EmbedType } from "@vizel/core";
import type React from "react";
import { useEffect, useRef } from "react";
import { Icon } from "./Icon.tsx";

export interface EmbedViewProps {
  /** Embed data */
  data: EmbedData & { loading?: boolean };
  /** Additional class name */
  className?: string;
  /** Whether the embed is selected */
  selected?: boolean;
}

/** Build base class name for embed container */
function buildBaseClass(
  loading: boolean | undefined,
  selected: boolean | undefined,
  className: string | undefined
): string {
  return `vizel-embed ${loading ? "is-loading" : ""} ${selected ? "ProseMirror-selectednode" : ""} ${className ?? ""}`;
}

/** Render loading state */
function renderLoading(baseClass: string, provider: string | undefined): React.JSX.Element {
  return (
    <div className={baseClass} data-embed-type="loading" data-embed-provider={provider}>
      <div className="vizel-embed-loading">
        <div className="vizel-embed-loading-spinner" />
        <span>Loading embed...</span>
      </div>
    </div>
  );
}

/** Render oEmbed (rich embed) */
function renderOEmbed(
  baseClass: string,
  data: EmbedData,
  containerRef: React.RefObject<HTMLDivElement | null>
): React.JSX.Element {
  const isVideo = ["youtube", "vimeo", "loom", "tiktok"].includes(data.provider ?? "");

  return (
    <div
      ref={containerRef}
      className={baseClass}
      data-embed-type="oembed"
      data-embed-provider={data.provider}
    >
      <div
        className={isVideo ? "vizel-embed-video" : "vizel-embed-oembed"}
        // biome-ignore lint/security/noDangerouslySetInnerHtml lint/style/useNamingConvention: oEmbed requires rendering provider HTML; __html is React API
        dangerouslySetInnerHTML={{ __html: data.html ?? "" }}
      />
    </div>
  );
}

/** Render OGP card */
function renderOGPCard(baseClass: string, data: EmbedData): React.JSX.Element {
  const hasImage = Boolean(data.image);
  const cardLayout = hasImage ? "vizel-embed-card-horizontal" : "";

  return (
    <div className={baseClass} data-embed-type="ogp" data-embed-provider={data.provider}>
      <a
        href={data.url}
        target="_blank"
        rel="noopener noreferrer"
        className={`vizel-embed-card ${cardLayout}`}
      >
        {hasImage && (
          <img src={data.image} alt="" className="vizel-embed-card-image" loading="lazy" />
        )}
        <div className="vizel-embed-card-content">
          {(data.siteName || data.favicon) && (
            <div className="vizel-embed-card-site">
              {data.favicon && (
                <img src={data.favicon} alt="" className="vizel-embed-card-favicon" />
              )}
              {data.siteName && <span>{data.siteName}</span>}
            </div>
          )}
          {data.title && <div className="vizel-embed-card-title">{data.title}</div>}
          {data.description && (
            <div className="vizel-embed-card-description">{data.description}</div>
          )}
          <div className="vizel-embed-card-url">{new URL(data.url).hostname}</div>
        </div>
      </a>
    </div>
  );
}

/** Render title link */
function renderTitleLink(
  baseClass: string,
  data: EmbedData,
  LinkIcon: React.JSX.Element
): React.JSX.Element {
  return (
    <div className={baseClass} data-embed-type="title" data-embed-provider={data.provider}>
      <a href={data.url} target="_blank" rel="noopener noreferrer" className="vizel-embed-link">
        <span className="vizel-embed-link-icon">{LinkIcon}</span>
        <span className="vizel-embed-link-text">{data.title}</span>
      </a>
    </div>
  );
}

/** Render plain link (fallback) */
function renderPlainLink(
  baseClass: string,
  data: EmbedData,
  LinkIcon: React.JSX.Element
): React.JSX.Element {
  return (
    <div className={baseClass} data-embed-type="link" data-embed-provider={data.provider}>
      <a href={data.url} target="_blank" rel="noopener noreferrer" className="vizel-embed-link">
        <span className="vizel-embed-link-icon">{LinkIcon}</span>
        <span className="vizel-embed-link-text">{data.url}</span>
      </a>
    </div>
  );
}

/**
 * Renders an embed based on its type.
 * Supports oEmbed (rich), OGP (card), title (link with text), and plain link.
 */
export function EmbedView({ data, className, selected }: EmbedViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle oEmbed scripts (Twitter, Instagram, etc.)
  useEffect(() => {
    if (data.type === "oembed" && data.html && containerRef.current) {
      // Find and execute any scripts in the HTML
      const scripts = containerRef.current.querySelectorAll("script");
      for (const script of scripts) {
        const newScript = document.createElement("script");
        if (script.src) {
          newScript.src = script.src;
        } else {
          newScript.textContent = script.textContent;
        }
        script.parentNode?.replaceChild(newScript, script);
      }

      // Load Twitter widgets if present
      if (data.provider === "twitter" && "twttr" in window) {
        (window as { twttr?: { widgets?: { load?: () => void } } }).twttr?.widgets?.load?.();
      }
    }
  }, [data.type, data.html, data.provider]);

  const baseClass = buildBaseClass(data.loading, selected, className);

  // Loading state
  if (data.loading) {
    return renderLoading(baseClass, data.provider);
  }

  // oEmbed (rich embed)
  if (data.type === "oembed" && data.html) {
    return renderOEmbed(baseClass, data, containerRef);
  }

  // OGP card
  if (data.type === "ogp") {
    return renderOGPCard(baseClass, data);
  }

  const linkIcon = <Icon name="link" />;

  // Title link
  if (data.type === "title" && data.title) {
    return renderTitleLink(baseClass, data, linkIcon);
  }

  // Plain link (fallback)
  return renderPlainLink(baseClass, data, linkIcon);
}

/**
 * Create a mock EmbedData for testing/demo purposes
 */
export function createMockEmbedData(url: string, type: EmbedType = "link"): EmbedData {
  return {
    url,
    type,
  };
}
