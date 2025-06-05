import React, { useCallback, useContext, useEffect, useState } from "react";
import "./index.css";
import { locale, setConditionRules } from "@fileverse-dev/fortune-core";
import produce from "immer";
import {
  Button,
  Checkbox,
  Divider,
  IconButton,
  LucideIcon,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  TextField,
} from "@fileverse/ui";
import WorkbookContext from "../../context";
import { useDialog } from "../../hooks/useDialog";
import { getDisplayedRangeTxt } from "../DataVerification/getDisplayedRangeTxt";

// Add styles for the datepicker
const datepickerStyles = `
  .datepicker-toggle {
    display: inline-block;
    position: relative;
    width: 100%;
  }
  
  .datepicker-toggle-button {
    opacity: 0.3;
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    width: 16px;
    height: 16px;
    background-image: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxyZWN0IHg9IjMiIHk9IjQiIHdpZHRoPSIxOCIgaGVpZ2h0PSIxOCIgcng9IjIiIHJ5PSIyIj48L3JlY3Q+PGxpbmUgeDE9IjE2IiB5MT0iMiIgeDI9IjE2IiB5Mj0iNiI+PC9saW5lPjxsaW5lIHgxPSI4IiB5MT0iMiIgeDI9IjgiIHkyPSI2Ij48L2xpbmU+PGxpbmUgeDE9IjMiIHkxPSIxMCIgeDI9IjIxIiB5Mj0iMTAiPjwvbGluZT48L3N2Zz4=');
    background-repeat: no-repeat;
    background-position: center;
    pointer-events: none;
  }
  
  .datepicker-input {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    font-size: 14px;
    line-height: 1.5;
    color: #1a202c;
    background-color: #fff;
    cursor: pointer;
  }
  
  .datepicker-input::-webkit-calendar-picker-indicator {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
    cursor: pointer;
    opacity: 0;
  }
  
  .datepicker-input:focus {
    outline: none;
    border-color: #4299e1;
    box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
  }
`;

// Add the styles to the document
if (typeof document !== "undefined") {
  const styleSheet = document.createElement("style");
  styleSheet.textContent = datepickerStyles;
  document.head.appendChild(styleSheet);
}

