import React from "react";
import { LucideIcon, Tooltip } from "@fileverse/ui";
import { getLucideIcon } from ".";

type Props = {
  tooltip: string;
  iconId: string;
  onClick?: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  disabled?: boolean;
  selected?: boolean;
  children?: React.ReactNode;
  style?: React.CSSProperties;
};

const Button: React.FC<Props> = ({
  tooltip,
  onClick,
  iconId,
  disabled,
  selected,
  children,
  style,
}) => {
  // const style: CSSProperties = { userSelect: "none" };
  return (
    <Tooltip text={tooltip} placement="bottom">
      <div
        className="fortune-toolbar-button fortune-toolbar-item"
        onClick={onClick}
        tabIndex={0}
        role="button"
        style={selected ? { backgroundColor: "#E7E5EB" } : style}
      >
        <LucideIcon
          name={getLucideIcon(iconId)}
          width={16}
          height={16}
          style={disabled ? { opacity: 0.3 } : {}}
        />
        {children}
      </div>
    </Tooltip>
  );
};

export default Button;
