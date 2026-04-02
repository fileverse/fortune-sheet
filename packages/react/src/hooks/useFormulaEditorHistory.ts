import { useCallback, useRef, type RefObject } from "react";
import { type Context, escapeScriptTag } from "@fileverse-dev/fortune-core";
import {
  getCursorPosition,
  getSelectionOffsets,
  setSelectionOffsets,
  setCursorPosition,
} from "../components/SheetOverlay/helper";
import type { SetContextOptions } from "../context";

export type FormulaHistoryEntry = {
  html: string;
  caret: number;
};

/** Which editor receives caret placement and drives history snapshots. */
export type FormulaEditorHistoryPrimary = "cell" | "fx";

type SetContext = (
  recipe: (ctx: Context) => void,
  options?: SetContextOptions
) => void;

const MAX_FORMULA_HISTORY = 100;

function normalizeEditorHtmlSnapshot(html: string): string {
  // Treat editor placeholders as "empty" so undo can clear the first char.
  const stripped = (html ?? "").replace(/\u200B/g, "").trim();
  if (
    stripped === "" ||
    stripped === "<br>" ||
    stripped === "<div><br></div>" ||
    stripped === "<div></div>"
  ) {
    return "";
  }
  return html ?? "";
}

function historyForLog(entries: FormulaHistoryEntry[], index: number) {
  return entries.map((e, i) => ({
    i,
    active: i === index,
    len: (e.html ?? "").length,
    preview: (e.html ?? "").replace(/\s+/g, " ").slice(0, 24),
  }));
}

/**
 * Custom undo/redo for the cell overlay and Fx bar — **one code path** for
 * formulas (=…) and plain/rich text (same snapshot shape: text, html, spans).
 */
