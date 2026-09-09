"use client";

import { Checkbox } from "@/components/ui/checkbox";

interface RolePermissionToggleProps {
  permission: string;
  checked: boolean;
  onChange?: (checked: boolean) => void;
}

export function RolePermissionToggle({
  permission,
  checked,
  onChange,
}: RolePermissionToggleProps) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50/50 transition-colors">
      <Checkbox
        checked={checked}
        onCheckedChange={onChange}
        className="data-[state=checked]:bg-[#4A5D7A] data-[state=checked]:border-[#4A5D7A]"
      />
      <span className="text-sm text-gray-700">{permission}</span>
    </div>
  );
}
