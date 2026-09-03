"use client";

import { BarChart3 } from "lucide-react";
import { ReportsPageShell } from "@/components/reports/ReportsPageShell";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface PlaceholderReportProps {
  title: string;
  description: string;
}

export function PlaceholderReport({ title, description }: PlaceholderReportProps) {
  return (
    <ReportsPageShell title={title} subtitle={description} showBack={true}>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center max-w-2xl mx-auto">
        <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <BarChart3 className="h-8 w-8 text-gray-400" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Report Coming Soon</h2>
        <p className="text-sm text-gray-500 mb-6">
          This report is currently under development. We're working to bring you detailed insights
          and analytics.
        </p>
        <Link href="/dashboard/reports">
          <Button variant="outline">Back to Reports</Button>
        </Link>
      </div>
    </ReportsPageShell>
  );
}
