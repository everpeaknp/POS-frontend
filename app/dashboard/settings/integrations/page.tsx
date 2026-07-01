"use client";

import { Plug } from "lucide-react";
import { DashHeader } from "@/components/dashboard/dash-header";

export default function IntegrationsPage() {
  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title="Integrations" subtitle="Connect third-party services" />
      <div className="flex-1 p-6">
        <div className="max-w-lg mx-auto mt-12 text-center">
          <div className="w-14 h-14 rounded-xl bg-gray-100 text-gray-500 flex items-center justify-center mx-auto mb-4">
            <Plug className="h-7 w-7" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Coming soon</h2>
          <p className="text-sm text-gray-500 mt-2">
            Third-party integrations for payments, banking, tax filing, and more will be available here.
          </p>
        </div>
      </div>
    </div>
  );
}
