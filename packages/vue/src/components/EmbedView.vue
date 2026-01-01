<script setup lang="ts">
import type { EmbedData, EmbedType } from "@vizel/core";
import { computed, onMounted, ref, watch } from "vue";

export interface EmbedViewProps {
  /** Embed data */
  data: EmbedData & { loading?: boolean };
  /** Additional class name */
  class?: string;
  /** Whether the embed is selected */
  selected?: boolean;
}

const props = defineProps<EmbedViewProps>();

const containerRef = ref<HTMLDivElement | null>(null);

const baseClass = computed(() => {
  const classes = ["vizel-embed"];
  if (props.data.loading) classes.push("is-loading");
  if (props.selected) classes.push("ProseMirror-selectednode");
  if (props.class) classes.push(props.class);
  return classes.join(" ");
});

const isVideo = computed(() => {
  return ["youtube", "vimeo", "loom", "tiktok"].includes(props.data.provider ?? "");
});

const hasImage = computed(() => Boolean(props.data.image));

const hostname = computed(() => {
  try {
    return new URL(props.data.url).hostname;
  } catch {
    return props.data.url;
  }
});

// Handle oEmbed scripts (Twitter, Instagram, etc.)
function loadScripts() {
  if (props.data.type === "oembed" && props.data.html && containerRef.value) {
    const scripts = containerRef.value.querySelectorAll("script");
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
    if (props.data.provider === "twitter" && "twttr" in window) {
      (window as { twttr?: { widgets?: { load?: () => void } } }).twttr?.widgets?.load?.();
    }
  }
}

onMounted(loadScripts);
watch(() => [props.data.type, props.data.html], loadScripts);
</script>

<template>
  <!-- Loading state -->
  <div
    v-if="data.loading"
    :class="baseClass"
    data-embed-type="loading"
    :data-embed-provider="data.provider"
  >
    <div class="vizel-embed-loading">
      <div class="vizel-embed-loading-spinner" />
      <span>Loading embed...</span>
    </div>
  </div>

  <!-- oEmbed (rich embed) -->
  <div
    v-else-if="data.type === 'oembed' && data.html"
    ref="containerRef"
    :class="baseClass"
    data-embed-type="oembed"
    :data-embed-provider="data.provider"
  >
    <div
      :class="isVideo ? 'vizel-embed-video' : 'vizel-embed-oembed'"
      v-html="data.html"
    />
  </div>

  <!-- OGP card -->
  <div
    v-else-if="data.type === 'ogp'"
    :class="baseClass"
    data-embed-type="ogp"
    :data-embed-provider="data.provider"
  >
    <a
      :href="data.url"
      target="_blank"
      rel="noopener noreferrer"
      :class="['vizel-embed-card', hasImage ? 'vizel-embed-card-horizontal' : '']"
    >
      <img
        v-if="hasImage"
        :src="data.image"
        alt=""
        class="vizel-embed-card-image"
        loading="lazy"
      />
      <div class="vizel-embed-card-content">
        <div v-if="data.siteName || data.favicon" class="vizel-embed-card-site">
          <img
            v-if="data.favicon"
            :src="data.favicon"
            alt=""
            class="vizel-embed-card-favicon"
          />
          <span v-if="data.siteName">{{ data.siteName }}</span>
        </div>
        <div v-if="data.title" class="vizel-embed-card-title">{{ data.title }}</div>
        <div v-if="data.description" class="vizel-embed-card-description">{{ data.description }}</div>
        <div class="vizel-embed-card-url">{{ hostname }}</div>
      </div>
    </a>
  </div>

  <!-- Title link -->
  <div
    v-else-if="data.type === 'title' && data.title"
    :class="baseClass"
    data-embed-type="title"
    :data-embed-provider="data.provider"
  >
    <a :href="data.url" target="_blank" rel="noopener noreferrer" class="vizel-embed-link">
      <span class="vizel-embed-link-icon">🔗</span>
      <span class="vizel-embed-link-text">{{ data.title }}</span>
    </a>
  </div>

  <!-- Plain link (fallback) -->
  <div
    v-else
    :class="baseClass"
    data-embed-type="link"
    :data-embed-provider="data.provider"
  >
    <a :href="data.url" target="_blank" rel="noopener noreferrer" class="vizel-embed-link">
      <span class="vizel-embed-link-icon">🔗</span>
      <span class="vizel-embed-link-text">{{ data.url }}</span>
    </a>
  </div>
</template>
