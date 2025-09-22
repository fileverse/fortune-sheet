import { locale } from "@fileverse-dev/fortune-core";
import { Button, TextField, LucideIcon } from "@fileverse/ui";
import React, { useContext, useEffect, useRef, useState } from "react";
import WorkbookContext from "../../../context";
import "./index.css";
import { DraggableDiv } from "./dragable-div";

const FormulaHint = (props: any) => {
  const { showFormulaHint, handleShowFormulaHint } = props;
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
  }, []);

  useEffect(() => {
    if (!top) {
      setTimeout(() => {
        setShowDelayedHint(true);
      }, 40);
    }
  }, [top]);

  useEffect(() => {
    // this handle scroll for function details section
    const el = document.getElementById("function-details");
    let handleWheel: any;
    if (el) {
      let scrollLockTimeout: any = null;
      const cache = {
        verticalScrollLock: false,
        horizontalScrollLock: false,
      };

      handleWheel = (e: WheelEvent) => {
        e.preventDefault();

        const step = 40;
        const ratio = 1;

        if (e.deltaY !== 0 && !cache.verticalScrollLock) {
          cache.horizontalScrollLock = true;
          el.scrollTop += (e.deltaY > 0 ? 1 : -1) * step * ratio;
        } else if (e.deltaX !== 0 && !cache.horizontalScrollLock) {
          cache.verticalScrollLock = true;
          el.scrollLeft += (e.deltaX > 0 ? 1 : -1) * step * ratio;
        }

        clearTimeout(scrollLockTimeout);
        scrollLockTimeout = setTimeout(() => {
          cache.verticalScrollLock = false;
          cache.horizontalScrollLock = false;
        }, 50);
      };

      el.addEventListener("wheel", handleWheel, { passive: false });
    }
    return () => {
      if (el && handleWheel) el.removeEventListener("wheel", handleWheel);
    };
  }, []);

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
          <button
            type="button"
            className="flex items-center justify-center w-4 h-4 rounded-full"
            style={{
              backgroundColor: "black",
              zIndex: 2000,
              position: "absolute",
              left: "327px",
              top: "-8px",
            }}
            onClick={handleShowFormulaHint}
            aria-label="Close formula hint"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className=" text-white"
              style={{ width: "12px", height: "12px" }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="3"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
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
                : "#F8F9FA",
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
                }
                dragHasMoved.current = false;
              }}
              className="flex cursor-pointer items-start justify-between"
              style={{
                backgroundColor: `${
                  fn.BRAND_COLOR ? fn.BRAND_COLOR : "#F8F9FA"
                }`,
                padding: "10px",
                borderRadius: "10px",
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
                        fontSize: "14px",
                      }}
                      className="font-family-mono mb-1 color-text-default jetbrains-mono"
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
                          fontSize: "14px",
                          padding: "0px",
                        }}
                        className="font-family-mono mb-1 mt-2 color-text-default"
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
                    {fn.p.map((param: any) => (
                      <div className="" key={param.name}>
                        <div>
                          <code className="font-family-mono mb-1 mt-2 color-text-default font-family-mono">
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
