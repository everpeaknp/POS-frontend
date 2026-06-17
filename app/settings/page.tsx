"use client";

import React from "react";
import Link from "next/link";
import { 
  User, Bell, Shield, Key, Palette, 
  Globe, ChevronRight, ArrowLeft, Settings2 
} from "lucide-react";
import { useAuth } from "@/lib/context/AuthContext";

const SETTINGS_OPTIONS = [
  {
    id: "profile",
    icon: User,
    title: "Account Profile",
    description: "Manage your public presence, bio, and personal details.",
    href: "/settings/profile",
  },
  {
    id: "security",
    icon: Key,
    title: "Password & Security",
    description: "Secure your account with MFA and credential management.",
    href: "/settings/security",
  },
  {
    id: "notifications",
    icon: Bell,
    title: "Notification Center",
    description: "Configure how and when you want to be alerted.",
    href: "/settings/notifications",
  },
  {
    id: "appearance",
    icon: Palette,
    title: "Interface & Appearance",
    description: "Customize your workspace theme and display density.",
    href: "/settings/appearance",
  },
  {
    id: "privacy",
    icon: Shield,
    title: "Privacy & Permissions",
    description: "Review data sharing and third-party application access.",
    href: "/settings/privacy",
  },
  {
    id: "sessions",
    icon: Globe,
    title: "Active Sessions",
    description: "View and manage your active devices and login history.",
    href: "/settings/sessions",
  },
];

export default function SettingsDashboard() {
  const { user } = useAuth();

  return (
    <main className="min-h-screen bg-[#FDFDFD] text-[#111827] selection:bg-[#22C55E]/20">
      <div className="max-w-[850px] mx-auto px-6 py-20">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[#22C55E] font-bold text-[12px] tracking-[0.1em] uppercase">
              <div className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
              <span>System Settings</span>
            </div>
            <h1 className="text-4xl font-black tracking-tight text-gray-900">
              Account
            </h1>
            <p className="text-gray-500 text-[16px] font-medium max-w-sm leading-relaxed">
              Real-time management of your personal workspace and security protocols.
            </p>
          </div>

          {user && (
            <div className="flex items-center gap-4 bg-white p-2 pr-6 rounded-2xl border border-gray-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] transition-all hover:border-[#22C55E]/30">
              <div className="relative">
                <div className="h-11 w-11 rounded-xl bg-[#22C55E] text-white flex items-center justify-center text-[15px] font-bold shadow-[0_4px_10px_rgba(34,197,94,0.3)]">
                  {user.first_name?.[0] || "U"}
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></div>
              </div>
              <div className="flex flex-col">
                <span className="text-[14px] font-bold text-gray-900 leading-none">
                  {user.first_name} {user.last_name}
                </span>
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mt-1.5">
                  {user.email}
                </span>
              </div>
            </div>
          )}
        </header>

        {/* Professional List Stack */}
        <div className="space-y-2">
          {SETTINGS_OPTIONS.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="group relative flex items-center gap-6 p-5 bg-white border border-gray-100 rounded-2xl transition-all duration-300 hover:border-[#22C55E]/40 hover:shadow-[0_10px_30px_-15px_rgba(34,197,94,0.15)] active:scale-[0.995]"
            >
              {/* Subtle accent line on hover */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-0 bg-[#22C55E] rounded-r-full transition-all duration-300 group-hover:h-8" />
              
              <div className="flex-shrink-0 w-12 h-12 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-center transition-all group-hover:bg-[#22C55E]/5 group-hover:border-[#22C55E]/20">
                <item.icon className="w-5 h-5 text-gray-500 group-hover:text-[#22C55E] transition-colors stroke-[1.6px]" />
              </div>
              
              <div className="flex-1">
                <h3 className="text-[16px] font-bold text-gray-900 group-hover:text-[#22C55E] transition-colors">
                  {item.title}
                </h3>
                <p className="text-[14px] text-gray-500 leading-snug mt-0.5 font-medium">
                  {item.description}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[12px] font-bold text-gray-300 opacity-0 group-hover:opacity-100 transition-all group-hover:text-[#22C55E]/50 tracking-tighter">
                  CONFIGURE
                </span>
                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-[#22C55E] group-hover:translate-x-1 transition-all" strokeWidth={2.5} />
              </div>
            </Link>
          ))}
        </div>

        {/* Footer Navigation */}
        <footer className="mt-20 flex flex-col sm:flex-row items-center justify-between border-t border-gray-100 pt-10 gap-6">
          <Link
            href="/erp"
            className="flex items-center gap-2.5 text-[13px] font-bold text-gray-400 hover:text-[#22C55E] transition-all group"
          >
            <div className="p-1.5 rounded-lg bg-gray-50 group-hover:bg-[#22C55E]/10">
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" strokeWidth={3} />
            </div>
            Back to Dashboard
          </Link>
          
          <div className="flex items-center gap-4">
             <div className="h-1 w-8 rounded-full bg-gray-100 overflow-hidden">
                <div className="h-full w-2/3 bg-[#22C55E] rounded-full" />
             </div>
             <span className="text-[11px] font-black text-gray-300 uppercase tracking-[0.25em]">
              Khata
             </span>
          </div>
        </footer>
      </div>
    </main>
  );
}