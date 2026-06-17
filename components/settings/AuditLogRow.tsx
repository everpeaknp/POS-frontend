"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface AuditLogRowProps {
  timestamp: string;
  user: string;
  action: string;
  module: string;
  record: string | null;
  description: string;
  ip: string;
  device: string;
  before?: any;
  after?: any;
}

const actionColors: Record<string, string> = {
  Created: "bg-green-100 text-green-700",
  Updated: "bg-blue-100 text-blue-700",
  Deleted: "bg-red-100 text-red-700",
  Posted: "bg-purple-100 text-purple-700",
  Added: "bg-green-100 text-green-700",
  Stock: "bg-orange-100 text-orange-700",
  Login: "bg-indigo-100 text-indigo-700",
  Export: "bg-amber-100 text-amber-700",
};

export function AuditLogRow({
  timestamp,
  user,
  action,
  module,
  record,
  description,
  ip,
  device,
  before,
  after,
}: AuditLogRowProps) {
  const [expanded, setExpanded] = useState(false);
  const verb = action.split(" ")[0];
  const hasDetails = before || after;

  return (
    <>
      <tr className="hover:bg-gray-50/50 border-b border-gray-50">
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#22C55E]/10 flex items-center justify-center text-xs font-bold text-[#22C55E]">
              {user[0]}
            </div>
            <span className="font-medium text-gray-800 text-sm">{user}</span>
          </div>
        </td>
        <td className="px-4 py-3">
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              actionColors[verb] ?? "bg-gray-100 text-gray-600"
            }`}
          >
            {action}
          </span>
        </td>
        <td className="px-4 py-3 text-gray-600 text-sm">{module}</td>
        <td className="px-4 py-3 font-mono text-xs text-[#22C55E]">{record}</td>
        <td className="px-4 py-3 text-gray-500 text-xs">{ip}</td>
        <td className="px-4 py-3 text-gray-500 text-xs">{device}</td>
        <td className="px-4 py-3 text-gray-500 text-xs">{timestamp}</td>
        {hasDetails && (
          <td className="px-4 py-3">
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <ChevronDown
                className={`h-4 w-4 text-gray-400 transition-transform ${
                  expanded ? "rotate-180" : ""
                }`}
              />
            </button>
          </td>
        )}
      </tr>
      {expanded && hasDetails && (
        <tr className="bg-gray-50/50 border-b border-gray-50">
          <td colSpan={8} className="px-4 py-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              {before && (
                <div>
                  <p className="font-semibold text-gray-700 mb-2">Before</p>
                  <pre className="bg-white border border-gray-200 rounded p-2 text-xs overflow-auto max-h-40">
                    {JSON.stringify(before, null, 2)}
                  </pre>
                </div>
              )}
              {after && (
                <div>
                  <p className="font-semibold text-gray-700 mb-2">After</p>
                  <pre className="bg-white border border-gray-200 rounded p-2 text-xs overflow-auto max-h-40">
                    {JSON.stringify(after, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
