<script lang="ts" module>
export interface VizelToolbarDividerProps {
  /** Custom class name */
  class?: string;
}
</script>

<script lang="ts">
let { class: className }: VizelToolbarDividerProps = $props();
</script>

<span class="vizel-toolbar-divider {className ?? ''}"></span>
