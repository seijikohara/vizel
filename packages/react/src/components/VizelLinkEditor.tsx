import { detectVizelEmbedProvider, type Editor, type VizelLocale } from "@vizel/core";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { VizelIcon } from "./VizelIcon.tsx";

export interface VizelLinkEditorProps {
  editor: Editor;
  onClose?: () => void;
  className?: string;
  /** Enable embed option (requires Embed extension) */
  enableEmbed?: boolean;
  /** Locale for translated UI strings */
  locale?: VizelLocale;
}

/**
 * A link editor component for editing hyperlinks in the VizelBubbleMenu.
 * Provides an input field for URL entry, open-in-new-tab toggle, visit button,
 * and buttons to apply or remove the link.
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
  locale,
}: VizelLinkEditorProps) {
  const linkAttrs = editor.getAttributes("link");
  const currentHref = linkAttrs.href || "";
  const [url, setUrl] = useState(currentHref);
  const [openInNewTab, setOpenInNewTab] = useState(linkAttrs.target === "_blank");
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
      if (!(event.target instanceof Node)) return;
      if (formRef.current && !formRef.current.contains(event.target)) {
        onClose?.();
      }
    };

    // Handle Escape key to close
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopImmediatePropagation();
        onClose?.();
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
        onClose?.();
        return;
      }

      if (asEmbed && canEmbed) {
        // Remove the link first, then insert embed
        editor.chain().focus().unsetLink().setEmbed({ url: trimmedUrl }).run();
      } else {
        editor
          .chain()
          .focus()
          .setLink({
            href: trimmedUrl,
            target: openInNewTab ? "_blank" : null,
          })
          .run();
      }
      onClose?.();
    },
    [editor, url, openInNewTab, asEmbed, canEmbed, onClose]
  );

  const handleRemove = useCallback(() => {
    editor.chain().focus().unsetLink().run();
    onClose?.();
  }, [editor, onClose]);

  const handleVisit = useCallback(() => {
    const trimmedUrl = url.trim();
    if (trimmedUrl) {
      window.open(trimmedUrl, "_blank", "noopener,noreferrer");
    }
  }, [url]);

  return (
    <form ref={formRef} onSubmit={handleSubmit} className={`vizel-link-editor ${className ?? ""}`}>
      <div className="vizel-link-editor-row">
        <input
          ref={inputRef}
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder={locale?.linkEditor?.urlPlaceholder ?? "Enter URL..."}
          className="vizel-link-input"
          aria-label="Link URL"
        />
        <button
          type="submit"
          className="vizel-link-button"
          title={locale?.linkEditor?.apply ?? "Apply"}
          aria-label={locale?.linkEditor?.applyAriaLabel ?? "Apply link"}
        >
          <VizelIcon name="check" />
        </button>
        {currentHref && (
          <button
            type="button"
            onClick={handleRemove}
            className="vizel-link-button vizel-link-remove"
            title={locale?.linkEditor?.removeLink ?? "Remove link"}
            aria-label={locale?.linkEditor?.removeLinkAriaLabel ?? "Remove link"}
          >
            <VizelIcon name="x" />
          </button>
        )}
      </div>
      <div className="vizel-link-editor-options">
        <label className="vizel-link-newtab-toggle">
          <input
            type="checkbox"
            checked={openInNewTab}
            onChange={(e) => setOpenInNewTab(e.target.checked)}
          />
          <span>{locale?.linkEditor?.openInNewTab ?? "Open in new tab"}</span>
        </label>
        {url.trim() && (
          <button
            type="button"
            onClick={handleVisit}
            className="vizel-link-visit"
            title={locale?.linkEditor?.visitTitle ?? "Open URL in new tab"}
          >
            <VizelIcon name="externalLink" />
            <span>{locale?.linkEditor?.visit ?? "Visit"}</span>
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
          <label htmlFor="vizel-embed-toggle">
            {locale?.linkEditor?.embedAsRichContent ?? "Embed as rich content"}
          </label>
        </div>
      )}
    </form>
  );
}
