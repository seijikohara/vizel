import type { JSONContent } from "@tiptap/core";
import { Vizel } from "@vizel/react";

export interface VizelFixtureProps {
  placeholder?: string;
  initialContent?: JSONContent;
  showBubbleMenu?: boolean;
}

export function VizelFixture({
  placeholder = "Type something...",
  initialContent,
  showBubbleMenu = true,
}: VizelFixtureProps) {
  return (
    <Vizel
      placeholder={placeholder}
      initialContent={initialContent}
      showBubbleMenu={showBubbleMenu}
    />
  );
}
