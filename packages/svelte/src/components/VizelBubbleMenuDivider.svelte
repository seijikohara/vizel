<script lang="ts" module>
export interface VizelBubbleMenuDividerProps {
  /** Custom class name */
  class?: string;
}
</script>

<script lang="ts">
let { class: className }: VizelBubbleMenuDividerProps = $props();
</script>

<span class="vizel-bubble-menu-divider {className ?? ''}"></span>
