import { RefObject, useContext, useRef } from "react";
import {
  fixPositionOnFrozenCells,
  getSheetIndex,
  rowLocation,
  rowLocationByIndex,
  updateContextWithSheetData,
} from "@fileverse-dev/fortune-core";
import WorkbookContext from "../../../context";

export const useRowDragAndDrop = (
  containerRef: RefObject<HTMLDivElement | null>,
  selectedLocationRef: RefObject<any[]>
) => {
  const DOUBLE_MS = 300;
  const START_DRAG_THRESHOLD_PX = 6;
  const clickRef = useRef({ lastTime: 0, lastRow: -1 });
  const { context, setContext, refs } = useContext(WorkbookContext);

  const dragRef = useRef({
    mouseDown: false,
    startY: 0,
    source: -1,
    active: false,
    lineEl: null as HTMLDivElement | null,
    ghostEl: null as HTMLDivElement | null,
    onDocMove: null as null | ((ev: MouseEvent) => void),
    onDocUp: null as null | ((ev: MouseEvent) => void),
    prevUserSelect: "" as string,
    prevWebkitUserSelect: "" as string,
    lastNativeEvent: null as MouseEvent | null,
    ghostHeightPx: 24,
  });

  const removeDragLine = () => {
    const { lineEl, ghostEl } = dragRef.current;
    try {
      if (lineEl?.parentElement) lineEl.parentElement.removeChild(lineEl);
    } catch {}
    try {
      if (ghostEl?.parentElement) ghostEl.parentElement.removeChild(ghostEl);
    } catch {}
    dragRef.current.lineEl = null;
    dragRef.current.ghostEl = null;
    dragRef.current.active = false;
  };
  const getRowIndexClicked = (pageY: number, headerEl: HTMLDivElement) => {
    const rect = headerEl.getBoundingClientRect();
    const mouseYInHeader = pageY - rect.top - window.scrollY;
    const localYInHeader = mouseYInHeader + headerEl.scrollTop;
    const freeze = refs.globalCache.freezen?.[context.currentSheetId];
    const { y: adjustedY } = fixPositionOnFrozenCells(
      freeze,
      0,
      localYInHeader,
      0,
      mouseYInHeader
    );
    const [, , rowIndex] = rowLocation(adjustedY, context.visibledatarow);
    return rowIndex;
  };

  const isRowDoubleClicked = (clickedRowIndex: number) => {
    const now = performance.now();
    const isDoubleClicked =
      now - clickRef.current.lastTime < DOUBLE_MS &&
      clickRef.current.lastRow === clickedRowIndex;
    clickRef.current.lastTime = now;
    clickRef.current.lastRow = clickedRowIndex;
    return isDoubleClicked;
  };

  const computeInsertionFromPageY = (pageY: number) => {
    const workbookEl = containerRef.current;
    if (!workbookEl)
      return { insertionIndex: -1, lineTopPx: 0, mouseYInWorkbook: 0 };

    const wbRect = workbookEl.getBoundingClientRect();
    const mouseYInWorkbook = pageY - wbRect.top - window.scrollY;
    const localYInWorkbook =
      mouseYInWorkbook +
      (containerRef?.current?.scrollTop ?? context.scrollTop);

    const freeze = refs.globalCache.freezen?.[context.currentSheetId];
    const { y: yWorkbook } = fixPositionOnFrozenCells(
      freeze,
      0,
      localYInWorkbook,
      0,
      mouseYInWorkbook
    );

    const [rowTopPx, rowBottomPx, hoveredRowIndex] = rowLocation(
      yWorkbook,
      context.visibledatarow
    );

    const rowMidPx = (rowTopPx + rowBottomPx) / 2;
    let insertionIndex = hoveredRowIndex + (yWorkbook > rowMidPx ? 1 : 0);

    const sheetIdx = getSheetIndex(context, context.currentSheetId);
    const sheetLocal =
      sheetIdx == null ? null : context.luckysheetfile[sheetIdx];
    const maxRows = sheetLocal?.data?.length ?? context.visibledatarow.length;
    insertionIndex = Math.max(0, Math.min(maxRows, insertionIndex));

    const lineTopPx = yWorkbook > rowMidPx ? rowBottomPx : rowTopPx;
    return { insertionIndex, lineTopPx, mouseYInWorkbook };
  };
  const createInsertionLine = (host: HTMLElement) => {
    const el = document.createElement("div");
    el.style.position = "absolute";
    el.style.left = "0px";
    el.style.right = "0px";
    el.style.height = "2px";
    el.style.background = "#EFC703";
    el.style.zIndex = "9999";
    el.style.pointerEvents = "none";
    host.appendChild(el);
    return el;
  };
  const createGhost = (host: HTMLElement) => {
    const el = document.createElement("div");
    el.style.position = "fixed";
    el.style.left = "58px";
    el.style.width = `${window.innerWidth}px`;
    el.style.boxSizing = "border-box";
    el.style.padding = "6px 8px";
    el.style.background = "rgba(239,199,3,0.10)";
    el.style.border = "1px solid #EFC703";
    el.style.borderRadius = "6px";
    el.style.zIndex = "10000";
    el.style.pointerEvents = "none";
    el.style.display = "flex";
    el.style.alignItems = "center";
    el.style.fontSize = "12px";
    el.style.fontWeight = "500";

    let ghostHeightPx = 24;
    let ghostLabel = `${dragRef.current.source + 1} row`;

    const selectedBlock = selectedLocationRef.current.find(
      (s) => s.r1 <= dragRef.current.source && dragRef.current.source <= s.r2
    );

    if (selectedBlock) {
      ghostHeightPx = Math.max(
        24,
        selectedBlock.row - selectedBlock.row_pre - 1
      );
      const count = selectedBlock.r2 - selectedBlock.r1 + 1;
      ghostLabel = count > 1 ? `${count} rows` : `${selectedBlock.r1 + 1} row`;
    } else {
      const [pre, end] = rowLocationByIndex(
        dragRef.current.source,
        context.visibledatarow
      );
      const sourceRowHeight = end - pre - 1;
      ghostHeightPx = Math.max(24, sourceRowHeight);
    }

    el.style.height = `${ghostHeightPx}px`;
    el.textContent = ghostLabel;
    host.appendChild(el);
    return { el, ghostHeightPx };
  };
  const isDragActivated = (host: HTMLElement, pixelDeltaY: number) => {
    if (dragRef.current.active) return true;
    if (pixelDeltaY < START_DRAG_THRESHOLD_PX) return false;

    dragRef.current.active = true;

    // disable text selection
    dragRef.current.prevUserSelect = document.body.style.userSelect;
    dragRef.current.prevWebkitUserSelect = (
      document.body.style as any
    ).webkitUserSelect;
    document.body.style.userSelect = "none";
    (document.body.style as any).webkitUserSelect = "none";

    // visuals
    dragRef.current.lineEl = createInsertionLine(host);
    const { el, ghostHeightPx } = createGhost(host);
    dragRef.current.ghostEl = el;
    dragRef.current.ghostHeightPx = ghostHeightPx;

    return true;
  };

  const handleRowDrag = (ev: MouseEvent) => {
    if (!dragRef.current.mouseDown) return;
    dragRef.current.lastNativeEvent = ev;

    const host = containerRef.current;
    if (!host) return;

    const dragOffset = Math.abs(ev.pageY - dragRef.current.startY);
    if (!isDragActivated(host, dragOffset)) return;

    const { lineTopPx } = computeInsertionFromPageY(ev.pageY);
    const ghostPosOffset = dragRef.current.startY > ev.pageY ? 0 : 25;

    if (dragRef.current.lineEl) {
      dragRef.current.lineEl.style.top = `${lineTopPx}px`;
    }

    if (dragRef.current.ghostEl) {
      dragRef.current.ghostEl.style.top = `${ev.pageY - ghostPosOffset}px`;
    }
  };

  const handleRowDragEnd = (ev: MouseEvent) => {
    if (!dragRef.current.mouseDown) return;
    dragRef.current.mouseDown = false;

    // restore selection
    try {
      document.body.style.userSelect = dragRef.current.prevUserSelect || "";
      (document.body.style as any).webkitUserSelect =
        dragRef.current.prevWebkitUserSelect || "";
    } catch {}

    if (dragRef.current.active) {
      const { insertionIndex: finalInsertionIndex } = computeInsertionFromPageY(
        ev.pageY
      );

      const sourceIndex = dragRef.current.source;
      const sheetIdx = getSheetIndex(context, context.currentSheetId);

      if (
        sheetIdx != null &&
        sourceIndex >= 0 &&
        Number.isFinite(finalInsertionIndex) &&
        finalInsertionIndex >= 0
      ) {
        setContext((draft) => {
          const _sheet = draft.luckysheetfile[sheetIdx];
          if (!_sheet?.data) return;
          const rows = _sheet.data;
          if (sourceIndex < 0 || sourceIndex >= rows.length) return;

          // remove-then-insert adjustment
          let targetIndex = finalInsertionIndex;
          if (targetIndex > sourceIndex) targetIndex -= 1;

          const [rowData] = rows.splice(sourceIndex, 1);
          if (targetIndex < 0) targetIndex = 0;
          if (targetIndex > rows.length) targetIndex = rows.length;
          rows.splice(targetIndex, 0, rowData);

          _sheet.data = rows;
          updateContextWithSheetData(draft, _sheet.data);
        });
      }
    }

    // cleanup
    removeDragLine();
    dragRef.current.active = false;
    dragRef.current.source = -1;

    if (dragRef.current.onDocMove)
      document.removeEventListener("mousemove", dragRef.current.onDocMove);
    if (dragRef.current.onDocUp)
      document.removeEventListener("mouseup", dragRef.current.onDocUp);
    dragRef.current.onDocMove = null;
    dragRef.current.onDocUp = null;
  };

  const initiateDrag = (clickedRowIndex: number, startY: number) => {
    dragRef.current.mouseDown = true;
    dragRef.current.startY = startY;
    dragRef.current.source = clickedRowIndex;
    dragRef.current.active = false;

    dragRef.current.onDocMove = handleRowDrag;
    dragRef.current.onDocUp = handleRowDragEnd;
    document.addEventListener("mousemove", handleRowDrag);
    document.addEventListener("mouseup", handleRowDragEnd);
  };

  return { initiateDrag, getRowIndexClicked, isRowDoubleClicked };
};
