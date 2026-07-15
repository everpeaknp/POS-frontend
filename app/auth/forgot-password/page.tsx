"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { KhataLogo } from "@/components/khata-logo";

const B = "#22C55E";
const BD = "#16A34A";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // UI-only flow for now — matches existing behavior
    setTimeout(() => {
      setSent(true);
      setLoading(false);
    }, 400);
  };

  return (
    <main className="min-h-screen flex">
      <div
        className="hidden lg:flex lg:w-5/12 flex-col justify-between p-12 text-white"
        style={{ backgroundColor: "#1A2E1A" }}
      >
        <KhataLogo size="md" />
        <div>
          <h2 className="text-4xl font-bold leading-tight mb-4">
            Smart accounting<br />for modern businesses
          </h2>
          <p className="text-green-300 text-base leading-relaxed">
            Manage invoices, track expenses, and grow your business — all in one place.
          </p>
          <div className="mt-10 grid grid-cols-2 gap-4">
            {[
              { label: "Businesses", value: "10,000+" },
              { label: "Invoices Sent", value: "2M+" },
              { label: "Countries", value: "15+" },
              { label: "Uptime", value: "99.9%" },
            ].map((s) => (
              <div key={s.label} className="bg-white/10 rounded-xl p-4">
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-green-300 text-sm mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="text-green-400 text-xs">© 2025 Khata. All rights reserved.</p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-slate-50">
        <div className="w-full max-w-[400px]">
          <div className="flex justify-center mb-8 lg:hidden">
            <KhataLogo size="lg" />
          </div>
          <Card className="border-0 shadow-xl bg-white">
            <CardContent className="p-8">
              {sent ? (
                <>
                  <div className="flex items-start justify-between mb-7">
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900">Check your inbox</h1>
                      <p className="text-sm text-gray-400 mt-1">
                        We sent a reset link to{" "}
                        <span className="font-medium text-gray-700">{email}</span>
                      </p>
                    </div>
                    <div className="hidden lg:block">
                      <KhataLogo size="sm" />
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-4 py-2 text-center">
                    <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center">
                      <CheckCircle2 className="h-7 w-7" style={{ color: B }} />
                    </div>
                    <p className="text-sm text-gray-500 leading-relaxed">
                      If an account exists for that email, you&apos;ll receive instructions shortly.
                      Be sure to check your spam folder.
                    </p>
                  </div>

                  <div className="border-t border-gray-100 my-5" />
                  <p className="text-center text-sm text-gray-500">
                    <Link
                      href="/auth/login"
                      className="inline-flex items-center gap-1.5 font-semibold hover:underline"
                      style={{ color: B }}
                    >
                      <ArrowLeft className="h-3.5 w-3.5" /> Back to Sign In
                    </Link>
                  </p>
                </>
              ) : (
                <>
                  <div className="flex items-start justify-between mb-7">
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900">Forgot password?</h1>
                      <p className="text-sm text-gray-400 mt-1">
                        Enter your email and we&apos;ll send a reset link
                      </p>
                    </div>
                    <div className="hidden lg:block">
                      <KhataLogo size="sm" />
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                        Email <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="h-11 border-gray-200 bg-gray-50 focus-visible:border-green-500 focus-visible:ring-green-500/20"
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full h-11 text-white font-semibold group rounded-lg"
                      style={{ backgroundColor: B }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = BD)}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = B)}
                    >
                      {loading ? "Sending..." : "Send Reset Link"}
                      {!loading && (
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                      )}
                    </Button>
                  </form>

                  <div className="border-t border-gray-100 my-5" />
                  <p className="text-center text-sm text-gray-500">
                    Remember your password?{" "}
                    <Link
                      href="/auth/login"
                      className="font-semibold hover:underline"
                      style={{ color: B }}
                    >
                      Sign In
                    </Link>
                  </p>
                </>
              )}
            </CardContent>
          </Card>
          <p className="text-xs text-gray-400 text-center mt-6 leading-relaxed">
            By continuing, you agree to Khata&apos;s{" "}
            <Link href="#" className="underline hover:text-gray-600">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="#" className="underline hover:text-gray-600">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </main>
  );
}
