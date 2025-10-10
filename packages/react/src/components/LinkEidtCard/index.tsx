import React, {
  useContext,
  useState,
  useMemo,
  useCallback,
  useLayoutEffect,
  useRef,
  useEffect,
} from "react";
import {
  locale,
  saveHyperlink,
  LinkCardProps,
  removeHyperlink,
  replaceHtml,
  goToLink,
  isLinkValid,
} from "@fileverse-dev/fortune-core";
import {
  Button,
  TextField,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  LucideIcon,
} from "@fileverse/ui";
import "./index.css";
import _ from "lodash";
import WorkbookContext from "../../context";
import SVGIcon from "../SVGIcon";

export const LinkEditCard: React.FC<LinkCardProps> = ({
  r,
  c,
  rc,
  originText,
  originType,
  originAddress,
  isEditing,
  position,
}) => {
  const { context, setContext, refs } = useContext(WorkbookContext);
  const [linkText, setLinkText] = useState<string>(originText);
  const [linkAddress, setLinkAddress] = useState<string>(originAddress);
  const [linkType, setLinkType] = useState<string>(originType);
  const { insertLink, linkTypeList } = locale(context);
  const isLinkAddressValid = isLinkValid(context, linkType, linkAddress);

  const isButtonDisabled = useMemo(() => {
    if (!linkText.trim()) return true;

    if (linkType === "webpage") {
      return !linkAddress.trim() || !isLinkAddressValid.isValid;
    }

    if (linkType === "sheet") {
      return !linkAddress.trim();
    }

    return false;
  }, [linkText, linkAddress, linkType, isLinkAddressValid.isValid]);

  const hideLinkCard = useCallback(() => {
    _.set(refs.globalCache, "linkCard.mouseEnter", false);
    setContext((draftCtx) => {
      draftCtx.linkCard = undefined;
    });
  }, [refs.globalCache, setContext]);

  const containerEvent = useMemo(
    () => ({
      onMouseEnter: () => _.set(refs.globalCache, "linkCard.mouseEnter", true),
      onMouseLeave: () => _.set(refs.globalCache, "linkCard.mouseEnter", false),
      onMouseDown: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) =>
        e.stopPropagation(),
      onMouseMove: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) =>
        e.stopPropagation(),
      onMouseUp: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) =>
        e.stopPropagation(),
      onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => {
        e.stopPropagation();
        if (isButtonDisabled) return;
        if (e.key === "Enter") {
          _.set(refs.globalCache, "linkCard.mouseEnter", false);
          setContext((draftCtx) =>
            saveHyperlink(draftCtx, r, c, linkText, linkType, linkAddress)
          );
        }
      },
      onDoubleClick: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) =>
        e.stopPropagation(),
    }),
    [refs.globalCache, isButtonDisabled]
  );

  const renderToolbarButton = useCallback(
    (iconId: string, onClick: () => void) => (
      <div className="fortune-toolbar-button" onClick={onClick} tabIndex={0}>
        <SVGIcon name={iconId} style={{ width: 16, height: 16 }} />
      </div>
    ),
    []
  );

  useLayoutEffect(() => {
    setLinkAddress(originAddress);
    setLinkText(originText);
    setLinkType(originType);
  }, [rc, originAddress, originText, originType]);

  const hintRef = useRef<HTMLDivElement | null>(null);
  const [popupTopPx, setPopupTopPx] = useState<number>(
    (position?.cellBottom ?? 0) + 4
  );

  const calculatePopupPlacement = useCallback(() => {
    const firstSelection = context?.luckysheet_select_save?.[0];
    if (
      !firstSelection?.top?.toString?.() ||
      !firstSelection?.height_move?.toString?.() ||
      !hintRef.current
    ) {
      return;
    }

    const selectionHeight = firstSelection?.height_move || 0;
    const cellBottom = position?.cellBottom;
    const cellTop = cellBottom - selectionHeight;

    const inputBottom = cellTop + selectionHeight;
    const availableBelow = window.innerHeight - inputBottom;
    const divOffset = hintRef.current?.offsetHeight;
    const hintAbove = divOffset > availableBelow;

    // Final absolute top (document coordinates):
    //  - place just below the selection or just above it with a small margin
    const nextTop = hintAbove
      ? Math.max(0, cellTop - (divOffset + 30))
      : cellBottom + 4;

    setPopupTopPx(nextTop);
  }, [context?.luckysheet_select_save, position?.cellBottom]);

  useLayoutEffect(() => {
    calculatePopupPlacement();
  }, [calculatePopupPlacement, isEditing, rc, position]);

  useEffect(() => {
    const onResize = () => calculatePopupPlacement();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [calculatePopupPlacement]);

  if (!isEditing) {
    return (
      <div
        {...containerEvent}
        onKeyDown={(e) => {
          e.stopPropagation();
        }}
        className="fortune-link-modify-modal link-toolbar"
        style={{ left: position.cellLeft + 20, top: position.cellBottom - 5 }}
      >
        <div
          className="link-content"
          onClick={() => {
            setContext((draftCtx) =>
              goToLink(
                draftCtx,
                r,
                c,
                linkType,
                linkAddress,
                refs.scrollbarX.current!,
                refs.scrollbarY.current!
              )
            );
          }}
          tabIndex={0}
        >
          {linkType === "webpage"
            ? insertLink.openLink
            : replaceHtml(insertLink.goTo, { linkAddress })}
        </div>
        {context.allowEdit === true && <div className="divider" />}
        {context.allowEdit === true &&
          linkType === "webpage" &&
          renderToolbarButton("copy", () => {
            navigator.clipboard.writeText(originAddress);
            hideLinkCard();
          })}
        {context.allowEdit === true &&
          renderToolbarButton("pencil", () =>
            setContext((draftCtx) => {
              if (draftCtx.linkCard != null && draftCtx.allowEdit) {
                draftCtx.linkCard.isEditing = true;
              }
            })
          )}
        {context.allowEdit === true && <div className="divider" />}
        {context.allowEdit === true &&
          renderToolbarButton("unlink", () =>
            setContext((draftCtx) => {
              _.set(refs.globalCache, "linkCard.mouseEnter", false);
              removeHyperlink(draftCtx, r, c);
            })
          )}
      </div>
    );
  }

  return (
    <div
      className="fortune-link-card"
      ref={hintRef}
      style={{
        left: position.cellLeft + 20,
        top: popupTopPx,
      }}
      {...containerEvent}
    >
      <Select
        value={linkType}
        onValueChange={(value) => {
          if (value === "sheet") {
            if (!linkText) {
              setLinkText(context.luckysheetfile[0].name);
            }
            setLinkAddress(context.luckysheetfile[0].name);
          } else {
            setLinkAddress("");
          }
          setLinkType(value);
        }}
      >
        <SelectTrigger className="fortune-link-type-select">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="fortune-link-type-dropdown">
          {linkTypeList
            .filter((type) => type.value !== "cellrange")
            .map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.text}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>

      <div className="fortune-input-with-icon">
        <div className="input-icon">
          <LucideIcon name="ALargeSmall" />
        </div>
        <TextField
          placeholder="Display text"
          value={linkText}
          onChange={(e) => setLinkText(e.target.value)}
          className="fortune-link-input"
          autoFocus={!linkText}
        />
      </div>

      {linkType === "webpage" && (
        <div className="fortune-input-with-icon">
          <div className="input-icon">
            <SVGIcon name="link" width={16} height={16} />
          </div>
          <TextField
            placeholder="Paste URL"
            value={linkAddress}
            autoFocus={!!linkText}
            onChange={(e) => setLinkAddress(e.target.value)}
            className={`fortune-link-input ${
              !linkAddress || isLinkAddressValid.isValid ? "" : "error-input"
            }`}
          />
        </div>
      )}

      {linkType === "sheet" && (
        <div className="fortune-input-with-icon">
          <div className="input-icon">
            <SVGIcon name="link" width={16} height={16} />
          </div>
          <Select
            onValueChange={(value) => {
              if (!linkText) setLinkText(value);
              setLinkAddress(value);
            }}
            value={linkAddress}
          >
            <SelectTrigger className="fortune-sheet-select">
              <SelectValue placeholder="[Sheet name]" />
            </SelectTrigger>
            <SelectContent className="fortune-sheet-dropdown">
              {context.luckysheetfile.map((sheet) => (
                <SelectItem key={sheet.id} value={sheet.name}>
                  {sheet.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <Button
        className="fortune-insert-button"
        disabled={isButtonDisabled}
        onClick={() => {
          if (isButtonDisabled) return;
          _.set(refs.globalCache, "linkCard.mouseEnter", false);
          setContext((draftCtx) =>
            saveHyperlink(draftCtx, r, c, linkText, linkType, linkAddress)
          );
        }}
      >
        Insert link
      </Button>
    </div>
  );
};

export default LinkEditCard;
