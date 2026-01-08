import { VizelToolbarDivider } from "@vizel/react";

interface Props {
  className?: string;
}

export function BubbleMenuDividerFixture({ className }: Props) {
  return <VizelToolbarDivider className={className} />;
}
