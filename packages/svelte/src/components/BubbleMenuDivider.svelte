<script lang="ts">
interface Props {
  class?: string;
}

let { class: className }: Props = $props();
</script>

<span class="vizel-bubble-menu-divider {className ?? ''}"></span>
