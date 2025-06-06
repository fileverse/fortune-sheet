import _ from "lodash";
import React, { useContext } from "react";
import { LucideIcon } from "@fileverse/ui";
import WorkbookContext from "../../../context";
import "./index.css";

const FormulaSearch: React.FC<React.HTMLAttributes<HTMLDivElement>> = (
  props
) => {
  const { context } = useContext(WorkbookContext);
  if (_.isEmpty(context.functionCandidates)) return null;

  return (
    <div
      {...props}
      id="luckysheet-formula-search-c"
      className="luckysheet-formula-search-c"
    >
      {context.functionCandidates.map((v, index) => {
        return (
          <div
            key={v.n}
            data-func={v.n}
            className={`luckysheet-formula-search-item ${
              index === 0 ? "luckysheet-formula-search-item-active" : ""
            }`}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div className="luckysheet-formula-search-func text-body-sm">
                {v.n}
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "end",
                  width: "68px",
                  height: "20px",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                {v.LOGO && (
                  <img
                    src={v.LOGO}
                    alt="Service Logo"
                    style={{ width: "20px" }}
                  />
                )}
                {v.API_KEY && (
                  <div
                    style={{
                      borderRadius: "4px",
                      backgroundColor: `${
                        localStorage.getItem(v.API_KEY) ? "#177E23" : "#e8ebec"
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
                )}
              </div>
            </div>
            <div className="luckysheet-formula-search-detail mt-1 text-helper-text-sm">
              {v.d}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default FormulaSearch;
