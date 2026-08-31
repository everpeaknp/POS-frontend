"use client";

import { FormattedDate } from "@/components/shared/FormattedDate";
import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Edit, ArrowLeft, ExternalLink, Copy, Check, Phone, Mail, User, Calendar, DollarSign, FileText, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DashHeader } from "@/components/dashboard/dash-header";
import { StatusBadge } from "@/components/sales/StatusBadge";
import { SkeletonTable } from "@/components/shared/Skeleton";
import { useApi } from "@/lib/hooks/useApi";
import { customerAPI, salesOrderAPI, invoiceAPI, customerCreditAPI } from "@/lib/api/sales";
import { formatCurrency } from "@/lib/utils";
import { CustomerPricingPanel } from "@/components/sales/CustomerPricingPanel";
import toast from "react-hot-toast";
import { WhatsAppIcon, TelegramIcon, EnvelopeIcon } from "@/lib/icons/lucide-react-shim";

const tabs = ["Overview", "Orders", "Invoices", "Ledger", "Pricing"];

export default function CustomerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState("Overview");
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [shareCopied, setShareCopied] = useState(false);

  const { data: customerData, loading: customerLoading } = useApi(
    () => customerAPI.get(id),
    { immediate: true, deps: [id] }
  );

  const { data: ordersData, loading: ordersLoading } = useApi(
    () => salesOrderAPI.list({ customer: id }),
    { immediate: activeTab === "Orders", deps: [id, activeTab] }
  );

  const { data: invoicesData, loading: invoicesLoading } = useApi(
    () => invoiceAPI.list({ customer: id }),
    { immediate: activeTab === "Invoices", deps: [id, activeTab] }
  );

  const { data: ledgerData, loading: ledgerLoading } = useApi(
    () => customerCreditAPI.getLedger(id),
    { immediate: activeTab === "Ledger", deps: [id, activeTab] }
  );

  const handleShare = async () => {
    if (!customer) return;
    
    try {
      // Check if customer already has a share token
      if (customer.share_token) {
        const shareUrl = `${window.location.origin}/shares/customer/${customer.share_token}`;
        setShareLink(shareUrl);
        setShareModalOpen(true);
        return;
      }
      
      // Generate new share token (assuming API endpoint exists)
      const response = await customerAPI.generateShareToken(id);
      const shareUrl = `${window.location.origin}/shares/customer/${response.share_token}`;
      setShareLink(shareUrl);
      setShareModalOpen(true);
    } catch (error: any) {
      console.error("Failed to generate share link:", error);
      toast.error("Failed to generate share link");
    }
  };

  const handleCopyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
      toast.success("Link copied to clipboard");
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  if (customerLoading) {
    return (
      <div className="flex flex-col h-full min-h-0 bg-gray-50">
        <DashHeader title="Loading..." subtitle="Customer Profile" />
        <div className="flex-1 p-6">
          <SkeletonTable rows={5} />
        </div>
      </div>
    );
  }

  const customer = customerData?.data;
  if (!customer) {
    return (
      <div className="flex flex-col h-full min-h-0 bg-gray-50">
        <DashHeader title="Not Found" subtitle="Customer Profile" />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6">
          <p className="text-gray-500">Customer not found</p>
          <Link href="/dashboard/sales/customers">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to Customers
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const orders = ordersData?.data?.results || [];
  const invoices = invoicesData?.data?.results || [];
  const ledger = !ledgerData
    ? []
    : Array.isArray(ledgerData)
      ? ledgerData
      : (ledgerData as { results?: unknown[] }).results ?? [];

  return (
    <div className="flex flex-col h-full min-h-0 bg-gray-50">
      <DashHeader title={customer.name} subtitle="Customer Profile & Ledger" />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="w-full min-h-full space-y-4">
          {/* Hero Section - Customer Profile */}
          <div className="bg-gradient-to-br from-[#22C55E] to-emerald-600 rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              {/* Edit Button - Top Right */}
              <div className="flex justify-end mb-4">
                <Link href={`/dashboard/sales/customers/${customer.id}/edit`}>
                  <Button
                    size="sm"
                    className="bg-white text-[#22C55E] hover:bg-white/90 gap-1.5 h-8 text-xs"
                  >
                    <Edit className="h-3.5 w-3.5" />
                    Edit Profile
                  </Button>
                </Link>
              </div>
              
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                {/* Avatar */}
                <div className="shrink-0">
                  <div className="h-20 w-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-4 border-white shadow-lg">
                    <span className="text-3xl font-bold text-white">{getInitials(customer.name)}</span>
                  </div>
                </div>

                {/* Details */}
                <div className="flex-1 text-white">
                  <h1 className="text-2xl font-bold mb-2">{customer.name}</h1>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {customer.phone && (
                      <div className="flex items-center gap-1.5 text-white/90 bg-white/10 backdrop-blur-sm rounded-md px-2.5 py-1">
                        <Phone className="h-3.5 w-3.5" />
                        <span className="text-xs font-medium">{customer.phone}</span>
                      </div>
                    )}
                    {customer.email && (
                      <div className="flex items-center gap-1.5 text-white/90 bg-white/10 backdrop-blur-sm rounded-md px-2.5 py-1">
                        <Mail className="h-3.5 w-3.5" />
                        <span className="text-xs font-medium">{customer.email}</span>
                      </div>
                    )}
                    {customer.pan && (
                      <div className="flex items-center gap-1.5 text-white/90 bg-white/10 backdrop-blur-sm rounded-md px-2.5 py-1">
                        <User className="h-3.5 w-3.5" />
                        <span className="text-xs font-medium">PAN: {customer.pan}</span>
                      </div>
                    )}
                    <StatusBadge status={customer.status} />
                  </div>
                  {customer.address && (
                    <p className="text-xs text-white/80">{customer.address}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Financial Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-2xl font-bold text-gray-900 mb-2">
                    {customer.total_orders || 0}
                  </p>
                  <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Total Orders</h3>
                  <p className="text-xs text-gray-400">All time orders</p>
                </div>
                <div className="p-2.5 bg-blue-50 rounded-lg">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-2xl font-bold text-gray-900 mb-2">
                    {formatCurrency(customer.total_spent || 0)}
                  </p>
                  <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Total Spent</h3>
                  <p className="text-xs text-gray-400">All time revenue</p>
                </div>
                <div className="p-2.5 bg-emerald-50 rounded-lg">
                  <DollarSign className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-2xl font-bold text-red-600 mb-2">
                    {formatCurrency(customer.current_balance || 0)}
                  </p>
                  <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Outstanding</h3>
                  <p className="text-xs text-gray-400">Current balance due</p>
                </div>
                <div className="p-2.5 bg-red-50 rounded-lg">
                  <CreditCard className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-2xl font-bold text-gray-900 mb-2">
                    {formatCurrency(customer.credit_limit || 0)}
                  </p>
                  <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Credit Limit</h3>
                  <p className="text-xs text-gray-400">{customer.payment_terms || 'N/A'}</p>
                </div>
                <div className="p-2.5 bg-purple-50 rounded-lg">
                  <DollarSign className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Tabs Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="border-b border-gray-200 bg-gray-50/50 px-5 py-3">
              <div className="flex items-center justify-between">
                <div className="flex gap-1 overflow-x-auto">
                  {tabs.map((t) => (
                    <button
                      key={t}
                      onClick={() => setActiveTab(t)}
                      className={`px-4 py-2 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                        activeTab === t
                          ? "border-[#22C55E] text-[#22C55E]"
                          : "border-transparent text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  {/* Share functionality - Backend endpoint needed */}
                  {/* <Button
                    onClick={handleShare}
                    size="sm"
                    variant="outline"
                    className="border-gray-300 hover:bg-gray-50 gap-1.5 h-8"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Share
                  </Button> */}
                  <Link href={`/dashboard/sales/customers/${customer.id}/aging`}>
                    <Button variant="outline" size="sm" className="gap-1.5 h-8">
                      Aging Report
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            <div className="p-5 lg:p-6">
            {activeTab === "Overview" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <p className="text-sm text-gray-500 mb-1">Status</p>
                    <StatusBadge status={customer.status} />
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <p className="text-sm text-gray-500 mb-1">Payment Terms</p>
                    <p className="text-base font-medium text-gray-900">{customer.payment_terms || 'N/A'}</p>
                  </div>
                </div>
                {customer.notes && (
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <p className="text-sm text-gray-500 mb-2">Notes</p>
                    <p className="text-sm text-gray-700">{customer.notes}</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "Orders" && (
              ordersLoading ? (
                <SkeletonTable rows={3} />
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {["Order #", "Date", "Items", "Total", "Status"].map((h) => (
                        <th key={h} className="text-left text-xs text-gray-400 font-medium pb-2 px-2">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-sm text-gray-400">
                          No orders
                        </td>
                      </tr>
                    ) : (
                      orders.map((o: any) => (
                        <tr key={o.id} className="hover:bg-gray-50/50">
                          <td className="px-2 py-2.5 font-mono text-xs text-[#22C55E]">
                            <Link href={`/dashboard/sales/orders/${o.id}`} className="hover:underline">
                              {o.order_number}
                            </Link>
                          </td>
                          <td className="px-2 py-2.5 text-gray-600">
                            <FormattedDate value={o.date} />
                          </td>
                          <td className="px-2 py-2.5 text-gray-600">{o.items_count || 0}</td>
                          <td className="px-2 py-2.5 font-medium">{formatCurrency(o.total)}</td>
                          <td className="px-2 py-2.5">
                            <StatusBadge status={o.status} />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )
            )}

            {activeTab === "Invoices" && (
              invoicesLoading ? (
                <SkeletonTable rows={3} />
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {["Invoice #", "Date", "Due Date", "Amount", "Balance", "Status"].map((h) => (
                        <th key={h} className="text-left text-xs text-gray-400 font-medium pb-2 px-2">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {invoices.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-sm text-gray-400">
                          No invoices
                        </td>
                      </tr>
                    ) : (
                      invoices.map((inv: any) => (
                        <tr key={inv.id} className="hover:bg-gray-50/50">
                          <td className="px-2 py-2.5 font-mono text-xs text-[#22C55E]">
                            <Link href={`/dashboard/sales/invoices/${inv.id}`} className="hover:underline">
                              {inv.invoice_number}
                            </Link>
                          </td>
                          <td className="px-2 py-2.5 text-gray-600">
                            <FormattedDate value={inv.date} />
                          </td>
                          <td className="px-2 py-2.5 text-gray-600">
                            <FormattedDate value={inv.due_date} />
                          </td>
                          <td className="px-2 py-2.5 font-medium">{formatCurrency(inv.amount)}</td>
                          <td className="px-2 py-2.5 text-red-600">{formatCurrency(inv.balance)}</td>
                          <td className="px-2 py-2.5">
                            <StatusBadge status={inv.status} />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )
            )}

            {activeTab === "Ledger" && (
              ledgerLoading ? (
                <SkeletonTable rows={3} />
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {["Date", "Type", "Reference", "Debit", "Credit", "Balance"].map((h) => (
                        <th key={h} className="text-left text-xs text-gray-400 font-medium pb-2 px-2">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {ledger.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-sm text-gray-400">
                          No ledger entries
                        </td>
                      </tr>
                    ) : (
                      ledger.map((entry: any) => (
                        <tr key={entry.id} className="hover:bg-gray-50/50">
                          <td className="px-2 py-2.5 text-gray-600">
                            <FormattedDate value={entry.date} />
                          </td>
                          <td className="px-2 py-2.5 text-gray-600 capitalize">{entry.transaction_type}</td>
                          <td className="px-2 py-2.5 font-mono text-xs text-[#22C55E]">
                            {entry.reference_number}
                          </td>
                          <td className="px-2 py-2.5 text-red-600">
                            {entry.debit_amount > 0 ? formatCurrency(entry.debit_amount) : '-'}
                          </td>
                          <td className="px-2 py-2.5 text-green-600">
                            {entry.credit_amount > 0 ? formatCurrency(entry.credit_amount) : '-'}
                          </td>
                          <td className="px-2 py-2.5 font-medium">{formatCurrency(entry.running_balance)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )
            )}

            {activeTab === "Pricing" && (
              <CustomerPricingPanel customerId={id} />
            )}
            </div>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      <Dialog open={shareModalOpen} onOpenChange={setShareModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5 text-[#22C55E]" />
              Share Customer Ledger
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <p className="text-sm text-gray-600">
              Share this secure link to allow others to view {customer.name}'s ledger without logging in:
            </p>
            
            <div className="flex gap-2">
              <input
                type="text"
                value={shareLink}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 font-mono"
              />
              <Button
                onClick={handleCopyShareLink}
                className={`gap-2 ${shareCopied ? 'bg-green-600 hover:bg-green-700' : 'bg-[#22C55E] hover:bg-[#22C55E]/90'}`}
              >
                {shareCopied ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy
                  </>
                )}
              </Button>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm font-medium text-gray-700 mb-3">Share via</p>
              <div className="flex gap-2">
                <button
                  onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(shareLink)}`, '_blank')}
                  className="flex-1 p-3 hover:bg-gray-100 rounded-lg transition flex items-center justify-center gap-2 border border-gray-200"
                  title="Share on WhatsApp"
                >
                  <WhatsAppIcon className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium">WhatsApp</span>
                </button>
                <button
                  onClick={() => window.open(`https://t.me/share/url?url=${encodeURIComponent(shareLink)}`, '_blank')}
                  className="flex-1 p-3 hover:bg-gray-100 rounded-lg transition flex items-center justify-center gap-2 border border-gray-200"
                  title="Share on Telegram"
                >
                  <TelegramIcon className="h-5 w-5 text-blue-500" />
                  <span className="text-sm font-medium">Telegram</span>
                </button>
                <button
                  onClick={() => window.open(`mailto:?body=${encodeURIComponent(shareLink)}`, '_blank')}
                  className="flex-1 p-3 hover:bg-gray-100 rounded-lg transition flex items-center justify-center gap-2 border border-gray-200"
                  title="Share via Email"
                >
                  <EnvelopeIcon className="h-5 w-5 text-gray-600" />
                  <span className="text-sm font-medium">Email</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t pt-4">
            <Button
              onClick={() => setShareModalOpen(false)}
              className="bg-[#22C55E] hover:bg-[#22C55E]/90"
            >
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
