"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Globe, Monitor, Smartphone, Trash2, ShieldCheck, MapPin, Activity, Loader2 } from "lucide-react";
import { userApi } from "@/lib/api/user";
import type { Session } from "@/lib/types/user";
import toast from "react-hot-toast";

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const data = await userApi.getSessions();
      setSessions(data);
    } catch (error) {
      console.error("Failed to load sessions:", error);
      toast.error("Failed to load sessions");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await userApi.revokeSession(sessionId);
      toast.success("Session revoked successfully");
      // Remove from list
      setSessions(prev => prev.filter(s => s.id !== sessionId));
    } catch (error) {
      console.error("Failed to revoke session:", error);
      toast.error("Failed to revoke session");
    }
  };

  const getDeviceIcon = (device: string) => {
    if (device.toLowerCase().includes('iphone') || device.toLowerCase().includes('mobile')) {
      return Smartphone;
    }
    return Monitor;
  };

  return (
    <main className="min-h-screen bg-[#FDFDFD] text-[#111827]">
      <div className="max-w-[850px] mx-auto px-6 py-16">
        
        {/* Navigation & Header */}
        <div className="mb-12">
          <Link
            href="/settings"
            className="group inline-flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-[#22C55E] transition-all mb-6"
          >
            <div className="p-1.5 rounded-lg bg-gray-50 group-hover:bg-[#22C55E]/10 transition-colors">
              <ArrowLeft className="h-4 w-4 stroke-[3px]" />
            </div>
            Back to Settings
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-4xl font-black tracking-tight text-gray-900">Active Sessions</h1>
              <p className="text-gray-500 font-medium mt-2 max-w-md">
                Manage and revoke your active sessions across different devices and locations.
              </p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-[#22C55E]/5 border border-[#22C55E]/10 rounded-2xl">
              <ShieldCheck className="w-4 h-4 text-[#22C55E]" />
              <span className="text-[13px] font-bold text-[#22C55E]">{sessions.length} Devices active</span>
            </div>
          </div>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-[32px] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] overflow-hidden">
          <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-white">
            <h2 className="text-[17px] font-bold text-gray-900 flex items-center gap-3">
              <Globe className="h-5 w-5 text-[#22C55E]" strokeWidth={2.5} />
              Login Activity
            </h2>
          </div>

          <div className="divide-y divide-gray-50">
            {isLoading ? (
              <div className="p-8 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-[#22C55E]" />
              </div>
            ) : sessions.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No active sessions found
              </div>
            ) : (
              sessions.map((session) => {
                const Icon = getDeviceIcon(session.device);
                const lastActive = new Date(session.last_active).toLocaleString();
                
                return (
                  <div 
                    key={session.id} 
                    className="p-8 flex items-center justify-between group hover:bg-gray-50/30 transition-all"
                  >
                    <div className="flex items-center gap-6">
                      {/* Device Icon */}
                      <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-white group-hover:text-[#22C55E] group-hover:shadow-sm transition-all">
                        <Icon className="h-6 w-6 stroke-[1.5px]" />
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-gray-900">{session.device}</p>
                          {session.is_current && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-[#22C55E] bg-[#22C55E]/10 rounded-full">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
                              Active Now
                            </span>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-gray-500 font-medium">
                          <span className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 opacity-60" /> {session.location}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Activity className="w-3.5 h-3.5 opacity-60" /> {session.ip_address}
                          </span>
                        </div>
                        
                        <p className="text-[12px] text-gray-400 font-medium">
                          Last seen: {lastActive}
                        </p>
                      </div>
                    </div>

                    {!session.is_current && (
                      <button
                        onClick={() => handleRevokeSession(session.id)}
                        className="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all active:scale-95"
                        aria-label="Revoke session"
                      >
                        <Trash2 className="h-5 w-5 stroke-[2px]" />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div className="p-8 bg-gray-50/50 border-t border-gray-50">
            <button
              onClick={() => toast("Feature coming soon: Terminate all other sessions", {
                style: { borderRadius: '12px', background: '#111827', color: '#fff' }
              })}
              className="px-6 py-3 text-sm font-bold text-red-600 hover:bg-red-50 rounded-xl transition-all active:scale-[0.98]"
            >
              Terminate all other sessions
            </button>
          </div>
        </div>

        {/* Footer info */}
        <p className="mt-8 text-center text-xs text-gray-400 font-medium">
          If you see a device you don't recognize, revoke it immediately and change your password.
        </p>
      </div>
    </main>
  );
}