import { locale } from "@fileverse-dev/fortune-core";
import { Button, TextField, LucideIcon } from "@fileverse/ui";
import React, { useContext, useState } from "react";
import WorkbookContext from "../../../context";
import "./index.css";

function lightenHexColor(hex: string) {
  const amount = 100;
  // Ensure the hex color starts with '#' and is 7 characters long (including the '#')
  if (hex.startsWith("#")) {
    hex = hex.slice(1);
  }

  // Convert hex to RGB
  let r = parseInt(hex.slice(0, 2), 16);
  let g = parseInt(hex.slice(2, 4), 16);
  let b = parseInt(hex.slice(4, 6), 16);

  // Increase the RGB values to lighten the color (amount is a percentage of change)
  r = Math.min(255, r + amount);
  g = Math.min(255, g + amount);
  b = Math.min(255, b + amount);

  // Convert RGB back to Hex
  const newHex = `#${((1 << 24) | (r << 16) | (g << 8) | b)
    .toString(16)
    .slice(1)
    .toUpperCase()}`;

  return newHex;
}

const FormulaHint: React.FC<React.HTMLAttributes<HTMLDivElement>> = (props) => {
  const { context } = useContext(WorkbookContext);
  const { formulaMore } = locale(context);
  //if (!context.functionHint) return null;
  // @ts-ignore
  const fn = context.formulaCache.functionlistMap[context.functionHint];
  const [API_KEY, setAPI_KEY] = useState(localStorage.getItem(fn?.API_KEY));
  const [showAPInput, setShowAPInput] = useState(!API_KEY);
  if (!fn) return null;

  return (
    <div
      {...props}
      id="luckysheet-formula-help-c"
      className="luckysheet-formula-help-c"
      style={{
        border: `1px solid ${fn.BRAND_COLOR}`,
        backgroundColor: `${fn.BRAND_COLOR ? lightenHexColor(fn.BRAND_COLOR) : "#F8F9FA"
          }`,
      }}
    >
      <div className="luckysheet-formula-help-close" title="关闭">
        <i className="fa fa-times" aria-hidden="true" />
      </div>
      <div className="luckysheet-formula-help-collapse" title="收起">
        <i className="fa fa-angle-up" aria-hidden="true" />
      </div>
      <div
        className="luckysheet-formula-help-title formula-title"
        style={{
          backgroundColor: `${fn.BRAND_COLOR ? lightenHexColor(fn.BRAND_COLOR) : "#F8F9FA"
            }`,
        }}
      >
        <div className="luckysheet-formula-help-title-formula">
          <span className="luckysheet-arguments-help-function-name">
            {fn.n}
          </span>
          <span className="luckysheet-arguments-paren">(</span>
          <span className="luckysheet-arguments-parameter-holder">
            {fn.p.map((param: any, i: number) => {
              let { name } = param;
              if (param.repeat === "y") {
                name += ", ...";
              }
              if (param.require === "o") {
                name = `[${name}]`;
              }
              return (
                <span
                  className="luckysheet-arguments-help-parameter"
                  dir="auto"
                  key={name}
                >
                  {name}
                  {i !== fn.p.length - 1 && ", "}
                </span>
              );
            })}
          </span>
          <span className="luckysheet-arguments-paren">)</span>
        </div>
        <div style={{ display: "flex", gap: "4px" }}>
          {fn.LOGO && (
            <img src={fn.LOGO} alt="Service Logo" width={32} height={32} />
          )}
          {fn.API_KEY && (
            <div
              style={{
                borderRadius: "4px",
                width: "20px",
                height: "20px",
                backgroundColor: `${localStorage.getItem(fn.API_KEY) ? "#177E23" : "#F9A92B"
                  }`,
              }}
            >
              <LucideIcon name="Key" style={{ color: "white" }} />
            </div>
          )}
        </div>
      </div>
      <div
        className="luckysheet-formula-help-content"
        style={{
          backgroundColor: `${fn.BRAND_COLOR ? lightenHexColor(fn.BRAND_COLOR) : "#F8F9FA"
            }`,
        }}
      >
        {fn.API_KEY && (
          <div
            style={{
              borderLeft: `4px solid ${API_KEY ? "#177E23" : "#fb923c"}`,
              backgroundColor: "white",
              padding: "16px",
              margin: "4px 4px 0px 4px",
              borderRadius: "4px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                cursor: "pointer",
              }}
              onClick={() => setShowAPInput(!showAPInput)}
            >
              <h3
                style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#1f2937",
                  margin: "0 0 8px 0",
                }}
              >
                API key is required
              </h3>
              <LucideIcon name="ChevronDown" width={24} height={24} />
            </div>
            {showAPInput && (
              <div>
                <p
                  style={{
                    color: "#6b7280",
                    margin: "0 0 16px 0",
                  }}
                >
                  {`This function is require API key. Please paste it below and
                  press 'Ok'.`}
                </p>
                <div
                  style={{
                    display: "flex",
                    gap: "12px",
                  }}
                >
                  <TextField
                    // @ts-ignore
                    value={API_KEY}
                    id="function-api-key"
                    type="text"
                    placeholder="API key"
                    // value={apiKey}
                    onChange={(e) => {
                      setAPI_KEY(e.target.value);
                    }}
                  />
                  <Button
                    onClick={() => {
                      // @ts-ignore
                      localStorage.setItem(fn.API_KEY, API_KEY);
                    }}
                  >
                    Ok
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        <div
          style={{
            backgroundColor: "white",
            padding: "6px",
            margin: "4px 4px 0px 4px",
            borderRadius: "4px",
          }}
        >
          <div className="luckysheet-formula-help-content-example">
            <div className="luckysheet-arguments-help-section-title example-title">
              {formulaMore.helpExample}
            </div>
            <div className="luckysheet-arguments-help-formula">
              <span className="luckysheet-arguments-help-function-name example-value">
                {fn.n}
              </span>
              <span className="luckysheet-arguments-paren">(</span>
              <span className="luckysheet-arguments-parameter-holder">
                {fn.p.map((param: any, i: number) => (
                  <span
                    key={param.name}
                    className="luckysheet-arguments-help-parameter"
                    dir="auto"
                  >
                    {param.example}
                    {i !== fn.p.length - 1 && ", "}
                  </span>
                ))}
              </span>
              <span className="luckysheet-arguments-paren">)</span>
            </div>
          </div>
          <div
            className="luckysheet-formula-help-content-detail"
            style={{ paddingBottom: "6px" }}
          >
            <div className="luckysheet-arguments-help-section">
              <div className="luckysheet-arguments-help-section-title luckysheet-arguments-help-parameter-name example-title">
                About
              </div>
              <span className="luckysheet-arguments-help-parameter-content example-value">
                {fn.d}
              </span>
            </div>
          </div>
          <div className="luckysheet-formula-help-content-param">
            {fn.p.map((param: any) => (
              <div
                className="luckysheet-arguments-help-section"
                key={param.name}
              >
                <div className="luckysheet-arguments-help-section-title example-title">
                  {param.name}
                  {param.repeat === "y" && (
                    <span
                      className="luckysheet-arguments-help-argument-info example-value"
                      style={{ marginTop: "2px" }}
                    >
                      ...-{formulaMore.allowRepeatText}
                    </span>
                  )}
                  {param.require === "o" && (
                    <span
                      className="luckysheet-arguments-help-argument-info example-value"
                      style={{ marginTop: "2px" }}
                    >
                      -[{formulaMore.allowOptionText}]
                    </span>
                  )}
                </div>
                <span
                  className="luckysheet-arguments-help-parameter-content example-value"
                  style={{ marginTop: "2px" }}
                >
                  {param.detail}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="luckysheet-formula-help-foot" />
    </div>
  );
};

export default FormulaHint;
