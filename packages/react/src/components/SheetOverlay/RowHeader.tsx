import {
  rowLocation,
  rowLocationByIndex,
  selectTitlesMap,
  selectTitlesRange,
  handleContextMenu,
  handleRowHeaderMouseDown,
  handleRowSizeHandleMouseDown,
  fixRowStyleOverflowInFreeze,
  handleRowFreezeHandleMouseDown,
  getSheetIndex,
  fixPositionOnFrozenCells,
  updateContextWithSheetData,
} from "@fileverse-dev/fortune-core";
import _ from "lodash";
import React, {
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import WorkbookContext from "../../context";

type HoverLoc = { row: number; row_pre: number; row_index: number };
type SelectedLoc = { row: number; row_pre: number; r1: number; r2: number };

const DOUBLE_MS = 300; // double-click window
const START_DRAG_THRESHOLD_PX = 6;
const AUTOSCROLL_EDGE_PX = 36;
const AUTOSCROLL_SPEED_MAX_PX = 28;

const RowHeader: React.FC = () => {
  const { context, setContext, settings, refs } = useContext(WorkbookContext);
  const rowChangeSizeRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [hoverLocation, setHoverLocation] = useState<HoverLoc>({
    row: -1,
    row_pre: -1,
    row_index: -1,
  });
  const [hoverInFreeze, setHoverInFreeze] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<SelectedLoc[]>([]);

  const sheetIndex = getSheetIndex(context, context.currentSheetId);
  const sheet = sheetIndex == null ? null : context.luckysheetfile[sheetIndex];

  const freezeHandleTop = useMemo(() => {
    if (
      sheet?.frozen?.type === "row" ||
      sheet?.frozen?.type === "rangeRow" ||
      sheet?.frozen?.type === "rangeBoth" ||
      sheet?.frozen?.type === "both"
    ) {
      return (
        rowLocationByIndex(
          sheet?.frozen?.range?.row_focus || 0,
          context.visibledatarow
        )[1] + context.scrollTop
      );
    }
    return context.scrollTop;
  }, [context.visibledatarow, sheet?.frozen, context.scrollTop]);

  // Keep latest context/selection available inside document listeners
  const contextRef = useRef(context);
  useEffect(() => {
    contextRef.current = context;
  }, [context]);

  const selectedLocationRef = useRef(selectedLocation);
  useEffect(() => {
    selectedLocationRef.current = selectedLocation;
  }, [selectedLocation]);

  // Double-click detection state
  const clickRef = useRef({ lastTime: 0, lastRow: -1 });

  // Reorder-drag state
  const dragRef = useRef({
    mouseDown: false,
    startY: 0,
    source: -1,
    active: false,
    lineEl: null as HTMLDivElement | null,
    ghostEl: null as HTMLDivElement | null,
    onDocMove: null as null | ((ev: MouseEvent) => void),
    onDocUp: null as null | ((ev: MouseEvent) => void),
    rafId: 0 as number, // autoscroll rAF id
    prevUserSelect: "" as string,
    prevWebkitUserSelect: "" as string,
    lastNativeEvent: null as MouseEvent | null, // used for autoscroll
  });

  const stopAutoscroll = useCallback(() => {
    if (dragRef.current.rafId) {
      cancelAnimationFrame(dragRef.current.rafId);
      dragRef.current.rafId = 0;
    }
  }, []);

  const startAutoscroll = useCallback(() => {
    stopAutoscroll();
    const loop = () => {
      if (!dragRef.current.active) return;
      const wb = refs.workbookContainer.current || containerRef.current;
      const last = dragRef.current.lastNativeEvent;
      if (wb && last) {
        const rect = wb.getBoundingClientRect();
        const y = last.pageY - rect.top - window.scrollY;
        let dy = 0;
        if (y < AUTOSCROLL_EDGE_PX) {
          dy =
            -((AUTOSCROLL_EDGE_PX - y) / AUTOSCROLL_EDGE_PX) *
            AUTOSCROLL_SPEED_MAX_PX;
        } else if (y > rect.height - AUTOSCROLL_EDGE_PX) {
          dy =
            ((y - (rect.height - AUTOSCROLL_EDGE_PX)) / AUTOSCROLL_EDGE_PX) *
            AUTOSCROLL_SPEED_MAX_PX;
        }
        if (dy !== 0) {
          wb.scrollTop = Math.max(0, wb.scrollTop + dy);
        }
      }
      dragRef.current.rafId = requestAnimationFrame(loop);
    };
    dragRef.current.rafId = requestAnimationFrame(loop);
  }, [stopAutoscroll, refs.workbookContainer]);

  const removeDragLine = useCallback(() => {
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
  }, []);

  // Hover highlight tracking (freeze-aware)
  const onMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      if (context.luckysheet_rows_change_size) return;

      const container = containerRef.current;
      if (!container) return;

      const mouseY =
        e.pageY - container.getBoundingClientRect().top - window.scrollY;
      const _y = mouseY + container.scrollTop;
      const freeze = refs.globalCache.freezen?.[context.currentSheetId];
      const { y, inHorizontalFreeze } = fixPositionOnFrozenCells(
        freeze,
        0,
        _y,
        0,
        mouseY
      );
      const [row_pre, row, row_index] = rowLocation(y, context.visibledatarow);
      if (row_pre !== hoverLocation.row_pre || row !== hoverLocation.row) {
        setHoverLocation({ row_pre, row, row_index });
        setHoverInFreeze(inHorizontalFreeze);
      }
    },
    [
      context.luckysheet_rows_change_size,
      context.visibledatarow,
      hoverLocation.row,
      hoverLocation.row_pre,
      refs.globalCache.freezen,
      context.currentSheetId,
    ]
  );

  // Selection: compute header selection bands from grid selection
  useEffect(() => {
    const s = context.luckysheet_select_save || [];
    if (_.isNil(s)) return;
    setSelectedLocation([]);
    if (s[0]?.column_select) return;

    let rowTitleMap: Record<number, number> = {};
    for (let i = 0; i < s.length; i += 1) {
      const r1 = s[i].row[0];
      const r2 = s[i].row[1];
      rowTitleMap = selectTitlesMap(rowTitleMap, r1, r2);
    }
    const rowTitleRange = selectTitlesRange(rowTitleMap);
    const selects: SelectedLoc[] = [];
    for (let i = 0; i < rowTitleRange.length; i += 1) {
      const r1 = rowTitleRange[i][0];
      const r2 = rowTitleRange[i][rowTitleRange[i].length - 1];
      const row = rowLocationByIndex(r2, context.visibledatarow)[1];
      const row_pre = rowLocationByIndex(r1, context.visibledatarow)[0];
      if (_.isNumber(row_pre) && _.isNumber(row)) {
        selects.push({ row, row_pre, r1, r2 });
      }
    }
    setSelectedLocation(selects);
  }, [context.luckysheet_select_save, context.visibledatarow]);

  // Keep header scrolled with grid
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = context.scrollTop;
    }
  }, [context.scrollTop]);

  const onMouseLeave = useCallback(() => {
    if (context.luckysheet_rows_change_size) return;
    setHoverLocation({ row: -1, row_pre: -1, row_index: -1 });
  }, [context.luckysheet_rows_change_size]);

  const onRowSizeHandleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      const { nativeEvent } = e;
      setContext((draftCtx) => {
        handleRowSizeHandleMouseDown(
          draftCtx,
          refs.globalCache,
          nativeEvent,
          containerRef.current!,
          refs.workbookContainer.current!,
          refs.cellArea.current!
        );
      });
      e.stopPropagation();
    },
    [refs.cellArea, refs.globalCache, refs.workbookContainer, setContext]
  );

  const onRowFreezeHandleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      const { nativeEvent } = e;
      setContext((draftCtx) => {
        handleRowFreezeHandleMouseDown(
          draftCtx,
          refs.globalCache,
          nativeEvent,
          containerRef.current!,
          refs.workbookContainer.current!,
          refs.cellArea.current!
        );
      });
      e.stopPropagation();
    },
    [refs.cellArea, refs.globalCache, refs.workbookContainer, setContext]
  );

  const onContextMenu = useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      const { nativeEvent } = e;
      setContext((draftCtx) => {
        handleContextMenu(
          draftCtx,
          settings,
          nativeEvent,
          refs.workbookContainer.current!,
          refs.cellArea.current!,
          "rowHeader"
        );
      });
    },
    [refs.workbookContainer, setContext, settings, refs.cellArea]
  );

  /**
   * Hybrid onMouseDown:
   * - Single-click: selection (v2 behavior)
   * - Double-click (same row): arm reorder drag (v1 behavior)
   */
  const onMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      if (e.button !== 0) return; // left button only

      // ignore clicks on resize/freeze handles
      const target = e.target as HTMLElement;
      if (
        target.closest(".fortune-rows-change-size") ||
        target.closest(".fortune-rows-freeze-handle")
      ) {
        return;
      }

      const container = containerRef.current;
      if (!container) return;

      // map to row index (freeze-aware)
      const rect = container.getBoundingClientRect();
      const mouseY = e.pageY - rect.top - window.scrollY;
      const localY = mouseY + container.scrollTop;
      const freeze = refs.globalCache.freezen?.[context.currentSheetId];
      const { y } = fixPositionOnFrozenCells(freeze, 0, localY, 0, mouseY);
      const [, , rowIndex] = rowLocation(y, context.visibledatarow);
      if (rowIndex < 0) return;

      // detect double-click on the SAME row within DOUBLE_MS
      const now = performance.now();
      const isDouble =
        now - clickRef.current.lastTime < DOUBLE_MS &&
        clickRef.current.lastRow === rowIndex;
      clickRef.current.lastTime = now;
      clickRef.current.lastRow = rowIndex;

      if (!isDouble) {
        // --- SINGLE CLICK: selection (default v2 behavior) ---
        const { nativeEvent } = e;
        setContext((draftCtx) => {
          handleRowHeaderMouseDown(
            draftCtx,
            refs.globalCache,
            nativeEvent,
            containerRef.current!,
            refs.cellInput.current!,
            refs.fxInput.current!
          );
        });
        return;
      }

      // --- DOUBLE CLICK: start reorder drag (v1 behavior) ---
      e.preventDefault();
      e.stopPropagation();

      dragRef.current.mouseDown = true;
      dragRef.current.startY = e.pageY;
      dragRef.current.source = rowIndex;
      dragRef.current.active = false;

      const onDocMove = (ev: MouseEvent) => {
        if (!dragRef.current.mouseDown) return;
        dragRef.current.lastNativeEvent = ev;

        const wb = refs.workbookContainer.current || containerRef.current;
        if (!wb) return;

        const delta = Math.abs(ev.pageY - dragRef.current.startY);

        // Activate drag after a small movement
        if (!dragRef.current.active) {
          if (delta < START_DRAG_THRESHOLD_PX) return;
          dragRef.current.active = true;

          // Disable text selection until drop
          dragRef.current.prevUserSelect = document.body.style.userSelect;
          dragRef.current.prevWebkitUserSelect = (
            document.body.style as any
          ).webkitUserSelect;
          document.body.style.userSelect = "none";
          (document.body.style as any).webkitUserSelect = "none";

          // Full-width insertion line (append to workbook container)
          const line = document.createElement("div");
          line.style.position = "absolute";
          line.style.left = "0px";
          line.style.right = "0px";
          line.style.height = "2px";
          line.style.background = "#1a73e8";
          line.style.zIndex = "9999";
          line.style.pointerEvents = "none";
          wb.appendChild(line);
          dragRef.current.lineEl = line;

          // Ghost pill (size = selected block or single row)
          const ghost = document.createElement("div");
          ghost.style.position = "absolute";
          ghost.style.left = "8px";
          ghost.style.width = `${Math.max(
            60,
            contextRef.current.rowHeaderWidth - 8
          )}px`;
          ghost.style.boxSizing = "border-box";
          ghost.style.padding = "6px 8px";
          ghost.style.background = "rgba(26,115,232,0.10)";
          ghost.style.border = "1px solid rgba(26,115,232,0.35)";
          ghost.style.borderRadius = "6px";
          ghost.style.zIndex = "10000";
          ghost.style.pointerEvents = "none";
          ghost.style.display = "flex";
          ghost.style.alignItems = "center";
          ghost.style.fontSize = "12px";
          ghost.style.fontWeight = "500";

          let ghostHeight = 24;
          let label = `${dragRef.current.source + 1} row`;
          const block = selectedLocationRef.current.find(
            (s) =>
              s.r1 <= dragRef.current.source && dragRef.current.source <= s.r2
          );
          if (block) {
            ghostHeight = Math.max(24, block.row - block.row_pre - 1);
            const count = block.r2 - block.r1 + 1;
            label = count > 1 ? `${count} rows` : `${block.r1 + 1} row`;
          } else {
            const coords = rowLocationByIndex(
              dragRef.current.source,
              contextRef.current.visibledatarow
            );
            const h = coords[1] - coords[0] - 1;
            ghostHeight = Math.max(24, h);
          }
          ghost.style.height = `${ghostHeight}px`;
          ghost.textContent = label;
          wb.appendChild(ghost);
          dragRef.current.ghostEl = ghost;

          // start autoscroll loop
          startAutoscroll();
        }

        // Compute insertion position (workbook-local coords)
        const wbRect = wb.getBoundingClientRect();
        const _mouseY = ev.pageY - wbRect.top - window.scrollY;
        const _localY = _mouseY + wb.scrollTop;
        const freezeLocal =
          refs.globalCache.freezen?.[contextRef.current.currentSheetId];
        const { y: yaxis } = fixPositionOnFrozenCells(
          freezeLocal,
          0,
          _localY,
          0,
          _mouseY
        );
        const [row_pre, row, row_index] = rowLocation(
          yaxis,
          contextRef.current.visibledatarow
        );
        const mid = (row_pre + row) / 2;
        let insertion = row_index + (yaxis > mid ? 1 : 0);

        const si = getSheetIndex(
          contextRef.current,
          contextRef.current.currentSheetId
        );
        const sheetLocal =
          si == null ? null : contextRef.current.luckysheetfile[si];
        const max =
          sheetLocal?.data?.length ?? contextRef.current.visibledatarow.length;
        insertion = Math.max(0, Math.min(max, insertion));

        // Position visuals
        const topForLine = yaxis > mid ? row : row_pre;
        if (dragRef.current.lineEl)
          dragRef.current.lineEl.style.top = `${topForLine}px`;

        if (dragRef.current.ghostEl) {
          const gh = parseFloat(dragRef.current.ghostEl.style.height || "24");
          dragRef.current.ghostEl.style.top = `${
            _mouseY + wb.scrollTop - gh / 2
          }px`;
        }

        if (dragRef.current.lineEl)
          dragRef.current.lineEl.dataset.insertion = String(insertion);
      };

      const onDocUp = () => {
        if (!dragRef.current.mouseDown) return;
        dragRef.current.mouseDown = false;
        const wasActive = dragRef.current.active;

        // restore selection behavior
        try {
          document.body.style.userSelect = dragRef.current.prevUserSelect || "";
          (document.body.style as any).webkitUserSelect =
            dragRef.current.prevWebkitUserSelect || "";
        } catch {}
        stopAutoscroll();

        if (wasActive && dragRef.current.lineEl) {
          const raw = dragRef.current.lineEl.dataset.insertion;
          const insertion = raw == null ? -1 : Number(raw);
          const { source } = dragRef.current;
          const si = getSheetIndex(
            contextRef.current,
            contextRef.current.currentSheetId
          );
          if (
            si != null &&
            source >= 0 &&
            Number.isFinite(insertion) &&
            insertion >= 0
          ) {
            setContext((draftCtx) => {
              const sheet0 = draftCtx.luckysheetfile[si];
              if (!sheet0?.data) return;
              const arr = sheet0.data;
              if (source < 0 || source >= arr.length) return;

              let _target = insertion;
              if (_target > source) _target -= 1; // adjust for removal
              const [rowData] = arr.splice(source, 1);
              if (_target < 0) _target = 0;
              if (_target > arr.length) _target = arr.length; // allow append
              arr.splice(_target, 0, rowData);
              sheet0.data = arr;
              updateContextWithSheetData(draftCtx, sheet0.data);
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

      dragRef.current.onDocMove = onDocMove;
      dragRef.current.onDocUp = onDocUp;
      document.addEventListener("mousemove", onDocMove);
      document.addEventListener("mouseup", onDocUp);
    },
    [
      refs.globalCache,
      context.visibledatarow,
      context.currentSheetId,
      setContext,
      removeDragLine,
      startAutoscroll,
      stopAutoscroll,
    ]
  );

  return (
    <div
      ref={containerRef}
      className="fortune-row-header"
      style={{
        width: context.rowHeaderWidth - 1.5,
        height: context.cellmainHeight,
      }}
      onMouseMove={onMouseMove}
      onMouseDown={onMouseDown}
      onMouseLeave={onMouseLeave}
      onContextMenu={onContextMenu}
    >
      <div
        className="fortune-rows-freeze-handle"
        onMouseDown={onRowFreezeHandleMouseDown}
        style={{ top: freezeHandleTop }}
      />
      <div
        className="fortune-rows-change-size"
        ref={rowChangeSizeRef}
        onMouseDown={onRowSizeHandleMouseDown}
        style={{
          top: hoverLocation.row - 3 + (hoverInFreeze ? context.scrollTop : 0),
          opacity: context.luckysheet_rows_change_size ? 1 : 0,
        }}
      />
      {!context.luckysheet_rows_change_size && hoverLocation.row_index >= 0 ? (
        <div
          className="fortune-row-header-hover"
          style={_.assign(
            {
              top: hoverLocation.row_pre,
              height: hoverLocation.row - hoverLocation.row_pre - 1,
              display: "block",
            },
            fixRowStyleOverflowInFreeze(
              context,
              hoverLocation.row_index,
              hoverLocation.row_index,
              refs.globalCache.freezen?.[context.currentSheetId]
            )
          )}
        />
      ) : null}
      {selectedLocation.map(({ row, row_pre, r1, r2 }, i) => (
        <div
          className="fortune-row-header-selected"
          key={`${r1}-${r2}-${i}`}
          style={_.assign(
            {
              top: row_pre,
              height: row - row_pre - 1,
              display: "block",
              backgroundColor: "#EFC703",
              mixBlendMode: "multiply" as any,
            },
            fixRowStyleOverflowInFreeze(
              context,
              r1,
              r2,
              refs.globalCache.freezen?.[context.currentSheetId]
            )
          )}
        />
      ))}
      {/* overflow spacer to make the container scrollable */}
      <div
        style={{ height: context.rh_height, width: 1 }}
        id="luckysheetrowHeader_0"
        className="luckysheetsheetchange"
      />
    </div>
  );
};

export default RowHeader;
