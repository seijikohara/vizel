import { BubbleMenuDivider } from "@vizel/react";

interface Props {
  className?: string;
}

export function BubbleMenuDividerFixture({ className }: Props) {
  return <BubbleMenuDivider className={className} />;
}
