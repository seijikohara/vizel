<script lang="ts" module>
import type { VizelEmbedData } from "@vizel/core";

export interface VizelEmbedViewProps {
  /** Embed data */
  data: VizelEmbedData;
  /** Additional class name */
  class?: string;
  /** Whether the embed is selected */
  selected?: boolean;
}
</script>

<script lang="ts">
import { loadVizelEmbedScripts, resolveVizelEmbedView } from "@vizel/core";

import VizelIcon from "./VizelIcon.svelte";

let { data, class: className, selected = false }: VizelEmbedViewProps = $props();

let containerRef: HTMLDivElement | null = $state(null);

const view = $derived(resolveVizelEmbedView(data));

const baseClass = $derived(
  `vizel-embed ${data.loading ? "is-loading" : ""} ${selected ? "ProseMirror-selectednode" : ""} ${className ?? ""}`
);

// Re-parent any <script> tags so the browser executes them (innerHTML-inserted
// scripts are inert). Runs again on every data change via $effect tracking.
$effect(() => {
  if (view.kind === "oembed" && containerRef) {
    loadVizelEmbedScripts(containerRef, view.provider);
  }
});
</script>

{#if view.kind === "loading"}
  <div class={baseClass} data-embed-type="loading" data-embed-provider={view.provider}>
    <div class="vizel-embed-loading">
      <div class="vizel-embed-loading-spinner"></div>
      <span>Loading embed...</span>
    </div>
  </div>
{:else if view.kind === "oembed"}
  <div
    bind:this={containerRef}
    class={baseClass}
    data-embed-type="oembed"
    data-embed-provider={view.provider}
  >
    <div class={view.isVideo ? "vizel-embed-video" : "vizel-embed-oembed"}>
      {@html view.html}
    </div>
  </div>
{:else if view.kind === "ogp"}
  <div class={baseClass} data-embed-type="ogp" data-embed-provider={view.provider}>
    <a
      href={view.url}
      target="_blank"
      rel="noopener noreferrer"
      class="vizel-embed-card {view.image ? 'vizel-embed-card-horizontal' : ''}"
    >
      {#if view.image}
        <img src={view.image} alt="" class="vizel-embed-card-image" loading="lazy" />
      {/if}
      <div class="vizel-embed-card-content">
        {#if view.siteName || view.favicon}
          <div class="vizel-embed-card-site">
            {#if view.favicon}
              <img src={view.favicon} alt="" class="vizel-embed-card-favicon" />
            {/if}
            {#if view.siteName}
              <span>{view.siteName}</span>
            {/if}
          </div>
        {/if}
        {#if view.title}
          <div class="vizel-embed-card-title">{view.title}</div>
        {/if}
        {#if view.description}
          <div class="vizel-embed-card-description">{view.description}</div>
        {/if}
        <div class="vizel-embed-card-url">{view.hostname}</div>
      </div>
    </a>
  </div>
{:else if view.kind === "title"}
  <div class={baseClass} data-embed-type="title" data-embed-provider={view.provider}>
    <a href={view.url} target="_blank" rel="noopener noreferrer" class="vizel-embed-link">
      <span class="vizel-embed-link-icon"><VizelIcon name="link" /></span>
      <span class="vizel-embed-link-text">{view.title}</span>
    </a>
  </div>
{:else}
  <div class={baseClass} data-embed-type="link" data-embed-provider={view.provider}>
    <a href={view.url} target="_blank" rel="noopener noreferrer" class="vizel-embed-link">
      <span class="vizel-embed-link-icon"><VizelIcon name="link" /></span>
      <span class="vizel-embed-link-text">{view.url}</span>
    </a>
  </div>
{/if}
