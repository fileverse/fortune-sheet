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
              <div className="luckysheet-formula-search-func">{v.n}</div>
              <div style={{ display: "flex", gap: "4px" }}>
                {v.LOGO && (
                  <img src={v.LOGO} alt="Service Logo" width={32} height={32} />
                )}
                {v.API_KEY && (
                  <div
                    style={{
                      borderRadius: "4px",
                      width: "20px",
                      height: "20px",
                      backgroundColor: `${
                        localStorage.getItem(v.API_KEY) ? "#177E23" : "#F9A92B"
                      }`,
                    }}
                  >
                    <LucideIcon name="Key" style={{ color: "white" }} />
                  </div>
                )}
              </div>
            </div>
            <div className="luckysheet-formula-search-detail">{v.d}</div>
          </div>
        );
      })}
    </div>
  );
};

export default FormulaSearch;
