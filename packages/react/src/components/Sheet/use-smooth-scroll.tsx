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
    console.log("handleScroll called 6.2");
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
      const isPointerInSearchDialog =
        !!refs?.globalCache?.searchDialog?.mouseEnter;
      const hasFilterContextMenuOpen = context.filterContextMenu != null;

      const functionDetailAvailable = (event.target as Element).closest(
        ".luckysheet-formula-help-content"
      );
      const formulaSearchAvailable = (event.target as Element).closest(
        ".luckysheet-formula-search-c-p"
      );

      if (
        isPointerInSearchDialog ||
        hasFilterContextMenuOpen ||
        !!functionDetailAvailable ||
        !!formulaSearchAvailable
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
    let lastMoveTime = 0;
    let velocityX = 0;
    let velocityY = 0;
    let momentumAnimationId = 0;
    let scrollDirection: "horizontal" | "vertical" | "none" = "none";

    const PAN_DISTANCE_THRESHOLD_PX = 8;
    const FRICTION = 0.85; // Deceleration factor (higher = longer momentum)
    const MIN_VELOCITY = 0.6; // Stop momentum below this threshold
    const VELOCITY_MULTIPLIER = 2.5;
    const DIRECTION_LOCK_THRESHOLD = 1.5; // Ratio to determine primary scroll direction

    function stopMomentum() {
      if (momentumAnimationId) {
        cancelAnimationFrame(momentumAnimationId);
        momentumAnimationId = 0;
      }
      velocityX = 0;
      velocityY = 0;
    }

    function applyMomentum() {
      if (
        Math.abs(velocityX) < MIN_VELOCITY &&
        Math.abs(velocityY) < MIN_VELOCITY
      ) {
        stopMomentum();
        return;
      }

      const scale = getPixelScale();

      // Apply direction locking to momentum as well
      let momentumX = -velocityX * scale;
      let momentumY = -velocityY * scale;

      if (scrollDirection === "vertical") {
        momentumX = 0;
      } else if (scrollDirection === "horizontal") {
        momentumY = 0;
      }

      scrollHandler(momentumX, momentumY);

      velocityX *= FRICTION;
      velocityY *= FRICTION;

      momentumAnimationId = requestAnimationFrame(applyMomentum);
    }

    function onPointerDown(pointerEvent: PointerEvent) {
      if (
        pointerEvent.pointerType !== "touch" &&
        pointerEvent.pointerType !== "pen"
      )
        return;

      stopMomentum(); // Stop any ongoing momentum

      isScrolling = false;
      scrollDirection = "none"; // Reset scroll direction
      gestureStartClientX = pointerEvent.clientX;
      lastPointerClientX = pointerEvent.clientX;
      gestureStartClientY = pointerEvent.clientY;
      lastPointerClientY = pointerEvent.clientY;
      lastMoveTime = performance.now();
      velocityX = 0;
      velocityY = 0;

      containerEl.setPointerCapture(pointerEvent.pointerId);
    }

    function onPointerMove(pointerEvent: PointerEvent) {
      if (
        pointerEvent.pointerType !== "touch" &&
        pointerEvent.pointerType !== "pen"
      )
        return;

      const currentTime = performance.now();
      const deltaTime = Math.max(1, currentTime - lastMoveTime);

      const deltaXSinceLastMove = pointerEvent.clientX - lastPointerClientX;
      const deltaYSinceLastMove = pointerEvent.clientY - lastPointerClientY;

      // Calculate velocity for momentum (pixels per millisecond)
      velocityX = (deltaXSinceLastMove / deltaTime) * 16; // Normalize to 60fps
      velocityY = (deltaYSinceLastMove / deltaTime) * 16;

      lastPointerClientX = pointerEvent.clientX;
      lastPointerClientY = pointerEvent.clientY;
      lastMoveTime = currentTime;

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

        // Determine primary scroll direction based on initial movement
        const absX = Math.abs(totalXFromGestureStart);
        const absY = Math.abs(totalYFromGestureStart);

        if (absX > absY * DIRECTION_LOCK_THRESHOLD) {
          scrollDirection = "horizontal";
        } else if (absY > absX * DIRECTION_LOCK_THRESHOLD) {
          scrollDirection = "vertical";
        } else {
          scrollDirection = "none"; // Allow both if movement is diagonal
        }

        isScrolling = true;
      }

      // now we're panning: prevent page scroll, move sheet
      pointerEvent.preventDefault();
      const scale = getPixelScale();

      // Apply direction locking
      let scrollX = -deltaXSinceLastMove * scale * VELOCITY_MULTIPLIER;
      let scrollY = -deltaYSinceLastMove * scale * VELOCITY_MULTIPLIER;

      if (scrollDirection === "vertical") {
        scrollX = 0; // Lock horizontal movement
      } else if (scrollDirection === "horizontal") {
        scrollY = 0; // Lock vertical movement
      }

      scrollHandler(scrollX, scrollY);
    }

    function onPointerUp(e: PointerEvent) {
      try {
        containerEl.releasePointerCapture(e.pointerId);
      } catch {}

      if (isScrolling) {
        // Start momentum scroll based on final velocity
        if (
          Math.abs(velocityX) > MIN_VELOCITY ||
          Math.abs(velocityY) > MIN_VELOCITY
        ) {
          momentumAnimationId = requestAnimationFrame(applyMomentum);
        }
      }

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
      stopMomentum();
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
