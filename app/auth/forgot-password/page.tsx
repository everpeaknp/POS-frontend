"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, CheckCircle2 } from "lucide-react";
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-[420px]">
        <div className="flex justify-center mb-8"><KhataLogo size="lg" /></div>
        <Card className="border-0 shadow-xl bg-white">
          <CardContent className="p-8">
            {sent ? (
              <div className="flex flex-col items-center gap-4 py-4 text-center">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Check your inbox</h2>
                  <p className="text-sm text-gray-500 mt-2">
                    We sent a reset link to <span className="font-semibold text-gray-800">{email}</span>
                  </p>
                </div>
                <Link href="/auth/login" className="inline-flex items-center gap-1.5 text-sm font-medium hover:underline mt-2" style={{ color: B }}>
                  <ArrowLeft className="h-3.5 w-3.5" /> Back to Sign In
                </Link>
              </div>
            ) : (
              <>
                <div className="mb-7">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 bg-green-50">
                    <Mail className="h-6 w-6" style={{ color: B }} />
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900">Forgot your password?</h1>
                  <p className="text-sm text-gray-500 mt-1.5">Enter your email and we&apos;ll send you a reset link.</p>
                </div>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email address</Label>
                    <Input id="email" type="email" placeholder="yourmail@domain.com" value={email}
                      onChange={(e) => setEmail(e.target.value)} required
                      className="h-11 border-gray-200 bg-gray-50 focus-visible:border-green-500 focus-visible:ring-green-500/20" />
                  </div>
                  <Button type="submit" className="w-full h-11 text-white font-semibold rounded-lg"
                    style={{ backgroundColor: B }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = BD)}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = B)}>
                    Send Reset Link
                  </Button>
                </form>
                <p className="text-center mt-6">
                  <Link href="/auth/login" className="inline-flex items-center gap-1.5 text-sm font-medium hover:underline" style={{ color: B }}>
                    <ArrowLeft className="h-3.5 w-3.5" /> Back to Sign In
                  </Link>
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
