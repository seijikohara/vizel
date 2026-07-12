import {
  loadVizelEmbedScripts,
  resolveVizelEmbedView,
  type VizelEmbedData,
  type VizelEmbedType,
  type VizelEmbedViewModel,
} from "@vizel/core";
import type React from "react";
import { useEffect, useMemo, useRef } from "react";

import { VizelIcon } from "./VizelIcon.tsx";

export interface VizelEmbedViewProps {
  /** Embed data */
  data: VizelEmbedData;
  /** Additional class name */
  className?: string;
  /** Whether the embed is selected */
  selected?: boolean;
}

function buildBaseClass(
  loading: boolean | undefined,
  selected: boolean | undefined,
  className: string | undefined
): string {
  return `vizel-embed ${loading ? "is-loading" : ""} ${selected ? "ProseMirror-selectednode" : ""} ${className ?? ""}`;
}

/**
 * Renders an embed based on its type.
 *
 * The display variant (loading / oEmbed / OGP card / title link / plain link)
 * is resolved by `@vizel/core`'s `resolveVizelEmbedView`. This component
 * just maps the variant to React JSX and delegates script reparenting to
 * `loadVizelEmbedScripts`.
 */
export function VizelEmbedView({ data, className, selected }: VizelEmbedViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const view = useMemo(() => resolveVizelEmbedView(data), [data]);
  const baseClass = buildBaseClass(data.loading, selected, className);

  useEffect(() => {
    if (view.kind === "oembed" && containerRef.current) {
      loadVizelEmbedScripts(containerRef.current, view.provider);
    }
  }, [view]);

  return renderEmbed(view, baseClass, containerRef);
}

function renderEmbed(
  view: VizelEmbedViewModel,
  baseClass: string,
  containerRef: React.RefObject<HTMLDivElement | null>
): React.JSX.Element {
  switch (view.kind) {
    case "loading":
      return (
        <div className={baseClass} data-embed-type="loading" data-embed-provider={view.provider}>
          <div className="vizel-embed-loading">
            <div className="vizel-embed-loading-spinner" />
            <span>Loading embed...</span>
          </div>
        </div>
      );
    case "oembed":
      return (
        <div
          ref={containerRef}
          className={baseClass}
          data-embed-type="oembed"
          data-embed-provider={view.provider}
        >
          <div
            className={view.isVideo ? "vizel-embed-video" : "vizel-embed-oembed"}
            // oxlint-disable-next-line react/no-danger -- oEmbed provider HTML is sanitized in core/extensions/embed.ts via DOMPurify before reaching this view; __html is the React API
            dangerouslySetInnerHTML={{ __html: view.html }}
          />
        </div>
      );
    case "ogp": {
      const cardLayout = view.image ? "vizel-embed-card-horizontal" : "";
      return (
        <div className={baseClass} data-embed-type="ogp" data-embed-provider={view.provider}>
          <a
            href={view.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`vizel-embed-card ${cardLayout}`}
          >
            {view.image && (
              <img src={view.image} alt="" className="vizel-embed-card-image" loading="lazy" />
            )}
            <div className="vizel-embed-card-content">
              {(view.siteName || view.favicon) && (
                <div className="vizel-embed-card-site">
                  {view.favicon && (
                    <img src={view.favicon} alt="" className="vizel-embed-card-favicon" />
                  )}
                  {view.siteName && <span>{view.siteName}</span>}
                </div>
              )}
              {view.title && <div className="vizel-embed-card-title">{view.title}</div>}
              {view.description && (
                <div className="vizel-embed-card-description">{view.description}</div>
              )}
              <div className="vizel-embed-card-url">{view.hostname}</div>
            </div>
          </a>
        </div>
      );
    }
    case "title":
      return (
        <div className={baseClass} data-embed-type="title" data-embed-provider={view.provider}>
          <a href={view.url} target="_blank" rel="noopener noreferrer" className="vizel-embed-link">
            <span className="vizel-embed-link-icon">
              <VizelIcon name="link" />
            </span>
            <span className="vizel-embed-link-text">{view.title}</span>
          </a>
        </div>
      );
    case "link":
      return (
        <div className={baseClass} data-embed-type="link" data-embed-provider={view.provider}>
          <a href={view.url} target="_blank" rel="noopener noreferrer" className="vizel-embed-link">
            <span className="vizel-embed-link-icon">
              <VizelIcon name="link" />
            </span>
            <span className="vizel-embed-link-text">{view.url}</span>
          </a>
        </div>
      );
    default: {
      const exhaustive: never = view;
      return exhaustive;
    }
  }
}

/**
 * Create a mock EmbedData for testing/demo purposes
 */
export function createMockEmbedData(url: string, type: VizelEmbedType = "link"): VizelEmbedData {
  return {
    url,
    type,
  };
}
