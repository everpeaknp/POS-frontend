"use client";

import { useEffect, useState } from "react";
import {
  CreditCard,
  Check,
  Loader2,
  History,
  AlertCircle,
  Shield,
  Zap,
  FileDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormattedDate } from "@/components/shared/FormattedDate";
import { billingApi, submitEsewaForm, isPlanActivation, type BillingOverview } from "@/lib/api/billing";
import { openInvoiceForPdfDownload } from "@/lib/billing/invoice";
import { formatCurrency } from "@/lib/utils";
import toast from "react-hot-toast";

function formatPlanPrice(price: number) {
  return price === 0 ? "Free" : formatCurrency(price);
}

function PaymentStatusBadge({ status }: { status: string }) {
  const styles =
    status === "completed"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
      : status === "pending"
        ? "bg-amber-50 text-amber-700 ring-amber-600/20"
        : "bg-red-50 text-red-700 ring-red-600/20";

  return (
    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ring-1 ring-inset ${styles}`}>
      {status}
    </span>
  );
}

export function BillingPanel({
  onLoadingChange,
}: {
  onLoadingChange?: (loading: boolean) => void;
}) {
  const [overview, setOverview] = useState<BillingOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutPlan, setCheckoutPlan] = useState<string | null>(null);
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState<number | null>(null);

  const setPageLoading = (value: boolean) => {
    setLoading(value);
    onLoadingChange?.(value);
  };

  const loadOverview = async (showLoading = true) => {
    try {
      if (showLoading) setPageLoading(true);
      const data = await billingApi.getOverview();
      setOverview(data);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to load billing");
    } finally {
      if (showLoading) setPageLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, []);

  const handleUpgrade = async (planCode: string) => {
    if (!overview?.can_manage_billing) {
      toast.error("Unable to change your account plan right now");
      return;
    }

    const plan = overview.plans.find((p) => p.code === planCode);
    const isFree = (plan?.price ?? 0) === 0;

    if (!isFree && !overview.esewa_enabled) {
      toast.error("eSewa payments are not configured");
      return;
    }

    try {
      setCheckoutPlan(planCode);
      if (!isFree) toast.loading("Redirecting to eSewa...");
      const result = await billingApi.checkout(planCode);
      toast.dismiss();

      if (isPlanActivation(result)) {
        toast.success(result.message);
        setCheckoutPlan(null);
        await loadOverview(false);
        return;
      }

      sessionStorage.setItem("khata_billing_txn", result.transaction_uuid);
      submitEsewaForm(result);
    } catch (error: any) {
      toast.dismiss();
      toast.error(error.response?.data?.detail || "Failed to change plan");
      setCheckoutPlan(null);
    }
  };

  const handleDownloadInvoice = async (paymentId: number) => {
    try {
      setDownloadingInvoiceId(paymentId);
      const html = await billingApi.fetchInvoiceHtml(paymentId);
      openInvoiceForPdfDownload(html, `invoice-${paymentId}`);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } }; message?: string };
      toast.error(err.response?.data?.detail || err.message || "Failed to download invoice");
    } finally {
      setDownloadingInvoiceId(null);
    }
  };

  if (loading) {
    return null;
  }

  if (!overview) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-gray-500">
        <AlertCircle className="h-10 w-10 text-gray-300" />
        <p>Unable to load billing information</p>
        <Button variant="outline" size="sm" onClick={() => loadOverview()}>
          Try again
        </Button>
      </div>
    );
  }

  const {
    account,
    plans,
    payments,
    can_manage_billing,
    esewa_enabled,
    subscription,
  } = overview;

  return (
    <div className="space-y-6">
      {account && (
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Your account</p>
          <p className="mt-1 text-lg font-semibold text-gray-900">{account.name}</p>
          <p className="text-sm text-gray-500">{account.email}</p>
          {subscription.current_period_end && (
            <p className="mt-2 text-sm text-gray-600">
              Plan expires{" "}
              <FormattedDate value={subscription.current_period_end} />
            </p>
          )}
        </div>
      )}

      {!esewa_enabled && (
        <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <CreditCard className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900">eSewa not configured</p>
            <p className="text-sm text-blue-800/80 mt-0.5">
              Online payments are disabled until your platform administrator configures eSewa.
            </p>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold text-gray-900">Your account plan</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Subscribe on your account, then use paid modules when you create or join organizations. Paid plans use eSewa.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mt-5">
          {plans.map((plan) => {
            const isPopular = Boolean(plan.is_popular) && !plan.is_current;
            const isFree = plan.price === 0;
            return (
              <div
                key={plan.code}
                className={`relative flex flex-col rounded-2xl border bg-white p-6 shadow-sm ${
                  plan.is_current
                    ? "border-[#22C55E] ring-2 ring-[#22C55E]/20"
                    : isPopular
                      ? "border-emerald-200"
                      : "border-gray-100"
                }`}
              >
                {plan.is_current && (
                  <div className="absolute -top-3 left-6 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#22C55E] text-white text-xs font-semibold">
                    <Check className="h-3 w-3" /> Current plan
                  </div>
                )}
                {isPopular && (
                  <div className="absolute -top-3 left-6 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500 text-white text-xs font-semibold">
                    <Zap className="h-3 w-3" /> Most popular
                  </div>
                )}

                <p className="font-bold text-gray-900 text-lg pt-1">{plan.name}</p>
                <div className="text-xs text-gray-500 mt-0.5 space-y-0.5">
                  <p>
                    {plan.max_users != null ? `Up to ${plan.max_users} users` : "Unlimited users"}
                  </p>
                  <p>
                    {plan.max_orgs != null
                      ? `Up to ${plan.max_orgs} ${plan.max_orgs === 1 ? "organization" : "organizations"}`
                      : "Unlimited organizations"}
                  </p>
                </div>

                <div className="mt-4 mb-5">
                  <span className="text-3xl font-bold text-gray-900">{formatPlanPrice(plan.price)}</span>
                  {!isFree && <span className="text-sm text-gray-500 ml-1">/month</span>}
                </div>

                <ul className="space-y-2.5 flex-1 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-gray-600">
                      <Check className="h-3.5 w-3.5 text-[#22C55E] shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>

                <Button
                  className={`w-full h-10 font-semibold ${
                    plan.is_current
                      ? "bg-gray-100 text-gray-500 hover:bg-gray-100 cursor-default"
                      : isFree
                        ? "bg-gray-900 hover:bg-gray-800 text-white"
                        : "bg-[#22C55E] hover:bg-[#16A34A] text-white"
                  }`}
                  disabled={
                    plan.is_current ||
                    !can_manage_billing ||
                    checkoutPlan === plan.code ||
                    (!isFree && !esewa_enabled)
                  }
                  onClick={() => handleUpgrade(plan.code)}
                >
                  {checkoutPlan === plan.code ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {isFree ? "Switching..." : "Redirecting..."}
                    </span>
                  ) : plan.is_current ? (
                    "Your current plan"
                  ) : isFree ? (
                    "Switch to Free"
                  ) : (
                    "Pay with eSewa"
                  )}
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center gap-2.5 px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <History className="h-4 w-4 text-gray-500" />
          <div>
            <h3 className="font-semibold text-gray-900">Payment history</h3>
            <p className="text-xs text-gray-500">Payments for your Khata account</p>
          </div>
          <div className="ml-auto hidden sm:flex items-center gap-1.5 text-xs text-gray-500">
            <Shield className="h-3.5 w-3.5" />
            eSewa
          </div>
        </div>

        {payments.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-500">No payments yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/30">
                  {["Date", "Plan", "Amount", "Expires", "Method", "Status", "Reference", "Invoice"].map((h) => (
                    <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                      <FormattedDate value={payment.completed_at || payment.created_at} />
                    </td>
                    <td className="px-6 py-4 capitalize font-medium">{payment.plan_code}</td>
                    <td className="px-6 py-4 font-semibold">{formatCurrency(payment.amount)}</td>
                    <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                      {payment.period_end ? (
                        <FormattedDate value={payment.period_end} />
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 capitalize text-gray-600">{payment.payment_method}</td>
                    <td className="px-6 py-4">
                      <PaymentStatusBadge status={payment.status} />
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-gray-400 max-w-[180px] truncate">
                      {payment.transaction_uuid}
                    </td>
                    <td className="px-6 py-4">
                      {payment.invoice_available ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1.5 text-xs"
                          disabled={downloadingInvoiceId === payment.id}
                          onClick={() => handleDownloadInvoice(payment.id)}
                        >
                          {downloadingInvoiceId === payment.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <FileDown className="h-3.5 w-3.5" />
                          )}
                          PDF
                        </Button>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
