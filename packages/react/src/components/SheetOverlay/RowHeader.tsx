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

const RowHeader: React.FC = () => {
  const { context, setContext, settings, refs } = useContext(WorkbookContext);
  const rowChangeSizeRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoverLocation, setHoverLocation] = useState({
    row: -1,
    row_pre: -1,
    row_index: -1,
  });
  const [hoverInFreeze, setHoverInFreeze] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<
    { row: number; row_pre: number; r1: number; r2: number }[]
  >([]);
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

  const onMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      if (context.luckysheet_rows_change_size) {
        return;
      }
      const mouseY =
        e.pageY -
        containerRef.current!.getBoundingClientRect().top -
        window.scrollY;
      const _y = mouseY + containerRef.current!.scrollTop;
      const freeze = refs.globalCache.freezen?.[context.currentSheetId];
      const { y, inHorizontalFreeze } = fixPositionOnFrozenCells(
        freeze,
        0,
        _y,
        0,
        mouseY
      );
      const row_location = rowLocation(y, context.visibledatarow);
      const [row_pre, row, row_index] = row_location;
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

  // NOTE: header click/selection is handled on mouseup rather than mousedown so
  // a drag can begin without being immediately turned into a selection.
  const dragRef = useRef({
    mouseDown: false,
    startY: 0,
    source: -1,
    active: false,
    lineEl: null as HTMLDivElement | null,
    lastNativeEvent: null as MouseEvent | null,
    ghostEl: null as HTMLDivElement | null,
    // store per-drag handlers so they can be removed reliably
    onDocMove: null as null | ((ev: MouseEvent) => void),
    onDocUp: null as null | ((ev: MouseEvent) => void),
  });

  // keep refs to values used inside dynamically-attached document listeners
  const selectedLocationRef = useRef(selectedLocation);
  useEffect(() => {
    selectedLocationRef.current = selectedLocation;
  }, [selectedLocation]);

  const contextRef = useRef(context);
  useEffect(() => {
    contextRef.current = context;
  }, [context]);

  const onMouseLeave = useCallback(() => {
    if (context.luckysheet_rows_change_size) {
      return;
    }
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
    const selects: { row: number; row_pre: number; r1: number; r2: number }[] =
      [];
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

  useEffect(() => {
    containerRef.current!.scrollTop = context.scrollTop;
  }, [context.scrollTop]);

  // helpers to cleanup drag line
  const removeDragLine = useCallback(() => {
    const line = dragRef.current.lineEl;
    if (line && line.parentElement) {
      line.parentElement.removeChild(line);
    }
    dragRef.current.lineEl = null;
    const ghost = dragRef.current.ghostEl;
    if (ghost && ghost.parentElement) {
      ghost.parentElement.removeChild(ghost);
    }
    dragRef.current.ghostEl = null;
    dragRef.current.active = false;
  }, []);

  // attach to onMouseDown: start tracking
  const onMouseDownWithDrag = useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      // only left button
      if (e.button !== 0) return;
      // prevent other handlers from turning this into an immediate selection
      e.preventDefault();
      e.stopPropagation();
      // don't start drag when clicking on resize or freeze handles
      const target = e.target as HTMLElement;
      if (
        target.closest(".fortune-rows-change-size") ||
        target.closest(".fortune-rows-freeze-handle")
      ) {
        return;
      }
      // record start
      dragRef.current.mouseDown = true;
      dragRef.current.startY = e.pageY;
      // store native event so selection can be applied on mouseup if no drag occurs
      dragRef.current.lastNativeEvent = e.nativeEvent;

      // compute source row index from the click position (more reliable than hover state)
      const rect = containerRef.current!.getBoundingClientRect();
      const mouseY = e.pageY - rect.top - window.scrollY;
      const localY = mouseY + containerRef.current!.scrollTop;
      const freeze = refs.globalCache.freezen?.[context.currentSheetId];
      const { y } = fixPositionOnFrozenCells(freeze, 0, localY, 0, mouseY);
      const [, , sourceIndex] = rowLocation(y, context.visibledatarow);
      dragRef.current.source = sourceIndex;
      // if we didn't hit a valid row, bail out early
      if (sourceIndex < 0) {
        dragRef.current.mouseDown = false;
        dragRef.current.lastNativeEvent = null;
        return;
      }
      dragRef.current.active = false;

      // attach document listeners for this drag session
      const onDocMove = (ev: MouseEvent) => {
        if (!dragRef.current.mouseDown) return;
        const { pageY } = ev;
        const delta = Math.abs(pageY - dragRef.current.startY);
        const startThreshold = 6; // pixels to start drag
        const container = containerRef.current;
        if (!container) return;

        if (!dragRef.current.active) {
          if (delta < startThreshold) return;
          // start drag
          dragRef.current.active = true;
          const line = document.createElement("div");
          line.style.position = "absolute";
          line.style.left = "0px";
          line.style.right = "0px";
          line.style.height = "2px";
          line.style.background = "#007bff";
          line.style.zIndex = "9999";
          line.style.pointerEvents = "none";
          container.appendChild(line);
          dragRef.current.lineEl = line;

          // create ghost
          const ghost = document.createElement("div");
          ghost.style.position = "absolute";
          ghost.style.left = "0px";
          ghost.style.width = `${Math.max(
            60,
            contextRef.current.rowHeaderWidth - 8
          )}px`;
          ghost.style.boxSizing = "border-box";
          ghost.style.padding = "6px 8px";
          ghost.style.background = "rgba(0,123,255,0.12)";
          ghost.style.border = "1px solid rgba(0,123,255,0.3)";
          ghost.style.borderRadius = "4px";
          ghost.style.zIndex = "10000";
          ghost.style.pointerEvents = "none";
          ghost.style.display = "flex";
          ghost.style.alignItems = "center";
          ghost.style.fontSize = "13px";
          ghost.style.color = "#034ea2";

          // label/height based on latest selectedLocation
          let ghostHeight = 24;
          let label = "1 row";
          try {
            const { source } = dragRef.current;
            const foundBlock = selectedLocationRef.current.find(
              (s) => s.r1 <= source && source <= s.r2
            );
            if (foundBlock) {
              ghostHeight = Math.max(
                24,
                foundBlock.row - foundBlock.row_pre - 1
              );
              const count = foundBlock.r2 - foundBlock.r1 + 1;
              label = count > 1 ? `${count} rows` : `${foundBlock.r1 + 1} row`;
            } else {
              const coords = rowLocationByIndex(
                dragRef.current.source,
                contextRef.current.visibledatarow
              );
              const h = coords[1] - coords[0] - 1;
              ghostHeight = Math.max(24, h);
              label = `${dragRef.current.source + 1} row`;
            }
          } catch (err) {
            // ignore
          }
          ghost.style.height = `${ghostHeight}px`;
          ghost.textContent = label;
          container.appendChild(ghost);
          dragRef.current.ghostEl = ghost;
        }

        // compute insertion similar to previous implementation
        const _rect = container.getBoundingClientRect();
        const _mouseY = pageY - _rect.top - window.scrollY;
        const _localY = _mouseY + container.scrollTop;
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
        const sheetIndexLocal = getSheetIndex(
          contextRef.current,
          contextRef.current.currentSheetId
        );
        const sheetLocal =
          sheetIndexLocal == null
            ? null
            : contextRef.current.luckysheetfile[sheetIndexLocal];
        const max =
          sheetLocal?.data?.length ?? contextRef.current.visibledatarow.length;
        if (insertion < 0) insertion = 0;
        if (insertion > max) insertion = max;

        const topForLine = yaxis > mid ? row : row_pre;
        if (dragRef.current.lineEl)
          dragRef.current.lineEl.style.top = `${topForLine}px`;
        if (dragRef.current.ghostEl) {
          const ghost = dragRef.current.ghostEl;
          const gh = parseFloat(ghost.style.height || "24");
          const top = _mouseY + container.scrollTop - gh / 2;
          ghost.style.top = `${top}px`;
        }
        if (dragRef.current.lineEl)
          dragRef.current.lineEl.dataset.insertion = String(insertion);
      };

      const onDocUp = () => {
        if (!dragRef.current.mouseDown) return;
        dragRef.current.mouseDown = false;
        const wasActive = dragRef.current.active;

        if (wasActive && dragRef.current.lineEl) {
          const insertion = Number(dragRef.current.lineEl.dataset.insertion);
          const { source } = dragRef.current;
          const sheetIndexLocal = getSheetIndex(
            contextRef.current,
            contextRef.current.currentSheetId
          );
          if (
            sheetIndexLocal != null &&
            source >= 0 &&
            !Number.isNaN(insertion) &&
            insertion >= 0
          ) {
            setContext((draftCtx) => {
              const targetSheet = draftCtx.luckysheetfile[sheetIndexLocal];
              if (!targetSheet || !targetSheet.data) return;
              const arr = targetSheet.data;
              if (source < 0 || source >= arr.length) return;
              let _target = insertion;
              // adjust target relative to source before removal
              if (_target > source) _target -= 1;
              // remove the source first so length/indices reflect the post-removal state
              const [rowData] = arr.splice(source, 1);
              // now clamp target to [0..arr.length] (allow append at the end)
              if (_target < 0) _target = 0;
              if (_target > arr.length) _target = arr.length;
              // if target equals the (post-removal) source, it’s effectively a no-op, but keep it simple:
              arr.splice(_target, 0, rowData);
              targetSheet.data = arr;
              updateContextWithSheetData(draftCtx, targetSheet.data);
            });
          }
        } else {
          const native = dragRef.current.lastNativeEvent;
          if (native) {
            setContext((draftCtx) => {
              handleRowHeaderMouseDown(
                draftCtx,
                refs.globalCache,
                native,
                containerRef.current!,
                refs.cellInput.current!,
                refs.fxInput.current!
              );
            });
          }
        }

        // cleanup DOM and state
        removeDragLine();
        dragRef.current.active = false;
        dragRef.current.mouseDown = false;
        dragRef.current.lastNativeEvent = null;
        dragRef.current.lineEl = null;
        dragRef.current.ghostEl = null;
        dragRef.current.source = -1;

        // remove listeners
        if (dragRef.current.onDocMove)
          document.removeEventListener("mousemove", dragRef.current.onDocMove);
        if (dragRef.current.onDocUp)
          document.removeEventListener("mouseup", dragRef.current.onDocUp);
        dragRef.current.onDocMove = null;
        dragRef.current.onDocUp = null;
      };

      // store and attach
      dragRef.current.onDocMove = onDocMove;
      dragRef.current.onDocUp = onDocUp;
      document.addEventListener("mousemove", onDocMove);
      document.addEventListener("mouseup", onDocUp);

      // do not trigger header selection immediately; defer handling to mouseup
      // so a drag can start without being overridden by selection logic.
    },
    [
      refs.globalCache,
      context.visibledatarow,
      context.currentSheetId,
      setContext,
      removeDragLine,
    ]
  );

  // ensure cleanup on unmount if any listeners remained
  useEffect(() => {
    return () => {
      if (dragRef.current.onDocMove)
        document.removeEventListener("mousemove", dragRef.current.onDocMove);
      if (dragRef.current.onDocUp)
        document.removeEventListener("mouseup", dragRef.current.onDocUp);
      dragRef.current.onDocMove = null;
      dragRef.current.onDocUp = null;
    };
  }, []);

  const onMouseMoveWithDrag = useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      onMouseMove(e);
      // update lastNativeEvent for potential selection use on mouseup
      dragRef.current.lastNativeEvent = e.nativeEvent;
    },
    [onMouseMove]
  );

  // ...existing onMouseLeave, onRowSizeHandleMouseDown, etc. ...

  // replace original onMouseDown usage in returned JSX with onMouseDownWithDrag
  return (
    <div
      ref={containerRef}
      className="fortune-row-header"
      style={{
        width: context.rowHeaderWidth - 1.5,
        height: context.cellmainHeight,
      }}
      // capture-phase handler to preempt other listeners that may create selection
      onMouseDownCapture={onMouseDownWithDrag}
      onMouseMove={onMouseMoveWithDrag}
      onMouseLeave={onMouseLeave}
      onContextMenu={onContextMenu}
    >
      <div
        className="fortune-rows-freeze-handle"
        onMouseDown={onRowFreezeHandleMouseDown}
        style={{
          top: freezeHandleTop,
        }}
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
          key={i}
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
      {/* placeholder to overflow the container, making the container scrollable */}
      <div
        style={{ height: context.rh_height, width: 1 }}
        id="luckysheetrowHeader_0"
        className="luckysheetsheetchange"
      />
    </div>
  );
};

export default RowHeader;
