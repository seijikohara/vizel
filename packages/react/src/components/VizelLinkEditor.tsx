import {
  applyVizelLinkEdit,
  buildVizelLinkEditorSpec,
  type Editor,
  resolveVizelLinkEditorLabels,
  type VizelLocale,
} from "@vizel/core";
import { createVizelDismissable, createVizelFocusTrapController } from "@vizel/headless";
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
 * Pointer-outside and Escape dismissal route through
 * `createVizelDismissable` from `@vizel/headless`; `deferPointerHandler`
 * installs the outside-click listener on the next tick so the opening
 * pointerdown does not register as an outside click.
 * `createVizelFocusTrapController` traps Tab inside the form, focuses the
 * URL input on open, and returns focus to the bubble-menu trigger on
 * close, so the two headless controllers own every form-level listener.
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

  const viewState = useMemo(
    () => (editor ? buildVizelLinkEditorSpec(editor, url, enableEmbed) : null),
    [editor, url, enableEmbed]
  );

  // Forward the latest `onClose` to the controller without re-mounting so
  // a prop change does not detach the listener mid-interaction.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Re-mount when the form first renders (editor / viewState becomes
  // non-null) so the controller picks up `formRef.current` once it
  // exists. Empty-deps would skip this case when the editor resolves
  // asynchronously.
  const hasFormTarget = Boolean(editor && viewState);
  useEffect(() => {
    if (!hasFormTarget) return;
    const form = formRef.current;
    if (!form) return;

    // `captureEscape: true` runs the Escape handler in the capture phase
    // and calls `stopImmediatePropagation()`. The link editor owns Escape
    // while open; otherwise the editor's bubble-phase keymap also fires
    // and resets the selection, closing the popover and dropping focus
    // from the input. The controller owns this contract.
    const controller = createVizelDismissable({
      onPointerOutside: () => onCloseRef.current?.(),
      onEscape: () => onCloseRef.current?.(),
      captureEscape: true,
      // Defer the outside-click listener to the next tick so the pointerdown
      // that opens the link editor does not immediately register as an
      // outside click.
      deferPointerHandler: true,
    });
    controller.mount(form);

    // The focus trap moves focus to the URL input on open (replacing the
    // former ad-hoc input focus), keeps Tab cycling inside the form, and
    // returns focus to the bubble-menu trigger when the form unmounts. It
    // ignores Escape so the dismissable stays the sole owner of the close
    // gesture. The controller owns these listeners.
    const focusTrap = createVizelFocusTrapController();
    focusTrap.mount(form);
    return () => {
      controller.unmount();
      focusTrap.unmount();
    };
  }, [hasFormTarget]);

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
          {/*
            Wrap the input in the label so the click target is the same as
            an `htmlFor`/`id` pair without needing a globally-unique DOM id.
            Two link editors on one page (the bubble-menu instance plus a
            custom toolbar instance) used to share `id="vizel-embed-toggle"`,
            triggering the wrong checkbox under WCAG 4.1.1.
          */}
          <label className="vizel-link-editor-embed-toggle-label">
            <input
              type="checkbox"
              checked={asEmbed}
              onChange={(e) => setAsEmbed(e.target.checked)}
            />
            <span>{labels.embedAsRichContent}</span>
          </label>
        </div>
      )}
    </form>
  );
}
