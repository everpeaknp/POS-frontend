"use client";

const tabs = [
  { id: "organizations", label: "Your Organization" },
  { id: "requests", label: "Requests" },
  { id: "invitation", label: "Invitation" },
];

interface OrgTabsProps {
  activeTab: string;
  onChange: (tab: string) => void;
  pendingInvitationsCount?: number;
}

export function OrgTabs({ activeTab, onChange, pendingInvitationsCount = 0 }: OrgTabsProps) {
  return (
    <div className="bg-white border-b border-gray-100 px-6">
      <nav className="flex gap-1" role="tablist">
        {tabs.map((tab) => (
          <button key={tab.id} role="tab" aria-selected={activeTab === tab.id}
            onClick={() => onChange(tab.id)}
            className={`px-4 py-3.5 text-sm font-medium border-b-2 transition-all relative ${
              activeTab === tab.id
                ? "border-[#22C55E] text-[#22C55E]"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200"
            }`}>
            {tab.label}
            {tab.id === "invitation" && pendingInvitationsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {pendingInvitationsCount}
              </span>
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}
