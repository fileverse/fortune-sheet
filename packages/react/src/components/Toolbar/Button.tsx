import React from "react";
import SVGIcon from "../SVGIcon";

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
    <div
      className="fortune-toolbar-button fortune-toolbar-item"
      onClick={onClick}
      tabIndex={0}
      data-tips={tooltip}
      role="button"
      aria-label={tooltip}
      style={selected ? { backgroundColor: "#E7E5EB" } : style}
    >
      <SVGIcon
        name={iconId}
        width={16}
        height={16}
        style={disabled ? { opacity: 0.3 } : {}}
      />
      {tooltip && <div className="fortune-tooltip">{tooltip}</div>}
      {children}
    </div>
  );
};

export default Button;
