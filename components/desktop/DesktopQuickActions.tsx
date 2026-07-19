"use client";

import { useState } from "react";
import {
  Plus,
  FileText,
  Users,
  Package,
  UserPlus,
  RefreshCw,
  Zap,
} from "lucide-react";
import { useDesktopWorkspace } from "@/lib/context/DesktopWorkspaceContext";
import { getDesktopApi } from "@/lib/desktop";

/**
 * Floating quick actions — desktop productivity only.
 */
export function DesktopQuickActions() {
  const { openTab } = useDesktopWorkspace();
  const [open, setOpen] = useState(false);

  const actions = [
    {
      label: "Create invoice",
      icon: FileText,
      run: () => openTab("/dashboard/sales/invoices/new", "New invoice"),
    },
    {
      label: "Create customer",
      icon: Users,
      run: () => openTab("/dashboard/sales/customers/new", "New customer"),
    },
    {
      label: "Create product",
      icon: Package,
      run: () => openTab("/dashboard/inventory/products/new", "New product"),
    },
    {
      label: "Create employee",
      icon: UserPlus,
      run: () => openTab("/dashboard/hr/employees/new", "New employee"),
    },
    {
      label: "Sync now",
      icon: RefreshCw,
      run: () => void getDesktopApi()?.offline?.syncNow(),
    },
  ];

  return (
    <div className="fixed bottom-10 right-5 z-[180] flex flex-col items-end gap-2">
      {open && (
        <div className="flex flex-col gap-1.5 mb-1 animate-in fade-in slide-in-from-bottom-2 duration-150">
          {actions.map((a) => (
            <button
              key={a.label}
              type="button"
              onClick={() => {
                a.run();
                setOpen(false);
              }}
              className="flex items-center gap-2 rounded-full bg-[#0f172a] text-white text-xs font-medium pl-3 pr-3.5 py-2 shadow-lg border border-white/10 hover:border-[#22C55E]/40"
            >
              <a.icon className="h-3.5 w-3.5 text-[#22C55E]" />
              {a.label}
            </button>
          ))}
        </div>
      )}
      <button
        type="button"
        aria-label="Quick actions"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="h-12 w-12 rounded-full bg-gradient-to-br from-[#16A34A] to-[#22C55E] text-white shadow-xl shadow-green-900/30 grid place-items-center hover:scale-105 transition-transform"
      >
        {open ? <Zap className="h-5 w-5" /> : <Plus className="h-6 w-6" />}
      </button>
    </div>
  );
}
