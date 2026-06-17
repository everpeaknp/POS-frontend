"use client";

import Link from "next/link";
import { ArrowLeft, Shield, Eye, Download, Trash2, ChevronDown, Lock } from "lucide-react";
import toast from "react-hot-toast";

export default function PrivacyPage() {
  const inputStyles = "appearance-none w-full sm:w-48 px-4 py-2.5 bg-gray-50 border border-gray-100 text-sm font-bold rounded-xl focus:outline-none focus:ring-2 focus:ring-[#22C55E]/20 focus:border-[#22C55E] transition-all cursor-pointer";

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
          <h1 className="text-4xl font-black tracking-tight text-gray-900">Privacy & Data</h1>
          <p className="text-gray-500 font-medium mt-2">Manage your data footprint and visibility preferences.</p>
        </div>

        <div className="space-y-8">
          
          {/* Section: Visibility */}
          <section className="bg-white rounded-3xl border border-gray-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#22C55E]/10 flex items-center justify-center">
                <Shield className="h-4 w-4 text-[#22C55E]" strokeWidth={2.5} />
              </div>
              <h2 className="text-[16px] font-bold text-gray-900">Privacy Controls</h2>
            </div>

            <div className="p-8 space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-[15px] font-bold text-gray-900 leading-tight">Profile Visibility</p>
                  <p className="text-[13px] text-gray-500 font-medium mt-1">Control who can view your business profile</p>
                </div>
                <div className="relative">
                  <select className={inputStyles}>
                    <option>Everyone</option>
                    <option>Organization Only</option>
                    <option>Private</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {[
                { title: "Activity Status", sub: "Show others when you are active in the workspace.", active: true },
                { title: "Search Indexing", sub: "Allow your profile to be discovered via search engines.", active: false },
              ].map((item) => (
                <div key={item.title} className="flex items-center justify-between group">
                  <div className="flex flex-col">
                    <span className="text-[15px] font-bold text-gray-900 leading-tight">{item.title}</span>
                    <span className="text-[13px] text-gray-500 font-medium mt-1">{item.sub}</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked={item.active} />
                    <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#22C55E]"></div>
                  </label>
                </div>
              ))}
            </div>
          </section>

          {/* Section: Data Management */}
          <section className="bg-white rounded-3xl border border-gray-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <Eye className="h-4 w-4 text-blue-600" strokeWidth={2.5} />
              </div>
              <h2 className="text-[16px] font-bold text-gray-900">Data Management</h2>
            </div>

            <div className="p-8 space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-[15px] font-bold text-gray-900 leading-tight">Data Retention</p>
                  <p className="text-[13px] text-gray-500 font-medium mt-1">Automatic cleanup of your activity logs</p>
                </div>
                <div className="relative">
                  <select className={inputStyles}>
                    <option>1 Year</option>
                    <option>5 Years</option>
                    <option>Forever</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-white rounded-lg shadow-sm text-gray-400">
                    <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[14px] font-bold text-gray-900">Download Archive</p>
                    <p className="text-[12px] text-gray-500 font-medium">Get a JSON export of all your data</p>
                  </div>
                </div>
                <button 
                  onClick={() => toast.success("Preparing your data archive...", {
                    style: { borderRadius: '12px', background: '#111827', color: '#fff' }
                  })}
                  className="px-4 py-2 text-xs font-black uppercase tracking-wider text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Request
                </button>
              </div>
            </div>
          </section>

          {/* Section: Danger Zone */}
          <section className="bg-red-50/30 rounded-3xl border border-red-100 overflow-hidden">
            <div className="p-6 border-b border-red-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                <Trash2 className="h-4 w-4 text-red-600" strokeWidth={2.5} />
              </div>
              <h2 className="text-[16px] font-bold text-red-900">Danger Zone</h2>
            </div>

            <div className="p-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="max-w-md">
                  <p className="text-[15px] font-bold text-red-900 leading-tight">Delete Account</p>
                  <p className="text-[13px] text-red-700/70 font-medium mt-2 leading-relaxed">
                    Once you delete your account, there is no going back. All your data, including history and assets, will be permanently removed.
                  </p>
                </div>
                <button
                  onClick={() => toast.error("Account deletion requires 2FA confirmation")}
                  className="whitespace-nowrap px-6 py-3 text-sm font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 shadow-lg shadow-red-200 transition-all active:scale-[0.98]"
                >
                  Permanently Delete
                </button>
              </div>
            </div>
          </section>

          {/* Trust Badge */}
          <div className="flex items-center justify-center gap-2 pt-4">
            <Lock className="w-3 h-3 text-gray-300" />
            <span className="text-[11px] font-black text-gray-300 uppercase tracking-[0.2em]">End-to-End Encrypted Data Storage</span>
          </div>

        </div>
      </div>
    </main>
  );
}