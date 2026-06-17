"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";

interface ColorPickerProps {
  value: string;
  onChange?: (color: string) => void;
  label?: string;
}

const presetColors = [
  "#22C55E", // Green (brand)
  "#3B82F6", // Blue
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#06B6D4", // Cyan
  "#6366F1", // Indigo
];

export function ColorPicker({
  value,
  onChange,
  label = "Color",
}: ColorPickerProps) {
  const [showPicker, setShowPicker] = useState(false);

  return (
    <div className="space-y-2">
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      <div className="flex items-center gap-3">
        <div className="relative">
          <button
            onClick={() => setShowPicker(!showPicker)}
            className="w-10 h-10 rounded-lg border-2 border-gray-200 hover:border-gray-300 transition-colors"
            style={{ backgroundColor: value }}
          />
          {showPicker && (
            <div className="absolute top-12 left-0 z-10 bg-white border border-gray-200 rounded-lg shadow-lg p-3 space-y-3">
              <div className="grid grid-cols-4 gap-2">
                {presetColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => {
                      onChange?.(color);
                      setShowPicker(false);
                    }}
                    className="w-8 h-8 rounded border-2 hover:border-gray-400 transition-colors"
                    style={{
                      backgroundColor: color,
                      borderColor: value === color ? "#000" : "#e5e7eb",
                    }}
                  />
                ))}
              </div>
              <Input
                type="text"
                value={value}
                onChange={(e) => onChange?.(e.target.value)}
                placeholder="#000000"
                className="h-8 text-xs"
              />
            </div>
          )}
        </div>
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder="#000000"
          className="h-9 text-sm flex-1"
        />
      </div>
    </div>
  );
}
