<script lang="ts" module>
export interface BubbleMenuDividerProps {
  /** Custom class name */
  class?: string;
}
</script>

<script lang="ts">
let { class: className }: BubbleMenuDividerProps = $props();
</script>

<span class="vizel-bubble-menu-divider {className ?? ''}"></span>
