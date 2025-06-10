import {
  locale,
  handleCopy,
  handlePasteByClick,
  deleteRowCol,
  insertRowCol,
  removeActiveImage,
  deleteSelectedCellText,
  sortSelection,
  createFilter,
  showImgChooser,
  handleLink,
  hideSelected,
  showSelected,
  getSheetIndex,
  api,
  isAllowEdit,
  jfrefreshgrid,
  newComment,
  getFreezeState,
  toggleFreeze,
  clearFilter,
} from "@fileverse-dev/fortune-core";
import _ from "lodash";
import React, { useContext, useRef, useCallback, useLayoutEffect } from "react";
import regeneratorRuntime from "regenerator-runtime";
import Tippy from "@tippyjs/react";
import { SplitColumn } from "../SplitColumn";
import DataVerification from "../DataVerification";
import WorkbookContext, { SetContextOptions } from "../../context";
import { useAlert } from "../../hooks/useAlert";
import { useDialog } from "../../hooks/useDialog";
import Divider from "./Divider";
import "./index.css";
import Menu from "./Menu";
// import CustomSort from "../CustomSort";
import SVGIcon from "../SVGIcon";
import "tippy.js/dist/tippy.css";
import ConditionalFormat from "../ConditionFormat";

const ContextMenu: React.FC = () => {
  const { showDialog } = useDialog();
  const containerRef = useRef<HTMLDivElement>(null);
  const { context, setContext, settings, refs } = useContext(WorkbookContext);
  const { contextMenu } = context;
  const { showAlert } = useAlert();
  const { rightclick, drag, generalDialog, info, toolbar, splitText } =
    locale(context);

  const getMenuElement = useCallback(
    (name: string, i: number) => {
      const selection = context.luckysheet_select_save?.[0];
      if (name === "|") {
        return <Divider key={`divider-${i}`} />;
      }
      if (name === "split-text") {
        return (
          <Menu
            key="split-text"
            onClick={() => {
              if (context.allowEdit === false) return;
              if (_.isUndefined(context.luckysheet_select_save)) {
                showDialog(splitText.tipNoSelect, "ok");
              } else {
                const currentColumn =
                  context.luckysheet_select_save[
                    context.luckysheet_select_save.length - 1
                  ].column;
                if (context.luckysheet_select_save.length > 1) {
                  showDialog(splitText.tipNoMulti, "ok");
                } else if (currentColumn[0] !== currentColumn[1]) {
                  showDialog(splitText.tipNoMultiColumn, "ok");
                } else {
                  showDialog(
                    <SplitColumn />,
                    undefined,
                    "Split text to columns"
                  );
                }
              }
              setContext((draftCtx) => {
                draftCtx.contextMenu = {};
              });
            }}
          >
            <div className="context-item">
              <SVGIcon
                name="split-flv"
                width={16}
                height={16}
                style={{ marginTop: "4px", marginRight: "4px" }}
              />
              Split text to columns
            </div>
          </Menu>
        );
      }
      if (name === "freeze-row") {
        const freezeState = getFreezeState(context);
        const isFrozen = freezeState.isRowFrozen;
        const isEntireRowSelected = selection?.row_select === true;

        if (!isEntireRowSelected) return null;

        return (
          <Menu
            key="freeze-row"
            onClick={() => {
              setContext((draftCtx) => {
                if (isFrozen) {
                  toggleFreeze(draftCtx, "unfreeze-row");
                } else {
                  toggleFreeze(draftCtx, "row");
                }
                draftCtx.contextMenu = {};
              });
            }}
          >
            <div className="context-item">
              <SVGIcon
                name="freeze-flv"
                width={16}
                height={16}
                style={{ marginTop: "4px", marginRight: "4px" }}
              />
              {isFrozen ? "Unfreeze row" : "Freeze to current row"}
            </div>
          </Menu>
        );
      }

      if (name === "freeze-column") {
        const freezeState = getFreezeState(context);
        const isFrozen = freezeState.isColFrozen;
        const isEntireColumnSelected = selection?.column_select === true;

        if (!isEntireColumnSelected) return null;

        return (
          <Menu
            key="freeze-column"
            onClick={() => {
              setContext((draftCtx) => {
                if (isFrozen) {
                  toggleFreeze(draftCtx, "unfreeze-column");
                } else {
                  toggleFreeze(draftCtx, "column");
                  // Force a refresh of the grid after freezing
                  jfrefreshgrid(draftCtx, null, undefined, false);
                }
                draftCtx.contextMenu = {};
              });
            }}
          >
            <div className="context-item">
              <SVGIcon
                name="freeze-flv"
                width={18}
                height={18}
                style={{ marginTop: "4px", marginRight: "4px" }}
              />
              <p>{isFrozen ? "Unfreeze column" : "Freeze to current column"}</p>
            </div>
          </Menu>
        );
      }
      if (name === "comment") {
        return (
          <Menu
            key={name}
            onClick={() => {
              setContext((draftCtx) => {
                newComment(
                  draftCtx,
                  refs.globalCache,
                  selection?.row_focus!,
                  selection?.column_focus!
                );
                draftCtx.contextMenu = {};
              });
            }}
          >
            <div className="context-item">
              <SVGIcon
                name="comment-flv"
                width={18}
                height={18}
                style={{ marginTop: "4px", marginRight: "4px" }}
              />
              <p>Comment</p>
            </div>
          </Menu>
        );
      }
      if (name === "dataVerification") {
        return (
          <Menu
            key={name}
            onClick={() => {
              if (context.allowEdit === false) return;
              setContext((draftCtx) => {
                draftCtx.contextMenu = {};
              });
              showDialog(
                <DataVerification />,
                undefined,
                toolbar.dataVerification
              );
            }}
          >
            <div className="context-item">
              <SVGIcon name="dataVerification" style={{ marginRight: "4px" }} />
              <p>Data Verification</p>
            </div>
          </Menu>
        );
      }
      if (name === "searchReplace") {
        return (
          <Menu
            key={name}
            onClick={() => {
              if (context.allowEdit === false) return;
              setContext((draftCtx) => {
                draftCtx.showSearch = true;
                draftCtx.showReplace = true;
                draftCtx.contextMenu = {};
              });
            }}
          >
            <div className="context-item">
              <SVGIcon name="search" style={{ marginRight: "4px" }} />
              <p>Find and Replace</p>
            </div>
          </Menu>
        );
      }
      if (name === "copy") {
        return (
          <Menu
            key={name}
            onClick={() => {
              setContext((draftCtx) => {
                if (draftCtx.luckysheet_select_save?.length! > 1) {
                  showAlert(rightclick.noMulti, "ok");
                  draftCtx.contextMenu = {};
                  return;
                }
                handleCopy(draftCtx);
                draftCtx.contextMenu = {};
              });
            }}
          >
            <div className="context-item">
              <SVGIcon
                name="copy-flv"
                width={22}
                height={22}
                style={{ marginTop: "4px" }}
              />
              <p>{rightclick.copy}</p>
            </div>
          </Menu>
        );
      }
      if (name === "cut") {
        return (
          <Menu
            key={name}
            onClick={() => {
              setContext((draftCtx) => {
                if (draftCtx.luckysheet_select_save?.length! > 1) {
                  showAlert(rightclick.noMulti, "ok");
                  draftCtx.contextMenu = {};
                  return;
                }
                handleCopy(draftCtx);

                if (draftCtx.activeImg != null) {
                  removeActiveImage(draftCtx);
                } else {
                  const msg = deleteSelectedCellText(draftCtx);
                  if (msg === "partMC") {
                    showDialog(generalDialog.partiallyError, "ok");
                  } else if (msg === "allowEdit") {
                    showDialog(generalDialog.readOnlyError, "ok");
                  } else if (msg === "dataNullError") {
                    showDialog(generalDialog.dataNullError, "ok");
                  }
                }
                jfrefreshgrid(draftCtx, null, undefined);

                draftCtx.contextMenu = {};
              });
            }}
          >
            <div className="context-item">
              <SVGIcon
                name="cut-flv"
                width={18}
                height={18}
                style={{ marginRight: "8px" }}
              />
              <p>Cut</p>
            </div>
          </Menu>
        );
      }
      if (name === "paste" && regeneratorRuntime) {
        return (
          <Menu
            key={name}
            onClick={async () => {
              const clipboardText = await navigator.clipboard.readText();
              setContext((draftCtx) => {
                handlePasteByClick(draftCtx, clipboardText);
                draftCtx.contextMenu = {};
              });
            }}
          >
            <div className="context-item">
              <SVGIcon
                name="paste-flv"
                width={16}
                height={16}
                style={{ marginRight: "8px" }}
              />
              <p>{rightclick.paste}</p>
            </div>
          </Menu>
        );
      }
      if (name === "insert-column") {
        return selection?.row_select
          ? null
          : ["left"].map((dir) => (
              <Menu
                key={`add-col-${dir}`}
                onClick={() => {
                  const position =
                    context.luckysheet_select_save?.[0]?.column?.[0];
                  if (position == null) return;
                  // const countStr = (e.target as HTMLDivElement).querySelector(
                  //   "input"
                  // )?.value;
                  // if (countStr == null) return;
                  // const count = parseInt(countStr, 10);
                  const count = 1;
                  if (count < 1) return;
                  const direction = dir === "left" ? "lefttop" : "rightbottom";
                  const insertRowColOp: SetContextOptions["insertRowColOp"] = {
                    type: "column",
                    index: position,
                    count,
                    direction,
                    id: context.currentSheetId,
                  };
                  setContext(
                    (draftCtx) => {
                      try {
                        insertRowCol(draftCtx, insertRowColOp);
                        draftCtx.contextMenu = {};
                      } catch (err: any) {
                        if (err.message === "maxExceeded")
                          showAlert(rightclick.columnOverLimit, "ok");
                        else if (err.message === "readOnly")
                          showAlert(
                            rightclick.cannotInsertOnColumnReadOnly,
                            "ok"
                          );
                        draftCtx.contextMenu = {};
                      }
                    },
                    {
                      insertRowColOp,
                    }
                  );
                }}
              >
                <>
                  <SVGIcon name="insert-flv" width={18} height={18} />
                  <div>
                    Insert column to the left
                    {/* {_.startsWith(context.lang ?? "", "zh") && (
                      <>
                        {rightclick.to}
                        <span className={`luckysheet-cols-rows-shift-${dir}`}>
                          {(rightclick as any)[dir]}
                        </span>
                      </>
                    )}
                    {`${rightclick.insert}  `} */}
                    {/* <input
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                  tabIndex={0}
                  type="text"
                  className="luckysheet-mousedown-cancel"
                  placeholder={rightclick.number}
                  defaultValue="1"
                /> */}
                    {/* 1
                    <span className="luckysheet-cols-rows-shift-word luckysheet-mousedown-cancel">
                      {` ${rightclick.column}  `}
                    </span>
                    {!_.startsWith(context.lang ?? "", "zh") && (
                      <span className={`luckysheet-cols-rows-shift-${dir}`}>
                        {(rightclick as any)[dir]}
                      </span>
                    )} */}
                  </div>
                </>
              </Menu>
            ));
      }
      if (name === "insert-row") {
        return selection?.column_select
          ? null
          : ["bottom"].map((dir) => (
              <Menu
                key={`add-row-${dir}`}
                onClick={() => {
                  const position =
                    context.luckysheet_select_save?.[0]?.row?.[0];
                  if (position == null) return;
                  // const countStr = container.querySelector("input")?.value;
                  // if (countStr == null) return;
                  const count = 1;
                  // const count = parseInt(countStr, 10);
                  if (count < 1) return;
                  const direction = dir === "top" ? "lefttop" : "rightbottom";
                  const insertRowColOp: SetContextOptions["insertRowColOp"] = {
                    type: "row",
                    index: position,
                    count,
                    direction,
                    id: context.currentSheetId,
                  };
                  setContext(
                    (draftCtx) => {
                      try {
                        insertRowCol(draftCtx, insertRowColOp);
                        draftCtx.contextMenu = {};
                      } catch (err: any) {
                        if (err.message === "maxExceeded")
                          showAlert(rightclick.rowOverLimit, "ok");
                        else if (err.message === "readOnly")
                          showAlert(rightclick.cannotInsertOnRowReadOnly, "ok");
                        draftCtx.contextMenu = {};
                      }
                    },
                    { insertRowColOp }
                  );
                }}
              >
                <>
                  <SVGIcon name="insert-flv" width={18} height={18} />
                  <div>
                    Insert row below
                    {/* {_.startsWith(context.lang ?? "", "zh") && (
                      <>
                        {rightclick.to}
                        <span className={`luckysheet-cols-rows-shift-${dir}`}>
                          {(rightclick as any)[dir]}
                        </span>
                      </>
                    )}
                    {`${rightclick.insert}  `}1 */}
                    {/* <input
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                  tabIndex={0}
                  type="text"
                  className="luckysheet-mousedown-cancel"
                  placeholder={rightclick.number}
                  defaultValue="1"
                /> */}
                    {/* <span className="luckysheet-cols-rows-shift-word luckysheet-mousedown-cancel">
                      {` ${rightclick.row}  `}
                    </span>
                    {!_.startsWith(context.lang ?? "", "zh") && (
                      <span className={`luckysheet-cols-rows-shift-${dir}`}>
                        {(rightclick as any)[dir]}
                      </span>
                    )} */}
                  </div>
                </>
              </Menu>
            ));
      }
      if (name === "delete-column") {
        return (
          selection?.column_select && (
            <Menu
              key="delete-col"
              onClick={() => {
                if (!selection) return;
                const [st_index, ed_index] = selection.column;
                const deleteRowColOp: SetContextOptions["deleteRowColOp"] = {
                  type: "column",
                  start: st_index,
                  end: ed_index,
                  id: context.currentSheetId,
                };
                setContext(
                  (draftCtx) => {
                    if (draftCtx.luckysheet_select_save?.length! > 1) {
                      showAlert(rightclick.noMulti, "ok");
                      draftCtx.contextMenu = {};
                      draftCtx.dataVerificationDropDownList = false;
                      return;
                    }
                    const slen = ed_index - st_index + 1;
                    const index = getSheetIndex(
                      draftCtx,
                      context.currentSheetId
                    ) as number;
                    if (
                      draftCtx.luckysheetfile[index].data?.[0]?.length! <= slen
                    ) {
                      showAlert(rightclick.cannotDeleteAllColumn, "ok");
                      draftCtx.contextMenu = {};
                      return;
                    }
                    try {
                      deleteRowCol(draftCtx, deleteRowColOp);
                    } catch (e: any) {
                      if (e.message === "readOnly") {
                        showAlert(rightclick.cannotDeleteColumnReadOnly, "ok");
                      }
                    }
                    draftCtx.contextMenu = {};
                  },
                  { deleteRowColOp }
                );
              }}
            >
              <div className="context-item">
                <SVGIcon
                  name="delete-flv"
                  width={18}
                  height={18}
                  style={{ marginRight: "8px" }}
                />
                <div>
                  {rightclick.deleteSelected}
                  {rightclick.column}
                </div>
              </div>
            </Menu>
          )
        );
      }
      if (name === "cell-delete-column") {
        return (
          !selection?.row_select && (
            <Menu
              key="cell-delete-col"
              onClick={() => {
                if (!selection) return;
                const [st_index, ed_index] = selection.column;
                const deleteRowColOp: SetContextOptions["deleteRowColOp"] = {
                  type: "column",
                  start: st_index,
                  end: ed_index,
                  id: context.currentSheetId,
                };
                setContext(
                  (draftCtx) => {
                    if (draftCtx.luckysheet_select_save?.length! > 1) {
                      showAlert(rightclick.noMulti, "ok");
                      draftCtx.contextMenu = {};
                      draftCtx.dataVerificationDropDownList = false;
                      return;
                    }
                    const slen = ed_index - st_index + 1;
                    const index = getSheetIndex(
                      draftCtx,
                      context.currentSheetId
                    ) as number;
                    if (
                      draftCtx.luckysheetfile[index].data?.[0]?.length! <= slen
                    ) {
                      showAlert(rightclick.cannotDeleteAllColumn, "ok");
                      draftCtx.contextMenu = {};
                      return;
                    }
                    try {
                      deleteRowCol(draftCtx, deleteRowColOp);
                    } catch (e: any) {
                      if (e.message === "readOnly") {
                        showAlert(rightclick.cannotDeleteColumnReadOnly, "ok");
                      }
                    }
                    draftCtx.contextMenu = {};
                  },
                  { deleteRowColOp }
                );
              }}
            >
              <div className="context-item">
                <SVGIcon
                  name="delete-flv"
                  width={18}
                  height={18}
                  style={{ marginRight: "8px" }}
                />
                <div>
                  {rightclick.deleteSelected}
                  {rightclick.column}
                </div>
              </div>
            </Menu>
          )
        );
      }
      if (name === "delete-row") {
        return (
          selection?.row_select && (
            <Menu
              key="delete-row"
              onClick={() => {
                if (!selection) return;
                const [st_index, ed_index] = selection.row;
                const deleteRowColOp: SetContextOptions["deleteRowColOp"] = {
                  type: "row",
                  start: st_index,
                  end: ed_index,
                  id: context.currentSheetId,
                };
                setContext(
                  (draftCtx) => {
                    if (draftCtx.luckysheet_select_save?.length! > 1) {
                      showAlert(rightclick.noMulti, "ok");
                      draftCtx.contextMenu = {};
                      return;
                    }
                    const slen = ed_index - st_index + 1;
                    const index = getSheetIndex(
                      draftCtx,
                      context.currentSheetId
                    ) as number;
                    if (draftCtx.luckysheetfile[index].data?.length! <= slen) {
                      showAlert(rightclick.cannotDeleteAllRow, "ok");
                      draftCtx.contextMenu = {};
                      return;
                    }
                    try {
                      deleteRowCol(draftCtx, deleteRowColOp);
                    } catch (e: any) {
                      if (e.message === "readOnly") {
                        showAlert(rightclick.cannotDeleteRowReadOnly, "ok");
                      }
                    }
                    draftCtx.contextMenu = {};
                  },
                  { deleteRowColOp }
                );
              }}
            >
              <div className="context-item">
                <SVGIcon
                  name="delete-flv"
                  width={18}
                  height={18}
                  style={{ marginRight: "8px" }}
                />
                <div>
                  {rightclick.deleteSelected}
                  {rightclick.row}
                </div>
              </div>
            </Menu>
          )
        );
      }
      if (name === "cell-delete-row") {
        return (
          !selection?.column_select && (
            <Menu
              key="cell-delete-row"
              onClick={() => {
                if (!selection) return;
                const [st_index, ed_index] = selection.row;
                const deleteRowColOp: SetContextOptions["deleteRowColOp"] = {
                  type: "row",
                  start: st_index,
                  end: ed_index,
                  id: context.currentSheetId,
                };
                setContext(
                  (draftCtx) => {
                    if (draftCtx.luckysheet_select_save?.length! > 1) {
                      showAlert(rightclick.noMulti, "ok");
                      draftCtx.contextMenu = {};
                      return;
                    }
                    const slen = ed_index - st_index + 1;
                    const index = getSheetIndex(
                      draftCtx,
                      context.currentSheetId
                    ) as number;
                    if (draftCtx.luckysheetfile[index].data?.length! <= slen) {
                      showAlert(rightclick.cannotDeleteAllRow, "ok");
                      draftCtx.contextMenu = {};
                      return;
                    }
                    try {
                      deleteRowCol(draftCtx, deleteRowColOp);
                    } catch (e: any) {
                      if (e.message === "readOnly") {
                        showAlert(rightclick.cannotDeleteRowReadOnly, "ok");
                      }
                    }
                    draftCtx.contextMenu = {};
                  },
                  { deleteRowColOp }
                );
              }}
            >
              <div className="context-item">
                <SVGIcon
                  name="delete-flv"
                  width={18}
                  height={18}
                  style={{ marginRight: "8px" }}
                />
                <div>
                  {rightclick.deleteSelected}
                  {rightclick.row}
                </div>
              </div>
            </Menu>
          )
        );
      }
      if (name === "hide-row") {
        return (
          selection?.row_select === true &&
          ["hideSelected", "showHide"].map((item) => (
            <Menu
              key={item}
              onClick={() => {
                setContext((draftCtx) => {
                  let msg = "";
                  if (item === "hideSelected") {
                    msg = hideSelected(draftCtx, "row");
                  } else if (item === "showHide") {
                    showSelected(draftCtx, "row");
                  }
                  if (msg === "noMulti") {
                    showDialog(drag.noMulti);
                  }
                  draftCtx.contextMenu = {};
                });
              }}
            >
              <div className="context-item">
                <SVGIcon
                  name="hide-flv"
                  width={18}
                  height={18}
                  style={{ marginRight: "8px" }}
                />
                <div>{(rightclick as any)[item] + rightclick.row}</div>
              </div>
            </Menu>
          ))
        );
      }
      if (name === "hide-column") {
        return (
          selection?.column_select === true &&
          ["hideSelected", "showHide"].map((item) => (
            <Menu
              key={item}
              onClick={() => {
                setContext((draftCtx) => {
                  let msg = "";
                  if (item === "hideSelected") {
                    msg = hideSelected(draftCtx, "column");
                  } else if (item === "showHide") {
                    showSelected(draftCtx, "column");
                  }
                  if (msg === "noMulti") {
                    showDialog(drag.noMulti);
                  }
                  draftCtx.contextMenu = {};
                });
              }}
            >
              <div className="context-item">
                <SVGIcon
                  name="hide-flv"
                  width={18}
                  height={18}
                  style={{ marginRight: "8px" }}
                />
                <div>{(rightclick as any)[item] + rightclick.column}</div>
              </div>
            </Menu>
          ))
        );
      }
      if (name === "set-row-height") {
        const rowHeight = selection?.height || context.defaultrowlen;
        const shownRowHeight = context.luckysheet_select_save?.some(
          (section) =>
            section.height_move !==
            (rowHeight + 1) * (section.row[1] - section.row[0] + 1) - 1
        )
          ? ""
          : rowHeight;
        return context.luckysheet_select_save?.some(
          (section) => section.row_select
        ) ? (
          <Menu
            key="set-row-height"
            onClick={(e, container) => {
              const targetRowHeight = container.querySelector("input")?.value;
              setContext((draftCtx) => {
                if (
                  _.isUndefined(targetRowHeight) ||
                  targetRowHeight === "" ||
                  parseInt(targetRowHeight, 10) <= 0 ||
                  parseInt(targetRowHeight, 10) > 545
                ) {
                  showAlert(info.tipRowHeightLimit, "ok");
                  draftCtx.contextMenu = {};
                  return;
                }
                const numRowHeight = parseInt(targetRowHeight, 10);
                const rowHeightList: Record<string, number> = {};
                _.forEach(draftCtx.luckysheet_select_save, (section) => {
                  for (
                    let rowNum = section.row[0];
                    rowNum <= section.row[1];
                    rowNum += 1
                  ) {
                    rowHeightList[rowNum] = numRowHeight;
                  }
                });
                api.setRowHeight(draftCtx, rowHeightList, {}, true);
                draftCtx.contextMenu = {};
              });
            }}
          >
            <div className="context-item">
              <SVGIcon
                name="resize-flv"
                width={18}
                height={18}
                style={{ marginRight: "8px" }}
              />
              <div>
                Resize row height
                {/* {rightclick.row + ""}
                  {rightclick.height} */}
                <input
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                  tabIndex={0}
                  type="number"
                  min={1}
                  max={545}
                  className="luckysheet-mousedown-cancel"
                  placeholder={rightclick.number}
                  defaultValue={shownRowHeight}
                  style={{ width: "40px" }}
                />
                px
              </div>
            </div>
          </Menu>
        ) : null;
      }
      if (name === "set-column-width") {
        const colWidth = selection?.width || context.defaultcollen;
        const shownColWidth = context.luckysheet_select_save?.some(
          (section) =>
            section.width_move !==
            (colWidth + 1) * (section.column[1] - section.column[0] + 1) - 1
        )
          ? ""
          : colWidth;
        return context.luckysheet_select_save?.some(
          (section) => section.column_select
        ) ? (
          <Menu
            key="set-column-width"
            onClick={(e, container) => {
              const targetColWidth = container.querySelector("input")?.value;
              setContext((draftCtx) => {
                if (
                  _.isUndefined(targetColWidth) ||
                  targetColWidth === "" ||
                  parseInt(targetColWidth, 10) <= 0 ||
                  parseInt(targetColWidth, 10) > 2038
                ) {
                  showAlert(info.tipColumnWidthLimit, "ok");
                  draftCtx.contextMenu = {};
                  return;
                }
                const numColWidth = parseInt(targetColWidth, 10);
                const colWidthList: Record<string, number> = {};
                _.forEach(draftCtx.luckysheet_select_save, (section) => {
                  for (
                    let colNum = section.column[0];
                    colNum <= section.column[1];
                    colNum += 1
                  ) {
                    colWidthList[colNum] = numColWidth;
                  }
                });
                api.setColumnWidth(draftCtx, colWidthList, {}, true);
                draftCtx.contextMenu = {};
              });
            }}
          >
            <div className="context-item">
              <SVGIcon
                name="resize-flv"
                width={18}
                height={18}
                style={{ marginRight: "8px" }}
              />
              <div>
                Resize column height
                {/* {rightclick.row + ""}
                  {rightclick.height} */}
                <input
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                  tabIndex={0}
                  type="number"
                  min={1}
                  max={545}
                  className="luckysheet-mousedown-cancel"
                  placeholder={rightclick.number}
                  defaultValue={shownColWidth}
                  style={{ width: "40px" }}
                />
                px
              </div>
            </div>
          </Menu>
        ) : null;
      }
      if (name === "clear") {
        return (
          <Menu
            key={name}
            onClick={() => {
              setContext((draftCtx) => {
                const allowEdit = isAllowEdit(draftCtx);
                if (!allowEdit) return;
                if (draftCtx.activeImg != null) {
                  removeActiveImage(draftCtx);
                } else {
                  const msg = deleteSelectedCellText(draftCtx);
                  if (msg === "partMC") {
                    showDialog(generalDialog.partiallyError, "ok");
                  } else if (msg === "allowEdit") {
                    showDialog(generalDialog.readOnlyError, "ok");
                  } else if (msg === "dataNullError") {
                    showDialog(generalDialog.dataNullError, "ok");
                  }
                }
                draftCtx.contextMenu = {};
                jfrefreshgrid(draftCtx, null, undefined);
              });
            }}
          >
            <div className="context-item">
              <SVGIcon
                name="clear-flv"
                width={18}
                height={18}
                style={{ marginRight: "8px" }}
              />
              <p>{rightclick.clearContent}</p>
            </div>
          </Menu>
        );
      }
      if (name === "ascSort") {
        return (
          <Menu
            key={name}
            onClick={() => {
              if (context.allowEdit === false) return;
              setContext((draftCtx) => {
                sortSelection(draftCtx, true);
                draftCtx.contextMenu = {};
                draftCtx.contextMenu = {};
              });
              // showDialog(
              //   <DataVerification />,
              //   undefined,
              //   toolbar.dataVerification
              // );
            }}
          >
            <div className="context-item">
              <SVGIcon
                name="asc-sort-flv"
                width={18}
                height={18}
                style={{ marginTop: "4px", marginRight: "8px" }}
              />
              <p>Ascending sort</p>
            </div>
          </Menu>
        );
      }
      if (name === "desSort") {
        return (
          <Menu
            key={name}
            onClick={() => {
              if (context.allowEdit === false) return;
              setContext((draftCtx) => {
                sortSelection(draftCtx, false);
                draftCtx.contextMenu = {};
                draftCtx.contextMenu = {};
              });
              // showDialog(
              //   <DataVerification />,
              //   undefined,
              //   toolbar.dataVerification
              // );
            }}
          >
            <div className="context-item">
              <SVGIcon
                name="des-sort-flv"
                width={18}
                height={18}
                style={{ marginTop: "4px", marginRight: "8px" }}
              />
              <p>Descending sort</p>
            </div>
          </Menu>
        );
      }
      if (name === "sort") {
        const { sort } = locale(context);
        return (
          <Tippy
            key={name}
            placement="right-start"
            interactive
            interactiveBorder={50}
            offset={[0, 0]}
            arrow={false}
            zIndex={3000}
            appendTo={document.body}
            content={
              <div
                className="fortune-toolbar-select"
                style={{ minWidth: "11.25rem" }}
              >
                <div className="flex flex-col color-text-default text-body-sm">
                  <Menu
                    onClick={() => {
                      setContext((draftCtx) => {
                        sortSelection(draftCtx, true);
                        draftCtx.contextMenu = {};
                      });
                    }}
                  >
                    <div
                      className="context-item p-2 w-full"
                      style={{ height: "40px" }}
                    >
                      <SVGIcon
                        name="sort-asc"
                        width={24}
                        height={18}
                        style={{ marginRight: "4px" }}
                      />
                      <p>{sort.asc}</p>
                    </div>
                  </Menu>
                  <Menu
                    onClick={() => {
                      setContext((draftCtx) => {
                        sortSelection(draftCtx, false);
                        draftCtx.contextMenu = {};
                      });
                    }}
                  >
                    <div
                      className="context-item p-2 w-full"
                      style={{ height: "40px" }}
                    >
                      <SVGIcon
                        name="sort-desc"
                        width={24}
                        height={18}
                        style={{ marginRight: "4px" }}
                      />
                      <p>{sort.desc}</p>
                    </div>
                  </Menu>
                  {/* <Menu
                    onClick={() => {
                      setContext((draftCtx) => {
                        showDialog(<CustomSort />);
                        draftCtx.contextMenu = {};
                      });
                    }}
                  >
                    <div
                      className="context-item p-2 w-full"
                      style={{ height: "40px" }}
                    >
                      <SVGIcon
                        name="sort"
                        width={22}
                        style={{ marginRight: "4px" }}
                      />
                      <p>{sort.custom}</p>
                    </div>
                  </Menu> */}
                </div>
              </div>
            }
            trigger="mouseenter focus"
            hideOnClick={false}
          >
            <div>
              <Menu>
                <div className="flex items-center justify-between w-full">
                  <div className="context-item">
                    <SVGIcon
                      name="sort-flv"
                      width={18}
                      height={18}
                      style={{ marginRight: "8px" }}
                    />
                    <p>{rightclick.sortSelection}</p>
                  </div>
                  <SVGIcon name="rightArrow" width={18} />
                </div>
              </Menu>
            </div>
          </Tippy>
        );
      }
      if (name === "filter") {
        const { filter } = locale(context);
        return (
          <Tippy
            key={name}
            placement="right-start"
            interactive
            interactiveBorder={50}
            offset={[0, 0]}
            arrow={false}
            zIndex={3000}
            appendTo={document.body}
            content={
              <div
                className="fortune-toolbar-select"
                style={{ minWidth: "11.25rem" }}
              >
                <div className="flex flex-col color-text-default text-body-sm">
                  <Menu
                    onClick={() => {
                      setContext((draftCtx) => {
                        createFilter(draftCtx);
                        draftCtx.contextMenu = {};
                      });
                    }}
                  >
                    <div
                      className="context-item p-2 w-full"
                      style={{ height: "40px" }}
                    >
                      <SVGIcon
                        name="filter"
                        width={24}
                        style={{ marginRight: "4px" }}
                      />
                      <p>{filter.filter}</p>
                    </div>
                  </Menu>
                  <Menu
                    onClick={() => {
                      setContext((draftCtx) => {
                        clearFilter(draftCtx);
                        draftCtx.contextMenu = {};
                      });
                    }}
                  >
                    <div
                      className="context-item p-2 w-full"
                      style={{ height: "40px" }}
                    >
                      <SVGIcon
                        name="eraser"
                        width={24}
                        height={22}
                        style={{ marginRight: "4px", marginLeft: "2px" }}
                      />
                      <p>{filter.clearFilter}</p>
                    </div>
                  </Menu>
                </div>
              </div>
            }
            trigger="mouseenter focus"
            hideOnClick={false}
          >
            <div>
              <Menu>
                <div className="flex items-center justify-between w-full">
                  <div className="context-item">
                    <SVGIcon
                      name="filter"
                      width={24}
                      style={{ marginRight: "4px" }}
                    />
                    <p>{rightclick.filterSelection}</p>
                  </div>
                  <SVGIcon name="rightArrow" width={18} />
                </div>
              </Menu>
            </div>
          </Tippy>
        );
      }
      if (name === "image") {
        return (
          <Menu
            key={name}
            onClick={() => {
              setContext((draftCtx) => {
                showImgChooser();
                draftCtx.contextMenu = {};
              });
            }}
          >
            {rightclick.image}
          </Menu>
        );
      }
      if (name === "link") {
        return (
          <Menu
            key={name}
            onClick={() => {
              setContext((draftCtx) => {
                handleLink(draftCtx);
                draftCtx.contextMenu = {};
              });
            }}
          >
            <div className="context-item">
              <SVGIcon name="link" style={{ marginRight: "4px" }} />
              <p>{rightclick.link}</p>
            </div>
          </Menu>
        );
      }
      if (name === "conditionFormat") {
        // Helper to close context menu
        const closeContextMenu = () =>
          setContext((ctx) => {
            ctx.contextMenu = {};
          });
        return (
          <Tippy
            key={name}
            placement="right-start"
            interactive
            interactiveBorder={50}
            offset={[0, 0]}
            arrow={false}
            zIndex={3000}
            appendTo={document.body}
            content={
              <div style={{ minWidth: 220 }}>
                <ConditionalFormat
                  items={[
                    "highlightCellRules",
                    "itemSelectionRules",
                    "-",
                    "deleteRule",
                  ]}
                  setOpen={closeContextMenu}
                />
              </div>
            }
            trigger="mouseenter focus"
            hideOnClick={false}
          >
            <div>
              <Menu>
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <SVGIcon name="conditionFormat" width={16} height={16} />
                    <p>{rightclick.conditionFormat || "Conditional Format"}</p>
                  </div>
                  <SVGIcon name="rightArrow" width={16} height={16} />
                </div>
              </Menu>
            </div>
          </Tippy>
        );
      }
      return null;
    },
    [
      context,
      setContext,
      refs.globalCache,
      rightclick,
      showAlert,
      showDialog,
      drag.noMulti,
      info.tipRowHeightLimit,
      info.tipColumnWidthLimit,
      generalDialog.partiallyError,
      generalDialog.readOnlyError,
      generalDialog.dataNullError,
    ]
  );

  useLayoutEffect(() => {
    // re-position the context menu if it overflows the window
    if (!containerRef.current) {
      return;
    }
    const winH = window.innerHeight;
    const winW = window.innerWidth;
    const rect = containerRef.current.getBoundingClientRect();
    const workbookRect =
      refs.workbookContainer.current?.getBoundingClientRect();
    if (!workbookRect) {
      return;
    }
    const menuW = rect.width;
    const menuH = rect.height;
    let top = contextMenu.y || 0;
    let left = contextMenu.x || 0;

    let hasOverflow = false;
    if (workbookRect.left + left + menuW > winW) {
      left -= menuW;
      hasOverflow = true;
    }
    if (workbookRect.top + top + menuH > winH) {
      top -= menuH;
      hasOverflow = true;
    }
    if (top < 0) {
      top = 0;
      hasOverflow = true;
    }
    if (hasOverflow) {
      setContext((draftCtx) => {
        draftCtx.contextMenu.x = left;
        draftCtx.contextMenu.y = top;
      });
    }
  }, [contextMenu.x, contextMenu.y, refs.workbookContainer, setContext]);

  if (_.isEmpty(context.contextMenu)) return null;

  return (
    <div
      className="fortune-context-menu luckysheet-cols-menu"
      ref={containerRef}
      onContextMenu={(e) => e.stopPropagation()}
      style={{ left: contextMenu.x, top: contextMenu.y }}
    >
      {context.contextMenu.headerMenu === true
        ? settings.headerContextMenu.map((menu, i) => getMenuElement(menu, i))
        : settings.cellContextMenu.map((menu, i) => getMenuElement(menu, i))}
    </div>
  );
};

export default ContextMenu;
