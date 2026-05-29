import {
  buildVizelFindReplaceSpec,
  type Editor,
  getVizelFindReplaceState,
  resolveVizelFindReplaceLabels,
  type VizelLocale,
} from "@vizel/core";
import {
  type ChangeEvent,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useVizelEditorState } from "../_reactivity.ts";
import { useVizelContextSafe } from "./VizelContext.tsx";

export interface VizelFindReplaceProps {
  /**
   * The Tiptap editor instance.
   *
   * Optional — when omitted, the component resolves the editor from
   * the surrounding {@link VizelProvider} / {@link Vizel} context, so a
   * consumer can drop `<VizelFindReplace />` inside the all-in-one
   * component without juggling refs.
   */
  editor?: Editor | null;
  /** Custom class name */
  className?: string;
  /** Locale for translated UI strings */
  locale?: VizelLocale;
  /** Callback when the panel is closed */
  onClose?: () => void;
}

/**
 * Find & Replace panel component for React
 */
export function VizelFindReplace({
  editor: editorProp,
  className,
  locale,
  onClose,
}: VizelFindReplaceProps) {
  const contextEditor = useVizelContextSafe();
  const editor = editorProp ?? contextEditor;
  const labels = resolveVizelFindReplaceLabels(locale?.findReplace);
  const [findText, setFindText] = useState("");
  const [replaceText, setReplaceText] = useState("");
  const [caseSensitive, setCaseSensitive] = useState(false);
  const findInputRef = useRef<HTMLInputElement>(null);

  // Read the Find & Replace plugin state through the flagship
  // `useVizelEditorState` primitive (ADR-0004), replacing the hand-rolled
  // `editor.on("transaction")` subscription. The plugin's `apply` returns
  // the same state reference on transactions that leave the find state
  // unchanged, so the default `Object.is` equality re-renders the panel
  // only when the query, matches, or open state actually change. The
  // explicit `editor` keeps the subscription bound to the prop instance
  // when the panel renders outside a `VizelProvider`.
  const state = useVizelEditorState(
    (current) => (current === null ? null : getVizelFindReplaceState(current.state)),
    { editor }
  );

  // Focus input when panel opens
  useEffect(() => {
    if (state?.isOpen) {
      findInputRef.current?.focus();
      findInputRef.current?.select();
    }
  }, [state?.isOpen]);

  const handleFindInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setFindText(value);
      if (editor) {
        editor.commands.find(value);
      }
    },
    [editor]
  );

  const handleFindNext = useCallback(() => {
    editor?.commands.findNext();
  }, [editor]);

  const handleFindPrevious = useCallback(() => {
    editor?.commands.findPrevious();
  }, [editor]);

  const handleReplace = useCallback(() => {
    if (editor) {
      editor.commands.replace(replaceText);
      editor.commands.findNext();
    }
  }, [editor, replaceText]);

  const handleReplaceAll = useCallback(() => {
    if (editor) {
      editor.commands.replaceAll(replaceText);
    }
  }, [editor, replaceText]);

  const handleClose = useCallback(() => {
    if (editor) {
      editor.commands.clearFind();
      editor.commands.closeFindReplace();
    }
    setFindText("");
    setReplaceText("");
    editor?.view.dom.focus();
    onClose?.();
  }, [editor, onClose]);

  const handleCaseSensitiveChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const checked = e.target.checked;
      setCaseSensitive(checked);
      editor?.commands.setFindCaseSensitive(checked);
      if (findText) {
        editor?.commands.find(findText);
      }
    },
    [editor, findText]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (e.shiftKey) {
          handleFindPrevious();
        } else {
          handleFindNext();
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
      }
    },
    [handleFindNext, handleFindPrevious, handleClose]
  );

  const view = useMemo(
    () => buildVizelFindReplaceSpec(state, labels.noResults),
    [state, labels.noResults]
  );

  if (!view.isOpen) {
    return null;
  }

  return (
    <div
      className={`vizel-find-replace-panel ${className || ""}`}
      role="dialog"
      aria-label={labels.label}
    >
      <div className="vizel-find-replace-row">
        <input
          ref={findInputRef}
          type="text"
          className="vizel-find-replace-input"
          placeholder={labels.findPlaceholder}
          value={findText}
          onChange={handleFindInputChange}
          onKeyDown={handleKeyDown}
          aria-label={labels.findTextAriaLabel}
        />
        <span className="vizel-find-replace-count" aria-live="polite">
          {view.matchCountDisplay}
        </span>
        <button
          type="button"
          className="vizel-find-replace-button"
          onClick={handleFindPrevious}
          disabled={view.isDisabled}
          aria-label={labels.findPreviousAriaLabel}
          title={labels.findPreviousTitle}
        >
          ↑
        </button>
        <button
          type="button"
          className="vizel-find-replace-button"
          onClick={handleFindNext}
          disabled={view.isDisabled}
          aria-label={labels.findNextAriaLabel}
          title={labels.findNextTitle}
        >
          ↓
        </button>
        <button
          type="button"
          className="vizel-find-replace-button"
          onClick={handleClose}
          aria-label={labels.closeAriaLabel}
          title={labels.closeTitle}
        >
          ✕
        </button>
      </div>

      {view.isReplaceMode && (
        <div className="vizel-find-replace-row">
          <input
            type="text"
            className="vizel-find-replace-input"
            placeholder={labels.replacePlaceholder}
            value={replaceText}
            onChange={(e) => setReplaceText(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-label={labels.replaceTextAriaLabel}
          />
          <button
            type="button"
            className="vizel-find-replace-button"
            onClick={handleReplace}
            disabled={view.isDisabled}
            aria-label={labels.replaceAriaLabel}
            title={labels.replaceTitle}
          >
            Replace
          </button>
          <button
            type="button"
            className="vizel-find-replace-button vizel-find-replace-button--primary"
            onClick={handleReplaceAll}
            disabled={view.isDisabled}
            aria-label={labels.replaceAllAriaLabel}
            title={labels.replaceAllTitle}
          >
            All
          </button>
        </div>
      )}

      <div className="vizel-find-replace-options">
        <label className="vizel-find-replace-checkbox">
          <input type="checkbox" checked={caseSensitive} onChange={handleCaseSensitiveChange} />
          {labels.caseSensitive}
        </label>
      </div>
    </div>
  );
}
