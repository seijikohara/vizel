<script lang="ts">
import { createVizelEditor, VizelEditor, VizelProvider } from "@vizel/svelte";

import CreateVizelEditorStateInner from "./CreateVizelEditorStateInner.svelte";

const editor = createVizelEditor({
  immediatelyRender: false,
});
</script>

<VizelProvider editor={editor.current}>
  <CreateVizelEditorStateInner />
  <VizelEditor />
</VizelProvider>