export function useFormulaEditorHistory(
  primaryRef: RefObject<HTMLDivElement | null>,
  cellInputRef: RefObject<HTMLDivElement | null>,
  fxInputRef: RefObject<HTMLDivElement | null>,
  _setContext: SetContext,
  primary: FormulaEditorHistoryPrimary
) {
  const preTextRef = useRef("");
  const preHtmlRef = useRef("");
  const preCaretRef = useRef<number>(0);
  const startedFromEmptyRef = useRef<boolean>(true);
  const formulaHistoryRef = useRef<{
    active: boolean;
    entries: FormulaHistoryEntry[];
    index: number;
  }>({
    active: false,
    entries: [],
    index: -1,
  });
  /** Skip recording when DOM is updated by undo/redo (avoids truncating redo). */
  const isApplyingHistoryRef = useRef(false);

  const resetFormulaHistory = useCallback(() => {
    formulaHistoryRef.current = {
      active: false,
      entries: [],
      index: -1,
    };
    preHtmlRef.current = "";
    preCaretRef.current = 0;
    startedFromEmptyRef.current = true;
  }, []);

  const pushFormulaHistoryEntry = useCallback((entry: FormulaHistoryEntry) => {
    const history = formulaHistoryRef.current;
    const current = history.entries[history.index];
    // caret-only changes should not create new undo steps
    if (current && current.html === entry.html) {
      console.log("[Hist:pushSkipDuplicate]", {
        currentHtmlLen: current.html.length,
        entryHtmlLen: entry.html.length,
        index: history.index,
      });
      return;
    }

    const nextEntries = history.entries.slice(0, history.index + 1);
    nextEntries.push(entry);
    if (nextEntries.length > MAX_FORMULA_HISTORY) nextEntries.shift();

    history.entries = nextEntries;
    history.index = nextEntries.length - 1;
    history.active = true;
    console.log("[Hist:push]", {
      htmlLen: entry.html.length,
      caret: entry.caret,
      entriesLen: history.entries.length,
      index: history.index,
      entries: historyForLog(history.entries, history.index),
    });
  }, []);

  const applyFormulaHistoryEntry = useCallback(
    (entry: FormulaHistoryEntry, preserveSelection?: { start: number; end: number }) => {
      const primaryEl = primaryRef.current;
      if (!primaryEl) return;

      isApplyingHistoryRef.current = true;

      // We store and re-apply raw `innerHTML` snapshots.
      const html = escapeScriptTag(entry.html ?? "");

      const cell = cellInputRef.current;
      const fx = fxInputRef.current;

      primaryEl.innerHTML = html;
      if (primary === "cell") {
        if (fx) fx.innerHTML = html;
      } else if (cell) {
        cell.innerHTML = html;
      }

      const textLen = primaryEl.innerText?.length ?? 0;
      if (
        preserveSelection &&
        preserveSelection.end > preserveSelection.start &&
        textLen > 0
      ) {
        const start = Math.max(0, Math.min(preserveSelection.start, textLen));
        const end = Math.max(start, Math.min(preserveSelection.end, textLen));
        setSelectionOffsets(primaryEl, start, end);
      } else {
        // Default UX: place caret at end.
        setCursorPosition(primaryEl, Math.max(0, textLen));
      }
      console.log("[Hist:apply]", {
        entryHtmlLen: (entry.html ?? "").length,
        afterHtmlLen: (primaryEl.innerHTML ?? "").length,
        afterTextLen: textLen,
      });

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTimeout(() => {
            isApplyingHistoryRef.current = false;
          }, 120);
        });
      });
    },
    [cellInputRef, fxInputRef, primary, primaryRef]
  );

  const handleFormulaHistoryUndoRedo = useCallback(
    (isRedo: boolean) => {
      const history = formulaHistoryRef.current;
      if (!history.active || history.entries.length === 0) return false;

      const nextIndex = isRedo ? history.index + 1 : history.index - 1;
      if (nextIndex < 0 || nextIndex >= history.entries.length) {
        console.log("[Hist:undoRedoBoundary]", {
          isRedo,
          index: history.index,
          entriesLen: history.entries.length,
          nextIndex,
          startedFromEmpty: startedFromEmptyRef.current,
          liveHtmlLen: normalizeEditorHtmlSnapshot(
            primaryRef.current?.innerHTML ?? ""
          ).length,
          entries: historyForLog(history.entries, history.index),
        });
        if (!isRedo && nextIndex < 0 && startedFromEmptyRef.current) {
          const liveHtml = normalizeEditorHtmlSnapshot(
            primaryRef.current?.innerHTML ?? ""
          );
          if (liveHtml !== "") {
            history.entries[0] = { html: "", caret: 0 };
            history.index = 0;
            const currentSelection = primaryRef.current
              ? getSelectionOffsets(primaryRef.current)
              : undefined;
            applyFormulaHistoryEntry(history.entries[0], currentSelection);
            console.log("[Hist:undoRedoForcedEmpty]", {
              entriesLen: history.entries.length,
              index: history.index,
              entries: historyForLog(history.entries, history.index),
            });
            return true;
          }
        }
        return false;
      }
      history.index = nextIndex;
      const entry = history.entries[nextIndex];
      const currentSelection = primaryRef.current
        ? getSelectionOffsets(primaryRef.current)
        : undefined;
      applyFormulaHistoryEntry(entry, currentSelection);
      console.log("[Hist:undoRedoApplied]", {
        isRedo,
        nextIndex,
        entriesLen: history.entries.length,
        entryHtmlLen: entry.html.length,
        entries: historyForLog(history.entries, history.index),
      });
      return true;
    },
    [applyFormulaHistoryEntry, primaryRef]
  );

  /** Call at editor keydown start (formula + plain/rich text). */
  const capturePreEditorHistoryState = useCallback(() => {
    const el = primaryRef.current;
    if (!el) return;
    preTextRef.current = el.innerText;
    preHtmlRef.current = el.innerHTML;
    preCaretRef.current = getCursorPosition(el);
    if (!formulaHistoryRef.current.active) {
      startedFromEmptyRef.current =
        normalizeEditorHtmlSnapshot(preHtmlRef.current ?? "") === "";
    }
    console.log("[Hist:capturePre]", {
      preHtmlLen: (preHtmlRef.current ?? "").length,
      preTextLen: (preTextRef.current ?? "").length,
      preCaret: preCaretRef.current,
      startedFromEmpty: startedFromEmptyRef.current,
      historyActive: formulaHistoryRef.current.active,
      entriesLen: formulaHistoryRef.current.entries.length,
      index: formulaHistoryRef.current.index,
    });
  }, [primaryRef]);

  /**
   * Call from onChange when a key event is available.
   * Single path: formula vs non-formula only changes span seeding and when we reset.
   *
   * First keystroke in an empty editor: `input` often fires before `innerText`
   * matches the new character, so seed and "current" snapshots can be identical.
   * Dedupe would drop the second push → only one stack entry → undo uses
   * `index === 0`, `nextIndex === -1`, returns "handled" and preventDefault
   * blocks native undo — the first character never disappears. After seeding,
   * always `force` the post-edit snapshot so we get two entries even when
   * snapshots match.
   */
  const appendEditorHistoryFromPrimaryEditor = useCallback(
    (getCaret: () => number) => {
      if (isApplyingHistoryRef.current) return;

      const el = primaryRef.current;
      if (!el) return;

      const preHtmlSnapshot = normalizeEditorHtmlSnapshot(
        preHtmlRef.current ?? ""
      );
      const snapshotHtml = normalizeEditorHtmlSnapshot(el.innerHTML ?? "");
      const caret = getCaret();

      const history = formulaHistoryRef.current;
      const wasInactive = !history.active || history.entries.length === 0;
      console.log("[Hist:appendStart]", {
        preHtmlLen: preHtmlSnapshot.length,
        currentHtmlLen: snapshotHtml.length,
        caret,
        wasInactive,
        historyActive: history.active,
        entriesLen: history.entries.length,
        index: history.index,
        entries: historyForLog(history.entries, history.index),
      });

      if (wasInactive) {
        startedFromEmptyRef.current = preHtmlSnapshot === "";
        // Seed with the captured pre-state, then push the post-state.
        // If pre and post match (can happen on the first character due to
        // editor placeholder/DOM timing), force a truly empty seed so undo
        // can clear the first character.
        const seedHtml =
          preHtmlSnapshot === snapshotHtml ? "" : preHtmlSnapshot ?? "";
        pushFormulaHistoryEntry({
          html: seedHtml,
          caret: preCaretRef.current,
        });
      } else {
        console.log("[Hist:seedSkippedAlreadyActive]", {
          index: history.index,
          entriesLen: history.entries.length,
          entries: historyForLog(history.entries, history.index),
        });
      }

      pushFormulaHistoryEntry({
        html: snapshotHtml,
        caret,
      });
    },
    [primaryRef, pushFormulaHistoryEntry]
  );

  return {
    formulaHistoryRef,
    preTextRef,
    resetFormulaHistory,
    handleFormulaHistoryUndoRedo,
    capturePreEditorHistoryState,
    appendEditorHistoryFromPrimaryEditor,
    capturePreFormulaState: capturePreEditorHistoryState,
    appendFormulaHistoryFromPrimaryEditor: appendEditorHistoryFromPrimaryEditor,
  };
}
