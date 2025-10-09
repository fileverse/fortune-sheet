import { locale } from "@fileverse-dev/fortune-core";
import { Button, TextField, LucideIcon, Tooltip } from "@fileverse/ui";
import React, { useContext, useEffect, useRef, useState } from "react";
import WorkbookContext from "../../../context";
import "./index.css";
import { DraggableDiv } from "./dragable-div";

const FormulaHint = (props: any) => {
  const { showFormulaHint, handleShowFormulaHint, commaCount } = props;
  const dragHasMoved = useRef(false);
  const { context } = useContext(WorkbookContext);
  const firstSelection = context.luckysheet_select_save?.[0];
  const { formulaMore } = locale(context);
  // if (!context.functionHint) return null;
  // @ts-ignore
  const fn = context.formulaCache.functionlistMap[context.functionHint];
  const [API_KEY, setAPI_KEY] = useState(localStorage.getItem(fn?.API_KEY));
  const [showAPInput, setShowAPInput] = useState(!API_KEY);
  const [isKeyAdded, setApiKeyAdded] = useState(
    !!localStorage.getItem(fn?.API_KEY)
  );
  const formulaExpand = localStorage.getItem("formula-expand") === "true";
  const [showFunctionBody, setShouldShowFunctionBody] = useState(formulaExpand);

  useEffect(() => {
    if (fn) {
      setApiKeyAdded(!!localStorage.getItem(fn?.API_KEY));
      setAPI_KEY(localStorage.getItem(fn?.API_KEY) || "");
      setShowAPInput(!localStorage.getItem(fn?.API_KEY));
    }
  }, [fn]);
  const apiKeyPlaceholder: Record<string, string> = {
    ETHERSCAN_API_KEY: "Etherscan API key",
  };
  const hintRef = useRef<HTMLDivElement>(null);
  const [top, setTop] = useState(0);
  const [showDelayedHint, setShowDelayedHint] = useState(false);
  const calcuatePopUpPlacement = () => {
    if (
      !firstSelection?.top?.toString() ||
      !firstSelection.height_move?.toString() ||
      !hintRef.current
    )
      return;
    const hintHeight = 360;
    const inputBoxTop =
      parseInt(
        document.getElementById("luckysheet-input-box")?.style.top || "0",
        10
      ) - 85;
    const inputBottom = inputBoxTop + firstSelection.height_move;
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
  }, []);

  useEffect(() => {
    if (!top) {
      setTimeout(() => {
        setShowDelayedHint(true);
      }, 40);
    }
  }, [top]);

  if (!fn) return null;

  return (
    <DraggableDiv
      initialTop={top}
      dragHasMoved={dragHasMoved}
      className={`bg-secondary text-secondary-foreground p-4 rounded-lg flex items-center justify-center ${
        showDelayedHint ? "opacity-100" : "opacity-0"
      }`}
    >
      {showFormulaHint && (
        <div>
          <Tooltip
            text="Hide formula suggestions (F10)"
            placement="top"
            defaultOpen
            style={{
              position: "absolute",
              left: "210px",
              top: "-40px",
              width: "200px",
            }}
          >
            <button
              type="button"
              className="flex items-center justify-center w-4 h-4 rounded-full"
              style={{
                backgroundColor: "black",
                zIndex: 2000,
                position: "absolute",
                left: "327px",
                top: "-8px",
                padding: "2.4px",
                color: "white",
              }}
              onClick={handleShowFormulaHint}
              aria-label="Close formula hint"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-x-icon lucide-x color-white"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </Tooltip>
          <div
            {...props}
            ref={hintRef}
            id="luckysheet-formula-help-c"
            className="luckysheet-formula-help-c"
            style={{
              top: "0px",
              left: "0px",
              borderWidth: "1px",
              borderColor: fn?.BRAND_SECONDARY_COLOR
                ? fn?.BRAND_SECONDARY_COLOR
                : "rgba(0, 0, 0, 0.2)",
              backgroundColor: `${fn.BRAND_COLOR ? fn.BRAND_COLOR : "#F8F9FA"}`,
              width: "340px",
              padding: "0px",
            }}
          >
            <div className="luckysheet-formula-help-close" title="关闭">
              <i className="fa fa-times" aria-hidden="true" />
            </div>
            <div className="luckysheet-formula-help-collapse" title="收起">
              <i className="fa fa-angle-up" aria-hidden="true" />
            </div>
            <div
              onClick={() => {
                if (!dragHasMoved.current) {
                  localStorage.setItem(
                    "formula-expand",
                    `${!showFunctionBody}`
                  );
                  setShouldShowFunctionBody(!showFunctionBody);
                  setTimeout(() => {
                    calcuatePopUpPlacement();
                  }, 50);
                }
                dragHasMoved.current = false;
              }}
              className="flex !cursor-grab active:cursor-grabbing items-start justify-between"
              id="luckysheet-formula-help-title"
              style={{
                backgroundColor: `${
                  fn.BRAND_COLOR ? fn.BRAND_COLOR : "#F8F9FA"
                }`,
                padding: "10px",
                borderRadius: "10px",
                cursor: "grab",
                userSelect: "none",
              }}
            >
              <div className=" flex-grow  color-text-default">
                <code
                  style={{ fontWeight: 500 }}
                  className="luckysheet-arguments-help-function-name font-family-mono mb-1 mt-2 color-text-default font-family-mono"
                >
                  {fn.n}
                </code>
                <code className="luckysheet-arguments-paren font-family-mono mb-1 mt-2 color-text-default">
                  (
                </code>
                <code className="luckysheet-arguments-parameter-holder font-family-mono mb-1 mt-2 color-text-default">
                  {fn.p.map((param: any, i: number) => {
                    let { name } = param;
                    if (param.repeat === "y") {
                      name += ", ...";
                    }
                    if (param.require === "o") {
                      name = `[${name}]`;
                    }
                    return (
                      <code
                        className="luckysheet-arguments-help-parameter font-family-mono mb-1 mt-2 color-text-default"
                        dir="auto"
                        key={name}
                        style={{
                          backgroundColor:
                            commaCount === i
                              ? fn?.BRAND_SECONDARY_COLOR || "#FFDF0A"
                              : "transparent",
                        }}
                      >
                        {name}
                        {i !== fn.p.length - 1 && ", "}
                      </code>
                    );
                  })}
                </code>
                <code className="luckysheet-arguments-paren font-family-mono mb-1 mt-2 color-text-default">
                  )
                </code>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "end",
                  minWidth: "75px",
                  height: "20px",
                  alignItems: "center",
                  gap: "6px",
                  cursor: "pointer",
                }}
              >
                {fn.LOGO && (
                  <img
                    src={fn.LOGO}
                    alt="Service Logo"
                    style={{ width: "16px" }}
                  />
                )}
                {fn.SECONDARY_LOGO && (
                  <img
                    src={fn.SECONDARY_LOGO}
                    alt="Service Logo"
                    style={{ width: "16px" }}
                  />
                )}
                {fn.API_KEY && (
                  <div
                    style={{
                      borderRadius: "4px",
                      backgroundColor: `${isKeyAdded ? "#177E23" : "#e8ebec"}`,
                      width: "16px",
                      height: "16px",
                    }}
                    className="flex justify-center"
                  >
                    <LucideIcon
                      name="Key"
                      style={{
                        color: isKeyAdded ? "white" : "#77818A",
                        width: "12px",
                        height: "12px",
                      }}
                    />
                  </div>
                )}
                <div>
                  <LucideIcon
                    name={showFunctionBody ? "ChevronUp" : "ChevronDown"}
                    width={16}
                    height={16}
                  />
                </div>
              </div>
            </div>
            {showFunctionBody && (
              <div
                className="luckysheet-formula-help-content"
                id="function-details"
                style={{
                  backgroundColor: `${
                    fn.BRAND_COLOR ? fn.BRAND_COLOR : "#F8F9FA"
                  }`,
                  maxHeight: "284px",
                  overflowY: "scroll",
                  cursor: "auto",
                }}
              >
                {fn.API_KEY && (
                  <div
                    style={{
                      borderLeft: `4px solid ${
                        isKeyAdded ? "#177E23" : "#fb923c"
                      }`,
                      backgroundColor: "white",
                      padding: "8px",
                      paddingBottom: "2px",
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
                          margin: "0 0 8px 0",
                        }}
                        className="text-heading-xsm color-text-default"
                      >
                        {isKeyAdded
                          ? "API key provided"
                          : "API key is required"}
                      </h3>
                      <LucideIcon
                        name={showAPInput ? "ChevronUp" : "ChevronDown"}
                        width={24}
                        height={24}
                        style={{ cursor: "pointer" }}
                      />
                    </div>
                    {showAPInput && (
                      <div>
                        <p
                          style={{
                            margin: "0 0 16px 0",
                          }}
                          className="text-body-sm color-text-default"
                        >
                          {`This function requires an API key. Please paste it below and
                  press 'Ok'.`}
                        </p>
                        <div className="w-full">
                          <TextField
                            // @ts-ignore
                            value={API_KEY}
                            id="function-api-key"
                            type="text"
                            placeholder={apiKeyPlaceholder[fn.API_KEY]}
                            onChange={(e) => {
                              setAPI_KEY(e.target.value);
                              setApiKeyAdded(false);
                            }}
                          />
                          <div className="flex justify-end mt-2 mb-2">
                            <Button
                              onClick={() => {
                                // @ts-ignore
                                localStorage.setItem(fn.API_KEY, API_KEY);
                                setApiKeyAdded(true);
                                setShowAPInput(false);
                              }}
                              disabled={!API_KEY}
                              className="min-w-[80px]"
                            >
                              Ok
                            </Button>
                          </div>
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
                    marginTop: "-1px",
                  }}
                >
                  <div className="">
                    <div
                      style={{
                        lineHeight: "16px",
                        fontSize: "12px",
                        fontFamily: "Helvetica Neue",
                      }}
                      className="font-family-mono mb-1 color-text-secondary"
                    >
                      {formulaMore.helpExample}
                    </div>
                    <div>
                      <code
                        style={{
                          overflowWrap: "break-word",
                        }}
                        className="example-value-code"
                      >
                        <span className="luckysheet-arguments-help-function-name">
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
                      </code>
                    </div>
                  </div>
                  <div
                    className="luckysheet-formula-help-content-detail"
                    style={{ paddingBottom: "16px" }}
                  >
                    <div className="">
                      <div
                        style={{
                          lineHeight: "16px",
                          fontSize: "12px",
                          padding: "0px",
                          fontFamily: "Helvetica Neue",
                        }}
                        className="font-family-mono mb-1 mt-2 color-text-secondary"
                      >
                        About
                      </div>
                      <span className="luckysheet-arguments-help-parameter-content text-helper-text-sm">
                        {fn.d}
                      </span>
                    </div>
                  </div>
                  <div
                    style={{ paddingTop: "16px" }}
                    className="luckysheet-formula-help-content-param"
                  >
                    {fn.p.map((param: any, index: number) => (
                      <div className="" key={param.name}>
                        <div>
                          <code
                            className="font-family-mono mb-1 mt-2 color-text-default font-family-mono"
                            style={{
                              backgroundColor:
                                commaCount === index
                                  ? fn?.BRAND_SECONDARY_COLOR || "#FFDF0A"
                                  : "transparent",
                            }}
                          >
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
                          </code>
                        </div>
                        <span
                          className="luckysheet-arguments-help-parameter-content text-helper-text-sm"
                          style={{ marginTop: "2px" }}
                        >
                          {param.detail}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {showFunctionBody && (
              <div
                style={{
                  backgroundColor: `${
                    fn.BRAND_COLOR ? fn.BRAND_COLOR : "#F8F9FA"
                  }`,
                  padding: "8px",
                  borderBottomLeftRadius: "10px",
                  borderBottomRightRadius: "10px",
                }}
                className="w-full"
              >
                <div
                  onClick={() => {
                    document.getElementById("function-button")?.click();
                  }}
                  className="color-text-link cursor-pointer text-helper-text-sm"
                >
                  Learn More
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </DraggableDiv>
  );
};

export default FormulaHint;
