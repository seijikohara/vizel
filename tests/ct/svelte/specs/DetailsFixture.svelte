<script lang="ts" module>
export interface DetailsFixtureProps {
  placeholder?: string;
  initialContent?: string;
}
</script>

<script lang="ts">
import { VizelEditor, VizelProvider, createVizelEditor } from "@vizel/svelte";

const props = $props<DetailsFixtureProps>();

const editor = createVizelEditor({
  placeholder: props.placeholder ?? "Type something...",
  initialContent: props.initialContent,
  features: {
    details: true,
  },
});
</script>

<VizelProvider editor={editor.current}>
  <VizelEditor />
</VizelProvider>
