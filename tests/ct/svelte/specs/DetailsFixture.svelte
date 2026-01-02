<script lang="ts" module>
export interface DetailsFixtureProps {
  placeholder?: string;
  initialContent?: string;
}
</script>

<script lang="ts">
import { EditorContent, EditorRoot, createVizelEditor } from "@vizel/svelte";

let { placeholder = "Type something...", initialContent }: DetailsFixtureProps = $props();

const editor = createVizelEditor({
  placeholder,
  initialContent,
  features: {
    details: true,
  },
});
</script>

<EditorRoot editor={editor.current}>
  <EditorContent />
</EditorRoot>
