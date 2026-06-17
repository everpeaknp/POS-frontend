"use client";

import { Trash2, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Account } from "@/lib/api/accounting";

export interface JournalLine {
  id: string;
  accountId: string;
  accountName: string;
  description: string;
  debit: number;
  credit: number;
}

interface Props {
  lines: JournalLine[];
  onChange: (lines: JournalLine[]) => void;
  readOnly?: boolean;
  accounts?: Account[];
}

export function JournalLinesTable({ lines, onChange, readOnly, accounts = [] }: Props) {
  const addLine = () => {
    onChange([...lines, { id: Date.now().toString(), accountId: "", accountName: "", description: "", debit: 0, credit: 0 }]);
  };

  const removeLine = (id: string) => {
    onChange(lines.filter((l) => l.id !== id));
  };

  const updateLine = (id: string, field: keyof JournalLine, value: string | number) => {
    onChange(lines.map((l) => {
      if (l.id !== id) return l;
      if (field === "accountId") {
        const acc = accounts.find((a) => a.id === value);
        return { ...l, accountId: value as string, accountName: acc?.name ?? "" };
      }
      return { ...l, [field]: value };
    }));
  };

  const totalDebit = lines.reduce((s, l) => s + (l.debit || 0), 0);
  const totalCredit = lines.reduce((s, l) => s + (l.credit || 0), 0);
  const balanced = totalDebit > 0 && totalDebit === totalCredit;

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 w-48">Account</th>
              <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500">Description</th>
              <th className="text-right px-3 py-2.5 text-xs font-semibold text-gray-500 w-32">Debit (Rs.)</th>
              <th className="text-right px-3 py-2.5 text-xs font-semibold text-gray-500 w-32">Credit (Rs.)</th>
              {!readOnly && <th className="w-10" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {lines.map((line) => (
              <tr key={line.id} className="hover:bg-gray-50/50">
                <td className="px-3 py-2">
                  {readOnly ? (
                    <span className="text-gray-800">{line.accountName}</span>
                  ) : (
                    <select
                      value={line.accountId}
                      onChange={(e) => updateLine(line.id, "accountId", e.target.value)}
                      className="w-full h-8 text-sm border border-gray-200 rounded px-2 bg-white focus:outline-none focus:border-[#22C55E]"
                    >
                      <option value="">Select account</option>
                      {accounts.filter((a) => a.level > 0).map((a) => (
                        <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                      ))}
                    </select>
                  )}
                </td>
                <td className="px-3 py-2">
                  {readOnly ? (
                    <span className="text-gray-600">{line.description}</span>
                  ) : (
                    <Input
                      value={line.description}
                      onChange={(e) => updateLine(line.id, "description", e.target.value)}
                      className="h-8 text-sm border-gray-200"
                      placeholder="Description"
                    />
                  )}
                </td>
                <td className="px-3 py-2">
                  {readOnly ? (
                    <span className="text-right block text-gray-800">{line.debit > 0 ? `Rs. ${line.debit.toLocaleString("en-IN")}` : "—"}</span>
                  ) : (
                    <Input
                      type="number"
                      value={line.debit || ""}
                      onChange={(e) => updateLine(line.id, "debit", parseFloat(e.target.value) || 0)}
                      className="h-8 text-sm border-gray-200 text-right"
                      placeholder="0"
                    />
                  )}
                </td>
                <td className="px-3 py-2">
                  {readOnly ? (
                    <span className="text-right block text-gray-800">{line.credit > 0 ? `Rs. ${line.credit.toLocaleString("en-IN")}` : "—"}</span>
                  ) : (
                    <Input
                      type="number"
                      value={line.credit || ""}
                      onChange={(e) => updateLine(line.id, "credit", parseFloat(e.target.value) || 0)}
                      className="h-8 text-sm border-gray-200 text-right"
                      placeholder="0"
                    />
                  )}
                </td>
                {!readOnly && (
                  <td className="px-2 py-2">
                    <button onClick={() => removeLine(line.id)} className="p-1 text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50 border-t border-gray-200">
            <tr>
              <td colSpan={2} className="px-3 py-2.5 text-xs font-semibold text-gray-600">Totals</td>
              <td className="px-3 py-2.5 text-right text-sm font-bold text-gray-800">Rs. {totalDebit.toLocaleString("en-IN")}</td>
              <td className="px-3 py-2.5 text-right text-sm font-bold text-gray-800">Rs. {totalCredit.toLocaleString("en-IN")}</td>
              {!readOnly && <td />}
            </tr>
          </tfoot>
        </table>
      </div>

      {!readOnly && (
        <button onClick={addLine} className="flex items-center gap-1.5 text-sm text-[#22C55E] hover:text-[#16A34A] font-medium transition-colors">
          <Plus className="h-4 w-4" /> Add Line
        </button>
      )}

      <div className={`flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg ${balanced ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
        {balanced ? "✓ Balanced" : `⚠ Difference: Rs. ${Math.abs(totalDebit - totalCredit).toLocaleString("en-IN")}`}
        <span className="text-gray-500 font-normal ml-2">Debit: Rs. {totalDebit.toLocaleString("en-IN")} | Credit: Rs. {totalCredit.toLocaleString("en-IN")}</span>
      </div>
    </div>
  );
}
