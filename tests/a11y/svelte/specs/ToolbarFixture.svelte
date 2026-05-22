<script lang="ts">
import { Vizel } from "@vizel/svelte";

// Toolbar fixture for the a11y suite. The `Vizel` all-in-one shell
// renders `VizelToolbar` when `showToolbar` is true, so a single mount
// exercises the toolbar role + button labelling that Pillar 5 cares
// about.
</script>

<Vizel
  showToolbar={true}
  showBubbleMenu={false}
  initialContent="<p>Toolbar fixture body.</p>"
  placeholder="Type something..."
/>
