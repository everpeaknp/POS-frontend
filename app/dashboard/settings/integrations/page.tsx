"use client";

import { DashHeader } from "@/components/dashboard/dash-header";
import { Button } from "@/components/ui/button";

const integrations = [
  { name: "eSewa", desc: "Accept digital payments via eSewa", connected: true, logo: "💚" },
  { name: "Khalti", desc: "Accept digital payments via Khalti", connected: true, logo: "💜" },
  { name: "Nepal Bank Ltd", desc: "Bank reconciliation and transfers", connected: false, logo: "🏦" },
  { name: "IRD Nepal", desc: "VAT filing and tax compliance", connected: false, logo: "🏛️" },
  { name: "Tally", desc: "Export data to Tally accounting", connected: false, logo: "📊" },
  { name: "WhatsApp Business", desc: "Send invoices via WhatsApp", connected: false, logo: "💬" },
];

export default function IntegrationsPage() {
  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title="Integrations" subtitle="Connect third-party services" />
      <div className="flex-1 p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl">
          {integrations.map((i) => (
            <div key={i.name} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{i.logo}</span>
                <div>
                  <p className="font-semibold text-gray-800">{i.name}</p>
                  {i.connected && <span className="text-xs text-green-600 font-medium">● Connected</span>}
                </div>
              </div>
              <p className="text-sm text-gray-500 mb-4">{i.desc}</p>
              <Button size="sm" variant={i.connected ? "outline" : "default"}
                className={i.connected ? "border-red-200 text-red-500 hover:bg-red-50 w-full" : "bg-[#22C55E] hover:bg-[#16A34A] text-white w-full"}>
                {i.connected ? "Disconnect" : "Connect"}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
