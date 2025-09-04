import _ from "lodash";
import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  LucideIcon,
  Button,
} from "@fileverse/ui";
import { useMediaQuery } from "usehooks-ts";
import {
  updateCell,
  addSheet,
  calcSelectionInfo,
} from "@fileverse-dev/fortune-core";
// @ts-ignore
import WorkbookContext from "../../context";
import SVGIcon from "../SVGIcon";
import "./index.css";
import SheetItem from "./SheetItem";
import ZoomControl from "../ZoomControl";

const STATS = [
  { label: "Avg", value: "average" },
  { label: "Count", value: "count" },
  { label: "Max", value: "max" },
  { label: "Min", value: "min" },
  { label: "Cells", value: "numberC" },
  { label: "Sum", value: "sum" },
];

const STATS_LABELS = {
  average: "Avg",
  count: "Count",
  max: "Max",
  min: "Min",
  numberC: "Cells",
  sum: "Sum",
};

const SheetTab: React.FC = () => {
  const isMobile = useMediaQuery("(max-width: 780px)", { defaultValue: true });
  const { context, setContext, settings, refs } = useContext(WorkbookContext);
  const tabContainerRef = useRef<HTMLDivElement>(null);
  const leftScrollRef = useRef<HTMLDivElement>(null);
  const rightScrollRef = useRef<HTMLDivElement>(null);
  const [isShowScrollBtn, setIsShowScrollBtn] = useState<boolean>(false);
  const [isShowBoundary, setIsShowBoundary] = useState<boolean>(true);
  const [calInfo, setCalInfo] = useState<{
    numberC: number;
    count: number;
    sum: number;
    max: number;
    min: number;
    average: string;
  }>({
    numberC: 0,
    count: 0,
    sum: 0,
    max: 0,
    min: 0,
    average: "",
  });

  const [selectedStat, setSelectedStat] = useState<string>("sum");

  const scrollDelta = 150;

  const scrollBy = useCallback((amount: number) => {
    if (
      tabContainerRef.current == null ||
      tabContainerRef.current.scrollLeft == null
    ) {
      return;
    }
    const { scrollLeft } = tabContainerRef.current;
    if (scrollLeft + amount <= 0) setIsShowBoundary(true);
    else if (scrollLeft > 0) setIsShowBoundary(false);

    tabContainerRef.current?.scrollBy({
      left: amount,
      behavior: "smooth",
    });
  }, []);

  useEffect(() => {
    const selection = context.luckysheet_select_save;
    // const { lang } = props;
    if (selection) {
      const re = calcSelectionInfo(context, "en");
      setCalInfo(re);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context.luckysheet_select_save]);

  useEffect(() => {
    const tabCurrent = tabContainerRef.current;
    if (!tabCurrent) return;
    setIsShowScrollBtn(tabCurrent!.scrollWidth - 2 > tabCurrent!.clientWidth);
  }, [context.luckysheetfile]);

  const onAddSheetClick = useCallback(
    () =>
      setTimeout(() => {
        setContext(
          (draftCtx) => {
            if (draftCtx.luckysheetCellUpdate.length > 0) {
              updateCell(
                draftCtx,
                draftCtx.luckysheetCellUpdate[0],
                draftCtx.luckysheetCellUpdate[1],
                refs.cellInput.current!
              );
            }
            addSheet(draftCtx, settings);
          },
          { addSheetOp: true }
        );
        const tabCurrent = tabContainerRef.current;
        setIsShowScrollBtn(tabCurrent!.scrollWidth > tabCurrent!.clientWidth);
      }),
    [refs.cellInput, setContext, settings]
  );

  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const handleCloseDisclaimer = () => {
    setShowDisclaimer(false);
    const cornerPlus = document.getElementById("corner-plus");
    if (cornerPlus) {
      cornerPlus.style.display = "block";
    }
  };

  useEffect(() => {
    const cornerPlus = document.getElementById("corner-plus");
    if (cornerPlus) {
      cornerPlus.style.display = "none";
    }
  }, [isMobile]);

  useEffect(() => {
    settings.onSheetCountChange?.(context.luckysheetfile.length);
  }, [context.luckysheetfile.length]);

  return (
    <div>
      {showDisclaimer && (
        <div
          className="w-full"
          id="denomination-warning"
          style={{
            zIndex: 1003,
            position: "absolute",
            display: "none",
            bottom: "31px",
            backgroundColor: "#F8F9FA",
            borderBottom: "1px solid #E8EBEC",
            color: "#77818A",
            fontFamily: "Helvetica Neue",
            fontSize: "var(--font-size-2xsm, 12px)",
            fontStyle: "normal",
            fontWeight: "400",
          }}
        >
          <div
            className={`max-w-7xl mx-auto px-4 py-1 ${
              isMobile && "w-full flex justify-between"
            }`}
          >
            <p className={`${isMobile ? "text-left" : "text-center"} text-xsm`}>
              <span className="font-medium">Disclaimer:</span> Prices are not
              updated in real time and may differ slightly. Updates may be
              delayed by up to 20 minutes.
            </p>
            {isMobile && (
              // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
              <p
                className="ml-4 content-center cursor-pointer"
                style={{ alignContent: "center" }}
                onClick={handleCloseDisclaimer}
              >
                Close
              </p>
            )}
          </div>
        </div>
      )}
      <div
        className="luckysheet-sheet-area luckysheet-noselected-text"
        onContextMenu={(e) => e.preventDefault()}
        id="luckysheet-sheet-area"
      >
        <div id="luckysheet-sheet-content">
          {context.allowEdit && (
            <div className="fortune-sheettab-button" onClick={onAddSheetClick}>
              <SVGIcon name="plus" width={16} height={16} />
            </div>
          )}
          {context.allowEdit && (
            <div className="sheet-list-container">
              <div
                id="all-sheets"
                className="fortune-sheettab-button"
                ref={tabContainerRef}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  setContext((ctx) => {
                    ctx.showSheetList = _.isUndefined(ctx.showSheetList)
                      ? true
                      : !ctx.showSheetList;
                    ctx.sheetTabContextMenu = {};
                  });
                }}
              >
                <SVGIcon name="all-sheets" width={16} height={16} />
              </div>
            </div>
          )}
          <div
            id="luckysheet-sheets-m"
            className="luckysheet-sheets-m lucky-button-custom"
          >
            <i className="iconfont luckysheet-iconfont-caidan2" />
          </div>
          <div
            className="fortune-sheettab-container"
            id="fortune-sheettab-container"
          >
            {!isShowBoundary && <div className="boundary boundary-left" />}
            <div
              className="fortune-sheettab-container-c"
              id="fortune-sheettab-container-c"
              ref={tabContainerRef}
            >
              {_.sortBy(context.luckysheetfile, (s) => Number(s.order)).map(
                (sheet) => {
                  return <SheetItem key={sheet.id} sheet={sheet} />;
                }
              )}
              {/* <SheetItem
              isDropPlaceholder
              sheet={{ name: "", id: "drop-placeholder" }}
            /> */}
            </div>
            {isShowBoundary && isShowScrollBtn && (
              <div className="boundary boundary-right" />
            )}
          </div>
          {isShowScrollBtn && (
            <div
              id="fortune-sheettab-leftscroll"
              className="fortune-sheettab-scroll"
              ref={leftScrollRef}
              onClick={() => {
                scrollBy(-scrollDelta);
              }}
              tabIndex={0}
            >
              <SVGIcon name="arrow-doubleleft" width={12} height={12} />
            </div>
          )}
          {isShowScrollBtn && (
            <div
              id="fortune-sheettab-rightscroll"
              className="fortune-sheettab-scroll"
              ref={rightScrollRef}
              onClick={() => {
                scrollBy(scrollDelta);
              }}
              tabIndex={0}
            >
              <SVGIcon name="arrow-doubleright" width={12} height={12} />
            </div>
          )}
        </div>
        <div className="fortune-sheet-area-right">
          <Popover>
            <PopoverTrigger className="p-0 m-0 mr-2">
              <Button
                variant="ghost"
                className="w-full !h-6 p-2 m-1 text-left flex items-center justify-center transition mr-2 !rounded-[0px]"
                style={{ height: "24px !important" }}
              >
                {calInfo.count > 0 && (
                  <p className="text-body-sm">
                    {STATS_LABELS[selectedStat as keyof typeof STATS_LABELS]}:{" "}
                    {calInfo[selectedStat as keyof typeof calInfo]}
                  </p>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              alignOffset={0}
              className="stats-content color-border-default shadow-elevation-3"
              style={{ width: "fit-content!important" }}
              elevation={2}
              side="bottom"
              sideOffset={4}
            >
              <div
                className="p-2 color-text-default color-border-default"
                style={{ paddingRight: "15px" }}
              >
                {STATS.map((option) => (
                  <Button
                    variant="ghost"
                    key={option.value}
                    className={`w-full h-8 rounded p-2 m-1 text-left flex items-center justify-between transition mr-2 min-w-[50px] ${
                      selectedStat === option.value && "bg-[#F8F9FA]"
                    }`}
                    onClick={() => setSelectedStat(option.value)}
                  >
                    <div className="flex gap-2 items-center w-full">
                      {selectedStat === option.value && (
                        <div className="w-[20px] h-[20px]">
                          <LucideIcon name="Check" size="sm" />
                        </div>
                      )}
                      <p
                        className="text-body-sm color-text-secondary"
                        style={{
                          marginLeft:
                            selectedStat === option.value ? 0 : "24px",
                          fontSize: "14px",
                        }}
                      >
                        {option.label}:{" "}
                      </p>
                      <div className="flex w-full justify-end">
                        <p
                          className="font-body-sm-bold color-text-default"
                          style={{
                            marginLeft:
                              selectedStat === option.value ? 0 : "24px",
                            fontSize: "14px",
                            fontWeight: 500,
                          }}
                        >
                          {calInfo[option.value as keyof typeof calInfo]}
                        </p>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          <ZoomControl />
        </div>
      </div>
    </div>
  );
};

export default SheetTab;
