"use client";

import { useState, useRef, useEffect, ReactNode } from "react";

interface DraggableFabProps {
  children: ReactNode;
  defaultPosition?: { x: number; y: number };
  storageKey: string; // Unique key to store position in localStorage
  className?: string;
}

/**
 * Draggable Floating Action Button wrapper
 * Allows users to drag and reposition floating buttons anywhere on screen
 * Position is saved to localStorage and persists across sessions
 */
export function DraggableFab({
  children,
  defaultPosition = { x: 24, y: 24 }, // Default: 24px from bottom-right (6 * 4px = 24px in Tailwind)
  storageKey,
  className = "",
}: DraggableFabProps) {
  const [position, setPosition] = useState(defaultPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const fabRef = useRef<HTMLDivElement>(null);

  // Load saved position from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(`fab-position-${storageKey}`);
    if (saved) {
      try {
        const savedPosition = JSON.parse(saved);
        setPosition(savedPosition);
      } catch (e) {
        console.error("Failed to parse saved FAB position:", e);
      }
    }
  }, [storageKey]);

  // Save position to localStorage when it changes
  useEffect(() => {
    if (position !== defaultPosition) {
      localStorage.setItem(`fab-position-${storageKey}`, JSON.stringify(position));
    }
  }, [position, storageKey, defaultPosition]);

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only start drag if clicking on the container, not child buttons
    if (e.target === fabRef.current || (e.target as HTMLElement).closest('[data-drag-handle]')) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
      e.preventDefault();
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;

    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;

    // Constrain to viewport
    const maxX = window.innerWidth - (fabRef.current?.offsetWidth || 0);
    const maxY = window.innerHeight - (fabRef.current?.offsetHeight || 0);

    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY)),
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Handle touch events for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.target === fabRef.current || (e.target as HTMLElement).closest('[data-drag-handle]')) {
      const touch = e.touches[0];
      setIsDragging(true);
      setDragStart({
        x: touch.clientX - position.x,
        y: touch.clientY - position.y,
      });
      e.preventDefault();
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging) return;

    const touch = e.touches[0];
    const newX = touch.clientX - dragStart.x;
    const newY = touch.clientY - dragStart.y;

    const maxX = window.innerWidth - (fabRef.current?.offsetWidth || 0);
    const maxY = window.innerHeight - (fabRef.current?.offsetHeight || 0);

    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY)),
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Add/remove global event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.addEventListener("touchmove", handleTouchMove);
      document.addEventListener("touchend", handleTouchEnd);

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.removeEventListener("touchmove", handleTouchMove);
        document.removeEventListener("touchend", handleTouchEnd);
      };
    }
  }, [isDragging, dragStart, position]);

  return (
    <div
      ref={fabRef}
      className={`fixed z-50 ${isDragging ? "cursor-grabbing" : "cursor-grab"} ${className}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        touchAction: "none",
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      data-drag-handle
      title="Drag to reposition"
    >
      {children}
    </div>
  );
}
