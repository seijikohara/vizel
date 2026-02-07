import { type Editor, getVizelFindReplaceState, type VizelFindReplaceState } from "@vizel/core";
import {
  type ChangeEvent,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

export interface VizelFindReplaceProps {
  /** The Tiptap editor instance */
  editor: Editor | null;
  /** Custom class name */
  className?: string;
  /** Callback when the panel is closed */
  onClose?: () => void;
}

/**
 * Find & Replace panel component for React
 */
export function VizelFindReplace({ editor, className, onClose }: VizelFindReplaceProps) {
  const [findText, setFindText] = useState("");
  const [replaceText, setReplaceText] = useState("");
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [state, setState] = useState<VizelFindReplaceState | null>(null);
  const findInputRef = useRef<HTMLInputElement>(null);

  // Subscribe to plugin state changes
  useEffect(() => {
    if (!editor) return;

    const updateState = () => {
      const pluginState = getVizelFindReplaceState(editor.state);
      setState(pluginState);
    };

    updateState();
    editor.on("transaction", updateState);

    return () => {
      editor.off("transaction", updateState);
    };
  }, [editor]);

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

  if (!state?.isOpen) {
    return null;
  }

  const matchCount = state.matches.length;
  const currentMatch = state.activeIndex >= 0 ? state.activeIndex + 1 : 0;
  const isReplaceMode = state.mode === "replace";

  return (
    <div
      className={`vizel-find-replace-panel ${className || ""}`}
      role="dialog"
      aria-label="Find and Replace"
    >
      <div className="vizel-find-replace-row">
        <input
          ref={findInputRef}
          type="text"
          className="vizel-find-replace-input"
          placeholder="Find..."
          value={findText}
          onChange={handleFindInputChange}
          onKeyDown={handleKeyDown}
          aria-label="Find text"
        />
        <span className="vizel-find-replace-count">
          {matchCount > 0 ? `${currentMatch}/${matchCount}` : "No results"}
        </span>
        <button
          type="button"
          className="vizel-find-replace-button"
          onClick={handleFindPrevious}
          disabled={matchCount === 0}
          aria-label="Find previous"
          title="Find previous (Shift+Enter)"
        >
          ↑
        </button>
        <button
          type="button"
          className="vizel-find-replace-button"
          onClick={handleFindNext}
          disabled={matchCount === 0}
          aria-label="Find next"
          title="Find next (Enter)"
        >
          ↓
        </button>
        <button
          type="button"
          className="vizel-find-replace-button"
          onClick={handleClose}
          aria-label="Close"
          title="Close (Escape)"
        >
          ✕
        </button>
      </div>

      {isReplaceMode && (
        <div className="vizel-find-replace-row">
          <input
            type="text"
            className="vizel-find-replace-input"
            placeholder="Replace with..."
            value={replaceText}
            onChange={(e) => setReplaceText(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-label="Replace text"
          />
          <button
            type="button"
            className="vizel-find-replace-button"
            onClick={handleReplace}
            disabled={matchCount === 0}
            aria-label="Replace"
            title="Replace current match"
          >
            Replace
          </button>
          <button
            type="button"
            className="vizel-find-replace-button vizel-find-replace-button--primary"
            onClick={handleReplaceAll}
            disabled={matchCount === 0}
            aria-label="Replace all"
            title="Replace all matches"
          >
            All
          </button>
        </div>
      )}

      <div className="vizel-find-replace-options">
        <label className="vizel-find-replace-checkbox">
          <input type="checkbox" checked={caseSensitive} onChange={handleCaseSensitiveChange} />
          Case sensitive
        </label>
      </div>
    </div>
  );
}
