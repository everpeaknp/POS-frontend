"use client";

import { CreditCard, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashHeader } from "@/components/dashboard/dash-header";

const plans = [
  { name: "Starter", price: 999, features: ["Up to 2 users", "Sales & Purchase", "Basic Reports", "Email Support"], current: false },
  { name: "Business", price: 2499, features: ["Up to 10 users", "All Modules", "Advanced Reports", "Priority Support", "API Access"], current: true },
  { name: "Enterprise", price: 5999, features: ["Unlimited users", "All Modules", "Custom Reports", "Dedicated Support", "Custom Integrations", "SLA Guarantee"], current: false },
];

export default function BillingPage() {
  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title="Billing & Subscription" subtitle="Manage your plan and payments" />
      <div className="flex-1 p-6 space-y-6">
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm flex items-center gap-4 max-w-2xl">
          <div className="p-3 rounded-xl bg-green-50"><CreditCard className="h-6 w-6 text-[#22C55E]" /></div>
          <div className="flex-1">
            <p className="font-semibold text-gray-800">Business Plan — Active</p>
            <p className="text-sm text-gray-500 mt-0.5">Next billing: Baisakh 1, 2083 · Rs. 2,499/month</p>
          </div>
          <Button variant="outline" size="sm" className="border-gray-200 text-gray-600">Manage</Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl">
          {plans.map((plan) => (
            <div key={plan.name} className={`bg-white rounded-xl border p-5 shadow-sm ${plan.current ? "border-[#22C55E] ring-1 ring-[#22C55E]" : "border-gray-100"}`}>
              {plan.current && <div className="text-xs font-semibold text-[#22C55E] mb-2">Current Plan</div>}
              <p className="font-bold text-gray-800 text-lg">{plan.name}</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">Rs. {plan.price.toLocaleString()}<span className="text-sm font-normal text-gray-500">/mo</span></p>
              <ul className="mt-4 space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                    <Check className="h-3.5 w-3.5 text-[#22C55E] shrink-0" />{f}
                  </li>
                ))}
              </ul>
              <Button className={`w-full mt-5 ${plan.current ? "bg-gray-100 text-gray-500 cursor-default" : "bg-[#22C55E] hover:bg-[#16A34A] text-white"}`} disabled={plan.current}>
                {plan.current ? "Current Plan" : "Upgrade"}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
