/* eslint-disable no-plusplus */
import React, { useContext } from "react";
import WorkbookContext from "../../context";

const ErrorBoxes: React.FC = () => {
  const { context } = useContext(WorkbookContext);

  const error = context.hoverErrorBox;
  if (!error) return null;
  const { left, top, title, message } = error;

  return (
    <div
      style={{
        borderLeft: `4px solid #FB3449`,
        width: "auto",
        maxWidth: "280px",
        height: "auto",
        left,
        top,
        position: "absolute",
        padding: "8px",
        background: "#FFFFFF",
        zIndex: 100,
        borderRadius: "4px",
      }}
      className="shadow-lg flex flex-col gap-2 break-all"
    >
      <h3 className="text-heading-xsm color-text-danger">{title}</h3>
      <div className="color-text-default text-body-sm">{message}</div>
    </div>
  );
};

export default ErrorBoxes;
