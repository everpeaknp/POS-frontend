"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { TiggLogo } from "@/components/tigg-logo";
import { useAuth } from "@/lib/context/AuthContext";

const B = "#22C55E";
const BD = "#16A34A";

export default function LoginPage() {
  const router = useRouter();
  const { login, user } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Don't redirect here - let AuthContext handle it after login
  // The login() function in AuthContext will redirect to /workspace

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login({ email, password });
      toast.success("Login successful! Redirecting...");
    } catch (err: any) {
      // Handle different error scenarios
      if (err.response?.status === 401) {
        toast.error("Invalid email or password. Please try again.");
      } else if (err.response?.status === 400) {
        const errorData = err.response?.data;
        if (errorData?.email) {
          toast.error(`Email: ${errorData.email[0]}`);
        } else if (errorData?.password) {
          toast.error(`Password: ${errorData.password[0]}`);
        } else {
          toast.error(errorData?.detail || "Invalid credentials. Please check your input.");
        }
      } else if (err.response?.status === 500) {
        toast.error("Server error. Please try again later.");
      } else if (err.code === 'ERR_NETWORK' || !err.response) {
        toast.error("Network error. Please check your connection and try again.");
      } else {
        toast.error(err.response?.data?.detail || "Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-5/12 flex-col justify-between p-12 text-white" style={{ backgroundColor: "#1A2E1A" }}>
        <TiggLogo size="md" />
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
            <TiggLogo size="lg" />
          </div>
          <Card className="border-0 shadow-xl bg-white">
            <CardContent className="p-8">
              <div className="flex items-start justify-between mb-7">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
                  <p className="text-sm text-gray-400 mt-1">Sign in to your Khata account</p>
                </div>
                <div className="hidden lg:block"><TiggLogo size="sm" /></div>
              </div>

              <form onSubmit={handleLogin} className="flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email <span className="text-red-500">*</span></Label>
                  <Input id="email" type="email" placeholder="Enter your email" value={email}
                    onChange={(e) => setEmail(e.target.value)} required
                    className="h-11 border-gray-200 bg-gray-50 focus-visible:border-green-500 focus-visible:ring-green-500/20" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <Input id="password" type={showPassword ? "text" : "password"} placeholder="Enter password"
                      value={password} onChange={(e) => setPassword(e.target.value)} required
                      className="h-11 pr-10 border-gray-200 bg-gray-50 focus-visible:border-green-500 focus-visible:ring-green-500/20" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      aria-label="Toggle password">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <div className="flex justify-end">
                    <Link href="/auth/forgot-password" className="text-xs font-medium hover:underline" style={{ color: B }}>Forgot Password?</Link>
                  </div>
                </div>
                <Button type="submit" disabled={loading} className="w-full h-11 text-white font-semibold group rounded-lg"
                  style={{ backgroundColor: B }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = BD)}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = B)}>
                  {loading ? "Signing in..." : "Sign In"} {!loading && <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />}
                </Button>
              </form>

              <div className="border-t border-gray-100 my-5" />
              <p className="text-center text-sm text-gray-500">
                Don&apos;t have an account?{" "}
                <Link href="/auth/signup" className="font-semibold hover:underline" style={{ color: B }}>Create one</Link>
              </p>
            </CardContent>
          </Card>
          <p className="text-xs text-gray-400 text-center mt-6 leading-relaxed">
            By continuing, you agree to Khata&apos;s{" "}
            <Link href="#" className="underline hover:text-gray-600">Terms of Service</Link> and{" "}
            <Link href="#" className="underline hover:text-gray-600">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </main>
  );
}
