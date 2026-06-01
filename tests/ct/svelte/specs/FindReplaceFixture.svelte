<script lang="ts">
import {
  createVizelEditor,
  createVizelFindReplaceExtension,
  VizelEditor,
  VizelFindReplace,
  VizelProvider,
} from "@vizel/svelte";

const editor = createVizelEditor({
  immediatelyRender: false,
  initialMarkdown: "alpha beta alpha gamma alpha",
  extensions: [createVizelFindReplaceExtension()],
});

function openReplace() {
  editor.current?.commands.openFindReplace("replace");
}
</script>

<VizelProvider editor={editor.current}>
  <button type="button" data-testid="open-replace" onclick={openReplace}>open replace</button>
  <VizelFindReplace />
  <VizelEditor />
</VizelProvider>
