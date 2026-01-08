import { getVizelPortalContainer, VIZEL_PORTAL_Z_INDEX, type VizelPortalLayer } from "@vizel/core";
import { type ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Props for the VizelPortal component.
 */
export interface VizelPortalProps {
  /** Content to render in the portal */
  children: ReactNode;
  /** Z-index layer for the portal content */
  layer?: VizelPortalLayer;
  /** Additional CSS class name */
  className?: string;
  /** Whether the portal is disabled (renders children in place) */
  disabled?: boolean;
}

/**
 * Portal component for rendering content outside the DOM hierarchy.
 *
 * Renders children into a portal container at the document body level,
 * ensuring proper z-index stacking for floating UI elements.
 *
 * @example
 * ```tsx
 * <VizelPortal layer="dropdown">
 *   <DropdownMenu />
 * </VizelPortal>
 * ```
 *
 * @example Disabled portal (renders in place)
 * ```tsx
 * <VizelPortal disabled>
 *   <Content />
 * </VizelPortal>
 * ```
 */
export function VizelPortal({
  children,
  layer = "dropdown",
  className,
  disabled = false,
}: VizelPortalProps): ReactNode {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render portal during SSR or when disabled
  if (!mounted || disabled) {
    return children;
  }

  const container = getVizelPortalContainer();

  return createPortal(
    <div
      data-vizel-portal-layer={layer}
      className={className}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        zIndex: VIZEL_PORTAL_Z_INDEX[layer],
      }}
    >
      {children}
    </div>,
    container
  );
}

VizelPortal.displayName = "VizelPortal";
