<script setup lang="ts">
import { loadVizelEmbedScripts, resolveVizelEmbedView, type VizelEmbedData } from "@vizel/core";
import { computed, onMounted, useTemplateRef, watch } from "vue";

import VizelIcon from "./VizelIcon.vue";

export interface VizelEmbedViewProps {
  /** Embed data */
  data: VizelEmbedData;
  /** Additional class name */
  class?: string;
  /** Whether the embed is selected */
  selected?: boolean;
}

const props = defineProps<VizelEmbedViewProps>();

const containerRef = useTemplateRef<HTMLDivElement>("containerRef");

const view = computed(() => resolveVizelEmbedView(props.data));

const baseClass = computed(() => {
  const classes = ["vizel-embed"];
  if (props.data.loading) classes.push("is-loading");
  if (props.selected) classes.push("ProseMirror-selectednode");
  if (props.class) classes.push(props.class);
  return classes.join(" ");
});

function loadScripts() {
  if (view.value.kind === "oembed" && containerRef.value) {
    loadVizelEmbedScripts(containerRef.value, view.value.provider);
  }
}

onMounted(loadScripts);
watch(view, loadScripts);
</script>

<template>
  <template v-if="view.kind === 'loading'">
    <div :class="baseClass" data-embed-type="loading" :data-embed-provider="view.provider">
      <div class="vizel-embed-loading">
        <div class="vizel-embed-loading-spinner" />
        <span>Loading embed...</span>
      </div>
    </div>
  </template>

  <template v-else-if="view.kind === 'oembed'">
    <div
      ref="containerRef"
      :class="baseClass"
      data-embed-type="oembed"
      :data-embed-provider="view.provider"
    >
      <div :class="view.isVideo ? 'vizel-embed-video' : 'vizel-embed-oembed'" v-html="view.html" />
    </div>
  </template>

  <template v-else-if="view.kind === 'ogp'">
    <div :class="baseClass" data-embed-type="ogp" :data-embed-provider="view.provider">
      <a
        :href="view.url"
        target="_blank"
        rel="noopener noreferrer"
        :class="['vizel-embed-card', view.image ? 'vizel-embed-card-horizontal' : '']"
      >
        <img
          v-if="view.image"
          :src="view.image"
          alt=""
          class="vizel-embed-card-image"
          loading="lazy"
        />
        <div class="vizel-embed-card-content">
          <div v-if="view.siteName || view.favicon" class="vizel-embed-card-site">
            <img v-if="view.favicon" :src="view.favicon" alt="" class="vizel-embed-card-favicon" />
            <span v-if="view.siteName">{{ view.siteName }}</span>
          </div>
          <div v-if="view.title" class="vizel-embed-card-title">{{ view.title }}</div>
          <div v-if="view.description" class="vizel-embed-card-description">
            {{ view.description }}
          </div>
          <div class="vizel-embed-card-url">{{ view.hostname }}</div>
        </div>
      </a>
    </div>
  </template>

  <template v-else-if="view.kind === 'title'">
    <div :class="baseClass" data-embed-type="title" :data-embed-provider="view.provider">
      <a :href="view.url" target="_blank" rel="noopener noreferrer" class="vizel-embed-link">
        <span class="vizel-embed-link-icon"><VizelIcon name="link" /></span>
        <span class="vizel-embed-link-text">{{ view.title }}</span>
      </a>
    </div>
  </template>

  <template v-else>
    <div :class="baseClass" data-embed-type="link" :data-embed-provider="view.provider">
      <a :href="view.url" target="_blank" rel="noopener noreferrer" class="vizel-embed-link">
        <span class="vizel-embed-link-icon"><VizelIcon name="link" /></span>
        <span class="vizel-embed-link-text">{{ view.url }}</span>
      </a>
    </div>
  </template>
</template>
