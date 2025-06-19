import React, { CSSProperties, useMemo, useRef, useState } from "react";
import {
  IconButton,
  Tooltip,
  Popover,
  PopoverContent,
  PopoverTrigger,
  cn,
  Button,
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
  fillColor,
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
    <span>
      {iconId === "font-color" ? (
        <Tooltip text={tooltip} placement="bottom">
          <Button
            variant="ghost"
            onClick={() => setOpen(!open)}
            className={cn("fortune-toolbar-combo-button !min-w-fit !px-0", {})}
            style={{
              width: 30,
              height: 30,
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill={fillColor}
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M11.9997 3C12.3784 3 12.7248 3.21402 12.8942 3.55273L20.8942 19.5527L20.9352 19.6465C21.115 20.1204 20.9101 20.663 20.447 20.8945C19.9839 21.1259 19.4272 20.9642 19.1559 20.5361L19.1052 20.4473L16.8815 16H7.11786L4.89422 20.4473C4.64719 20.9412 4.04636 21.1415 3.55243 20.8945C3.05867 20.6475 2.85831 20.0466 3.10516 19.5527L11.1052 3.55273L11.1764 3.43164C11.3613 3.16376 11.6684 3.0001 11.9997 3ZM8.11786 14H15.8815L11.9997 6.23633L8.11786 14Z"
                fill={fillColor}
              />
            </svg>
          </Button>
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
      )}
    </span>
  );

  return (
    <div ref={buttonRef} className="fortune-toolbar-item">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="flex items-center">{trigger}</div>
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
