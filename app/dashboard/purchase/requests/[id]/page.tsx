"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle, XCircle, FileText, Printer, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DashHeader } from "@/components/dashboard/dash-header";
import { StatusBadge } from "@/components/purchase/StatusBadge";
import { LineItemsTable } from "@/components/purchase/LineItemsTable";
import { mockPurchaseRequests } from "@/lib/mock-data/purchase";

const mockItems = [
  { id: "1", product: "Cotton Fabric (per meter)", description: "For Q2 production", qty: 50, unit: "Meter", unitPrice: 450, discount: 0, tax: 13, amount: 25425 },
  { id: "2", product: "Embroidery Thread", description: "Assorted colors", qty: 20, unit: "Roll", unitPrice: 250, discount: 0, tax: 13, amount: 5650 },
];

const priorityColors: Record<string, string> = {
  High: "bg-red-100 text-red-700",
  Medium: "bg-yellow-100 text-yellow-700",
  Low: "bg-gray-100 text-gray-600",
};

export default function PurchaseRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const req = mockPurchaseRequests.find((r) => r.id === id) ?? mockPurchaseRequests[0];
  const [rejectModal, setRejectModal] = useState(false);

  const timeline = [
    { label: "Request Submitted", date: req.date, color: "bg-gray-400", by: req.requestedBy },
    { label: "Under Review", date: req.date, color: "bg-yellow-400", by: "Manager" },
    ...(req.status === "Approved" || req.status === "Converted to PO" ? [{ label: "Approved", date: req.requiredBy, color: "bg-green-500", by: "Manager" }] : []),
    ...(req.status === "Rejected" ? [{ label: "Rejected", date: req.requiredBy, color: "bg-red-500", by: "Manager" }] : []),
    ...(req.status === "Converted to PO" ? [{ label: "Converted to PO", date: req.requiredBy, color: "bg-blue-500", by: "System" }] : []),
  ];

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title={req.id} subtitle={`Purchase Request · ${req.date}`} />
      <div className="flex-1 p-6 space-y-4 max-w-4xl">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={req.status} />
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityColors[req.priority]}`}>{req.priority} Priority</span>
          <div className="flex-1" />
          {req.status === "Pending Approval" && (
            <>
              <Button size="sm" className="h-8 bg-[#22C55E] hover:bg-[#16A34A] text-white gap-1.5">
                <CheckCircle className="h-3.5 w-3.5" /> Approve
              </Button>
              <Button size="sm" variant="outline" className="h-8 gap-1.5 text-red-500 border-red-200 hover:bg-red-50" onClick={() => setRejectModal(true)}>
                <XCircle className="h-3.5 w-3.5" /> Reject
              </Button>
            </>
          )}
          {req.status === "Approved" && (
            <Button size="sm" className="h-8 bg-[#22C55E] hover:bg-[#16A34A] text-white gap-1.5" onClick={() => router.push("/dashboard/purchase/orders/new")}>
              <FileText className="h-3.5 w-3.5" /> Convert to Purchase Order
            </Button>
          )}
          {req.status === "Converted to PO" && (
            <Button size="sm" variant="outline" className="h-8 gap-1.5" onClick={() => router.push("/dashboard/purchase/orders")}>
              <FileText className="h-3.5 w-3.5" /> View PO
            </Button>
          )}
          <Button variant="outline" size="sm" className="h-8 gap-1.5" onClick={() => window.print()}>
            <Printer className="h-3.5 w-3.5" /> Print
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm space-y-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Request Info</h3>
            {[["PR #", req.id], ["Date", req.date], ["Required By", req.requiredBy], ["Requested By", req.requestedBy], ["Department", req.department]].map(([k, v]) => (
              <div key={k} className="flex justify-between text-sm">
                <span className="text-gray-500">{k}</span><span className="font-medium text-gray-800">{v}</span>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Approval History</h3>
            <div className="space-y-3">
              {timeline.map((ev, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${ev.color}`} />
                  <div>
                    <p className="text-sm font-medium text-gray-700">{ev.label}</p>
                    <p className="text-xs text-gray-400">{ev.date} · {ev.by}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Requested Items</h3>
          <LineItemsTable items={mockItems} onChange={() => {}} readOnly />
          <div className="flex justify-end mt-3">
            <div className="bg-gray-50 rounded-lg border border-gray-200 px-4 py-2">
              <span className="text-sm text-gray-600">Estimated Total: </span>
              <span className="font-bold text-[#22C55E]">Rs. {req.estimatedAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <Button variant="ghost" onClick={() => router.back()} className="gap-1.5 text-gray-500">
          <ArrowLeft className="h-4 w-4" /> Back to Requests
        </Button>
      </div>

      <Dialog open={rejectModal} onOpenChange={setRejectModal}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Reject Purchase Request</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <textarea className="w-full h-24 text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:border-[#22C55E]"
              placeholder="Reason for rejection..." />
            <div className="flex gap-2">
              <Button onClick={() => setRejectModal(false)} className="flex-1 bg-red-500 hover:bg-red-600 text-white">Confirm Reject</Button>
              <Button variant="outline" onClick={() => setRejectModal(false)} className="flex-1">Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
