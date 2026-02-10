import { detectVizelEmbedProvider, type Editor } from "@vizel/core";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { VizelIcon } from "./VizelIcon.tsx";

export interface VizelLinkEditorProps {
  editor: Editor;
  onClose: () => void;
  className?: string;
  /** Enable embed option (requires Embed extension) */
  enableEmbed?: boolean;
}

/**
 * A link editor component for editing hyperlinks in the VizelBubbleMenu.
 * Provides an input field for URL entry and buttons to apply or remove the link.
 * Optionally supports converting links to embeds when the Embed extension is loaded.
 *
 * @example
 * ```tsx
 * const [showLinkEditor, setShowLinkEditor] = useState(false);
 *
 * {showLinkEditor ? (
 *   <VizelLinkEditor
 *     editor={editor}
 *     onClose={() => setShowLinkEditor(false)}
 *     enableEmbed
 *   />
 * ) : (
 *   <VizelBubbleMenuButton onClick={() => setShowLinkEditor(true)}>
 *     Link
 *   </VizelBubbleMenuButton>
 * )}
 * ```
 */
export function VizelLinkEditor({
  editor,
  onClose,
  className,
  enableEmbed = false,
}: VizelLinkEditorProps) {
  const currentHref = editor.getAttributes("link").href || "";
  const [url, setUrl] = useState(currentHref);
  const [asEmbed, setAsEmbed] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check if embed extension is available
  const canEmbed = useMemo(() => {
    if (!enableEmbed) return false;
    // Check if setEmbed command exists (embed extension is loaded)
    const extensionManager = editor.extensionManager;
    return extensionManager.extensions.some((ext) => ext.name === "embed");
  }, [editor, enableEmbed]);

  // Check if URL is a known embed provider
  const isEmbedProvider = useMemo(() => {
    if (!url.trim()) return false;
    return detectVizelEmbedProvider(url.trim()) !== null;
  }, [url]);

  // Auto-focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    // Handle Escape key to close
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopImmediatePropagation();
        onClose();
      }
    };

    // Use setTimeout to avoid immediate trigger from the click that opened the editor
    const timeoutId = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 0);
    // Use capture phase so this handler runs before VizelBubbleMenu's handler
    document.addEventListener("keydown", handleKeyDown, true);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [onClose]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmedUrl = url.trim();

      if (!trimmedUrl) {
        editor.chain().focus().unsetLink().run();
        onClose();
        return;
      }

      if (asEmbed && canEmbed) {
        // Remove the link first, then insert embed
        editor.chain().focus().unsetLink().setEmbed({ url: trimmedUrl }).run();
      } else {
        editor.chain().focus().setLink({ href: trimmedUrl }).run();
      }
      onClose();
    },
    [editor, url, asEmbed, canEmbed, onClose]
  );

  const handleRemove = useCallback(() => {
    editor.chain().focus().unsetLink().run();
    onClose();
  }, [editor, onClose]);

  return (
    <form ref={formRef} onSubmit={handleSubmit} className={`vizel-link-editor ${className ?? ""}`}>
      <div className="vizel-link-editor-row">
        <input
          ref={inputRef}
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter URL..."
          className="vizel-link-input"
          aria-label="Link URL"
        />
        <button type="submit" className="vizel-link-button" title="Apply" aria-label="Apply link">
          <VizelIcon name="check" />
        </button>
        {currentHref && (
          <button
            type="button"
            onClick={handleRemove}
            className="vizel-link-button vizel-link-remove"
            title="Remove link"
            aria-label="Remove link"
          >
            <VizelIcon name="x" />
          </button>
        )}
      </div>
      {canEmbed && isEmbedProvider && (
        <div className="vizel-link-editor-embed-toggle">
          <input
            type="checkbox"
            id="vizel-embed-toggle"
            checked={asEmbed}
            onChange={(e) => setAsEmbed(e.target.checked)}
          />
          <label htmlFor="vizel-embed-toggle">Embed as rich content</label>
        </div>
      )}
    </form>
  );
}
