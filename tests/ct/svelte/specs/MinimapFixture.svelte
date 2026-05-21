<script lang="ts">
import { createVizelEditor, VizelEditor, VizelMinimap, VizelProvider } from "@vizel/svelte";

interface Props {
  width?: number;
  height?: number;
}

let { width = 120, height = 200 }: Props = $props();

const editor = createVizelEditor({
  immediatelyRender: false,
});
</script>

<VizelProvider editor={editor.current}>
  <div style="display: flex">
    <div style="flex: 1">
      <VizelEditor />
    </div>
    <VizelMinimap editor={editor.current} {width} {height} />
  </div>
</VizelProvider>
