import { Vizel } from "@vizel/react";

/**
 * Toolbar fixture for the a11y suite. The `Vizel` all-in-one shell
 * renders `VizelToolbar` when `showToolbar` is true, so a single mount
 * exercises the toolbar role + button labelling that Pillar 5 cares
 * about.
 */
export function ToolbarFixture() {
  return (
    <Vizel
      showToolbar
      showBubbleMenu={false}
      initialContent="<p>Toolbar fixture body.</p>"
      placeholder="Type something..."
    />
  );
}
