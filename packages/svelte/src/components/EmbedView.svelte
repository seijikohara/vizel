<script lang="ts" module>
import type { EmbedData } from "@vizel/core";

export interface EmbedViewProps {
  /** Embed data */
  data: EmbedData & { loading?: boolean };
  /** Additional class name */
  class?: string;
  /** Whether the embed is selected */
  selected?: boolean;
}
</script>

<script lang="ts">
import { onMount } from "svelte";
import Icon from "./Icon.svelte";

let { data, class: className, selected = false }: EmbedViewProps = $props();

let containerRef: HTMLDivElement | null = $state(null);

const baseClass = $derived(
  `vizel-embed ${data.loading ? "is-loading" : ""} ${selected ? "ProseMirror-selectednode" : ""} ${className ?? ""}`
);

const isVideo = $derived(
  ["youtube", "vimeo", "loom", "tiktok"].includes(data.provider ?? "")
);

const hasImage = $derived(Boolean(data.image));

const hostname = $derived.by(() => {
  try {
    return new URL(data.url).hostname;
  } catch {
    return data.url;
  }
});

// Handle oEmbed scripts
function loadScripts() {
  if (data.type === "oembed" && data.html && containerRef) {
    const scripts = containerRef.querySelectorAll("script");
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
}

$effect(() => {
  if (data.type === "oembed" && data.html) {
    loadScripts();
  }
});

onMount(loadScripts);
</script>

{#if data.loading}
  <!-- Loading state -->
  <div
    class={baseClass}
    data-embed-type="loading"
    data-embed-provider={data.provider}
  >
    <div class="vizel-embed-loading">
      <div class="vizel-embed-loading-spinner"></div>
      <span>Loading embed...</span>
    </div>
  </div>
{:else if data.type === "oembed" && data.html}
  <!-- oEmbed (rich embed) -->
  <div
    bind:this={containerRef}
    class={baseClass}
    data-embed-type="oembed"
    data-embed-provider={data.provider}
  >
    <div
      class={isVideo ? "vizel-embed-video" : "vizel-embed-oembed"}
    >
      {@html data.html}
    </div>
  </div>
{:else if data.type === "ogp"}
  <!-- OGP card -->
  <div
    class={baseClass}
    data-embed-type="ogp"
    data-embed-provider={data.provider}
  >
    <a
      href={data.url}
      target="_blank"
      rel="noopener noreferrer"
      class="vizel-embed-card {hasImage ? 'vizel-embed-card-horizontal' : ''}"
    >
      {#if hasImage}
        <img
          src={data.image}
          alt=""
          class="vizel-embed-card-image"
          loading="lazy"
        />
      {/if}
      <div class="vizel-embed-card-content">
        {#if data.siteName || data.favicon}
          <div class="vizel-embed-card-site">
            {#if data.favicon}
              <img
                src={data.favicon}
                alt=""
                class="vizel-embed-card-favicon"
              />
            {/if}
            {#if data.siteName}
              <span>{data.siteName}</span>
            {/if}
          </div>
        {/if}
        {#if data.title}
          <div class="vizel-embed-card-title">{data.title}</div>
        {/if}
        {#if data.description}
          <div class="vizel-embed-card-description">{data.description}</div>
        {/if}
        <div class="vizel-embed-card-url">{hostname}</div>
      </div>
    </a>
  </div>
{:else if data.type === "title" && data.title}
  <!-- Title link -->
  <div
    class={baseClass}
    data-embed-type="title"
    data-embed-provider={data.provider}
  >
    <a href={data.url} target="_blank" rel="noopener noreferrer" class="vizel-embed-link">
      <span class="vizel-embed-link-icon"><Icon name="link" /></span>
      <span class="vizel-embed-link-text">{data.title}</span>
    </a>
  </div>
{:else}
  <!-- Plain link (fallback) -->
  <div
    class={baseClass}
    data-embed-type="link"
    data-embed-provider={data.provider}
  >
    <a href={data.url} target="_blank" rel="noopener noreferrer" class="vizel-embed-link">
      <span class="vizel-embed-link-icon"><Icon name="link" /></span>
      <span class="vizel-embed-link-text">{data.url}</span>
    </a>
  </div>
{/if}
