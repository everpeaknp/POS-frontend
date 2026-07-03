"use client";

import { useEffect, useState } from "react";
import { CreditCard, Check, Loader2, History, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashHeader } from "@/components/dashboard/dash-header";
import { FormattedDate } from "@/components/shared/FormattedDate";
import { billingApi, submitEsewaForm, type BillingOverview } from "@/lib/api/billing";
import { formatCurrency } from "@/lib/utils";
import toast from "react-hot-toast";

export default function BillingPage() {
  const [overview, setOverview] = useState<BillingOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutPlan, setCheckoutPlan] = useState<string | null>(null);

  const loadOverview = async () => {
    try {
      setLoading(true);
      const data = await billingApi.getOverview();
      setOverview(data);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to load billing");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, []);

  const handleUpgrade = async (planCode: string) => {
    if (!overview?.can_manage_billing) {
      toast.error("Only organization admins can change the subscription plan");
      return;
    }
    if (!overview.esewa_enabled) {
      toast.error("eSewa payments are not configured");
      return;
    }

    try {
      setCheckoutPlan(planCode);
      toast.loading("Redirecting to eSewa...");
      const checkout = await billingApi.checkout(planCode);
      toast.dismiss();
      sessionStorage.setItem("khata_billing_txn", checkout.transaction_uuid);
      submitEsewaForm(checkout);
    } catch (error: any) {
      toast.dismiss();
      toast.error(error.response?.data?.detail || "Failed to start checkout");
      setCheckoutPlan(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Billing & Subscription" subtitle="Manage your plan and payments" />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#22C55E]" />
        </div>
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Billing & Subscription" subtitle="Manage your plan and payments" />
        <div className="flex-1 flex items-center justify-center text-gray-500">
          Unable to load billing information
        </div>
      </div>
    );
  }

  const { subscription, plans, payments, can_manage_billing } = overview;

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title="Billing & Subscription" subtitle="Manage your plan and payments" />
      <div className="flex-1 p-6 space-y-6">
        {!can_manage_billing && (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-xl p-4 max-w-3xl">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">
              Only organization admins can upgrade plans or manage billing. Contact your admin to make changes.
            </p>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm flex items-center gap-4 max-w-3xl">
          <div className="p-3 rounded-xl bg-green-50">
            <CreditCard className="h-6 w-6 text-[#22C55E]" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-800">
              {subscription.plan_name} Plan
              <span className={`ml-2 text-xs font-medium px-2 py-0.5 rounded-full ${
                subscription.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
              }`}>
                {subscription.is_active ? subscription.status : "inactive"}
              </span>
            </p>
            <p className="text-sm text-gray-500 mt-0.5">
              {subscription.current_period_end ? (
                <>
                  Next billing: <FormattedDate value={subscription.current_period_end} />
                  {" · "}
                </>
              ) : null}
              {formatCurrency(subscription.monthly_price)}/month
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-5xl">
          {plans.map((plan) => (
            <div
              key={plan.code}
              className={`bg-white rounded-xl border p-5 shadow-sm ${
                plan.is_current ? "border-[#22C55E] ring-1 ring-[#22C55E]" : "border-gray-100"
              }`}
            >
              {plan.is_current && (
                <div className="text-xs font-semibold text-[#22C55E] mb-2">Current Plan</div>
              )}
              <p className="font-bold text-gray-800 text-lg">{plan.name}</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {formatCurrency(plan.price)}
                <span className="text-sm font-normal text-gray-500">/mo</span>
              </p>
              <ul className="mt-4 space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                    <Check className="h-3.5 w-3.5 text-[#22C55E] shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                className={`w-full mt-5 ${
                  plan.is_current
                    ? "bg-gray-100 text-gray-500 cursor-default"
                    : "bg-[#22C55E] hover:bg-[#16A34A] text-white"
                }`}
                disabled={plan.is_current || !can_manage_billing || checkoutPlan === plan.code}
                onClick={() => handleUpgrade(plan.code)}
              >
                {checkoutPlan === plan.code ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Redirecting...
                  </span>
                ) : plan.is_current ? (
                  "Current Plan"
                ) : (
                  `Pay with eSewa`
                )}
              </Button>
            </div>
          ))}
        </div>

        {payments.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden max-w-5xl">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
              <History className="h-4 w-4 text-gray-500" />
              <h3 className="font-semibold text-gray-800">Payment History</h3>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["Date", "Plan", "Amount", "Method", "Status", "Reference"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 text-gray-600">
                      <FormattedDate value={payment.completed_at || payment.created_at} />
                    </td>
                    <td className="px-4 py-3 capitalize text-gray-700">{payment.plan_code}</td>
                    <td className="px-4 py-3 font-medium">{formatCurrency(payment.amount)}</td>
                    <td className="px-4 py-3 capitalize text-gray-600">{payment.payment_method}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                        payment.status === "completed"
                          ? "bg-green-100 text-green-700"
                          : payment.status === "pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                      }`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{payment.transaction_uuid}</td>
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
