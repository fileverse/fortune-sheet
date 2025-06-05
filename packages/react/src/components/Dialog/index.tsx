import { locale } from "@fileverse-dev/fortune-core";
import { Button, cn, IconButton } from "@fileverse/ui";
import React, { useContext } from "react";
import WorkbookContext from "../../context";
import "./index.css";

type Props = {
  type?: "ok" | "yesno";
  onOk?: () => void;
  onCancel?: () => void;
  containerStyle?: React.CSSProperties;
  contentStyle?: React.CSSProperties;
  children?: React.ReactNode;
  title?: string | React.ReactNode;
};

const Dialog: React.FC<Props> = ({
  type,
  onOk,
  onCancel,
  children,
  containerStyle,
  contentStyle,
  title,
}) => {
  const { context } = useContext(WorkbookContext);
  const { button } = locale(context);
  return (
    <div className="fortune-dialog" style={containerStyle}>
      <div
        className={cn(
          "flex items-center justify-end border-b color-border-default py-3 px-6",
          {
            "justify-between": title,
          }
        )}
      >
        {title && <div className="text-heading-sm">{title}</div>}
        <IconButton icon="X" variant="ghost" onClick={onCancel} tabIndex={0} />
      </div>
      <div className="px-6 pb-6 pt-4 text-body-sm" style={contentStyle}>
        {children}
      </div>
      {type != null && (
        <div className="px-6 pb-6 flex flex-row gap-2 justify-end">
          {type === "ok" ? (
            <Button
              variant="default"
              style={{
                minWidth: "80px",
              }}
              onClick={onOk}
              tabIndex={0}
            >
              {button.confirm}
            </Button>
          ) : (
            <>
              <Button
                variant="secondary"
                style={{
                  minWidth: "80px",
                }}
                onClick={onCancel}
                tabIndex={0}
              >
                {button.cancel}
              </Button>
              <Button
                variant="default"
                style={{
                  minWidth: "80px",
                }}
                onClick={onOk}
                tabIndex={0}
              >
                {button.confirm}
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Dialog;
