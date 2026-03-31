import { useCallback, useRef, type RefObject } from "react";
import _ from "lodash";
import {
  type Context,
  escapeScriptTag,
  functionHTMLGenerate,
  escapeHTMLTag,
  handleFormulaInput,
} from "@fileverse-dev/fortune-core";
import { setCursorPosition } from "../components/SheetOverlay/helper";
import type { SetContextOptions } from "../context";

export type FormulaHistoryEntry = {
  text: string;
  caret: number;
  spanValues: string[];
};

/** Which editor receives caret placement and drives history snapshots. */
export type FormulaEditorHistoryPrimary = "cell" | "fx";

type SetContext = (
  recipe: (ctx: Context) => void,
  options?: SetContextOptions
) => void;

const MAX_FORMULA_HISTORY = 100;

/**
 * Custom undo/redo stack for formula text in the cell overlay or Fx bar.
 * Keeps both DOM editors in sync on apply; call handleFormulaInput with the
 * same argument order as each editor's onChange (cell: copy→fx, editor→cell;
 * fx: copy→cell, editor→fx).
 */
export function useFormulaEditorHistory(
  primaryRef: RefObject<HTMLDivElement | null>,
  cellInputRef: RefObject<HTMLDivElement | null>,
  fxInputRef: RefObject<HTMLDivElement | null>,
  setContext: SetContext,
  primary: FormulaEditorHistoryPrimary
) {
  const preTextRef = useRef("");
  const preFormulaSpanValuesRef = useRef<string[] | null>(null);
  const formulaHistoryRef = useRef<{
    active: boolean;
    entries: FormulaHistoryEntry[];
    index: number;
  }>({
    active: false,
    entries: [],
    index: -1,
  });

  const resetFormulaHistory = useCallback(() => {
    formulaHistoryRef.current = {
      active: false,
      entries: [],
      index: -1,
    };
    preFormulaSpanValuesRef.current = null;
  }, []);

  const pushFormulaHistoryEntry = useCallback((entry: FormulaHistoryEntry) => {
    const history = formulaHistoryRef.current;
    const current = history.entries[history.index];

    if (
      current &&
      current.spanValues.length > 0 &&
      entry.spanValues.length > 0 &&
      _.isEqual(current.spanValues, entry.spanValues)
    ) {
      return;
    }

    if (
      current &&
      current.spanValues.length === 0 &&
      entry.spanValues.length === 0 &&
      current.text === entry.text &&
      current.caret === entry.caret
    ) {
      return;
    }

    const nextEntries = history.entries.slice(0, history.index + 1);
    nextEntries.push(entry);
    if (nextEntries.length > MAX_FORMULA_HISTORY) {
      nextEntries.shift();
    }

    history.entries = nextEntries;
    history.index = nextEntries.length - 1;
    history.active = true;
  }, []);

  const applyFormulaHistoryEntry = useCallback(
    (entry: FormulaHistoryEntry) => {
      const primaryEl = primaryRef.current;
      if (!primaryEl) return;

      const safeText = escapeScriptTag(entry.text || "");
      const html = safeText.startsWith("=")
        ? functionHTMLGenerate(safeText)
        : escapeHTMLTag(safeText);

      const cell = cellInputRef.current;
      const fx = fxInputRef.current;

      primaryEl.innerHTML = html;
      if (primary === "cell") {
        if (fx) fx.innerHTML = html;
      } else if (cell) {
        cell.innerHTML = html;
      }

      setCursorPosition(primaryEl, Math.min(entry.caret, entry.text.length));

      setContext((draftCtx) => {
        if (primary === "cell") {
          if (!cellInputRef.current) return;
          handleFormulaInput(
            draftCtx,
            fxInputRef.current,
            cellInputRef.current,
            0
          );
        } else {
          if (!fxInputRef.current) return;
          handleFormulaInput(
            draftCtx,
            cellInputRef.current,
            fxInputRef.current,
            0
          );
        }
      });
    },
    [cellInputRef, fxInputRef, primary, primaryRef, setContext]
  );

  const handleFormulaHistoryUndoRedo = useCallback(
    (isRedo: boolean) => {
      const history = formulaHistoryRef.current;
      if (!history.active || history.entries.length === 0) return false;

      const nextIndex = isRedo ? history.index + 1 : history.index - 1;
      if (nextIndex < 0 || nextIndex >= history.entries.length) return true;

      history.index = nextIndex;
      applyFormulaHistoryEntry(history.entries[nextIndex]);
      return true;
    },
    [applyFormulaHistoryEntry]
  );

  /** Call at formula keydown start (after setting editor owner) — captures pre-keypress text. */
  const capturePreFormulaState = useCallback(() => {
    const el = primaryRef.current;
    if (!el) return;
    preTextRef.current = el.innerText;
    preFormulaSpanValuesRef.current = Array.from(
      el.querySelectorAll("span.fortune-formula-functionrange-cell")
    ).map((node) => node.textContent ?? "");
  }, [primaryRef]);

  /** Call from onChange when a key event is available; mirrors InputBox formula history. */
  const appendFormulaHistoryFromPrimaryEditor = useCallback(
    (getCaret: () => number) => {
      const el = primaryRef.current;
      if (!el) return;

      const currentText = el.innerText || "";
      if (currentText.startsWith("=")) {
        const caret = getCaret();
        const spanValues = Array.from(
          el.querySelectorAll("span.fortune-formula-functionrange-cell")
        ).map((node) => node.textContent ?? "");

        if (!formulaHistoryRef.current.active) {
          const seedText = preTextRef.current || "";
          pushFormulaHistoryEntry({
            text: seedText,
            caret: Math.min(caret, seedText.length),
            spanValues:
              preFormulaSpanValuesRef.current ?? spanValues ?? ([] as string[]),
          });
        }
        pushFormulaHistoryEntry({
          text: currentText,
          caret,
          spanValues,
        });
      } else if (formulaHistoryRef.current.active) {
        resetFormulaHistory();
      }
    },
    [primaryRef, pushFormulaHistoryEntry, resetFormulaHistory]
  );

  return {
    formulaHistoryRef,
    preTextRef,
    preFormulaSpanValuesRef,
    resetFormulaHistory,
    handleFormulaHistoryUndoRedo,
    capturePreFormulaState,
    appendFormulaHistoryFromPrimaryEditor,
  };
}
