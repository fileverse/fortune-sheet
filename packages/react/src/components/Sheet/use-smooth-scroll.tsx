import { RefObject, useContext, useEffect } from "react";
import { removeEditingComment } from "@fileverse-dev/fortune-core";
import WorkbookContext from "../../context";

export const useSmoothScroll = (
  scrollContainerRef: RefObject<HTMLDivElement | null>
) => {
  const { context, refs, setContext } = useContext(WorkbookContext);
  function handleScroll(
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

    function scrollHandler(x: number, y: number) {
      queuedXPixels += x;
      queuedYPixels += y;
      if (!animationFrameId)
        animationFrameId = requestAnimationFrame(applyQueuedScroll);
    }

    function handleWheelEvent(event: WheelEvent) {
      setContext((ctx) => {
        removeEditingComment(ctx, refs.globalCache);
      });
      const functionDetailsElement =
        document.getElementById("function-details");
      const formulaSearchElement = document.getElementById(
        "luckysheet-formula-search-c-p"
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
      event.preventDefault();
      const scaleFactor = getPixelScale();
      scrollHandler(event.deltaX * scaleFactor, event.deltaY * scaleFactor);
    }

    scrollContainer.addEventListener("wheel", handleWheelEvent, {
      passive: false,
    });
    return {
      scrollHandler,
      detach() {
        scrollContainer.removeEventListener("wheel", handleWheelEvent);
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
      },
    };
  }

  function handleMobileScroll(
    containerEl: HTMLElement,
    scrollHandler: (x: number, y: number) => void,
    getPixelScale: () => number
  ) {
    let isScrolling = false;
    let gestureStartClientX = 0;
    let gestureStartClientY = 0;
    let lastPointerClientX = 0;
    let lastPointerClientY = 0;
    const PAN_DISTANCE_THRESHOLD_PX = 8;

    function onPointerDown(pointerEvent: PointerEvent) {
      if (
        pointerEvent.pointerType !== "touch" &&
        pointerEvent.pointerType !== "pen"
      )
        return;
      isScrolling = false;
      gestureStartClientX = pointerEvent.clientX;
      lastPointerClientX = pointerEvent.clientX;
      gestureStartClientY = pointerEvent.clientY;
      lastPointerClientY = pointerEvent.clientY;
      containerEl.setPointerCapture(pointerEvent.pointerId);
    }

    function onPointerMove(pointerEvent: PointerEvent) {
      if (
        pointerEvent.pointerType !== "touch" &&
        pointerEvent.pointerType !== "pen"
      )
        return;

      const deltaXSinceLastMove = pointerEvent.clientX - lastPointerClientX;
      const deltaYSinceLastMove = pointerEvent.clientY - lastPointerClientY;
      lastPointerClientX = pointerEvent.clientX;
      lastPointerClientY = pointerEvent.clientY;

      if (!isScrolling) {
        const totalXFromGestureStart = lastPointerClientX - gestureStartClientX;
        const totalYFromGestureStart = lastPointerClientY - gestureStartClientY;
        if (
          totalXFromGestureStart * totalXFromGestureStart +
            totalYFromGestureStart * totalYFromGestureStart <
          PAN_DISTANCE_THRESHOLD_PX * PAN_DISTANCE_THRESHOLD_PX
        ) {
          return; // still a tap – do nothing
        }
        isScrolling = true;
      }

      // now we’re panning: prevent page scroll, move sheet
      pointerEvent.preventDefault();
      const scale = getPixelScale();
      scrollHandler(-deltaXSinceLastMove * scale, -deltaYSinceLastMove * scale);
    }

    function onPointerUp(e: PointerEvent) {
      try {
        containerEl.releasePointerCapture(e.pointerId);
      } catch {}
      isScrolling = false;
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

  const makeScrollableAreaMoveByPixels = (
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

  function mountScrollEventHandlers(
    scrollContainerEl: HTMLElement,
    horizontalScrollbarEl: HTMLDivElement,
    verticalScrollbarEl: HTMLDivElement
  ) {
    const moveScrollableAreaByPixels = makeScrollableAreaMoveByPixels(
      horizontalScrollbarEl,
      verticalScrollbarEl
    );
    const { scrollHandler, detach: unmountScrollHandler } = handleScroll(
      scrollContainerEl,
      moveScrollableAreaByPixels,
      () => (window.devicePixelRatio || 1) * context.zoomRatio
    );
    const unmountMobileScrollHandler = handleMobileScroll(
      scrollContainerEl,
      scrollHandler,
      () => (window.devicePixelRatio || 1) * context.zoomRatio
    );

    return () => {
      unmountScrollHandler();
      unmountMobileScrollHandler();
    };
  }
  useEffect(() => {
    const scrollContainerEl = scrollContainerRef.current;
    const horizontalScrollbarEl = refs.scrollbarX.current;
    const verticalScrollbarEl = refs.scrollbarY.current;
    if (!scrollContainerEl || !horizontalScrollbarEl || !verticalScrollbarEl)
      return () => {};

    const unmountScrollEventHandlers = mountScrollEventHandlers(
      scrollContainerEl,
      horizontalScrollbarEl,
      verticalScrollbarEl
    );

    return unmountScrollEventHandlers;
  }, [context.zoomRatio]);
};
