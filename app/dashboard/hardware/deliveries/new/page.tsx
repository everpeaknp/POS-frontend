"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashHeader } from "@/components/dashboard/dash-header";

export default function NewDeliveryPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader 
        title="Create Delivery" 
        subtitle="Schedule delivery for invoice items"
      />

      <div className="flex-1 p-6">
        <div className="max-w-3xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <div className="bg-white dark:bg-card rounded-xl border border-gray-100 dark:border-border p-12 text-center">
            <h3 className="text-lg font-semibold mb-2">Delivery Form Coming Soon</h3>
            <p className="text-gray-500 dark:text-muted-foreground mb-6">
              This feature is under development. You'll be able to create deliveries from invoices here.
            </p>
            <Button onClick={() => router.push("/dashboard/hardware/deliveries")}>
              Back to Deliveries
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
