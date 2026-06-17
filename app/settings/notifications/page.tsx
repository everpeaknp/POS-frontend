"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Bell, Mail, MessageSquare, Smartphone, Volume2, Package, CreditCard, Users, AlertCircle, Loader2 } from "lucide-react";
import { userApi } from "@/lib/api/user";
import type { NotificationPreferences } from "@/lib/types/user";
import toast from "react-hot-toast";

export default function NotificationsPage() {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email_order_updates: true,
    email_payment_reminders: true,
    email_inventory_alerts: true,
    email_team_activity: true,
    push_desktop: false,
    push_mobile: false,
    push_sound: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const prefs = await userApi.getNotificationPreferences();
      setPreferences(prefs);
    } catch (error) {
      console.error("Failed to load preferences:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async (key: keyof NotificationPreferences) => {
    const newValue = !preferences[key];
    
    // Optimistic update
    setPreferences(prev => ({ ...prev, [key]: newValue }));

    try {
      await userApi.updateNotificationPreferences({ [key]: newValue });
      toast.success("Preference updated", {
        style: { borderRadius: '12px', background: '#111827', color: '#fff' }
      });
    } catch (error) {
      // Revert on error
      setPreferences(prev => ({ ...prev, [key]: !newValue }));
      toast.error("Failed to update preference", {
        style: { borderRadius: '12px', background: '#111827', color: '#fff' }
      });
    }
  };
  const emailSettings = [
    { title: "Order Updates", description: "Notifications about order status changes", icon: Package, key: 'email_order_updates' as keyof NotificationPreferences },
    { title: "Payment Reminders", description: "Reminders for pending payments", icon: CreditCard, key: 'email_payment_reminders' as keyof NotificationPreferences },
    { title: "Inventory Alerts", description: "Low stock and inventory updates", icon: AlertCircle, key: 'email_inventory_alerts' as keyof NotificationPreferences },
    { title: "Team Activity", description: "Updates from your team members", icon: Users, key: 'email_team_activity' as keyof NotificationPreferences },
  ];

  const pushSettings = [
    { title: "Desktop Notifications", description: "Show notifications on your desktop", icon: MessageSquare, key: 'push_desktop' as keyof NotificationPreferences },
    { title: "Mobile Notifications", description: "Receive push notifications on mobile", icon: Smartphone, key: 'push_mobile' as keyof NotificationPreferences },
    { title: "Sound Alerts", description: "Play sound for important notifications", icon: Volume2, key: 'push_sound' as keyof NotificationPreferences },
  ];

  const sectionHeader = (Icon: any, title: string) => (
    <div className="p-6 border-b border-gray-50 flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-[#22C55E]/10 flex items-center justify-center">
        <Icon className="h-4 w-4 text-[#22C55E]" strokeWidth={2.5} />
      </div>
      <h2 className="text-[16px] font-bold text-gray-900">{title}</h2>
    </div>
  );

  const toggleRow = (item: { title: string; description: string; icon: any; key: keyof NotificationPreferences }) => (
    <div key={item.title} className="flex items-center justify-between group p-4 -mx-2 rounded-xl hover:bg-gray-50 transition-all duration-200">
      <div className="flex items-center gap-4">
        <div className="hidden sm:flex w-10 h-10 items-center justify-center rounded-full bg-gray-50 text-gray-400 group-hover:text-[#22C55E] group-hover:bg-white transition-colors">
          <item.icon className="w-5 h-5 stroke-[1.5px]" />
        </div>
        <div className="flex flex-col">
          <span className="text-[15px] font-bold text-gray-900 leading-tight">{item.title}</span>
          <span className="text-[13px] text-gray-500 font-medium mt-0.5">{item.description}</span>
        </div>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input 
          type="checkbox" 
          className="sr-only peer" 
          checked={preferences[item.key]}
          onChange={() => handleToggle(item.key)}
          disabled={isLoading}
        />
        <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#22C55E] peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
      </label>
    </div>
  );

  return (
    <main className="min-h-screen bg-[#FDFDFD] text-[#111827] selection:bg-[#22C55E]/20">
      <div className="max-w-[850px] mx-auto px-6 py-16">
        
        {/* Navigation & Header */}
        <div className="mb-12">
          <Link
            href="/settings"
            className="group inline-flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-[#22C55E] transition-all mb-6"
          >
            <div className="p-1.5 rounded-lg bg-gray-50 group-hover:bg-[#22C55E]/10">
              <ArrowLeft className="h-4 w-4 stroke-[3px]" />
            </div>
            Back to Settings
          </Link>
          <h1 className="text-4xl font-black tracking-tight text-gray-900">Notifications</h1>
          <p className="text-gray-500 font-medium mt-2 leading-relaxed">
            Choose how you want to be alerted about your business activity.
          </p>
        </div>

        <div className="space-y-8">
          
          {/* Email Notifications Card */}
          <section className="bg-white rounded-3xl border border-gray-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.04)] overflow-hidden">
            {sectionHeader(Mail, "Email Subscriptions")}
            <div className="p-6 md:p-8 space-y-2">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-[#22C55E]" />
                </div>
              ) : (
                emailSettings.map((item) => toggleRow(item))
              )}
            </div>
          </section>

          {/* Push Notifications Card */}
          <section className="bg-white rounded-3xl border border-gray-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.04)] overflow-hidden">
            {sectionHeader(Bell, "System & Push Alerts")}
            <div className="p-6 md:p-8 space-y-2">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-[#22C55E]" />
                </div>
              ) : (
                pushSettings.map((item) => toggleRow(item))
              )}
            </div>
          </section>

          {/* Marketing Footer Note */}
          <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-6 flex items-start gap-4">
            <div className="p-2 rounded-lg bg-white shadow-sm">
              <Bell className="w-5 h-5 text-[#22C55E]" />
            </div>
            <div>
              <h4 className="text-[14px] font-bold text-emerald-900">Looking for Marketing emails?</h4>
              <p className="text-[13px] text-emerald-700/70 font-medium mt-1">
                Newsletter and promotion preferences are managed separately. 
                <button className="ml-1 text-[#22C55E] font-bold hover:underline">Manage Marketing</button>
              </p>
            </div>
          </div>

        </div>

        <p className="mt-12 text-center text-[11px] font-black text-gray-300 uppercase tracking-[0.3em]">
          Notification Protocol • v1.0.4
        </p>
      </div>
    </main>
  );
}