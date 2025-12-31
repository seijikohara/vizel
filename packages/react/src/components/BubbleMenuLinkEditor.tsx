import type { Editor } from "@vizel/core";
import { useCallback, useEffect, useRef, useState } from "react";

export interface BubbleMenuLinkEditorProps {
  editor: Editor;
  onClose: () => void;
  className?: string;
}

/**
 * A link editor component for editing hyperlinks in the BubbleMenu.
 * Provides an input field for URL entry and buttons to apply or remove the link.
 *
 * @example
 * ```tsx
 * const [showLinkEditor, setShowLinkEditor] = useState(false);
 *
 * {showLinkEditor ? (
 *   <BubbleMenuLinkEditor
 *     editor={editor}
 *     onClose={() => setShowLinkEditor(false)}
 *   />
 * ) : (
 *   <BubbleMenuButton onClick={() => setShowLinkEditor(true)}>
 *     Link
 *   </BubbleMenuButton>
 * )}
 * ```
 */
export function BubbleMenuLinkEditor({ editor, onClose, className }: BubbleMenuLinkEditorProps) {
  const currentHref = editor.getAttributes("link").href || "";
  const [url, setUrl] = useState(currentHref);
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Handle click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (formRef.current && !formRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    // Handle Escape key to close
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopImmediatePropagation();
        onClose();
      }
    }

    // Use setTimeout to avoid immediate trigger from the click that opened the editor
    const timeoutId = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 0);
    // Use capture phase so this handler runs before BubbleMenu's handler
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
      if (url.trim()) {
        editor.chain().focus().setLink({ href: url.trim() }).run();
      } else {
        editor.chain().focus().unsetLink().run();
      }
      onClose();
    },
    [editor, url, onClose]
  );

  const handleRemove = useCallback(() => {
    editor.chain().focus().unsetLink().run();
    onClose();
  }, [editor, onClose]);

  return (
    <form ref={formRef} onSubmit={handleSubmit} className={`vizel-link-editor ${className ?? ""}`}>
      <input
        ref={inputRef}
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Enter URL..."
        className="vizel-link-input"
      />
      <button type="submit" className="vizel-link-button" title="Apply">
        OK
      </button>
      {currentHref && (
        <button
          type="button"
          onClick={handleRemove}
          className="vizel-link-button vizel-link-remove"
          title="Remove link"
        >
          X
        </button>
      )}
    </form>
  );
}
