import { useEffect, useState, type RefObject } from "react";

/**
 * Subscribes to `selectionchange` while editing a formula so components that
 * derive UI from caret position (e.g. nested function hints) re-render when
 * the user only moves the caret without changing React state.
 */
export function useRerenderOnFormulaCaret(
  editorRef: RefObject<HTMLDivElement | null>,
  editSessionActive: boolean
): void {
  const [, bump] = useState(0);

  useEffect(() => {
    if (!editSessionActive) {
      return () => {};
    }

    const onSelectionChange = () => {
      const el = editorRef.current;
      if (!el) return;
      const text = el.innerText?.trim() ?? "";
      if (!text.startsWith("=")) return;

      const sel = window.getSelection();
      if (!sel?.rangeCount || !el.contains(sel.getRangeAt(0).startContainer)) {
        return;
      }

      bump((n) => n + 1);
    };

    document.addEventListener("selectionchange", onSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", onSelectionChange);
    };
  }, [editSessionActive, editorRef]);
}
