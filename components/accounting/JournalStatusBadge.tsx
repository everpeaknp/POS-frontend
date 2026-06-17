"use client";

const STATUS_STYLES: Record<string, string> = {
  Posted: "bg-green-100 text-green-700",
  Draft: "bg-gray-100 text-gray-600",
  Reversed: "bg-red-100 text-red-700",
};

const TYPE_STYLES: Record<string, string> = {
  Manual: "bg-gray-100 text-gray-600",
  Sales: "bg-blue-100 text-blue-700",
  Purchase: "bg-purple-100 text-purple-700",
  Payment: "bg-green-100 text-green-700",
  Adjustment: "bg-orange-100 text-orange-700",
};

export function JournalStatusBadge({ status }: { status: string }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[status] ?? "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
}

export function JournalTypeBadge({ type }: { type: string }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_STYLES[type] ?? "bg-gray-100 text-gray-600"}`}>
      {type}
    </span>
  );
}
