"use client";

import { Checkbox } from "@/components/ui/checkbox";

interface Permission {
  module: string;
  actions: string[];
}

interface PermissionsMatrixProps {
  roles: string[];
  permissions: Permission[];
  defaultPerms?: Record<string, Record<string, boolean>>;
  onChange?: (role: string, permission: string, checked: boolean) => void;
}

export function PermissionsMatrix({
  roles,
  permissions,
  defaultPerms = {},
  onChange,
}: PermissionsMatrixProps) {
  const handleChange = (role: string, key: string, checked: boolean) => {
    onChange?.(role, key, checked);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase w-40">
                Module / Action
              </th>
              {roles.map((r) => (
                <th
                  key={r}
                  className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase"
                >
                  {r}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {permissions.map((mod) => (
              <div key={mod.module}>
                <tr className="bg-gray-50/50">
                  <td
                    className="px-4 py-2 font-semibold text-gray-700 text-xs uppercase tracking-wide"
                    colSpan={roles.length + 1}
                  >
                    {mod.module}
                  </td>
                </tr>
                {mod.actions.map((action) => (
                  <tr
                    key={`${mod.module}-${action}`}
                    className="border-t border-gray-50 hover:bg-gray-50/30"
                  >
                    <td className="px-4 py-2.5 text-gray-600 pl-8">{action}</td>
                    {roles.map((role) => {
                      const key = `${mod.module}-${action}`;
                      const checked =
                        role === "Admin" || defaultPerms[role]?.[key] === true;
                      return (
                        <td key={role} className="px-4 py-2.5 text-center">
                          <Checkbox
                            defaultChecked={checked}
                            onCheckedChange={(checked) =>
                              handleChange(role, key, checked as boolean)
                            }
                            className="data-[state=checked]:bg-[#22C55E] data-[state=checked]:border-[#22C55E]"
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </div>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
