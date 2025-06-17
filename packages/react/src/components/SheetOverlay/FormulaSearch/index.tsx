import _ from "lodash";
import React, { useContext, useEffect, useRef, useState } from "react";
import { LucideIcon, Tooltip } from "@fileverse/ui";
import WorkbookContext from "../../../context";
import "./index.css";

const FormulaSearch: React.FC<React.HTMLAttributes<HTMLDivElement>> = (
  props
) => {
  const { context } = useContext(WorkbookContext);
  const firstSelection = context.luckysheet_select_save?.[0];
  const hintRef = useRef<HTMLDivElement>(null);
  const [top, setTop] = useState(0);
  const calcuatePopUpPlacement = () => {
    if (
      !firstSelection?.top?.toString() ||
      !firstSelection.height_move?.toString() ||
      !hintRef.current
    )
      return;
    const hintHeight = 360;
    const inputBottom = firstSelection.top + firstSelection.height_move;
    const availableBelow = window.innerHeight - inputBottom;
    const hintAbove = hintHeight > availableBelow;
    const selectionHeight = firstSelection?.height_move || 0;
    const divOffset = hintRef.current?.offsetHeight || 0;
    setTop(
      hintAbove ? selectionHeight - (divOffset + 30) : selectionHeight + 4
    );
  };

  useEffect(() => {
    calcuatePopUpPlacement();
  });

  if (
    _.isEmpty(context.functionCandidates) &&
    _.isEmpty(context.defaultCandidates)
  )
    return null;

  return (
    <div
      {...props}
      ref={hintRef}
      id="luckysheet-formula-search-c"
      className="luckysheet-formula-search-c"
      style={{
        top,
      }}
    >
      {context.defaultCandidates.length > 0 && (
        <div
          style={{ marginBottom: "4px" }}
          className="w-full flex flex-col p-2 gap-1"
        >
          <h4 className="text-helper-sm-bold color-text-secondary">
            Onchain functions
          </h4>
          <p className="text-helper-text-sm color-text-secondary">
            A datablock is a native data structure allowing dSheets to read and
            structure any data coming from smart contracts or APIs. Anyone can
            contribute to datablocks to make new data sources supported on
            dSheets.
          </p>
        </div>
      )}

      {context.defaultCandidates.length > 0 ? (
        <>
          {context.defaultCandidates.map((v, index) => {
            return (
              <div
                key={v.n}
                data-func={v.n}
                style={{
                  cursor: "pointer",
                }}
                className={`luckysheet-formula-search-item  ${
                  index === 0 ? "luckysheet-formula-search-item-active" : ""
                }`}
              >
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <div className="luckysheet-formula-search-func color-text-default text-body-sm">
                    {v.n}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "end",
                      minWidth: "68px",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    {v.LOGO && (
                      <img
                        src={v.LOGO}
                        alt="Service Logo"
                        style={{ width: "16px" }}
                      />
                    )}
                    {v.SECONDARY_LOGO && (
                      <img
                        src={v.SECONDARY_LOGO}
                        alt="Service Logo"
                        style={{ width: "16px" }}
                      />
                    )}
                    {v.API_KEY && (
                      <Tooltip
                        text={
                          localStorage.getItem(v.API_KEY)
                            ? "API Key added"
                            : "API key required"
                        }
                      >
                        <div
                          style={{
                            borderRadius: "4px",
                            backgroundColor: `${
                              localStorage.getItem(v.API_KEY)
                                ? "#177E23"
                                : "#e8ebec"
                            }`,
                            width: "16px",
                            height: "16px",
                          }}
                          className="flex justify-center"
                        >
                          <LucideIcon
                            name="Key"
                            style={{
                              color: localStorage.getItem(v.API_KEY)
                                ? "white"
                                : "#77818A",
                              width: "12px",
                              height: "12px",
                            }}
                          />
                        </div>
                      </Tooltip>
                    )}
                  </div>
                </div>
                <div className="luckysheet-formula-search-detail mt-1 text-helper-text-sm  color-text-default">
                  {v.d}
                </div>
              </div>
            );
          })}
        </>
      ) : (
        <>
          {context.functionCandidates.map((v, index) => {
            return (
              <div
                key={v.n}
                data-func={v.n}
                className={`luckysheet-formula-search-item ${
                  index === 0 ? "luckysheet-formula-search-item-active" : ""
                }`}
              >
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <div className="luckysheet-formula-search-func color-text-default text-body-sm">
                    {v.n}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "end",
                      width: "68px",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    {v.LOGO && (
                      <img
                        src={v.LOGO}
                        alt="Service Logo"
                        style={{ width: "16px" }}
                      />
                    )}
                    {v.SECONDARY_LOGO && (
                      <img
                        src={v.SECONDARY_LOGO}
                        alt="Service Logo"
                        style={{ width: "16px" }}
                      />
                    )}
                    {v.API_KEY && (
                      <Tooltip
                        text={
                          localStorage.getItem(v.API_KEY)
                            ? "API Key added"
                            : "API Key required"
                        }
                      >
                        <div
                          style={{
                            borderRadius: "4px",
                            backgroundColor: `${
                              localStorage.getItem(v.API_KEY)
                                ? "#177E23"
                                : "#e8ebec"
                            }`,
                            width: "16px",
                            height: "16px",
                          }}
                          className="flex justify-center"
                        >
                          <LucideIcon
                            name="Key"
                            style={{
                              color: localStorage.getItem(v.API_KEY)
                                ? "white"
                                : "#77818A",
                              width: "12px",
                              height: "12px",
                            }}
                          />
                        </div>
                      </Tooltip>
                    )}
                  </div>
                </div>
                <div className="luckysheet-formula-search-detail mt-1 text-helper-text-sm color-text-secondary">
                  {v.d}
                </div>
              </div>
            );
          })}
        </>
      )}

      <hr className="color-border-default mb-2 mt-4 " />
      <div
        style={{ paddingLeft: "10px", paddingRight: "10px" }}
        className="flex gap-1 items-center color-border-default text-helper-sm"
      >
        <div className="border p-1 color-text-default rounded">Tab</div>
        <p className="color-text-secondary">to insert</p>
      </div>
    </div>
  );
};

export default FormulaSearch;
