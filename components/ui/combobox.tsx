"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface ComboboxOption {
  value: string;
  label: string;
  subtitle?: string;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  className?: string;
  disabled?: boolean;
}

function getDropdownStyle(trigger: HTMLDivElement | null): React.CSSProperties {
  if (!trigger) {
    return {
      position: "fixed",
      top: 0,
      left: 0,
      width: 0,
      visibility: "hidden",
      zIndex: 9999,
    };
  }

  const rect = trigger.getBoundingClientRect();
  const maxHeight = 280;
  const spaceBelow = window.innerHeight - rect.bottom - 8;
  const spaceAbove = rect.top - 8;
  const openUpward = spaceBelow < maxHeight && spaceAbove > spaceBelow;

  if (openUpward) {
    return {
      position: "fixed",
      left: rect.left,
      width: rect.width,
      bottom: window.innerHeight - rect.top + 4,
      zIndex: 9999,
    };
  }

  return {
    position: "fixed",
    top: rect.bottom + 4,
    left: rect.left,
    width: rect.width,
    zIndex: 9999,
  };
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "Select option...",
  searchPlaceholder = "Search...",
  emptyText = "No option found.",
  className,
  disabled = false,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [mounted, setMounted] = React.useState(false);
  const [positionTick, setPositionTick] = React.useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLDivElement>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const searchRef = React.useRef<HTMLInputElement>(null);
  const ignoreOutsideRef = React.useRef(false);

  const selectedOption = options.find((option) => option.value === value);

  const filteredOptions = options.filter(
    (option) =>
      option.label.toLowerCase().includes(search.toLowerCase()) ||
      option.subtitle?.toLowerCase().includes(search.toLowerCase())
  );

  const dropdownStyle = React.useMemo(() => {
    if (!open) return null;
    void positionTick;
    return getDropdownStyle(triggerRef.current);
  }, [open, positionTick]);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useLayoutEffect(() => {
    if (!open) return;

    setPositionTick((tick) => tick + 1);
    searchRef.current?.focus({ preventScroll: true });

    const updatePosition = () => setPositionTick((tick) => tick + 1);
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);

    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open]);

  React.useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (ignoreOutsideRef.current) return;

      const target = event.target as Node;
      if (
        containerRef.current?.contains(target) ||
        dropdownRef.current?.contains(target)
      ) {
        return;
      }

      setOpen(false);
      setSearch("");
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  const handleTriggerPointerDown = () => {
    ignoreOutsideRef.current = true;
    window.setTimeout(() => {
      ignoreOutsideRef.current = false;
    }, 0);
  };

  const toggleOpen = () => {
    if (disabled) return;
    setOpen((prev) => {
      if (prev) setSearch("");
      return !prev;
    });
  };

  const handleSelect = (optionValue: string) => {
    onValueChange(optionValue === value ? "" : optionValue);
    setOpen(false);
    setSearch("");
  };

  const dropdown =
    open && dropdownStyle ? (
      <div
        ref={dropdownRef}
        style={dropdownStyle}
        className="bg-white border border-gray-200 rounded-md shadow-lg dark:bg-card dark:border-border"
      >
        <div className="flex items-center border-b border-gray-200 dark:border-border px-3 py-2">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <input
            ref={searchRef}
            type="text"
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 text-sm outline-none placeholder:text-gray-500 dark:placeholder:text-muted-foreground bg-transparent"
          />
        </div>

        <div className="max-h-64 overflow-auto p-1 scrollbar-green">
          {filteredOptions.length === 0 ? (
            <div className="py-6 text-center text-sm text-gray-500 dark:text-muted-foreground">
              {emptyText}
            </div>
          ) : (
            filteredOptions.map((option) => (
              <div
                key={option.value}
                role="option"
                aria-selected={value === option.value}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => handleSelect(option.value)}
                className={cn(
                  "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-gray-100 dark:hover:bg-muted",
                  value === option.value && "bg-gray-100 dark:bg-muted"
                )}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === option.value ? "opacity-100" : "opacity-0"
                  )}
                />
                <div className="flex flex-col min-w-0">
                  <span className="truncate">{option.label}</span>
                  {option.subtitle && (
                    <span className="text-xs text-gray-500 dark:text-muted-foreground">
                      {option.subtitle}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    ) : null;

  return (
    <div className="relative" ref={containerRef}>
      <div ref={triggerRef}>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          onPointerDown={handleTriggerPointerDown}
          onClick={toggleOpen}
          className={cn(
            "w-full justify-between h-9 text-sm border-gray-200 font-normal",
            !value && "text-gray-500",
            className
          )}
          disabled={disabled}
        >
          <span className="truncate text-left">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </div>

      {mounted && dropdown ? createPortal(dropdown, document.body) : null}
    </div>
  );
}
