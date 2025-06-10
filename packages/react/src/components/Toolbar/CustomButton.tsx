import React from "react";
import { Tooltip } from "@fileverse/ui";
import CustomIcon from "./CustomIcon";

type Props = {
  tooltip?: string;
  onClick?: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  selected?: boolean;
  children?: React.ReactNode;
  iconName?: string;
  icon?: React.ReactNode;
};

const CustomButton: React.FC<Props> = ({
  tooltip,
  onClick,
  selected,
  children,
  iconName,
  icon,
}) => {
  // const style: CSSProperties = { userSelect: "none" };
  return (
    <Tooltip text={tooltip} placement="bottom">
      <div
        className="fortune-toolbar-button fortune-toolbar-item"
        onClick={onClick}
        tabIndex={0}
        role="button"
        style={selected ? { backgroundColor: "#E7E5EB" } : {}}
      >
        <CustomIcon width={16} height={16} iconName={iconName} content={icon} />
        {children}
      </div>
    </Tooltip>
  );
};

export default CustomButton;
