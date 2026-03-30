import {
  cancelNormalSelected,
  getCellValue,
  getInlineStringHTML,
  getStyleByCell,
  isInlineStringCell,
  moveToEnd,
  getFlowdata,
  handleFormulaInput,
  moveHighlightCell,
  escapeScriptTag,
  valueShowEs,
  createRangeHightlight,
  isShowHidenCR,
  israngeseleciton,
  escapeHTMLTag,
  isAllowEdit,
  indexToColumnChar,
  functionHTMLGenerate,
  handleBold,
  handleItalic,
  handleUnderline,
  handleStrikeThrough,
  getRangeRectsByCharacterOffset,
  rangeSetValue,
  getFormulaRangeIndexForKeyboardSync,
  getFormulaRangeIndexAtCaret,
  getFormulaEditorOwner,
  createFormulaRangeSelect,
  seletedHighlistByindex,
  isFormulaReferenceInputMode,
  isCaretAtValidFormulaRangeInsertionPoint,
  markRangeSelectionDirty,
  rangeHightlightselected,
  setFormulaEditorOwner,
} from "@fileverse-dev/fortune-core";
import React, {
  useContext,
  useEffect,
  useMemo,
  useRef,
  useCallback,
  useLayoutEffect,
  useState,
} from "react";
import _ from "lodash";
import { Tooltip } from "@fileverse/ui";
import WorkbookContext from "../../context";
import ContentEditable from "./ContentEditable";
import FormulaSearch from "./FormulaSearch";
import FormulaHint from "./FormulaHint";
import usePrevious from "../../hooks/usePrevious";
import { useFormulaEditorHistory } from "../../hooks/useFormulaEditorHistory";
import { useRerenderOnFormulaCaret } from "../../hooks/useRerenderOnFormulaCaret";
import {
  moveCursorToEnd,
  getCursorPosition,
  setCursorPosition,
  buildFormulaSuggestionText,
  getFunctionNameFromFormulaCaretSpans,
  isLetterNumberPattern,
  countCommasBeforeCursor,
  shouldShowFormulaFunctionList,
} from "./helper";
import { LucideIcon } from "./LucideIcon";

