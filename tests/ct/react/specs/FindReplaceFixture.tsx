import {
  createVizelFindReplaceExtension,
  useVizelEditor,
  VizelEditor,
  VizelFindReplace,
  VizelProvider,
} from "@vizel/react";
import { useMemo } from "react";

export function FindReplaceFixture() {
  const extensions = useMemo(() => [createVizelFindReplaceExtension()], []);
  const editor = useVizelEditor({
    immediatelyRender: false,
    initialMarkdown: "alpha beta alpha gamma alpha",
    extensions,
  });

  return (
    <VizelProvider editor={editor}>
      <button
        type="button"
        data-testid="open-replace"
        onClick={() => editor?.commands.openFindReplace("replace")}
      >
        open replace
      </button>
      <VizelFindReplace />
      <VizelEditor />
    </VizelProvider>
  );
}
