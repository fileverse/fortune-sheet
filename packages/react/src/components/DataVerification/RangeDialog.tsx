import { locale } from "@fileverse-dev/fortune-core";
import { Button, cn, IconButton, TextField } from "@fileverse/ui";
import React, { useCallback, useContext, useEffect, useState } from "react";
// import DataVerification from ".";
import WorkbookContext from "../../context";
import { useDialog } from "../../hooks/useDialog";
// import ConditionRules from "../ConditionFormat/ConditionRules";
import "./index.css";
import { getDisplayedRangeTxt } from "./getDisplayedRangeTxt";

const RangeDialog: React.FC = () => {
  const { context, setContext } = useContext(WorkbookContext);
  const { showDialog } = useDialog();
  const {
    dataVerification,
    button,
    // toolbar
  } = locale(context);
  const [rangeTxt2, setRangeTxt2] = useState<string>(
    getDisplayedRangeTxt(context)
  );

  const close = useCallback(() => {
    setContext((ctx) => {
      ctx.rangeDialog!.show = false;
      ctx.rangeDialog!.singleSelect = false;
    });
    document.getElementById("data-verification-button")?.click();
    // console.log("close", context,context.rangeDialog.type);
    // if (!context.rangeDialog) return;
    // const rangeDialogType = context.rangeDialog.type;
    // if (rangeDialogType.indexOf("between") >= 0) {
    //   showDialog(
    //     <ConditionRules type="between" />,
    //     undefined,
    //     (locale(context).conditionformat as any).conditionformat_between
    //   );
    //   return;
    // }
    // if (rangeDialogType.indexOf("conditionRules") >= 0) {
    //   const rulesType = rangeDialogType.substring(
    //     "conditionRules".length,
    //     rangeDialogType.length
    //   );
    //   showDialog(
    //     <ConditionRules type={rulesType} />,
    //     undefined,
    //     (locale(context).conditionformat as any)[`conditionformat_${rulesType}`]
    //   );
    // }
    // document.getElementById("data-verification-button")?.click();
    // showDialog(<DataVerification />, undefined, toolbar.dataVerification);
  }, [setContext, showDialog, context]);

  useEffect(() => {
    setRangeTxt2(getDisplayedRangeTxt(context));
  }, [context, context.luckysheet_select_save]);

  return (
    <div
      id="range-dialog"
      className="fortune-dialog"
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onMouseUp={(e) => e.stopPropagation()}
      tabIndex={0}
    >
      <div
        className={cn(
          "flex items-center justify-between border-b color-border-default py-3 px-6"
        )}
      >
        <div className="text-heading-sm">
          {dataVerification.selectCellRange}
        </div>
        <IconButton icon="X" variant="ghost" onClick={close} tabIndex={0} />
      </div>
      <div className="px-6 pb-6 pt-4 text-body-sm">
        <TextField
          className="w-full"
          readOnly
          placeholder={dataVerification.selectCellRange2}
          value={rangeTxt2}
        />
      </div>
      <div className="px-6 pb-6 flex flex-row gap-2 justify-end">
        <Button
          variant="secondary"
          style={{ minWidth: "80px" }}
          onClick={close}
          tabIndex={0}
        >
          {button.close}
        </Button>
        <Button
          variant="default"
          style={{ minWidth: "80px" }}
          onClick={() => {
            setContext((ctx) => {
              ctx.rangeDialog!.rangeTxt = rangeTxt2;
            });
            close();
          }}
          tabIndex={0}
        >
          {button.confirm}
        </Button>
      </div>
    </div>
  );
};

export default RangeDialog;
