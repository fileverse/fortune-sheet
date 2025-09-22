"use client";

import React, { useEffect, useState, useRef } from "react";

import { cn } from "@fileverse/ui";

interface DraggableDivProps {
  children?: React.ReactNode;
  className?: string;
  initialTop?: any;
  dragHasMoved?: any;
}

export const DraggableDiv = ({
  children,
  className,
  initialTop,
  dragHasMoved,
}: DraggableDivProps) => {
  const initialX = 0;
  const initialY = initialTop;
  const [position, setPosition] = useState({ x: initialX, y: initialY });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const divRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPosition({ x: position.x, y: initialTop });
  }, [initialTop]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    const element = document.getElementById("luckysheet-formula-help-c");
    if (element) {
      element.style.userSelect = "none";
    }

    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    const element = document.getElementById("luckysheet-formula-help-c");
    if (element) {
      element.style.userSelect = "none";
    }

    const touch = e.touches[0];
    setDragOffset({
      x: touch.clientX - position.x,
      y: touch.clientY - position.y,
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;

    e.preventDefault();
    dragHasMoved.current = true;

    setPosition(() => {
      // Calculate new position using current offset - no boundaries
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;

      return {
        x: newX * 1.3,
        y: newY * 1.3,
      };
    });
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging) return;

    e.preventDefault();
    dragHasMoved.current = true;

    const touch = e.touches[0];
    setPosition(() => {
      // Calculate new position using current offset - no boundaries
      const newX = touch.clientX - dragOffset.x;
      const newY = touch.clientY - dragOffset.y;

      return {
        x: newX * 1.3,
        y: newY * 1.3,
      };
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    const element = document.getElementById("luckysheet-formula-help-c");
    if (element) {
      element.style.userSelect = "auto";
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    const element = document.getElementById("luckysheet-formula-help-c");
    if (element) {
      element.style.userSelect = "auto";
    }
  };

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.addEventListener("touchmove", handleTouchMove);
      document.addEventListener("touchend", handleTouchEnd);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [
    isDragging,
    handleMouseMove,
    handleMouseUp,
    handleTouchMove,
    handleTouchEnd,
  ]);

  return (
    <div
      ref={divRef}
      className={cn(
        "absolute select-none touch-none",
        isDragging
          ? "cursor-grabbing shadow-2xl z-50"
          : "cursor-grab shadow-lg",
        className
      )}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        height: "0px",
      }}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {children}
    </div>
  );
};
