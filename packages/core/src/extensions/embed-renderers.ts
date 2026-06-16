/**
 * Embed NodeView DOM renderers.
 *
 * DOM-producing helpers extracted from the embed extension. Each function
 * runs inside the embed NodeView (browser-only), so DOM access here is
 * confined to function bodies, never module scope.
 */

import DOMPurify from "dompurify";

/**
 * Render loading state
 */
export function renderLoading(container: HTMLElement): void {
  const loader = document.createElement("div");
  loader.className = "vizel-embed-loading";
  loader.textContent = "Loading...";
  container.appendChild(loader);
}

/**
 * Render oEmbed HTML content with sanitization.
 *
 * Uses DOMPurify to sanitize oEmbed HTML, allowing iframes (for
 * YouTube, Vimeo, etc.) while stripping scripts and event handlers.
 */
export function renderOembed(container: HTMLElement, html: string): void {
  container.innerHTML = DOMPurify.sanitize(html, {
    ADD_TAGS: ["iframe"],
    ADD_ATTR: ["allow", "allowfullscreen", "frameborder", "scrolling"],
  });
}

/**
 * Render OGP link preview card
 */
export function renderOgpCard(
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
export function renderLink(container: HTMLElement, url: string, title?: string): void {
  const link = document.createElement("a");
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.className = "vizel-embed-link";
  link.textContent = title ?? url;
  container.appendChild(link);
}

/**
 * Re-parent any `<script>` tags inside an oEmbed container so the browser
 * actually executes them (innerHTML-inserted scripts are inert).
 *
 * Optionally invokes provider-specific bootstrap (Twitter widgets) when
 * the provider is `"twitter"`. Framework `VizelEmbedView` components call
 * this helper after their effect runs.
 */
export function loadVizelEmbedScripts(container: HTMLElement, provider?: string): void {
  const scripts = container.querySelectorAll("script");
  for (const oldScript of scripts) {
    const newScript = document.createElement("script");
    for (const attr of Array.from(oldScript.attributes)) {
      newScript.setAttribute(attr.name, attr.value);
    }
    if (oldScript.textContent) {
      newScript.textContent = oldScript.textContent;
    }
    oldScript.parentNode?.replaceChild(newScript, oldScript);
  }

  if (provider === "twitter" && typeof window !== "undefined" && "twttr" in window) {
    const twttr = (window as { twttr?: { widgets?: { load?: (el?: HTMLElement) => void } } }).twttr;
    twttr?.widgets?.load?.(container);
  }
}