const ConditionRules: React.FC<{ type: string }> = ({ type }) => {
  const { context, setContext } = useContext(WorkbookContext);
  const { hideDialog } = useDialog();
  const { conditionformat, button, protection, generalDialog } =
    locale(context);
  const [colorRules, setColorRules] = useState<{
    textColor: string;
    cellColor: string;
  }>({ textColor: "#FFFFFF", cellColor: "#D82E2A" });

  // 开启鼠标选区
  const dataSelectRange = useCallback(
    (selectType: string) => {
      hideDialog();
      setContext((ctx) => {
        ctx.conditionRules.textColor.color = colorRules.textColor;
        ctx.conditionRules.cellColor.color = colorRules.cellColor;

        ctx.rangeDialog!.show = true;
        ctx.rangeDialog!.type = selectType;
        ctx.rangeDialog!.rangeTxt = ctx.conditionRules.rulesValue;
        ctx.rangeDialog!.singleSelect = true;
      });
    },
    [colorRules.cellColor, colorRules.textColor, hideDialog, setContext]
  );

  const close = useCallback(
    (closeType: string) => {
      if (closeType === "confirm") {
        setContext((ctx) => {
          ctx.conditionRules.textColor.color = colorRules.textColor;
          ctx.conditionRules.cellColor.color = colorRules.cellColor;
          setConditionRules(
            ctx,
            protection,
            generalDialog,
            conditionformat,
            ctx.conditionRules
          );
        });
      }
      setContext((ctx) => {
        ctx.conditionRules = {
          rulesType: "",
          rulesValue: "",
          textColor: { check: true, color: "#000000" },
          cellColor: { check: true, color: "#000000" },
          betweenValue: { value1: "", value2: "" },
          dateValue: "",
          repeatValue: "0",
          projectValue: "10",
        };
      });
      hideDialog();
    },
    [
      colorRules,
      conditionformat,
      generalDialog,
      hideDialog,
      protection,
      setContext,
    ]
  );

  // rulesValue初始化
  useEffect(() => {
    setContext((ctx) => {
      ctx.conditionRules.rulesType = type;

      if (!ctx.rangeDialog) return;
      const rangeDialogType = ctx.rangeDialog.type;
      const rangeT = ctx.rangeDialog!.rangeTxt;
      if (rangeDialogType === "conditionRulesbetween1") {
        ctx.conditionRules.betweenValue.value1 = rangeT;
      } else if (rangeDialogType === "conditionRulesbetween2") {
        ctx.conditionRules.betweenValue.value2 = rangeT;
      } else if (rangeDialogType.indexOf("conditionRules") >= 0) {
        ctx.conditionRules.rulesValue = rangeT;
      } else if (rangeDialogType === "") {
        ctx.conditionRules = {
          rulesType: type,
          rulesValue: "",
          textColor: { check: true, color: "#000000" },
          cellColor: { check: true, color: "#000000" },
          betweenValue: { value1: "", value2: "" },
          dateValue: "",
          repeatValue: "0",
          projectValue: "10",
        };
      }
      ctx.rangeDialog.type = "";
      ctx.rangeDialog.rangeTxt = "";
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const titleType =
    // eslint-disable-next-line no-nested-ternary
    type === "top10_percent"
      ? "top10"
      : type === "last10_percent"
      ? "last10"
      : type;

  return (
    <div className="condition-rules">
      {!["aboveAverage", "belowAverage"].includes(type) && (
        <div className="flex flex-col">
          <div className="condition-rules-value text-heading-xsm">
            {(conditionformat as any)[`conditionformat_${titleType}_title`]}
          </div>

          {(type === "greaterThan" ||
            type === "lessThan" ||
            type === "equal" ||
            type === "textContains") && (
            <div className="w-full">
              <TextField
                value={context.conditionRules.rulesValue}
                onChange={(e) => {
                  const { value } = e.target;
                  setContext((ctx) => {
                    ctx.conditionRules.rulesValue = value;
                  });
                }}
              />
            </div>
          )}

          {type === "between" && (
            <div className="w-full flex gap-2 items-center">
              <div className="w-full">
                <TextField
                  placeholder="From"
                  value={context.conditionRules.betweenValue.value1}
                  onChange={(e) => {
                    const { value } = e.target;
                    setContext((ctx) => {
                      ctx.conditionRules.betweenValue.value1 = value;
                    });
                  }}
                />
              </div>
              <div className="w-full">
                <TextField
                  placeholder="To"
                  value={context.conditionRules.betweenValue.value2}
                  onChange={(e) => {
                    const { value } = e.target;
                    setContext((ctx) => {
                      ctx.conditionRules.betweenValue.value2 = value;
                    });
                  }}
                />
              </div>
            </div>
          )}
          {type === "occurrenceDate" && (
            <div className="datepicker-toggle">
              <input
                type="date"
                className="datepicker-input"
                value={context.conditionRules.dateValue}
                onChange={(e) => {
                  const { value } = e.target;
                  setContext((ctx) => {
                    ctx.conditionRules.dateValue = value;
                  });
                }}
              />
              <span className="datepicker-toggle-button" />
            </div>
          )}
          {type === "duplicateValue" && (
            <Select
              value={context.conditionRules.repeatValue}
              onValueChange={(value) => {
                setContext((ctx) => {
                  ctx.conditionRules.repeatValue = value;
                });
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="condition-rules-select">
                <SelectItem value="0">
                  {conditionformat.duplicateValue}
                </SelectItem>
                <SelectItem value="1">{conditionformat.uniqueValue}</SelectItem>
              </SelectContent>
            </Select>
          )}

          {(type === "top10" ||
            type === "top10_percent" ||
            type === "last10" ||
            type === "last10_percent") && (
            <div className="condition-rules-project-box">
              {type === "top10" || type === "top10_percent"
                ? conditionformat.top
                : conditionformat.last}

              <div className="flex items-center">
                <IconButton
                  icon="Minus"
                  variant="ghost"
                  className="!bg-transparent"
                  disabled={Number(context.conditionRules.projectValue) <= 1}
                  onClick={() => {
                    setContext((ctx) => {
                      const current =
                        Number(ctx.conditionRules.projectValue) || 0;
                      ctx.conditionRules.projectValue = String(
                        Math.max(current - 1, 1)
                      ); // Prevent going below 1 if needed
                    });
                  }}
                />
                <TextField
                  className="condition-rules-project-input pr-0"
                  type="number"
                  min={1}
                  max={type === "top10" || type === "last10" ? 10 : 100}
                  value={context.conditionRules.projectValue}
                  onChange={(e) => {
                    const { value } = e.target;
                    setContext((ctx) => {
                      ctx.conditionRules.projectValue = value;
                    });
                  }}
                  rightIcon={
                    type === "top10" || type === "last10" ? (
                      <span className="color-icon-secondary">
                        {conditionformat.oneself}
                      </span>
                    ) : (
                      <span className="color-icon-secondary">%</span>
                    )
                  }
                />
                <IconButton
                  icon="Plus"
                  variant="ghost"
                  className="!bg-transparent"
                  disabled={
                    Number(context.conditionRules.projectValue) >=
                    (type === "top10" || type === "last10" ? 10 : 100)
                  }
                  onClick={() => {
                    setContext((ctx) => {
                      const current =
                        Number(ctx.conditionRules.projectValue) || 0;
                      ctx.conditionRules.projectValue = String(current + 1);
                    });
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col">
        <div className="condition-rules-value text-heading-xsm">
          {conditionformat.applyRange}
        </div>
        <TextField
          rightIcon={<LucideIcon name="Grid2x2" size="sm" />}
          aria-hidden="true"
          readOnly
          placeholder={conditionformat.selectRange}
          value={getDisplayedRangeTxt(context)}
          onClick={() => {
            dataSelectRange(`conditionRules${type}`);
          }}
        />
      </div>

      <div className="flex flex-col">
        <div className="condition-rules-set-title text-heading-xsm">
          {`${conditionformat.setAs}：`}
        </div>

        <div className="condition-rules-setbox">
          <div className="condition-rules-set">
            <div className="condition-rules-color">
              <span id="checkTextColor">
                <Checkbox
                  className="border-2"
                  checked={context.conditionRules.textColor.check}
                  onCheckedChange={(e) => {
                    const { checked } = e.target;
                    setContext((ctx) => {
                      ctx.conditionRules.textColor.check = checked;
                    });
                  }}
                />
              </span>
              <label htmlFor="checkTextColor" className="condition-rules-label">
                {conditionformat.textColor}
              </label>
              <input
                type="color"
                className="condition-rules-select-color"
                value={colorRules.textColor}
                onChange={(e) => {
                  const { value } = e.target;
                  setColorRules(
                    produce((draft) => {
                      draft.textColor = value;
                    })
                  );
                }}
              />
            </div>
          </div>
          <div className="condition-rules-set">
            <div className="condition-rules-color">
              <span id="checkCellColor">
                <Checkbox
                  className="border-2"
                  checked={context.conditionRules.cellColor.check}
                  onCheckedChange={(e) => {
                    const { checked } = e.target;
                    setContext((ctx) => {
                      ctx.conditionRules.cellColor.check = checked;
                    });
                  }}
                />
              </span>
              <label htmlFor="checkCellColor" className="condition-rules-label">
                {conditionformat.cellColor}
              </label>
              <input
                type="color"
                className="condition-rules-select-color"
                value={colorRules.cellColor}
                onChange={(e) => {
                  const { value } = e.target;
                  setColorRules(
                    produce((draft) => {
                      draft.cellColor = value;
                    })
                  );
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <Divider className="w-full border-t-[1px]" />
      <div className="flex gap-2 justify-end">
        <Button
          variant="secondary"
          style={{
            minWidth: "80px",
          }}
          onClick={() => {
            // hideDialog();
            close("close");
          }}
          tabIndex={0}
        >
          {button.cancel}
        </Button>
        <Button
          variant="default"
          style={{
            minWidth: "80px",
          }}
          onClick={() => {
            // hideDialog();
            close("confirm");
          }}
          tabIndex={0}
        >
          {button.apply}
        </Button>
      </div>
    </div>
  );
};

export default ConditionRules;
