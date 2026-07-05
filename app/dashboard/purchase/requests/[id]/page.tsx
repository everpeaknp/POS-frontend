"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useReactToPrint } from "react-to-print";
import { CheckCircle, XCircle, FileText, Printer, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DashHeader } from "@/components/dashboard/dash-header";
import { StatusBadge } from "@/components/purchase/StatusBadge";
import { FormattedDate } from "@/components/shared/FormattedDate";
import { LineItemsTable } from "@/components/purchase/LineItemsTable";
import { PrintablePurchaseRequest } from "@/components/print/PrintablePurchaseRequest";
import { purchaseRequestsAPI, type PurchaseRequest } from "@/lib/api/purchase";
import { useCompanyInfo } from "@/lib/hooks/useCompanyInfo";
import { formatCurrency } from "@/lib/utils";
import toast from "react-hot-toast";

const priorityColors: Record<string, string> = {
  High: "bg-red-100 text-red-700",
  Medium: "bg-yellow-100 text-yellow-700",
  Low: "bg-gray-100 text-gray-600",
};

export default function PurchaseRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [req, setReq] = useState<PurchaseRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [rejectModal, setRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [convertedPoId, setConvertedPoId] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const { companyInfo } = useCompanyInfo();

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `${req?.request_number || "PurchaseRequest"}_${new Date().toISOString().split("T")[0]}`,
  });

  const fetchRequest = async () => {
    if (!id) return;
    try {
      const data = await purchaseRequestsAPI.get(id);
      setReq(data);
    } catch (error: any) {
      console.error("Error fetching request:", error);
      toast.error("Failed to load purchase request");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequest();
  }, [id]);

  const handleApprove = async () => {
    if (!req) return;
    setUpdating(true);
    try {
      const data = await purchaseRequestsAPI.approve(req.id);
      setReq(data);
      toast.success("Purchase request approved");
    } catch (error: any) {
      console.error("Error approving request:", error);
      toast.error(error.response?.data?.detail || "Failed to approve request");
    } finally {
      setUpdating(false);
    }
  };

  const handleReject = async () => {
    if (!req) return;
    if (!rejectReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }
    setUpdating(true);
    try {
      const data = await purchaseRequestsAPI.reject(req.id, rejectReason);
      setReq(data);
      setRejectModal(false);
      setRejectReason("");
      toast.success("Purchase request rejected");
    } catch (error: any) {
      console.error("Error rejecting request:", error);
      toast.error(error.response?.data?.detail || "Failed to reject request");
    } finally {
      setUpdating(false);
    }
  };

  const handleConvertToPO = async () => {
    if (!req) return;
    setUpdating(true);
    try {
      const po = await purchaseRequestsAPI.convertToPO(req.id);
      setConvertedPoId(po.id);
      await fetchRequest();
      toast.success(`Converted to PO ${po.po_number}`);
      router.push(`/dashboard/purchase/orders/${po.id}`);
    } catch (error: any) {
      console.error("Error converting request:", error);
      toast.error(error.response?.data?.detail || "Failed to convert to purchase order");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Loading..." subtitle="Purchase Request" />
        <div className="flex-1 p-6 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#22C55E]" />
        </div>
      </div>
    );
  }

  if (!req) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Request Not Found" subtitle="Purchase Request" />
        <div className="flex-1 p-6 flex flex-col items-center justify-center">
          <p className="text-gray-500 mb-4">The request you&apos;re looking for doesn&apos;t exist.</p>
          <Link href="/dashboard/purchase/requests">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to Requests
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const lineItems = req.lines?.map((line) => ({
    id: line.id || "",
    product: line.product_name || line.product,
    description: line.description || "",
    qty: Number(line.quantity),
    unit: "Pcs",
    unitPrice: Number(line.estimated_unit_price),
    discount: 0,
    tax: 0,
    amount: Number(line.estimated_amount ?? line.quantity * line.estimated_unit_price),
  })) || [];

  const timeline = [
    { label: "Request Submitted", date: req.date, color: "bg-gray-400", by: req.requested_by_name || req.requested_by || "—" },
    ...(req.status !== "Draft" ? [{ label: "Under Review", date: req.date, color: "bg-yellow-400", by: "Manager" }] : []),
    ...(req.status === "Approved" || req.status === "Converted to PO"
      ? [{ label: "Approved", date: req.approved_at || req.required_by, color: "bg-green-500", by: req.approved_by_name || "Manager" }]
      : []),
    ...(req.status === "Rejected"
      ? [{ label: "Rejected", date: req.updated_at, color: "bg-red-500", by: req.approved_by_name || "Manager" }]
      : []),
    ...(req.status === "Converted to PO"
      ? [{ label: "Converted to PO", date: req.updated_at, color: "bg-blue-500", by: "System" }]
      : []),
  ];

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader
        title={req.request_number}
        subtitle={`Purchase Request · ${req.date}`}
      />
      <div className="flex-1 p-6 space-y-4 max-w-4xl">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={req.status} />
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityColors[req.priority]}`}>
            {req.priority} Priority
          </span>
          <div className="flex-1" />
          {req.status === "Pending Approval" && (
            <>
              <Button
                size="sm"
                className="h-8 bg-[#22C55E] hover:bg-[#16A34A] text-white gap-1.5"
                onClick={handleApprove}
                disabled={updating}
              >
                {updating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1.5 text-red-500 border-red-200 hover:bg-red-50"
                onClick={() => setRejectModal(true)}
                disabled={updating}
              >
                <XCircle className="h-3.5 w-3.5" /> Reject
              </Button>
            </>
          )}
          {req.status === "Approved" && (
            <Button
              size="sm"
              className="h-8 bg-[#22C55E] hover:bg-[#16A34A] text-white gap-1.5"
              onClick={handleConvertToPO}
              disabled={updating}
            >
              {updating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
              Convert to Purchase Order
            </Button>
          )}
          {req.status === "Converted to PO" && convertedPoId && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1.5"
              onClick={() => router.push(`/dashboard/purchase/orders/${convertedPoId}`)}
            >
              <FileText className="h-3.5 w-3.5" /> View PO
            </Button>
          )}
          <Button variant="outline" size="sm" className="h-8 gap-1.5" onClick={() => handlePrint()} disabled={!companyInfo}>
            <Printer className="h-3.5 w-3.5" /> Print
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm space-y-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Request Info</h3>
            {[
              ["PR #", req.request_number],
              ["Date", <FormattedDate key="date" value={req.date} />],
              ["Required By", <FormattedDate key="req" value={req.required_by} />],
              ["Requested By", req.requested_by_name || req.requested_by || "—"],
              ["Department", req.department],
              ...(req.supplier_name ? [["Supplier", req.supplier_name]] : []),
            ].map(([k, v]) => (
              <div key={String(k)} className="flex justify-between text-sm">
                <span className="text-gray-500">{k}</span>
                <span className="font-medium text-gray-800">{v}</span>
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
                    <p className="text-xs text-gray-400">
                      {typeof ev.date === "string" && ev.date.includes("T")
                        ? new Date(ev.date).toLocaleDateString("en-GB")
                        : ev.date}{" "}
                      · {ev.by}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            {req.rejection_reason && (
              <div className="mt-3 p-2 bg-red-50 rounded-lg text-sm text-red-700">
                Rejection reason: {req.rejection_reason}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Requested Items</h3>
          <LineItemsTable items={lineItems} onChange={() => {}} readOnly />
          <div className="flex justify-end mt-3">
            <div className="bg-gray-50 rounded-lg border border-gray-200 px-4 py-2">
              <span className="text-sm text-gray-600">Estimated Total: </span>
              <span className="font-bold text-[#22C55E]">{formatCurrency(req.estimated_amount)}</span>
            </div>
          </div>
        </div>

        {req.notes && (
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Notes</h3>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{req.notes}</p>
          </div>
        )}

        <Link href="/dashboard/purchase/requests">
          <Button variant="ghost" className="gap-1.5 text-gray-500">
            <ArrowLeft className="h-4 w-4" /> Back to Requests
          </Button>
        </Link>
      </div>

      <Dialog open={rejectModal} onOpenChange={setRejectModal}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Reject Purchase Request</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full h-24 text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:border-[#22C55E]"
              placeholder="Reason for rejection..."
            />
            <div className="flex gap-2">
              <Button
                onClick={handleReject}
                disabled={updating}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white"
              >
                {updating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Confirm Reject
              </Button>
              <Button variant="outline" onClick={() => setRejectModal(false)} className="flex-1" disabled={updating}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {companyInfo && req && (
        <div className="hidden">
          <PrintablePurchaseRequest ref={printRef} request={req} companyInfo={companyInfo} />
        </div>
      )}
    </div>
  );
}
