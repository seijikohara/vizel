import { useVizelEditor, VizelEditor, VizelMinimap, VizelProvider } from "@vizel/react";

interface MinimapFixtureProps {
  width?: number;
  height?: number;
}

export function MinimapFixture({ width = 120, height = 200 }: MinimapFixtureProps) {
  const editor = useVizelEditor({
    immediatelyRender: false,
  });

  return (
    <VizelProvider editor={editor}>
      <div style={{ display: "flex" }}>
        <div style={{ flex: 1 }}>
          <VizelEditor />
        </div>
        <VizelMinimap editor={editor} width={width} height={height} />
      </div>
    </VizelProvider>
  );
}
