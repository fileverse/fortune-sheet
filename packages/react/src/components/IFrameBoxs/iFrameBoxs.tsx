import React, { useContext, useEffect, useRef } from "react";
import {
  onIframeMoveStart,
  onIframeResizeStart,
} from "@fileverse-dev/fortune-core";
import WorkbookContext from "../../context";

const IframeBoxs: React.FC = () => {
  const { context, setContext, refs } = useContext(WorkbookContext);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!containerRef.current) return;

      const iframeBoxes = containerRef.current.querySelectorAll(
        ".luckysheet-modal-dialog-iframe"
      );

      const clickedInsideSomeIframe = Array.from(iframeBoxes).some((el) =>
        el.contains(e.target as Node)
      );

      if (!clickedInsideSomeIframe && context.activeIframe !== undefined) {
        setContext((ctx) => {
          ctx.activeIframe = undefined;
        });
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [context.activeIframe, setContext]);

  return (
    <div id="fortune-iframe-boxes" ref={containerRef}>
      {context.insertedIframes?.map((frame: any) => {
        const isActive = frame.id === context.activeIframe;
        const style = {
          width: frame.width * context.zoomRatio,
          height: frame.height * context.zoomRatio,
          left: frame.left * context.zoomRatio,
          top: frame.top * context.zoomRatio,
          position: "absolute" as const,
          padding: 0,
          zIndex: isActive ? 300 : 200,
        };

        return (
          <div
            key={frame.id}
            id={isActive ? "fortune-modal-dialog-activeIframe" : frame.id}
            className="luckysheet-modal-dialog luckysheet-modal-dialog-iframe"
            style={style}
            onClick={(e) => {
              if (!isActive) {
                setContext((ctx) => {
                  ctx.activeIframe = frame.id;
                });
              }
              e.stopPropagation();
            }}
            onMouseDown={(e) => {
              if (isActive) {
                onIframeMoveStart(context, refs.globalCache, e.nativeEvent);
              }
              e.stopPropagation();
            }}
          >
            <div
              className="luckysheet-modal-dialog-content"
              style={{ width: "100%", height: "100%", overflow: "hidden" }}
            >
              <iframe
                title={`iframe-${frame.id}`}
                src={frame.src}
                style={{
                  width: "100%",
                  height: "100%",
                  border: "none",
                  pointerEvents: "none",
                }}
              />
            </div>

            <div className="luckysheet-modal-dialog-border" />

            {isActive && (
              <>
                <div className="luckysheet-modal-dialog-resize">
                  {["lt", "mt", "lm", "rm", "rt", "lb", "mb", "rb"].map(
                    (dir) => (
                      <div
                        key={dir}
                        className={`luckysheet-modal-dialog-resize-item luckysheet-modal-dialog-resize-item-${dir}`}
                        data-type={dir}
                        style={{ zIndex: 300, position: "absolute" }}
                        onMouseDown={(e) => {
                          onIframeResizeStart(
                            context,
                            refs.globalCache,
                            e.nativeEvent,
                            dir
                          );
                          e.stopPropagation();
                        }}
                      />
                    )
                  )}
                </div>

                <div className="luckysheet-modal-dialog-controll">
                  <span
                    className="luckysheet-modal-controll-btn luckysheet-modal-controll-del"
                    role="button"
                    tabIndex={0}
                    title="Delete"
                    onClick={() => {
                      setContext((ctx) => {
                        ctx.insertedIframes = ctx?.insertedIframes?.filter(
                          (f: any) => f.id !== frame.id
                        );
                        ctx.activeIframe = undefined;
                      });
                    }}
                  >
                    DELETE
                  </span>
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default IframeBoxs;
