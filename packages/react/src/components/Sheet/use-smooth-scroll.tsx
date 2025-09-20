import { RefObject, useContext, useEffect } from "react";
import WorkbookContext from "../../context";

export const useSmoothScroll = (
  scrollContainerRef: RefObject<HTMLDivElement | null>
) => {
  const { context, refs } = useContext(WorkbookContext);
  function attachSmoothWheelScroll(
    scrollContainer: HTMLElement,
    moveScrollBy: (deltaX: number, deltaY: number) => void,
    getPixelScale: () => number = () => window.devicePixelRatio || 1
  ) {
    let queuedXPixels = 0;
    let queuedYPixels = 0;
    let animationFrameId = 0;

    const MAX_PIXEL_DELTA_PER_FRAME = 1200;

    function applyQueuedScroll() {
      animationFrameId = 0;

      if (Math.abs(queuedXPixels) < 0.5 && Math.abs(queuedYPixels) < 0.5) {
        queuedXPixels = 0;
        queuedYPixels = 0;
        return;
      }

      const xPixels = Math.max(
        -MAX_PIXEL_DELTA_PER_FRAME,
        Math.min(MAX_PIXEL_DELTA_PER_FRAME, queuedXPixels)
      );
      const yPixels = Math.max(
        -MAX_PIXEL_DELTA_PER_FRAME,
        Math.min(MAX_PIXEL_DELTA_PER_FRAME, queuedYPixels)
      );

      moveScrollBy(xPixels, yPixels);

      queuedXPixels = 0;
      queuedYPixels = 0;
    }

    function handleWheelEvent(event: WheelEvent) {
      event.preventDefault();

      const functionDetailsElement =
        document.getElementById("function-details");
      const formulaSearchElement = document.getElementById(
        "luckysheet-formula-search-c"
      );
      const isPointerOverFunctionDetails =
        functionDetailsElement?.matches(":hover");
      const isPointerOverFormulaSearch =
        formulaSearchElement?.matches(":hover");
      const isPointerInSearchDialog =
        !!refs?.globalCache?.searchDialog?.mouseEnter;
      const hasFilterContextMenuOpen = context.filterContextMenu != null;

      if (
        (functionDetailsElement && isPointerOverFunctionDetails) ||
        (formulaSearchElement && isPointerOverFormulaSearch) ||
        isPointerInSearchDialog ||
        hasFilterContextMenuOpen
      ) {
        return;
      }

      const scaleFactor = getPixelScale();
      queuedXPixels += event.deltaX * scaleFactor;
      queuedYPixels += event.deltaY * scaleFactor;

      if (!animationFrameId)
        animationFrameId = requestAnimationFrame(applyQueuedScroll);
    }

    scrollContainer.addEventListener("wheel", handleWheelEvent, {
      passive: false,
    });
    return () => {
      scrollContainer.removeEventListener("wheel", handleWheelEvent);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }

  const makeScrollbarsMoveByPixels = (
    horizontalScrollbarEl: HTMLDivElement,
    verticalScrollbarEl: HTMLDivElement
  ) => {
    return (xPixels: number, yPixels: number) => {
      const maxScrollLeft =
        horizontalScrollbarEl.scrollWidth - horizontalScrollbarEl.clientWidth;
      const maxScrollTop =
        verticalScrollbarEl.scrollHeight - verticalScrollbarEl.clientHeight;

      const targetScrollLeft = Math.max(
        0,
        Math.min(maxScrollLeft, horizontalScrollbarEl.scrollLeft + xPixels)
      );
      const targetScrollTop = Math.max(
        0,
        Math.min(maxScrollTop, verticalScrollbarEl.scrollTop + yPixels)
      );

      const didScrollX = targetScrollLeft !== horizontalScrollbarEl.scrollLeft;
      const didScrollY = targetScrollTop !== verticalScrollbarEl.scrollTop;

      if (didScrollX) {
        horizontalScrollbarEl.scrollLeft = targetScrollLeft;
      }
      if (didScrollY) {
        verticalScrollbarEl.scrollTop = targetScrollTop;
      }
    };
  };

  function routeWheelScrollToScrollbars(
    sheetContext: any,
    scrollContainerEl: HTMLElement,
    horizontalScrollbarEl: HTMLDivElement,
    verticalScrollbarEl: HTMLDivElement
  ) {
    const moveScrollbarsByPixels = makeScrollbarsMoveByPixels(
      horizontalScrollbarEl,
      verticalScrollbarEl
    );
    return attachSmoothWheelScroll(
      scrollContainerEl,
      moveScrollbarsByPixels,
      () => (window.devicePixelRatio || 1) * sheetContext.zoomRatio
    );
  }
  useEffect(() => {
    const scrollContainerEl = scrollContainerRef.current;
    const horizontalScrollbarEl = refs.scrollbarX.current;
    const verticalScrollbarEl = refs.scrollbarY.current;
    if (!scrollContainerEl || !horizontalScrollbarEl || !verticalScrollbarEl)
      return () => {};

    const unmountScrollHandler = routeWheelScrollToScrollbars(
      context,
      scrollContainerEl,
      horizontalScrollbarEl,
      verticalScrollbarEl
    );

    return unmountScrollHandler;
  }, [context.zoomRatio]);
};
