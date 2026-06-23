import { VizelBubbleMenuDivider } from "@vizel/react";

interface Props {
  className?: string;
}

export function BubbleMenuDividerFixture({ className }: Props) {
  return <VizelBubbleMenuDivider className={className} />;
}
