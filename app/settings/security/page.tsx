"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Key, Shield, Smartphone, ChevronRight, Fingerprint, Loader2 } from "lucide-react";
import { userApi } from "@/lib/api/user";
import toast from "react-hot-toast";

export default function SecurityPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match", {
        style: { borderRadius: '12px', background: '#111827', color: '#fff' }
      });
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long", {
        style: { borderRadius: '12px', background: '#111827', color: '#fff' }
      });
      return;
    }

    setIsLoading(true);

    try {
      await userApi.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });

      toast.success("Password changed successfully", {
        style: { borderRadius: '12px', background: '#111827', color: '#fff' }
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      console.error("Password change error:", error);
      const errorMessage = error.response?.data?.current_password?.[0] || 
                          error.response?.data?.new_password?.[0] ||
                          error.response?.data?.detail || 
                          "Failed to change password";
      toast.error(errorMessage, {
        style: { borderRadius: '12px', background: '#111827', color: '#fff' }
      });
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyles = "w-full px-4 py-3 bg-gray-50 border border-gray-100 text-sm font-semibold rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-[#22C55E]/20 focus:border-[#22C55E]";

  return (
    <main className="min-h-screen bg-[#FDFDFD] text-[#111827] selection:bg-[#22C55E]/20">
      <div className="max-w-[850px] mx-auto px-6 py-16">
        
        {/* Header */}
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
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-black tracking-tight text-gray-900">Security</h1>
              <p className="text-gray-500 font-medium mt-2">Protect your account with enterprise-grade security tools.</p>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-[#22C55E] rounded-full border border-emerald-100">
              <CheckCircle className="w-4 h-4" />
              <span className="text-[12px] font-bold uppercase tracking-wider">Account Secure</span>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          
          {/* Section: Change Password */}
          <section className="bg-white rounded-3xl border border-gray-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#22C55E]/10 flex items-center justify-center">
                <Key className="h-4 w-4 text-[#22C55E]" strokeWidth={2.5} />
              </div>
              <h2 className="text-[16px] font-bold text-gray-900">Update Password</h2>
            </div>

            <form onSubmit={handlePasswordChange} className="p-8 space-y-5 max-w-md">
              <div className="space-y-2">
                <label className="text-[12px] font-black text-gray-400 uppercase tracking-widest px-1">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className={inputStyles}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[12px] font-black text-gray-400 uppercase tracking-widest px-1">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className={inputStyles}
                  required
                />
                <p className="text-[11px] text-gray-400 font-medium px-1 italic">Min. 8 characters with 1 symbol</p>
              </div>

              <div className="space-y-2 pb-2">
                <label className="text-[12px] font-black text-gray-400 uppercase tracking-widest px-1">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className={inputStyles}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full sm:w-auto px-8 py-3 text-sm font-bold text-white bg-gray-900 rounded-xl hover:bg-black transition-all active:scale-[0.98] shadow-lg shadow-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#22C55E' }} />}
                {isLoading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </section>

          {/* Section: 2FA & Advanced */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.04)] flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center mb-6">
                  <Smartphone className="h-5 w-5 text-orange-500" strokeWidth={2.5} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Multi-factor Auth</h3>
                <p className="text-[14px] text-gray-500 font-medium leading-relaxed mb-6">
                  Verify your identity via mobile app or SMS whenever you log in.
                </p>
              </div>
              <button 
                type="button"
                onClick={() => toast("Advanced 2FA setup is coming soon", {
                  style: { borderRadius: '12px', background: '#111827', color: '#fff' }
                })}
                className="w-full flex items-center justify-between px-5 py-3 rounded-xl bg-orange-50/50 border border-orange-100 text-orange-700 text-sm font-bold group hover:bg-orange-50 transition-all"
              >
                Configure 2FA
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </section>

            <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.04)] flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-[#22C55E]/10 flex items-center justify-center mb-6">
                  <Fingerprint className="h-5 w-5 text-[#22C55E]" strokeWidth={2.5} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Session Control</h3>
                <p className="text-[14px] text-gray-500 font-medium leading-relaxed mb-6">
                  Manage your active sessions and logout from other devices instantly.
                </p>
              </div>
              <Link 
                href="/settings/sessions"
                className="w-full flex items-center justify-between px-5 py-3 rounded-xl bg-gray-50 border border-gray-100 text-gray-700 text-sm font-bold group hover:bg-gray-100 transition-all"
              >
                View Sessions
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </section>
          </div>

          {/* Section: Alerts */}
          <section className="bg-white rounded-3xl border border-gray-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.04)]">
            <div className="p-6 border-b border-gray-50 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <Shield className="h-4 w-4 text-blue-600" strokeWidth={2.5} />
              </div>
              <h2 className="text-[16px] font-bold text-gray-900">Security Notifications</h2>
            </div>

            <div className="p-8 space-y-6">
              {[
                { title: "Login Alerts", sub: "Email notifications for new device logins.", active: true },
                { title: "Security Log Exports", sub: "Weekly audit of security-related actions.", active: false },
              ].map((item) => (
                <div key={item.title} className="flex items-center justify-between group">
                  <div className="flex flex-col">
                    <span className="text-[15px] font-bold text-gray-900 leading-tight">{item.title}</span>
                    <span className="text-[13px] text-gray-500 font-medium mt-0.5">{item.sub}</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked={item.active} />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#22C55E]"></div>
                  </label>
                </div>
              ))}
            </div>
          </section>

        </div>
      </div>
    </main>
  );
}

function CheckCircle(props: any) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}