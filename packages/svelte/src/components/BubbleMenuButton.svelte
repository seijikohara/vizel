<script lang="ts" module>
import type { Snippet } from "svelte";

export interface BubbleMenuButtonProps {
  /** Whether the button is in active state */
  isActive?: boolean;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Tooltip title */
  title?: string;
  /** Custom class name */
  class?: string;
  /** Button content */
  children: Snippet;
  /** Click handler */
  onclick?: () => void;
}
</script>

<script lang="ts">
let {
  isActive = false,
  disabled = false,
  title,
  class: className,
  children,
  onclick,
}: BubbleMenuButtonProps = $props();
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
