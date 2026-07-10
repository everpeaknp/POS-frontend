"use client";

import { ReactNode } from "react";

interface StickyTableProps {
  children: ReactNode;
  className?: string;
  maxHeight?: string;
}

/** Scrollable table wrapper with sticky header row for financial reports. */
export function StickyTable({ children, className = "", maxHeight = "max-h-[70vh]" }: StickyTableProps) {
  return (
    <div className={`overflow-auto ${maxHeight} ${className}`}>
      <table className="w-full text-sm border-collapse">{children}</table>
    </div>
  );
}

export function StickyTableHead({ children }: { children: ReactNode }) {
  return (
    <thead className="sticky top-0 z-10 bg-gray-50 shadow-[0_1px_0_0_rgb(229,231,235)]">
      {children}
    </thead>
  );
}
