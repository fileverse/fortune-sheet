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
  showSelected,
  fixPositionOnFrozenCells,
} from "@fileverse-dev/fortune-core";
import { setSelection } from "@fileverse-dev/fortune-core/src/api";
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
import { useRowDragAndDrop } from "./drag_and_drop/row-helpers";

type HoverLoc = { row: number; row_pre: number; row_index: number };
type SelectedLoc = { row: number; row_pre: number; r1: number; r2: number };

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

  const selectedLocationRef = useRef(selectedLocation);
  useEffect(() => {
    selectedLocationRef.current = selectedLocation;
  }, [selectedLocation]);

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

  const { initiateDrag, getRowIndexClicked, isRowDoubleClicked } =
    useRowDragAndDrop(containerRef, selectedLocationRef);

  const onMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      // @ts-expect-error
      if ((e.button === 0 && e.target.tagName === "use") || e.button === 2) {
        const { nativeEvent } = e;
        setContext((draft) => {
          handleRowHeaderMouseDown(
            draft,
            refs.globalCache,
            nativeEvent,
            containerRef.current!,
            refs.cellInput.current!,
            refs.fxInput.current!
          );
        });
      }
      if (e.button !== 0 || context.isFlvReadOnly) return; // left button only
      const targetEl = e.target as HTMLElement;
      if (
        targetEl.closest(".fortune-rows-change-size") ||
        targetEl.closest(".fortune-rows-freeze-handle")
      )
        return;

      const headerEl = containerRef.current;
      if (!headerEl) return;

      const clickedRowIndex = getRowIndexClicked(e.pageY, headerEl);
      if (clickedRowIndex < 0) return;

      if (isRowDoubleClicked(clickedRowIndex)) {
        setContext((draft) => {
          draft.luckysheet_scroll_status = true;
        });
      } else {
        const { nativeEvent } = e;
        setContext((draft) => {
          handleRowHeaderMouseDown(
            draft,
            refs.globalCache,
            nativeEvent,
            containerRef.current!,
            refs.cellInput.current!,
            refs.fxInput.current!
          );
        });
        return;
      }

      // handle drag and drop
      e.preventDefault();
      e.stopPropagation();
      initiateDrag(clickedRowIndex, e.pageY);
    },
    [
      refs.globalCache,
      context.visibledatarow,
      context.currentSheetId,
      setContext,
    ]
  );

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

  useEffect(() => {
    const s = context.luckysheet_select_save || [];
    if (_.isNil(s)) return;
    setSelectedLocation([]);
    if (s[0]?.column_select) return;

    let rowTitleMap = {};
    for (let i = 0; i < s.length; i += 1) {
      const r1 = s[i].row[0];
      const r2 = s[i].row[1];
      rowTitleMap = selectTitlesMap(rowTitleMap, r1, r2);
    }
    const rowTitleRange = selectTitlesRange(rowTitleMap);
    const selects = [];
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

  const [hiddenPointers, setHiddenPointers] = useState([]);

  useEffect(() => {
    if (sheetIndex == null) return;

    const tempPointers: any = [];
    const rowhidden = context.luckysheetfile[sheetIndex]?.config?.rowhidden;

    if (rowhidden) {
      Object.keys(rowhidden).forEach((key) => {
        const item = { row: key, top: context.visibledatarow[Number(key) - 1] };
        tempPointers.push(item);
      });
      setHiddenPointers(tempPointers);
    } else {
      setHiddenPointers([]);
    }
  }, [context.visibledatarow, sheetIndex]);

  const showRow = (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>,
    item: any
  ) => {
    if (context.isFlvReadOnly) return;
    e.stopPropagation();
    setContext((ctx) => {
      setSelection(
        ctx,
        [
          {
            row: [Number(item.row) - 1, Number(item.row) + 1],
            column: [0, context.visibledatacolumn?.length],
          },
        ],
        {
          id: context.currentSheetId,
        }
      );
    });
    setContext((ctx) => {
      showSelected(ctx, "row");
    });
  };

  useEffect(() => {
    containerRef.current!.scrollTop = context.scrollTop;
  }, [context.scrollTop]);

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
      {hiddenPointers.map((item: any) => {
        return (
          <div
            className="flex flex-col gap-4 cursor-pointer align-center hide-btn-row hide-btn"
            style={{
              top: `${item.top - 16}px`,
              zIndex: 100,
            }}
            onClick={(e) => showRow(e, item)}
          >
            <div className="rotate-row-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="5"
                height="8"
                viewBox="0 0 5 8"
                fill="none"
              >
                <path
                  d="M0.164574 4.20629L3.54376 7.58548C3.7275 7.76922 4.04167 7.63909 4.04167 7.37924L4.04167 0.620865C4.04167 0.361018 3.7275 0.230885 3.54376 0.414625L0.164575 3.79381C0.0506717 3.90772 0.0506715 4.09239 0.164574 4.20629Z"
                  fill="#363B3F"
                />
              </svg>
            </div>
            <div className="rotate-90">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="5"
                height="8"
                viewBox="0 0 5 8"
                fill="none"
              >
                <path
                  d="M0.164574 4.20629L3.54376 7.58548C3.7275 7.76922 4.04167 7.63909 4.04167 7.37924L4.04167 0.620865C4.04167 0.361018 3.7275 0.230885 3.54376 0.414625L0.164575 3.79381C0.0506717 3.90772 0.0506715 4.09239 0.164574 4.20629Z"
                  fill="#363B3F"
                />
              </svg>
            </div>
          </div>
        );
      })}
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
