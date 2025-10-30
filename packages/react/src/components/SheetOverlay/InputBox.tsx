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
  getrangeseleciton,
  indexToColumnChar,
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
import {
  moveCursorToEnd,
  getCursorPosition,
  isLetterNumberPattern,
  removeLastSpan,
  incrementColumn,
  decrementColumn,
  incrementRow,
  decrementRow,
  countCommasBeforeCursor,
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
  const hideFormulaHintLocal = localStorage.getItem("formulaMore") === "true";
  const [showFormulaHint, setShowFormulaHint] = useState(!hideFormulaHintLocal);
  const [showSearchHint, setShowSearchHint] = useState(false);
  const row_index = firstSelection?.row_focus!;
  const col_index = firstSelection?.column_focus!;
  const preText = useRef("");
  const placeRef = useRef("");

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
      if (inputRef.current?.innerText.charAt(0) === "=") {
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
      if (
        _.isEqual(prevCellUpdate, context.luckysheetCellUpdate) &&
        prevSheetId === context.currentSheetId
      ) {
        // data change by a collabrative update should not trigger this effect
        return;
      }
      const flowdata = getFlowdata(context);
      const cell = flowdata?.[row_index]?.[col_index];
      let value = "";
      if (cell && !refs.globalCache.overwriteCell) {
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
      if (!refs.globalCache.ignoreWriteCell)
        inputRef.current!.innerHTML = escapeHTMLTag(escapeScriptTag(value));
      refs.globalCache.ignoreWriteCell = false;
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
    }
  }, [context.luckysheetCellUpdate]);

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

  const getActiveFormula = useCallback(
    () => document.querySelector(".luckysheet-formula-search-item-active"),
    []
  );

  const insertSelectedFormula = useCallback(
    (formulaName: string) => {
      if (/^=[a-zA-Z]+$/.test(inputRef.current!.innerText)) {
        const ht = `<span dir="auto" class="luckysheet-formula-text-color">=</span><span dir="auto" class="luckysheet-formula-text-func">${formulaName}</span><span dir="auto" class="luckysheet-formula-text-lpar">(</span>`;
        inputRef.current!.innerHTML = ht;
        const fxEditor = document.getElementById("luckysheet-functionbox-cell");
        if (fxEditor) {
          fxEditor.innerHTML = ht;
        }
        moveCursorToEnd(inputRef.current!);
        setContext((draftCtx) => {
          draftCtx.functionCandidates = [];
          draftCtx.defaultCandidates = [];
          draftCtx.functionHint = formulaName;
        });
        return;
      }

      const textEditor = document.getElementById("luckysheet-rich-text-editor");
      if (!textEditor) return;

      textEditor.focus();

      let selection = window.getSelection();
      let range = selection?.rangeCount ? selection.getRangeAt(0) : null;

      // If no selection or selection is outside the editor, reset to end of editor
      if (!selection || !range || !textEditor.contains(range.startContainer)) {
        range = document.createRange();
        range.selectNodeContents(textEditor);
        range.collapse(false); // place caret at end
        selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
      }

      // Delete the partially typed formula name if needed
      const searchTxt = getrangeseleciton()?.textContent || "";
      const deleteCount = searchTxt === "=" ? 0 : searchTxt.length;

      if (
        deleteCount > 0 &&
        range.startContainer.nodeType === Node.TEXT_NODE &&
        textEditor.contains(range.startContainer)
      ) {
        const startOffset = Math.max(range.startOffset - deleteCount, 0);
        const endOffset = range.startOffset;
        range.setStart(range.startContainer, startOffset);
        range.setEnd(range.startContainer, endOffset);
        range.deleteContents();
      }

      // Clean up existing formula spans if any
      textEditor
        .querySelectorAll(
          ".luckysheet-formula-text-func, .luckysheet-formula-text-lpar"
        )
        .forEach((el) => el.remove());

      // Create new nodes to insert
      const funcNode = new DOMParser().parseFromString(
        `<span dir="auto" class="luckysheet-formula-text-func">${formulaName}</span>`,
        "text/html"
      ).body.firstChild;

      const parNode = new DOMParser().parseFromString(
        `<span dir="auto" class="luckysheet-formula-text-lpar">(</span>`,
        "text/html"
      ).body.firstChild;

      // Safely insert nodes at the current range
      if (range && parNode && funcNode) {
        range.insertNode(funcNode);
        range.collapse(false);
        range.insertNode(parNode);
        range.collapse(false);
        selection?.removeAllRanges();
        selection?.addRange(range);
      }

      // Clear formula UI state
      setContext((draftCtx) => {
        draftCtx.functionCandidates = [];
        draftCtx.defaultCandidates = [];
        draftCtx.functionHint = formulaName;
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
      // @ts-expect-error later
      if (e.target.className.includes("sign-fortune")) return;
      preText.current = inputRef.current!.innerText;
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

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      lastKeyDownEventRef.current = new KeyboardEvent(e.type, e.nativeEvent);
      preText.current = inputRef.current!.innerText;
      // if (
      //   $("#luckysheet-modal-dialog-mask").is(":visible") ||
      //   $(event.target).hasClass("luckysheet-mousedown-cancel") ||
      //   $(event.target).hasClass("formulaInputFocus")
      // ) {
      //   return;
      // }

      const currentCommaCount = countCommasBeforeCursor(inputRef?.current!);
      setCommaCount(currentCommaCount);

      /* Arrow navigation for cell reference starts here */
      let allowListNavigation = true;

      if (
        (e.key === "Delete" || e.key === "Backspace") &&
        getCursorPosition(inputRef?.current!) ===
          inputRef?.current!.innerText.length
      ) {
        setTimeout(() => {
          moveCursorToEnd(inputRef?.current!);
        }, 5);
      }

      let refCell = placeRef.current;

      if (e.key === "ArrowUp") {
        refCell = decrementRow(placeRef.current);
      } else if (e.key === "ArrowDown") {
        refCell = incrementRow(placeRef.current);
      } else if (e.key === "ArrowLeft") {
        refCell = decrementColumn(placeRef.current);
      } else if (e.key === "ArrowRight") {
        refCell = incrementColumn(placeRef.current);
      }

      // current hack to for arrow navigation, try to find a better way like using rangeDrag
      if (
        (e.key === "ArrowUp" ||
          e.key === "ArrowDown" ||
          e.key === "ArrowLeft" ||
          e.key === "ArrowRight") &&
        !(
          getCursorPosition(inputRef?.current!) !==
            inputRef?.current!.innerText.length && e.key === "ArrowRight"
        )
      ) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(
          `<div>${inputRef?.current?.innerHTML}</div>`,
          "text/html"
        );
        const spans = doc.querySelectorAll("span");
        const lastSpan = spans[spans.length - 1];

        const notFunctionInit = !document
          .getElementById("luckysheet-rich-text-editor")
          ?.innerText.includes("(");

        // handling for inputbox active arrow navigation for cell reference input for functions like SUM(A1:A10)
        const arrowRefNotAllowed =
          lastSpan?.innerText.includes(")") ||
          (notFunctionInit &&
            /^[a-zA-Z]+$/.test(lastSpan?.innerText) &&
            !_.includes(["="], lastSpan?.innerText));

        if (
          (lastSpan?.innerText === "(" ||
            lastSpan?.innerText === "," ||
            lastSpan?.innerText.includes(":") ||
            lastSpan?.innerText !== ")") &&
          !lastSpan?.innerText.includes('"') &&
          !isLetterNumberPattern(lastSpan?.innerText) &&
          !arrowRefNotAllowed &&
          !/^[a-zA-Z]+$/.test(lastSpan?.innerText)
        ) {
          allowListNavigation = false;
          inputRef.current!.innerHTML = `${
            inputRef.current!.innerHTML
          }<span class="fortune-formula-functionrange-cell" rangeindex="0" dir="auto" style="color:#c1232b;">${refCell}</span>`;

          setTimeout(() => {
            moveCursorToEnd(inputRef.current!);
          }, 1);
        }

        if (isLetterNumberPattern(lastSpan?.innerText)) {
          allowListNavigation = false;
          const htmlR = removeLastSpan(inputRef?.current!.innerHTML);
          inputRef.current!.innerHTML = `${htmlR}<span class="fortune-formula-functionrange-cell" rangeindex="0" dir="auto" style="color:#c1232b;">${refCell}</span>`;

          moveCursorToEnd(inputRef.current!);
          setTimeout(() => {
            moveCursorToEnd(inputRef.current!);
          }, 1);
        }
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
      clearSearchItemActiveClass,
      context.luckysheetCellUpdate.length,
      selectActiveFormula,
      setContext,
      firstSelection,
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

      if (
        inputRef?.current?.innerText.includes("=") &&
        /^=?[A-Za-z]*$/.test(getLastInputSpanText())
      ) {
        setShowSearchHint(true);
      } else {
        setShowSearchHint(false);
      }
      const currentCommaCount = countCommasBeforeCursor(inputRef?.current!);
      setCommaCount(currentCommaCount);
      // setInputHTML(html);
      // console.log("onChange", __);
      const e = lastKeyDownEventRef.current;
      if (!e) return;
      const kcode = e.keyCode;
      if (!kcode) return;

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
            preText.current
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
    [refs.cellInput, refs.fxInput, setContext]
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

  const wraperGetCell = () => {
    const cell = getCellAddress();
    placeRef.current = cell;
    if (activeRefCell !== cell) {
      setActiveRefCell(cell);
    }
    return activeCell || cell;
  };

  const fn =
    context.formulaCache.functionlistMap[context.functionHint as string];

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
        className="luckysheet-input-box-inner"
        style={
          firstSelection
            ? {
                minWidth: firstSelection.width,
                minHeight: firstSelection.height,
                ...inputBoxStyle,
              }
            : {}
        }
      >
        <ContentEditable
          onMouseUp={() => {
            handleHideShowHint();
            const currentCommaCount = countCommasBeforeCursor(
              inputRef?.current!
            );
            setCommaCount(currentCommaCount);
          }}
          innerRef={(e) => {
            // @ts-ignore
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
      </div>

      {(context.functionCandidates.length > 0 ||
        context.functionHint ||
        context.defaultCandidates.length > 0) && (
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
            {showFormulaHint &&
              fn &&
              inputRef?.current?.innerText.includes("(") && (
                <FormulaHint
                  handleShowFormulaHint={handleShowFormulaHint}
                  showFormulaHint={showFormulaHint}
                  commaCount={commaCount}
                />
              )}
            {!showFormulaHint && fn && (
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
