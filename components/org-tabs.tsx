"use client";

const tabs = [
  { id: "organizations", label: "Organizations" },
  { id: "requests", label: "Requests" },
  { id: "invitation", label: "Invitations" },
];

interface OrgTabsProps {
  activeTab: string;
  onChange: (tab: string) => void;
  pendingInvitationsCount?: number;
}

export function OrgTabs({ activeTab, onChange, pendingInvitationsCount = 0 }: OrgTabsProps) {
  return (
    <div className="bg-card border-b border-border">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        <nav className="flex gap-1 overflow-x-auto scrollbar-none" role="tablist">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => onChange(tab.id)}
              className={`shrink-0 px-4 py-3.5 text-sm font-medium border-b-2 transition-all inline-flex items-center gap-2 ${
                activeTab === tab.id
                  ? "border-[#22C55E] text-[#22C55E]"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              }`}
            >
              {tab.label}
              {tab.id === "invitation" && pendingInvitationsCount > 0 && (
                <span className="inline-flex h-5 min-w-5 px-1 items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold">
                  {pendingInvitationsCount}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
