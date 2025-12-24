<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    isActive?: boolean;
    disabled?: boolean;
    title?: string;
    class?: string;
    children: Snippet;
    onclick?: () => void;
  }

  let {
    isActive = false,
    disabled = false,
    title,
    class: className,
    children,
    onclick,
  }: Props = $props();
</script>

<button
  type="button"
  {disabled}
  class="vizel-bubble-menu-button {isActive ? 'is-active' : ''} {className ?? ''}"
  {title}
  data-active={isActive || undefined}
  {onclick}
>
  {@render children()}
</button>
