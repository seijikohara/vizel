import {
  applyVizelLinkEdit,
  buildVizelLinkEditorSpec,
  type Editor,
  resolveVizelLinkEditorLabels,
  type VizelLocale,
} from "@vizel/core";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useVizelContextSafe } from "./VizelContext.tsx";
import { VizelIcon } from "./VizelIcon.tsx";

export interface VizelLinkEditorProps {
  /**
   * The Tiptap editor instance.
   *
   * Optional — when omitted, the component resolves the editor from
   * the surrounding {@link VizelProvider} / {@link Vizel} context.
   */
  editor?: Editor | null;
  onClose?: () => void;
  className?: string;
  /** Enable embed option (requires Embed extension) */
  enableEmbed?: boolean;
  /** Locale for translated UI strings */
  locale?: VizelLocale;
}

/**
 * A link editor component for editing hyperlinks in the VizelBubbleMenu.
 *
 * Localized labels, view-state derivation (initial values from the link
 * mark, embed-toggle visibility, etc.), and the editor-command logic
 * for applying the form come from `@vizel/core`'s link-editor
 * skeleton helpers. The component owns input state and event wiring.
 */
export function VizelLinkEditor({
  editor: editorProp,
  onClose,
  className,
  enableEmbed = false,
  locale,
}: VizelLinkEditorProps) {
  const contextEditor = useVizelContextSafe();
  const editor = editorProp ?? contextEditor;
  const labels = useMemo(() => resolveVizelLinkEditorLabels(locale), [locale]);
  const initialState = useMemo(
    () => (editor ? buildVizelLinkEditorSpec(editor, "", enableEmbed) : null),
    [editor, enableEmbed]
  );
  const [url, setUrl] = useState(initialState?.initialUrl ?? "");
  const [openInNewTab, setOpenInNewTab] = useState(initialState?.initialOpenInNewTab ?? false);
  const [asEmbed, setAsEmbed] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const viewState = useMemo(
    () => (editor ? buildVizelLinkEditorSpec(editor, url, enableEmbed) : null),
    [editor, url, enableEmbed]
  );

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!(event.target instanceof Node)) return;
      if (formRef.current && !formRef.current.contains(event.target)) {
        onClose?.();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopImmediatePropagation();
        onClose?.();
      }
    };

    const timeoutId = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 0);
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
      if (!(editor && viewState)) return;
      applyVizelLinkEdit(editor, { url, openInNewTab, asEmbed }, viewState.canEmbed);
      onClose?.();
    },
    [editor, url, openInNewTab, asEmbed, viewState, onClose]
  );

  const handleRemove = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().unsetLink().run();
    onClose?.();
  }, [editor, onClose]);

  const handleVisit = useCallback(() => {
    const trimmedUrl = url.trim();
    if (trimmedUrl) {
      window.open(trimmedUrl, "_blank", "noopener,noreferrer");
    }
  }, [url]);

  // Bail out when no editor is resolvable from props or context. The early
  // return must come *after* every hook call so React's hook-order
  // contract holds across the populated and empty branches.
  if (!(editor && viewState)) return null;

  return (
    <form ref={formRef} onSubmit={handleSubmit} className={`vizel-link-editor ${className ?? ""}`}>
      <div className="vizel-link-editor-row">
        <input
          ref={inputRef}
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder={labels.urlPlaceholder}
          className="vizel-link-input"
          aria-label={labels.urlAriaLabel}
        />
        <button
          type="submit"
          className="vizel-link-button"
          title={labels.apply}
          aria-label={labels.applyAriaLabel}
        >
          <VizelIcon name="check" />
        </button>
        {viewState.showRemoveButton && (
          <button
            type="button"
            onClick={handleRemove}
            className="vizel-link-button vizel-link-remove"
            title={labels.removeLink}
            aria-label={labels.removeLinkAriaLabel}
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
          <span>{labels.openInNewTab}</span>
        </label>
        {viewState.showVisitButton && (
          <button
            type="button"
            onClick={handleVisit}
            className="vizel-link-visit"
            title={labels.visitTitle}
          >
            <VizelIcon name="externalLink" />
            <span>{labels.visit}</span>
          </button>
        )}
      </div>
      {viewState.showEmbedToggle && (
        <div className="vizel-link-editor-embed-toggle">
          <input
            type="checkbox"
            id="vizel-embed-toggle"
            checked={asEmbed}
            onChange={(e) => setAsEmbed(e.target.checked)}
          />
          <label htmlFor="vizel-embed-toggle">{labels.embedAsRichContent}</label>
        </div>
      )}
    </form>
  );
}
