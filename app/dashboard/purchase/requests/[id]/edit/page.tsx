"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashHeader } from "@/components/dashboard/dash-header";
import RequestForm from "@/components/purchase/RequestForm";
import { purchaseRequestsAPI } from "@/lib/api/purchase";
import toast from "react-hot-toast";

export default function EditPurchaseRequestPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [initialData, setInitialData] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    const fetchRequest = async () => {
      if (!id) return;
      try {
        const req = await purchaseRequestsAPI.get(id);
        if (req.status !== "Draft" && req.status !== "Pending Approval") {
          toast.error("Only draft or pending requests can be edited");
          router.replace(`/dashboard/purchase/requests/${id}`);
          return;
        }
        setInitialData({
          request_number: req.request_number,
          date: req.date,
          requested_by: req.requested_by || "",
          department: req.department,
          required_by: req.required_by,
          priority: req.priority,
          status: req.status,
          notes: req.notes || "",
          lines: req.lines?.length
            ? req.lines.map((line) => ({
                product: line.product,
                description: line.description || "",
                quantity: String(line.quantity),
                estimated_unit_price: String(line.estimated_unit_price),
              }))
            : [{ product: "", description: "", quantity: "", estimated_unit_price: "" }],
        });
      } catch (error: any) {
        console.error("Error fetching request:", error);
        toast.error("Failed to load purchase request");
        router.replace("/dashboard/purchase/requests");
      } finally {
        setLoading(false);
      }
    };
    fetchRequest();
  }, [id, router]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Loading..." subtitle="Update purchase request" />
        <div className="flex-1 p-6 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#22C55E]" />
        </div>
      </div>
    );
  }

  if (!initialData) {
    return null;
  }

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title={`Edit ${initialData.request_number as string}`} subtitle="Update purchase request" />
      <div className="flex-1 p-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 max-w-4xl">
          <RequestForm
            requestId={id}
            initialData={initialData as any}
            onSuccess={() => router.push(`/dashboard/purchase/requests/${id}`)}
            onCancel={() => router.back()}
          />
          <div className="mt-4 pt-4 border-t border-gray-100">
            <Button variant="ghost" onClick={() => router.back()} className="gap-1.5 text-gray-500">
              <ArrowLeft className="h-4 w-4" /> Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
