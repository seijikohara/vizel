import { type PortalLayer, VizelPortal } from "@vizel/react";

interface PortalFixtureProps {
  layer?: PortalLayer;
  disabled?: boolean;
  className?: string;
  withOverflowContainer?: boolean;
}

export function PortalFixture({
  layer = "dropdown",
  disabled = false,
  className,
  withOverflowContainer = false,
}: PortalFixtureProps) {
  const content = (
    <VizelPortal layer={layer} disabled={disabled} className={className}>
      <div className="test-portal-content" data-testid="portal-content">
        Portal Content
      </div>
    </VizelPortal>
  );

  if (withOverflowContainer) {
    return (
      <div
        data-testid="portal-fixture"
        style={{
          overflow: "hidden",
          width: "100px",
          height: "50px",
          position: "relative",
        }}
      >
        {content}
      </div>
    );
  }

  return <div data-testid="portal-fixture">{content}</div>;
}
