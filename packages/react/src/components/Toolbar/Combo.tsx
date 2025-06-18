import React, { CSSProperties, useMemo, useRef, useState } from "react";
import {
  IconButton,
  // LucideIcon,
  Tooltip,
  Popover,
  PopoverContent,
  PopoverTrigger,
  cn,
} from "@fileverse/ui";
import SVGIcon from "../SVGIcon";
import { getLucideIcon } from ".";

type Props = {
  tooltip: string;
  iconId?: string;
  text?: string;
  showArrow?: boolean;
  onClick?: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  children: (
    setOpen: React.Dispatch<React.SetStateAction<boolean>>
  ) => React.ReactNode;
  fillColor?: string;
};

const Combo: React.FC<Props> = ({
  tooltip,
  onClick,
  text,
  iconId,
  showArrow = true,
  children,
  fillColor
}) => {
  const style: CSSProperties = { userSelect: "none" };
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);

  const isLucideIcon = useMemo(() => {
    return (
      iconId?.startsWith("align-") ||
      [
        "text-overflow",
        "text-wrap",
        "text-clip",
        "font-color",
        "background",
        "border-all",
        "merge-all",
        "format",
        "conditionFormat",
        "filter",
        "comment",
        "image",
        "formula-sum",
        "dune",
        "template",
        "font-color",
        "background",
      ].includes(iconId as string)
    );
  }, [iconId]);

  const trigger = !isLucideIcon ? (
    <Tooltip text={tooltip} placement="bottom">
      <div
        className="fortune-toolbar-combo-button"
        onClick={(e) => {
          if (onClick) {
            onClick(e);
            // If there's no arrow, also toggle dropdown after executing onClick
            if (!showArrow) setOpen(!open);
          }
        }}
        tabIndex={0}
        role="button"
        style={style}
      >
        {iconId ? (
          <SVGIcon name={iconId} width={16} height={16} />
        ) : (
          <span className="fortune-toolbar-combo-text">
            {text !== undefined ? text : ""}
          </span>
        )}
      </div>
    </Tooltip>
  ) : (
    <Tooltip text={tooltip} placement="bottom">
      <IconButton
        icon={getLucideIcon(iconId as string)}
        variant="ghost"
        onClick={() => setOpen(!open)}
        className={cn("fortune-toolbar-combo-button", {
          "custom-color-button": iconId === "font-color" && fillColor,
        })}
        style={{
          color: iconId === "font-color" ? fillColor : undefined,
        }}
      />
    </Tooltip>
  );

  return (
    <div ref={buttonRef} className="fortune-toolbar-item">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="flex items-center">
            {trigger}
            {/* {showArrow && (
              <div
                className="fortune-toolbar-combo-arrow"
                onClick={() => setOpen(!open)}
                tabIndex={0}
                role="button"
                style={style}
              >
                <LucideIcon name="ChevronDown" width={14} height={14} />
              </div>
            )} */}
          </div>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          side="bottom"
          sideOffset={4}
          alignOffset={-16}
          className="fortune-toolbar-combo-popup border-none"
        >
          {children?.(setOpen)}
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default Combo;
