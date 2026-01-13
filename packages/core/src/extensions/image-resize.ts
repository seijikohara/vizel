import Image from "@tiptap/extension-image";

/**
 * Configuration options for the VizelResizableImage extension.
 * These are passed to VizelResizableImage.configure().
 */
export interface VizelResizableImageOptions {
  /** Minimum width in pixels (default: 100) */
  minWidth?: number;
  /** Minimum height in pixels (default: 100) */
  minHeight?: number;
  /** Maximum width in pixels (default: undefined - no limit, uses container width) */
  maxWidth?: number;
  /** Allow inline images */
  inline?: boolean;
  /** Allow base64 encoded images */
  allowBase64?: boolean;
  /** HTML attributes for the image element */
  HTMLAttributes?: Record<string, unknown>;
}

/**
 * ResizableImage Extension
 *
 * Extends the base Image extension with resize handles.
 * Uses a NodeView to wrap images with draggable resize handles.
 */
export const VizelResizableImage = Image.extend<VizelResizableImageOptions>({
  name: "image",

  addOptions() {
    return {
      ...this.parent?.(),
      minWidth: 100,
      minHeight: 100,
      inline: false,
      allowBase64: true,
      HTMLAttributes: {
        class: "vizel-image",
      },
    };
  },

  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (element) => {
          const width = element.getAttribute("width") || element.style.width;
          return width ? Number.parseInt(width, 10) : null;
        },
        renderHTML: (attributes) => {
          if (!attributes.width) return {};
          return { width: attributes.width };
        },
      },
      height: {
        default: null,
        parseHTML: (element) => {
          const height = element.getAttribute("height") || element.style.height;
          return height ? Number.parseInt(height, 10) : null;
        },
        renderHTML: (attributes) => {
          if (!attributes.height) return {};
          return { height: attributes.height };
        },
      },
    };
  },

  addNodeView() {
    return ({ node, editor, getPos }) => {
      const { minWidth = 100, maxWidth } = this.options;

      // Create wrapper
      const wrapper = document.createElement("div");
      wrapper.setAttribute("data-resize-wrapper", "true");

      // Create image
      const img = document.createElement("img");
      img.src = node.attrs.src;
      img.alt = node.attrs.alt || "";
      img.title = node.attrs.title || "";
      img.className = "vizel-image";
      img.draggable = false;

      // Set initial width - height is auto to maintain aspect ratio
      if (node.attrs.width) {
        img.style.width = `${node.attrs.width}px`;
        img.style.height = "auto";
      }

      wrapper.appendChild(img);

      // Create left handle
      const leftHandle = document.createElement("div");
      leftHandle.setAttribute("data-resize-handle", "left");
      leftHandle.contentEditable = "false";
      leftHandle.style.position = "absolute";
      leftHandle.style.left = "4px";
      leftHandle.style.top = "50%";
      leftHandle.style.transform = "translateY(-50%)";

      // Create right handle
      const rightHandle = document.createElement("div");
      rightHandle.setAttribute("data-resize-handle", "right");
      rightHandle.contentEditable = "false";
      rightHandle.style.position = "absolute";
      rightHandle.style.right = "4px";
      rightHandle.style.top = "50%";
      rightHandle.style.transform = "translateY(-50%)";

      // Create dimension tooltip
      const tooltip = document.createElement("div");
      tooltip.setAttribute("data-resize-tooltip", "true");
      tooltip.style.position = "absolute";
      tooltip.style.display = "none";

      wrapper.appendChild(leftHandle);
      wrapper.appendChild(rightHandle);
      wrapper.appendChild(tooltip);

      // Handle resize
      let startX = 0;
      let startWidth = 0;
      let isResizing = false;
      let resizeDirection: "left" | "right" = "right";

      const updateTooltip = (width: number, height: number) => {
        tooltip.textContent = `${Math.round(width)} × ${Math.round(height)}`;
      };

      const showTooltip = () => {
        tooltip.style.display = "block";
        updateTooltip(img.offsetWidth, img.offsetHeight);
      };

      const hideTooltip = () => {
        tooltip.style.display = "none";
      };

      const onMouseDown = (e: MouseEvent, direction: "left" | "right") => {
        e.preventDefault();
        e.stopPropagation();

        if (!editor.isEditable) return;

        isResizing = true;
        resizeDirection = direction;
        startX = e.clientX;
        startWidth = img.offsetWidth;

        showTooltip();

        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
        document.body.style.cursor = "ew-resize";
        document.body.style.userSelect = "none";
      };

      const onMouseMove = (e: MouseEvent) => {
        if (!isResizing) return;

        const diff = resizeDirection === "right" ? e.clientX - startX : startX - e.clientX;

        // Calculate effective maxWidth: use option if set, otherwise use container width
        const containerWidth = wrapper.parentElement?.clientWidth ?? Number.POSITIVE_INFINITY;
        const effectiveMaxWidth = maxWidth ?? containerWidth;

        // Clamp width between min and max
        const newWidth = Math.min(effectiveMaxWidth, Math.max(minWidth, startWidth + diff));

        // Only set width - height will auto-adjust to maintain aspect ratio
        img.style.width = `${newWidth}px`;
        img.style.height = "auto";

        // Update tooltip with current dimensions
        updateTooltip(img.offsetWidth, img.offsetHeight);
      };

      const onMouseUp = () => {
        if (!isResizing) return;

        isResizing = false;
        hideTooltip();
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";

        // Update the node attributes - only save width, height is auto
        const pos = typeof getPos === "function" ? getPos() : null;
        if (pos != null && editor.isEditable) {
          const newWidth = Math.round(img.offsetWidth);

          editor.commands.updateAttributes("image", {
            width: newWidth,
            height: null, // Clear height to use auto
          });
        }
      };

      // Store event handler references for proper cleanup
      const handleLeftMouseDown = (e: MouseEvent) => onMouseDown(e, "left");
      const handleRightMouseDown = (e: MouseEvent) => onMouseDown(e, "right");

      leftHandle.addEventListener("mousedown", handleLeftMouseDown);
      rightHandle.addEventListener("mousedown", handleRightMouseDown);

      return {
        dom: wrapper,
        contentDOM: null,
        update: (updatedNode) => {
          if (updatedNode.type.name !== "image") return false;

          img.src = updatedNode.attrs.src;
          img.alt = updatedNode.attrs.alt || "";
          img.title = updatedNode.attrs.title || "";

          // Only set width - height is auto to maintain aspect ratio
          if (updatedNode.attrs.width) {
            img.style.width = `${updatedNode.attrs.width}px`;
            img.style.height = "auto";
          } else {
            img.style.width = "";
            img.style.height = "";
          }

          return true;
        },
        destroy: () => {
          leftHandle.removeEventListener("mousedown", handleLeftMouseDown);
          rightHandle.removeEventListener("mousedown", handleRightMouseDown);
          // Clean up any lingering document listeners
          document.removeEventListener("mousemove", onMouseMove);
          document.removeEventListener("mouseup", onMouseUp);
        },
      };
    };
  },
});

export { VizelResizableImage as VizelImageResize };
