import { RefObject, useContext, useEffect } from "react";
import { removeEditingComment } from "@fileverse-dev/fortune-core";
import WorkbookContext from "../../context";

export const useSmoothScroll = (
  scrollContainerRef: RefObject<HTMLDivElement | null>
) => {
  const { context, refs, setContext } = useContext(WorkbookContext);
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

    function scheduleScrollUpdate(x: number, y: number) {
      queuedXPixels += x;
      queuedYPixels += y;
      if (!animationFrameId)
        animationFrameId = requestAnimationFrame(applyQueuedScroll);
    }

    function handleWheelEvent(event: WheelEvent) {
      event.preventDefault();
      setContext((ctx) => {
        removeEditingComment(ctx, refs.globalCache);
      });
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
      scheduleScrollUpdate(
        event.deltaX * scaleFactor,
        event.deltaY * scaleFactor
      );
    }

    scrollContainer.addEventListener("wheel", handleWheelEvent, {
      passive: false,
    });
    return {
      scheduleScrollUpdate,
      detach() {
        scrollContainer.removeEventListener("wheel", handleWheelEvent);
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
      },
    };
  }

  function attachTouchPanToQueue(
    containerEl: HTMLElement,
    scheduleScrollUpdate: (x: number, y: number) => void,
    getPixelScale: () => number
  ) {
    let dragging = false;
    let lastX = 0;
    let lastY = 0;

    function onPointerDown(e: PointerEvent) {
      if (e.pointerType !== "touch" && e.pointerType !== "pen") return;
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      containerEl.setPointerCapture(e.pointerId);
      e.preventDefault();
    }
    function onPointerMove(e: PointerEvent) {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      const scale = getPixelScale();
      // natural: finger right/down moves content left/up
      scheduleScrollUpdate(-dx * scale, -dy * scale);
      e.preventDefault();
    }
    function onPointerUp(e: PointerEvent) {
      if (!dragging) return;
      dragging = false;
      try {
        containerEl.releasePointerCapture(e.pointerId);
      } catch {}
    }

    containerEl.addEventListener("pointerdown", onPointerDown, {
      passive: false,
    });
    containerEl.addEventListener("pointermove", onPointerMove, {
      passive: false,
    });
    containerEl.addEventListener("pointerup", onPointerUp);
    containerEl.addEventListener("pointercancel", onPointerUp);

    return () => {
      containerEl.removeEventListener("pointerdown", onPointerDown as any);
      containerEl.removeEventListener("pointermove", onPointerMove as any);
      containerEl.removeEventListener("pointerup", onPointerUp as any);
      containerEl.removeEventListener("pointercancel", onPointerUp as any);
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
    scrollContainerEl: HTMLElement,
    horizontalScrollbarEl: HTMLDivElement,
    verticalScrollbarEl: HTMLDivElement
  ) {
    const moveScrollbarsByPixels = makeScrollbarsMoveByPixels(
      horizontalScrollbarEl,
      verticalScrollbarEl
    );
    const { scheduleScrollUpdate, detach } = attachSmoothWheelScroll(
      scrollContainerEl,
      moveScrollbarsByPixels,
      () => (window.devicePixelRatio || 1) * context.zoomRatio
    );
    const detachTouch = attachTouchPanToQueue(
      scrollContainerEl,
      scheduleScrollUpdate,
      () => (window.devicePixelRatio || 1) * context.zoomRatio
    );

    return () => {
      detach();
      detachTouch();
    };
  }
  useEffect(() => {
    const scrollContainerEl = scrollContainerRef.current;
    const horizontalScrollbarEl = refs.scrollbarX.current;
    const verticalScrollbarEl = refs.scrollbarY.current;
    if (!scrollContainerEl || !horizontalScrollbarEl || !verticalScrollbarEl)
      return () => {};

    const unmountScrollHandler = routeWheelScrollToScrollbars(
      scrollContainerEl,
      horizontalScrollbarEl,
      verticalScrollbarEl
    );

    return unmountScrollHandler;
  }, [context.zoomRatio]);
};