const InputBox: React.FC = () => {
  const { context, setContext, refs } = useContext(WorkbookContext);
  const inputRef = useRef<HTMLDivElement>(null);
  const lastKeyDownEventRef = useRef<KeyboardEvent>(null);
  const prevCellUpdate = usePrevious<any[]>(context.luckysheetCellUpdate);
  const prevSheetId = usePrevious<string>(context.currentSheetId);
  const [isHidenRC, setIsHidenRC] = useState<boolean>(false);
  const [isInputBoxActive, setIsInputBoxActive] = useState(false);
  const [activeCell, setActiveCell] = useState<string>("");
  const [activeRefCell, setActiveRefCell] = useState<string>("");
  const [frozenPosition, setFrozenPosition] = useState({ left: 0, top: 0 });
  const firstSelection = context.luckysheet_select_save?.[0];
  const [firstSelectionActiveCell, setFirstSelectionActiveCell] = useState<any>(
    {}
  );
  const [commaCount, setCommaCount] = useState(0);
  /** When true, in-cell editor shows left alignment for formulas (=...) even if the cell style is center/right. */
  const [cellEditorIsFormula, setCellEditorIsFormula] = useState(false);
  const hideFormulaHintLocal = localStorage.getItem("formulaMore") === "true";
  const [showFormulaHint, setShowFormulaHint] = useState(!hideFormulaHintLocal);
  const [showSearchHint, setShowSearchHint] = useState(false);
  const row_index = firstSelection?.row_focus!;
  const col_index = firstSelection?.column_focus!;
  const isComposingRef = useRef(false);
  const formulaAnchorCellRef = useRef<[number, number] | null>(null);
  const skipNextAnchorSelectionSyncRef = useRef(false);
  const lastHandledMouseDragSignatureRef = useRef("");
  const {
    formulaHistoryRef,
    preTextRef,
    resetFormulaHistory,
    handleFormulaHistoryUndoRedo,
    capturePreFormulaState,
    appendFormulaHistoryFromPrimaryEditor,
  } = useFormulaEditorHistory(
    inputRef,
    refs.cellInput,
    refs.fxInput,
    setContext,
    "cell"
  );

  const ZWSP = "\u200B";
  const inputBoxInnerRef = useRef<HTMLDivElement>(null);
  const [linkSelectionHighlightRects, setLinkSelectionHighlightRects] =
    useState<{ left: number; top: number; width: number; height: number }[]>(
      []
    );

  const ensureNotEmpty = () => {
    const el = inputRef.current;
    if (!el) return;

    const text = el.textContent;

    // Treat empty OR only-ZWSP as empty
    if (!text || text === ZWSP) {
      el.innerHTML = ZWSP;
      moveCursorToEnd(el);
    }
  };

  const handleShowFormulaHint = () => {
    localStorage.setItem("formulaMore", String(showFormulaHint));
    setShowFormulaHint(!showFormulaHint);
  };

  const getLastInputSpanText = () => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(
      `<div>${inputRef?.current?.innerHTML}</div>`,
      "text/html"
    );
    const spans = doc.querySelectorAll("span");
    const lastSpan = spans[spans.length - 1];
    return lastSpan?.innerText;
  };

  const inputBoxStyle = useMemo(() => {
    if (firstSelectionActiveCell && context.luckysheetCellUpdate.length > 0) {
      const flowdata = getFlowdata(context);
      if (!flowdata) return {};
      let style = getStyleByCell(
        context,
        flowdata,
        firstSelectionActiveCell.row_focus!,
        firstSelectionActiveCell.column_focus!
      );
      if (cellEditorIsFormula) {
        style = { ...style, textAlign: "left" };
      }
      return style;
    }
    return {};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    context.luckysheetfile,
    context.currentSheetId,
    context.luckysheetCellUpdate,
    context?.luckysheetCellUpdate?.length,
    firstSelectionActiveCell,
    cellEditorIsFormula,
  ]);

  useLayoutEffect(() => {
    if (!context.allowEdit) {
      setContext((ctx) => {
        const flowdata = getFlowdata(ctx);
        if (!_.isNil(flowdata) && ctx.forceFormulaRef) {
          const value = getCellValue(row_index, col_index, flowdata, "f");
          createRangeHightlight(ctx, value);
        }
      });
    }
    if (firstSelection && context.luckysheetCellUpdate.length > 0) {
      if (refs.globalCache.doNotUpdateCell) {
        delete refs.globalCache.doNotUpdateCell;
        return;
      }
      // Same cell as last applied layout pass: never re-hydrate from sheet or move
      // the caret (avoids jump-to-end on every luckysheetfile/selection-driven rerun).
      if (
        _.isEqual(prevCellUpdate, context.luckysheetCellUpdate) &&
        prevSheetId === context.currentSheetId
      ) {
        return;
      }

      const [ur, uc] = context.luckysheetCellUpdate;
      const pending = refs.globalCache.pendingTypeOverCell;
      // One-shot: skip hydrating from stored cell only for the first layout after
      // type-to-edit opened the editor; clear pending so later effect runs exit above.
      if (
        pending &&
        pending[0] === ur &&
        pending[1] === uc
      ) {
        refs.globalCache.overwriteCell = false;
        if (inputRef.current) {
          setCellEditorIsFormula(
            inputRef.current.innerText.trim().startsWith("=")
          );
        }
        if (!refs.globalCache.doNotFocus) {
          setTimeout(() => {
            moveToEnd(inputRef.current!);
          });
        }
        delete refs.globalCache.doNotFocus;
        delete refs.globalCache.pendingTypeOverCell;
        return;
      }
      const flowdata = getFlowdata(context);
      const cell = flowdata?.[row_index]?.[col_index];
      const overwrite = refs.globalCache.overwriteCell;
      let value = "";
      if (cell && !overwrite) {
        if (isInlineStringCell(cell)) {
          value = getInlineStringHTML(row_index, col_index, flowdata);
        } else if (cell.f) {
          value = getCellValue(row_index, col_index, flowdata, "f");
          setContext((ctx) => {
            createRangeHightlight(ctx, value);
          });
        } else {
          value = valueShowEs(row_index, col_index, flowdata);
          if (Number(cell.qp) === 1) {
            value = value ? `${value}` : value;
          }
        }
      }
      refs.globalCache.overwriteCell = false;
      if (!refs.globalCache.ignoreWriteCell && inputRef.current && value) {
        inputRef.current!.innerHTML = escapeHTMLTag(escapeScriptTag(value));
      } else if (
        !refs.globalCache.ignoreWriteCell &&
        inputRef.current &&
        !value &&
        !overwrite
      ) {
        // @ts-ignore
        const valueD = getCellValue(row_index, col_index, flowdata, "f");
        inputRef.current.innerText = valueD;
      }
      refs.globalCache.ignoreWriteCell = false;
      if (inputRef.current) {
        setCellEditorIsFormula(
          inputRef.current.innerText.trim().startsWith("=")
        );
      }
      if (!refs.globalCache.doNotFocus) {
        setTimeout(() => {
          moveToEnd(inputRef.current!);
        });
      }
      delete refs.globalCache.doNotFocus;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    context.luckysheetCellUpdate,
    context.luckysheetfile,
    context.currentSheetId,
    firstSelection,
  ]);

  useEffect(() => {
    if (_.isEmpty(context.luckysheetCellUpdate)) {
      if (inputRef.current) {
        inputRef.current.innerHTML = "";
      }
      delete refs.globalCache.pendingTypeOverCell;
      setCellEditorIsFormula(false);
      resetFormulaHistory();
    }
  }, [context.luckysheetCellUpdate, resetFormulaHistory, refs.globalCache]);

  // Reset cached formula anchor when formula edit session ends.
  useEffect(() => {
    if (_.isEmpty(context.luckysheetCellUpdate) || !refs.cellInput.current) {
      formulaAnchorCellRef.current = null;
      lastHandledMouseDragSignatureRef.current = "";
      return;
    }

    const inputText = refs.cellInput.current.innerText?.trim() || "";
    if (!inputText.startsWith("=")) {
      formulaAnchorCellRef.current = null;
      lastHandledMouseDragSignatureRef.current = "";
    }
  }, [context.luckysheetCellUpdate, refs.cellInput]);

  // Clear stale formula range visuals/state when editing target cell changes.
  // This prevents previous formula range highlights from leaking into a new
  // input session on a different cell.
  useEffect(() => {
    if (
      _.isEmpty(context.luckysheetCellUpdate) ||
      _.isEmpty(prevCellUpdate) ||
      _.isEqual(prevCellUpdate, context.luckysheetCellUpdate)
    ) {
      return;
    }

    setContext((ctx) => {
      ctx.formulaRangeHighlight = [];
      ctx.formulaRangeSelect = undefined;
      ctx.formulaCache.selectingRangeIndex = -1;
      ctx.formulaCache.func_selectedrange = undefined;
      ctx.formulaCache.rangestart = false;
      ctx.formulaCache.rangedrag_column_start = false;
      ctx.formulaCache.rangedrag_row_start = false;
      ctx.formulaCache.rangechangeindex = undefined;
    });
  }, [context.luckysheetCellUpdate, prevCellUpdate, setContext]);

  // 当选中行列是处于隐藏状态的话则不允许编辑
  useEffect(() => {
    setIsHidenRC(isShowHidenCR(context));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context.luckysheet_select_save]);

  // Reset active state when selection changes or InputBox is hidden
  useEffect(() => {
    if (
      !firstSelection ||
      context.rangeDialog?.show ||
      _.isEmpty(context.luckysheetCellUpdate)
    ) {
      setIsInputBoxActive(false);
    }
  }, [firstSelection, context.rangeDialog?.show, context.luckysheetCellUpdate]);

  // Cleanup: if input box is no longer active, remove any lingering
  // blue dotted formula-range overlays from the canvas.
  useEffect(() => {
    if (isInputBoxActive) return;
    setContext((ctx) => {
      if (
        _.isEmpty(ctx.formulaRangeHighlight) &&
        !ctx.formulaRangeSelect &&
        ctx.formulaCache.selectingRangeIndex === -1 &&
        !ctx.formulaCache.func_selectedrange
      ) {
        return;
      }
      ctx.formulaRangeHighlight = [];
      ctx.formulaRangeSelect = undefined;
      ctx.formulaCache.selectingRangeIndex = -1;
      ctx.formulaCache.func_selectedrange = undefined;
      ctx.formulaCache.rangestart = false;
      ctx.formulaCache.rangedrag_column_start = false;
      ctx.formulaCache.rangedrag_row_start = false;
      ctx.formulaCache.rangechangeindex = undefined;
      ctx.formulaCache.rangeSelectionActive = null;
    });
  }, [isInputBoxActive, setContext]);

  const getActiveFormula = useCallback(
    () => document.querySelector(".luckysheet-formula-search-item-active"),
    []
  );

  const insertSelectedFormula = useCallback(
    (formulaName: string) => {
      const textEditor = inputRef.current;
      if (!textEditor) return;

      const fxEditor = document.getElementById(
        "luckysheet-functionbox-cell"
      ) as HTMLDivElement | null;
      const { text, caretOffset } = buildFormulaSuggestionText(
        textEditor,
        formulaName
      );
      const safeText = escapeScriptTag(text);
      const html = safeText.startsWith("=")
        ? functionHTMLGenerate(safeText)
        : escapeHTMLTag(safeText);

      textEditor.innerHTML = html;
      if (fxEditor) {
        fxEditor.innerHTML = html;
      }
      setCursorPosition(textEditor, caretOffset);

      // Programmatic innerHTML does not fire contenteditable `input`; sync list
      // visibility so FormulaHint is not stuck hidden behind stale `showSearchHint`.
      setShowSearchHint(shouldShowFormulaFunctionList(textEditor));

      // Clear formula UI state
      setContext((draftCtx) => {
        draftCtx.functionCandidates = [];
        draftCtx.defaultCandidates = [];
        draftCtx.functionHint = (formulaName || "").toUpperCase();
      });
    },
    [setContext]
  );

  const clearSearchItemActiveClass = useCallback(() => {
    const activeFormula = getActiveFormula();
    if (activeFormula) {
      activeFormula.classList.remove("luckysheet-formula-search-item-active");
    }
  }, [getActiveFormula]);

  const selectActiveFormula = useCallback(
    (e: React.KeyboardEvent) => {
      const formulaName = getActiveFormula()?.querySelector(
        ".luckysheet-formula-search-func"
      )?.textContent;

      const lastSpanText = getLastInputSpanText();

      if (formulaName && !isLetterNumberPattern(lastSpanText)) {
        insertSelectedFormula(formulaName);
        // User selects datablock
        e.preventDefault();
        e.stopPropagation();
      }
    },
    [getActiveFormula, insertSelectedFormula]
  );

  const selectActiveFormulaOnClick = useCallback(
    (e: React.MouseEvent) => {
      if (isComposingRef.current || !inputRef.current) return;
      // @ts-expect-error later
      if (e.target.className.includes("sign-fortune")) return;
      preTextRef.current = inputRef.current!.innerText;
      const formulaName = getActiveFormula()?.querySelector(
        ".luckysheet-formula-search-func"
      )?.textContent;

      const lastSpanText = getLastInputSpanText();

      if (formulaName && !isLetterNumberPattern(lastSpanText)) {
        insertSelectedFormula(formulaName);
        e.preventDefault();
        e.stopPropagation();
      }
    },
    [getActiveFormula, insertSelectedFormula]
  );

  const stopPropagation = (event: React.KeyboardEvent<HTMLDivElement>) => {
    event.stopPropagation();
    event.preventDefault();
  };

  useEffect(() => {
    const cellInputEl = refs.cellInput.current;
    if (!context.luckysheet_select_save?.[0] || !cellInputEl) return;
    setContext((ctx) => {
      const currentSelection =
        ctx.luckysheet_select_save?.[ctx.luckysheet_select_save.length - 1];
      if (!currentSelection) return;

      // When the Fx editor owns the active formula session, core mouse handling
      // already updates both editors. Running InputBox sync here would insert the
      // same reference a second time (e.g. `=A1A1`).
      if (getFormulaEditorOwner(ctx) === "fx") {
        return;
      }

      // luckysheet_select_save is synced from rangeDrag; mouse.ts already calls
      // rangeSetValue. A second call here lacked spanToReplace / stale index.
      // const isMouseFormulaRangeDrag =
      //   !!ctx.formulaCache.func_selectedrange &&
      //   (ctx.formulaCache.rangestart ||
      //     ctx.formulaCache.rangedrag_column_start ||
      //     ctx.formulaCache.rangedrag_row_start);
      // if (isMouseFormulaRangeDrag) {
      //   return;
      // }

      // Sets formulaCache.rangeSetValueTo for APPEND insertion point.
      israngeseleciton(ctx);
      const keyboardSyncRangeIndex =
        getFormulaRangeIndexForKeyboardSync(cellInputEl);

      if (
        skipNextAnchorSelectionSyncRef.current &&
        formulaAnchorCellRef.current
      ) {
        const [anchorRow, anchorCol] = formulaAnchorCellRef.current;
        const isAnchorSelection =
          currentSelection.row_focus === anchorRow &&
          currentSelection.column_focus === anchorCol;
        if (isAnchorSelection) {
          skipNextAnchorSelectionSyncRef.current = false;
          return;
        }
      }

      const isFormulaMode = isFormulaReferenceInputMode(ctx);

      // Selection changes should update references only in formula mode.
      if (!isFormulaMode) return;

      // Point rangechangeindex at the ref under/near the caret — not always the
      // last span (e.g. `=,A4` with caret between `=` and `,` must not replace A4).
      if (keyboardSyncRangeIndex !== null) {
        ctx.formulaCache.rangechangeindex = keyboardSyncRangeIndex;
        ctx.formulaCache.rangestart = true;
        ctx.formulaCache.rangedrag_column_start = false;
        ctx.formulaCache.rangedrag_row_start = false;
      } else {
        ctx.formulaCache.rangechangeindex = undefined;
        ctx.formulaCache.rangestart = false;
      }

      // Mark that range/reference content was inserted by keyboard range selection.
      ctx.formulaCache.rangeSelectionActive = true;

      rangeSetValue?.(
        ctx,
        cellInputEl,
        {
          row: currentSelection.row,
          column: currentSelection.column,
        },
        refs.fxInput.current!
      );

      rangeHightlightselected(ctx, cellInputEl);

      // Mirror mouse behavior: show blue dotted formula-range selection
      // for keyboard-driven reference selection as well.
      if (!_.isNil(ctx.formulaCache.rangechangeindex)) {
        ctx.formulaCache.selectingRangeIndex =
          ctx.formulaCache.rangechangeindex;
        createRangeHightlight(
          ctx,
          cellInputEl.innerHTML,
          ctx.formulaCache.rangechangeindex
        );

        const rectFromSelection = seletedHighlistByindex(
          ctx,
          currentSelection.row[0],
          currentSelection.row[1],
          currentSelection.column[0],
          currentSelection.column[1]
        );

        if (rectFromSelection) {
          createFormulaRangeSelect(ctx, {
            rangeIndex: ctx.formulaCache.rangechangeindex || 0,
            left: rectFromSelection.left,
            top: rectFromSelection.top,
            width: rectFromSelection.width,
            height: rectFromSelection.height,
          });
        }
      }
    });
  }, [
    context.luckysheet_select_save,
    context.rangeDialog?.show,
    // isInputBoxActive,
  ]);
  const formulaMouseDragSignature = (() => {
    const r = context.formulaCache.func_selectedrange;
    if (!r) return "";
    return [
      r.row?.[0],
      r.row?.[1],
      r.column?.[0],
      r.column?.[1],
      r.left_move,
      r.top_move,
      r.width_move,
      r.height_move,
    ].join(":");
  })();

  // If formula range is changed by mouse drag, keep normal selected-state
  // aligned to the dragged cell/range.
  useEffect(() => {
    if (!formulaMouseDragSignature) return;
    if (
      lastHandledMouseDragSignatureRef.current === formulaMouseDragSignature
    ) {
      return;
    }
    if (!refs.cellInput.current) return;
    const inputText = refs.cellInput.current.innerText?.trim() || "";
    if (!inputText.startsWith("=")) return;
    const dragRange = context.formulaCache.func_selectedrange;
    if (!dragRange) return;

    lastHandledMouseDragSignatureRef.current = formulaMouseDragSignature;
    setContext((ctx) => {
      ctx.luckysheet_select_save = [
        {
          row: [dragRange.row[0], dragRange.row[1]],
          column: [dragRange.column[0], dragRange.column[1]],
          row_focus: _.isNil(dragRange.row_focus)
            ? dragRange.row[0]
            : dragRange.row_focus,
          column_focus: _.isNil(dragRange.column_focus)
            ? dragRange.column[0]
            : dragRange.column_focus,
        },
      ];
    });
  }, [
    formulaMouseDragSignature,
    context.formulaCache.func_selectedrange,
    refs.cellInput,
    setContext,
  ]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      setContext((draftCtx) => {
        setFormulaEditorOwner(draftCtx, "cell");
      });
      lastKeyDownEventRef.current = new KeyboardEvent(e.type, e.nativeEvent);
      capturePreFormulaState();
      const currentInputText = inputRef.current?.innerText?.trim() || "";

      if (
        (e.key === "=" || currentInputText.startsWith("=")) &&
        context.luckysheetCellUpdate.length === 2 &&
        formulaAnchorCellRef.current == null
      ) {
        // Starting a new formula flow; clear range-selection dirtiness so
        // the user can start referencing again.
        setContext((draftCtx) => {
          draftCtx.formulaCache.rangeSelectionActive = null;
        });
        formulaAnchorCellRef.current = [
          context.luckysheetCellUpdate[0],
          context.luckysheetCellUpdate[1],
        ];
      }

      if (e.key === "(" && currentInputText.startsWith("=")) {
        // When the user types "(" we are at/near a reference insertion point.
        // Clear dirtiness so keyboard/mouse referencing can continue.
        setContext((draftCtx) => {
          draftCtx.formulaCache.rangeSelectionActive = null;
        });
      }

      if (
        e.key === "," &&
        context.luckysheetCellUpdate.length > 0 &&
        currentInputText.startsWith("=") &&
        formulaAnchorCellRef.current
      ) {
        // Moving to next function argument; allow referencing flow again.
        setContext((draftCtx) => {
          draftCtx.formulaCache.rangeSelectionActive = null;
        });
        const [anchorRow, anchorCol] = formulaAnchorCellRef.current;
        skipNextAnchorSelectionSyncRef.current = true;
        setTimeout(() => {
          setContext((draftCtx) => {
            draftCtx.luckysheetCellUpdate = [anchorRow, anchorCol];
            draftCtx.luckysheet_select_save = [
              {
                row: [anchorRow, anchorRow],
                column: [anchorCol, anchorCol],
                row_focus: anchorRow,
                column_focus: anchorCol,
              },
            ];
            // Reference before comma is complete; clear the active range-select
            // overlay, but keep completed referenced-cell highlights visible.
            draftCtx.formulaRangeSelect = undefined;
            draftCtx.formulaCache.selectingRangeIndex = -1;
            draftCtx.formulaCache.func_selectedrange = undefined;
            draftCtx.formulaCache.rangechangeindex = undefined;
            draftCtx.formulaCache.rangestart = false;
            draftCtx.formulaCache.rangedrag_column_start = false;
            draftCtx.formulaCache.rangedrag_row_start = false;
            createRangeHightlight(
              draftCtx,
              refs.cellInput.current?.innerHTML ||
                refs.fxInput.current?.innerHTML ||
                ""
            );
            moveHighlightCell(draftCtx, "down", 0, "rangeOfSelect");
          });
        }, 0);
      }
      // if (
      //   $("#luckysheet-modal-dialog-mask").is(":visible") ||
      //   $(event.target).hasClass("luckysheet-mousedown-cancel") ||
      //   $(event.target).hasClass("formulaInputFocus")
      // ) {
      //   return;
      // }

      if ((e.metaKey || e.ctrlKey) && context.luckysheetCellUpdate.length > 0) {
        if (e.code === "KeyZ" || e.code === "KeyY") {
          const shouldUseFormulaHistory =
            currentInputText.startsWith("=") ||
            formulaHistoryRef.current.active;
          if (shouldUseFormulaHistory) {
            const handledByFormulaHistory = handleFormulaHistoryUndoRedo(
              e.code === "KeyY" || (e.code === "KeyZ" && e.shiftKey)
            );
            if (handledByFormulaHistory) {
              e.preventDefault();
            }
          }
          // Keep native undo/redo in contenteditable, but don't bubble to
          // workbook-level canvas shortcuts.
          e.stopPropagation();
          return;
        }
        if (e.code === "KeyB") {
          handleBold(context, inputRef.current!);
          stopPropagation(e);
        } else if (e.code === "KeyI") {
          handleItalic(context, inputRef.current!);
          stopPropagation(e);
        } else if (e.code === "KeyU") {
          handleUnderline(context, inputRef.current!);
          stopPropagation(e);
        } else if (e.code === "KeyS") {
          handleStrikeThrough(context, inputRef.current!);
          stopPropagation(e);
        }
      }

      if (!isComposingRef.current) {
        const currentCommaCount = countCommasBeforeCursor(inputRef?.current!);
        setCommaCount(currentCommaCount);
      }

      /* Arrow navigation for cell reference starts here */
      let allowListNavigation = true;
      const isArrowKey =
        e.key === "ArrowUp" ||
        e.key === "ArrowDown" ||
        e.key === "ArrowLeft" ||
        e.key === "ArrowRight";

      if (e.key === "Delete" || e.key === "Backspace") {
        const anchor = formulaAnchorCellRef.current;
        if (anchor != null) {
          const [anchorRow, anchorCol] = anchor;
          skipNextAnchorSelectionSyncRef.current = true;
          setTimeout(() => {
            setContext((draftCtx) => {
              draftCtx.luckysheetCellUpdate = [anchorRow, anchorCol];
              draftCtx.luckysheet_select_save = [
                {
                  row: [anchorRow, anchorRow],
                  column: [anchorCol, anchorCol],
                  row_focus: anchorRow,
                  column_focus: anchorCol,
                },
              ];
              markRangeSelectionDirty(draftCtx);
              // markRangeSelectionDirty clears formulaRangeHighlight; rebuild from the
              // live editor so argument highlights return after handleFormulaInput ran.
              const el = refs.cellInput.current;
              if (el && el.innerText.trim().startsWith("=")) {
                createRangeHightlight(draftCtx, el.innerHTML);
              }
            });
          }, 0);
        }
        if (isComposingRef.current) requestAnimationFrame(ensureNotEmpty);
        if (
          getCursorPosition(inputRef?.current!) ===
          inputRef?.current!.innerText.length
        ) {
          setTimeout(() => {
            moveCursorToEnd(inputRef?.current!);
          }, 5);
        }
      }

      if (isArrowKey && isFormulaReferenceInputMode(context)) {
        // Let global keyboard handlers move selected cells while formula range
        // updates are performed via `rangeSetValue` in the selection effect.
        allowListNavigation = false;
      }
      /* Arrow navigation for cell reference ends here */

      if (e.key === "Escape" && context.luckysheetCellUpdate.length > 0) {
        setContext((draftCtx) => {
          cancelNormalSelected(draftCtx);
          moveHighlightCell(draftCtx, "down", 0, "rangeOfSelect");
        });
        e.preventDefault();
      } else if (e.key === "Enter" && context.luckysheetCellUpdate.length > 0) {
        if (e.altKey || e.metaKey) {
          // originally `enterKeyControll`
          document.execCommand("insertHTML", false, "\n "); // 换行符后面的空白符是为了强制让他换行，在下一步的delete中会删掉
          document.execCommand("delete", false);
          e.stopPropagation();
        } else selectActiveFormula(e);
      } else if (e.key === "Tab" && context.luckysheetCellUpdate.length > 0) {
        selectActiveFormula(e);
        e.preventDefault();
      } else if (e.key === "F4" && context.luckysheetCellUpdate.length > 0) {
        // formula.setfreezonFuc(event);
        e.preventDefault();
      } else if (
        !(e.metaKey || e.ctrlKey) &&
        e.key === "ArrowUp" &&
        context.luckysheetCellUpdate.length > 0 &&
        allowListNavigation
      ) {
        if (document.getElementById("luckysheet-formula-search-c")) {
          const formulaSearchContainer = document.getElementById(
            "luckysheet-formula-search-c"
          );
          const activeItem = formulaSearchContainer?.querySelector(
            ".luckysheet-formula-search-item-active"
          );
          let previousItem = activeItem
            ? activeItem.previousElementSibling
            : null;
          while (
            previousItem &&
            !previousItem.classList.contains("luckysheet-formula-search-item")
          ) {
            previousItem = previousItem.previousElementSibling;
          }
          if (!previousItem) {
            const items = formulaSearchContainer?.querySelectorAll(
              ".luckysheet-formula-search-item"
            );
            const lastItem = items?.[items.length - 1];
            previousItem = lastItem || null;
          }
          clearSearchItemActiveClass();
          if (previousItem) {
            previousItem.classList.add("luckysheet-formula-search-item-active");
          }
        }
        e.preventDefault();
      } else if (
        !(e.metaKey || e.ctrlKey) &&
        e.key === "ArrowDown" &&
        context.luckysheetCellUpdate.length > 0 &&
        allowListNavigation
      ) {
        if (document.getElementById("luckysheet-formula-search-c")) {
          const formulaSearchContainer = document.getElementById(
            "luckysheet-formula-search-c"
          );
          const activeItem = formulaSearchContainer?.querySelector(
            ".luckysheet-formula-search-item-active"
          );
          let nextItem = activeItem ? activeItem.nextElementSibling : null;
          while (
            nextItem &&
            !nextItem.classList.contains("luckysheet-formula-search-item")
          ) {
            nextItem = nextItem.nextElementSibling;
          }
          if (!nextItem) {
            nextItem =
              formulaSearchContainer?.querySelector(
                ".luckysheet-formula-search-item"
              ) || null;
          }
          clearSearchItemActiveClass();
          if (nextItem) {
            nextItem.classList.add("luckysheet-formula-search-item-active");
          }
        }
        e.preventDefault();
      }
      // else if (
      //   e.key === "ArrowLeft" &&
      //   draftCtx.luckysheetCellUpdate.length > 0
      // ) {
      //   formulaMoveEvent("left", ctrlKey, shiftKey, event);
      // } else if (
      //   e.key === "ArrowRight" &&
      //   draftCtx.luckysheetCellUpdate.length > 0
      // ) {
      //   formulaMoveEvent("right", ctrlKey, shiftKey, event);
      // }
    },
    [
      capturePreFormulaState,
      clearSearchItemActiveClass,
      context.luckysheetCellUpdate.length,
      handleFormulaHistoryUndoRedo,
      selectActiveFormula,
      setContext,
      firstSelection,
      refs.cellInput,
    ]
  );

  const handleHideShowHint = () => {
    const searchElFx = document.getElementsByClassName("fx-search")?.[0];
    const searchElCell = document.getElementsByClassName("cell-search")?.[0];
    if (searchElFx) {
      // @ts-ignore
      searchElFx.style.display = "none";
    }
    if (searchElCell) {
      // @ts-ignore
      searchElCell.style.display = "block";
    }

    const el = document.getElementsByClassName("fx-hint")?.[0];
    const elCell = document.getElementsByClassName("cell-hint")?.[0];
    if (el) {
      // @ts-ignore
      el.style.display = "none";
    }
    if (elCell) {
      // @ts-ignore
      elCell.style.display = "block";
    }
  };

  const onChange = useCallback(
    (__: any, isBlur?: boolean) => {
      if (context.isFlvReadOnly) return;
      handleHideShowHint();

      const editorText = inputRef.current?.innerText?.trim() ?? "";
      setCellEditorIsFormula(editorText.startsWith("="));

      setShowSearchHint(
        shouldShowFormulaFunctionList(inputRef?.current ?? null)
      );

      if (!isComposingRef.current) {
        const currentCommaCount = countCommasBeforeCursor(inputRef?.current!);
        setCommaCount(currentCommaCount);
      }

      // setInputHTML(html);
      // console.log("onChange", __);
      const e = lastKeyDownEventRef.current;
      if (!e) {
        const cellEl = refs.cellInput.current;
        if (
          cellEl &&
          (cellEl.innerText?.trim().startsWith("=") ||
            cellEl.textContent?.trim().startsWith("="))
        ) {
          setContext((draftCtx) => {
            if (!isAllowEdit(draftCtx, draftCtx.luckysheet_select_save)) return;
            rangeHightlightselected(draftCtx, cellEl);
          });
        }
        return;
      }
      const kcode = e.keyCode;
      if (!kcode) return;

      appendFormulaHistoryFromPrimaryEditor(() =>
        getCursorPosition(inputRef.current!)
      );

      if (
        !(
          (
            (kcode >= 112 && kcode <= 123) ||
            kcode <= 46 ||
            kcode === 144 ||
            kcode === 108 ||
            e.ctrlKey ||
            e.altKey ||
            (e.shiftKey &&
              (kcode === 37 || kcode === 38 || kcode === 39 || kcode === 40))
          )
          // kcode === keycode.WIN ||
          // kcode === keycode.WIN_R ||
          // kcode === keycode.MENU))
        ) ||
        kcode === 8 ||
        kcode === 32 ||
        kcode === 46 ||
        (e.ctrlKey && kcode === 86)
      ) {
        setContext((draftCtx) => {
          if (
            (draftCtx.formulaCache.rangestart ||
              draftCtx.formulaCache.rangedrag_column_start ||
              draftCtx.formulaCache.rangedrag_row_start ||
              israngeseleciton(draftCtx)) &&
            isBlur
          )
            return;
          if (!isAllowEdit(draftCtx, draftCtx.luckysheet_select_save)) {
            return;
          }
          // if(event.target.id!="luckysheet-input-box" && event.target.id!="luckysheet-rich-text-editor"){
          handleFormulaInput(
            draftCtx,
            refs.fxInput.current,
            refs.cellInput.current!,
            kcode,
            preTextRef.current
          );
          // clearSearchItemActiveClass();
          // formula.functionInputHanddler(
          //   $("#luckysheet-functionbox-cell"),
          //   $("#luckysheet-rich-text-editor"),
          //   kcode
          // );
          // setCenterInputPosition(
          //   draftCtx.luckysheetCellUpdate[0],
          //   draftCtx.luckysheetCellUpdate[1],
          //   draftCtx.flowdata
          // );
          // }
        });
      }
    },
    [
      refs.cellInput,
      refs.fxInput,
      setContext,
      appendFormulaHistoryFromPrimaryEditor,
    ]
  );

  const onPaste = useCallback(
    (e: React.ClipboardEvent<HTMLDivElement>) => {
      if (_.isEmpty(context.luckysheetCellUpdate)) {
        e.preventDefault();
      }
    },
    [context.luckysheetCellUpdate]
  );

  const cfg = context.config || {};
  const rowReadOnly: Record<number, number> = cfg.rowReadOnly || {};
  const colReadOnly: Record<number, number> = cfg.colReadOnly || {};

  const edit = !(
    (colReadOnly[col_index] || rowReadOnly[row_index]) &&
    context.allowEdit === true
  );

  // Calculate input box position relative to viewport (screen) instead of canvas
  const getInputBoxPosition = useCallback(() => {
    if (!firstSelection || context.rangeDialog?.show) {
      return { left: -10000, top: -10000, display: "block" };
    }

    // Get the canvas container to calculate viewport-relative position
    const canvasContainer = refs.cellArea.current;

    if (!canvasContainer) {
      return {
        left: firstSelection.left || 0,
        top: firstSelection.top || 0,
        display: "block",
      };
    }

    if (isInputBoxActive) {
      // If InputBox is active, use the frozen position (ignore scroll)
      return {
        left: frozenPosition.left,
        top: frozenPosition.top,
        zIndex: _.isEmpty(context.luckysheetCellUpdate) ? -1 : 19,
        display: "block",
      };
    }
    // If not active, calculate the initial position (do not set state here)
    const containerRect = canvasContainer.getBoundingClientRect();
    const initialLeft =
      containerRect.left + (firstSelection.left || 0) - context.scrollLeft;
    const initialTop =
      containerRect.top + (firstSelection.top || 0) - context.scrollTop;
    return {
      left: initialLeft,
      top: initialTop,
      zIndex: _.isEmpty(context.luckysheetCellUpdate) ? -1 : 19,
      display: "block",
    };
  }, [
    firstSelection,
    context.rangeDialog?.show,
    context.luckysheetCellUpdate,
    refs.cellArea,
    isInputBoxActive,
    frozenPosition,
    context.scrollLeft,
    context.scrollTop,
  ]);

  // Effect to freeze the position when input box becomes visible and not yet active
  useEffect(() => {
    if (
      firstSelection &&
      !context.rangeDialog?.show &&
      !isInputBoxActive &&
      !_.isEmpty(context.luckysheetCellUpdate)
    ) {
      const canvasContainer = refs.cellArea.current;
      if (canvasContainer) {
        const containerRect = canvasContainer.getBoundingClientRect();
        const initialLeft =
          containerRect.left + (firstSelection.left || 0) - context.scrollLeft;
        const initialTop =
          containerRect.top + (firstSelection.top || 0) - context.scrollTop;
        setFrozenPosition({ left: initialLeft, top: initialTop });
        setIsInputBoxActive(true);
      }
    }
  }, [
    firstSelection,
    context.rangeDialog?.show,
    context.luckysheetCellUpdate,
    isInputBoxActive,
    context.scrollLeft,
    context.scrollTop,
    refs.cellArea,
  ]);

  // Calculate cell address indicator position
  const getAddressIndicatorPosition = useCallback(() => {
    if (!firstSelection || context.rangeDialog?.show) {
      return { display: "none" };
    }

    // Always show above the input box
    return { top: "-18px", left: "0", display: "block" };
  }, [firstSelection, context.rangeDialog?.show]);

  // Generate cell address string (e.g., "A1", "B5")
  const getCellAddress = useCallback(() => {
    if (!firstSelection) return "";

    const rowIndex = firstSelection.row_focus || 0;
    const colIndex = firstSelection.column_focus || 0;

    const columnChar = indexToColumnChar(colIndex);
    const rowNumber = rowIndex + 1;

    return `${columnChar}${rowNumber}`;
  }, [firstSelection]);

  useEffect(() => {
    if (isInputBoxActive) {
      setActiveCell(getCellAddress());
      setFirstSelectionActiveCell(context.luckysheet_select_save?.[0]);
    }
  }, [isInputBoxActive]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "F10") {
        event.preventDefault(); // stop default browser behavior if any
        handleShowFormulaHint();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showFormulaHint]);

  // Keep selection highlight visible in input box when link modal is open (focus moved to modal)
  useLayoutEffect(() => {
    const lc = context.linkCard;
    const isSameCell =
      context.luckysheetCellUpdate?.length === 2 &&
      lc &&
      context.luckysheetCellUpdate[0] === lc.r &&
      context.luckysheetCellUpdate[1] === lc.c;
    if (
      !lc?.applyToSelection ||
      !lc?.selectionOffsets ||
      !isSameCell ||
      !inputRef.current ||
      !inputBoxInnerRef.current
    ) {
      setLinkSelectionHighlightRects([]);
      return;
    }
    const { start, end } = lc.selectionOffsets;
    const rects = getRangeRectsByCharacterOffset(inputRef.current, start, end);
    const containerRect = inputBoxInnerRef.current.getBoundingClientRect();
    const relative = rects.map((r) => ({
      left: r.left - containerRect.left,
      top: r.top - containerRect.top,
      width: r.width,
      height: r.height,
    }));
    setLinkSelectionHighlightRects(relative);
  }, [
    context.linkCard?.applyToSelection,
    context.linkCard?.selectionOffsets,
    context.linkCard?.r,
    context.linkCard?.c,
    context.luckysheetCellUpdate,
  ]);

  const wraperGetCell = () => {
    const cell = getCellAddress();
    if (activeRefCell !== cell) {
      setActiveRefCell(cell);
    }
    return activeCell || cell;
  };

  useRerenderOnFormulaCaret(inputRef, context.luckysheetCellUpdate.length > 0);

  // Helper function to extract function name from input text
  const getFunctionNameFromInput = useCallback(() => {
    const inputText = inputRef?.current?.innerText || "";
    if (!inputText.startsWith("=")) return null;

    // Try to find function name pattern: =FUNCTIONNAME(
    const functionMatch = inputText.match(/^=([A-Za-z_][A-Za-z0-9_]*)\s*\(/);
    if (functionMatch) {
      return functionMatch[1].toUpperCase();
    }

    // Also check if there's a function with class luckysheet-formula-text-func in the HTML
    if (inputRef?.current) {
      const funcSpan = inputRef.current.querySelector(
        ".luckysheet-formula-text-func"
      );
      if (funcSpan) {
        return funcSpan.textContent?.toUpperCase() || null;
      }
    }

    return null;
  }, []);

  // Prefer caret-on-span detection for nested calls (e.g. SUM(MIN( → MIN)), then core hint, then text parse.
  const functionName =
    getFunctionNameFromFormulaCaretSpans(inputRef.current) ??
    context.functionHint ??
    getFunctionNameFromInput();

  // Get function object using the detected function name
  const fn = functionName
    ? context.formulaCache.functionlistMap[functionName]
    : null;

  const showCellFormulaChrome =
    context.luckysheetCellUpdate.length > 0 &&
    getFormulaEditorOwner(context) === "cell";

  const inputBoxBaseSelection =
    isInputBoxActive && firstSelectionActiveCell
      ? firstSelectionActiveCell
      : firstSelection;

  return (
    <div
      className="luckysheet-input-box"
      id="luckysheet-input-box"
      style={getInputBoxPosition()}
      onMouseDown={(e) => e.stopPropagation()}
      onMouseUp={(e) => e.stopPropagation()}
    >
      {firstSelection && !context.rangeDialog?.show && (
        <div
          className="luckysheet-cell-address-indicator"
          style={getAddressIndicatorPosition()}
        >
          {wraperGetCell()}
        </div>
      )}
      <div
        ref={inputBoxInnerRef}
        className="luckysheet-input-box-inner"
        style={
          inputBoxBaseSelection
            ? {
                position: "relative",
                minWidth: inputBoxBaseSelection.width,
                minHeight: inputBoxBaseSelection.height,
                ...inputBoxStyle,
              }
            : { position: "relative" }
        }
      >
        <ContentEditable
          onCompositionStart={() => {
            isComposingRef.current = true;
          }}
          onCompositionUpdate={() => {
            isComposingRef.current = true;
          }}
          onCompositionEnd={(e: React.CompositionEvent<HTMLInputElement>) => {
            if (e.data === "" && e.currentTarget.value === "") {
              isComposingRef.current = true;
              return;
            }
            ensureNotEmpty();
            isComposingRef.current = false;
          }}
          onMouseUp={() => {
            handleHideShowHint();
            setContext((draftCtx) => {
              setFormulaEditorOwner(draftCtx, "cell");
            });
            if (!isComposingRef.current) {
              const currentCommaCount = countCommasBeforeCursor(
                inputRef?.current!
              );
              setCommaCount(currentCommaCount);
            }

            const editor = inputRef.current;
            if (!editor) return;

            setContext((draftCtx) => {
              if (draftCtx.formulaCache.rangeSelectionActive !== true) return;

              const clickedInsideManagedRange =
                getFormulaRangeIndexAtCaret(editor) !== null;
              const atValidInsertionPoint =
                isCaretAtValidFormulaRangeInsertionPoint(editor);

              if (clickedInsideManagedRange || !atValidInsertionPoint) {
                markRangeSelectionDirty(draftCtx);
              }
            });
          }}
          innerRef={(e) => {
            inputRef.current = e;
            refs.cellInput.current = e;
          }}
          className="luckysheet-cell-input cell-input"
          id="luckysheet-rich-text-editor"
          style={{
            transform: `scale(${context.zoomRatio})`,
            transformOrigin: "left top",
            width: `${100 / context.zoomRatio}%`,
            height: `${100 / context.zoomRatio}%`,
            color: "black",
          }}
          aria-autocomplete="list"
          onChange={onChange}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
          allowEdit={edit ? !isHidenRC : edit}
        />
        {linkSelectionHighlightRects.length > 0 && (
          <div
            className="luckysheet-input-box-link-selection-highlight"
            aria-hidden
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              right: 0,
              bottom: 0,
              pointerEvents: "none",
            }}
          >
            {linkSelectionHighlightRects.map((r, i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: r.left,
                  top: r.top,
                  width: r.width,
                  height: r.height,
                  backgroundColor: "rgba(0, 123, 255, 0.25)",
                }}
              />
            ))}
          </div>
        )}
      </div>

      {(context.functionCandidates.length > 0 ||
        context.functionHint ||
        context.defaultCandidates.length > 0 ||
        fn) &&
        showCellFormulaChrome && (
          <>
            {showSearchHint && (
              <FormulaSearch
                onMouseMove={(e) => {
                  if (document.getElementById("luckysheet-formula-search-c")) {
                    // apply hovered state on the function item
                    const hoveredItem = (e.target as HTMLElement).closest(
                      ".luckysheet-formula-search-item"
                    ) as HTMLElement | null;
                    if (!hoveredItem) return;

                    clearSearchItemActiveClass();
                    hoveredItem.classList.add(
                      "luckysheet-formula-search-item-active"
                    );
                  }
                  e.preventDefault();
                }}
                onMouseDown={(e) => {
                  selectActiveFormulaOnClick(e);
                }}
              />
            )}
            <div className="cell-hint">
              {showFormulaHint && fn && !showSearchHint && (
                <FormulaHint
                  handleShowFormulaHint={handleShowFormulaHint}
                  showFormulaHint={showFormulaHint}
                  commaCount={commaCount}
                  functionName={functionName}
                />
              )}
              {!showFormulaHint && fn && !showSearchHint && (
                <Tooltip
                  text="Turn on formula suggestions (F10)"
                  placement="top"
                  defaultOpen
                  style={{
                    position: "absolute",
                    top: "-50px",
                    left: "-130px",
                    width: "210px",
                  }}
                >
                  <div
                    className="luckysheet-hin absolute show-more-btn"
                    onClick={() => {
                      handleShowFormulaHint();
                    }}
                  >
                    <LucideIcon
                      name="DSheetTextDisabled"
                      fill="black"
                      style={{
                        width: "14px",
                        height: "14px",
                        margin: "auto",
                        marginTop: "1px",
                      }}
                    />
                  </div>
                </Tooltip>
              )}
            </div>
          </>
        )}
    </div>
  );
};

export default InputBox;
