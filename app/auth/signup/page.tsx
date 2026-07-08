"use client";
import { KhataSpinner } from "@/components/shared/KhataSpinner";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import toast from "react-hot-toast";
import { Eye, EyeOff, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { KhataLogo } from "@/components/khata-logo";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { useAuth } from "@/lib/context/AuthContext";
import { buildInviteRedirect } from "@/lib/invitations/accept";

const B = "#22C55E";
const BD = "#16A34A";

// Zod validation schema - simplified without organization and username
const signupSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  phone: z.string().min(1, "Phone number is required"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type SignupFormData = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register: registerUser, user, login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const inviteToken = searchParams.get("invite") || "";
  const inviteEmail = searchParams.get("email") || "";
  const inviteRedirect = inviteToken ? buildInviteRedirect(inviteToken) : "";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: inviteEmail,
    },
  });

  const password = watch("password");
  const confirmPassword = watch("confirmPassword");
  const passwordMatch = confirmPassword && password === confirmPassword;
  const passwordMismatch = confirmPassword && password !== confirmPassword;

  useEffect(() => {
    if (inviteEmail) {
      setValue("email", inviteEmail);
    }
  }, [inviteEmail, setValue]);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push(inviteRedirect || "/dashboard");
    }
  }, [user, router, inviteRedirect]);

  const onSubmit = async (data: SignupFormData) => {
    try {
      if (inviteEmail && data.email.trim().toLowerCase() !== inviteEmail.trim().toLowerCase()) {
        toast.error(`Please register with the invited email: ${inviteEmail}`);
        return;
      }

      await registerUser({
        email: data.email,
        password: data.password,
        first_name: data.first_name,
        last_name: data.last_name,
        phone: data.phone.trim(),
      });

      toast.success(
        inviteToken ? "Account created! Joining your organization..." : "Account created! Signing you in..."
      );
      await login(
        { email: data.email, password: data.password },
        inviteRedirect || "/erp"
      );
    } catch (error: any) {
      // Handle different error scenarios
      if (error.response?.status === 400) {
        const errorData = error.response?.data;
        
        // Display all field errors
        if (errorData) {
          Object.keys(errorData).forEach((field) => {
            const fieldErrors = errorData[field];
            if (Array.isArray(fieldErrors)) {
              fieldErrors.forEach((err) => toast.error(`${field}: ${err}`));
            } else if (typeof fieldErrors === 'string') {
              toast.error(`${field}: ${fieldErrors}`);
            }
          });
        }
        
        // Fallback generic message
        if (!errorData || Object.keys(errorData).length === 0) {
          toast.error("Registration failed. Please check your input.");
        }
      } else if (error.response?.status === 500) {
        toast.error("Server error. Please try again later.");
      } else if (error.code === 'ERR_NETWORK' || !error.response) {
        toast.error("Network error. Please check your connection and try again.");
      } else {
        toast.error(error.response?.data?.detail || "Registration failed. Please try again.");
      }
    }
  };

  return (
    <main className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-5/12 flex-col justify-between p-12 text-white" style={{ backgroundColor: "#1A2E1A" }}>
        <KhataLogo size="md" />
        <div>
          <h2 className="text-4xl font-bold leading-tight mb-4">Join thousands of<br />businesses on Khata</h2>
          <p className="text-green-300 text-base leading-relaxed">Start your free trial today. No credit card required.</p>
          <div className="mt-10 space-y-3">
            {["Automated invoicing & billing", "Real-time financial reports", "VAT & tax compliance", "Multi-currency support"].map((f) => (
              <div key={f} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: B }}>
                  <CheckCircle2 className="h-3 w-3 text-white" />
                </div>
                <span className="text-green-100 text-sm">{f}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-green-400 text-xs">© 2025 Khata. All rights reserved.</p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-slate-50 overflow-y-auto">
        <div className="w-full max-w-[480px] my-8">
          <div className="flex justify-center mb-8 lg:hidden"><KhataLogo size="lg" /></div>
          <Card className="border-0 shadow-xl bg-white">
            <CardContent className="p-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Create account</h1>
                  <p className="text-sm text-gray-400 mt-1">Get started with Khata for free</p>
                </div>
                <div className="hidden lg:block"><KhataLogo size="sm" /></div>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                {/* First Name and Last Name */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="first_name" className="text-sm font-medium text-gray-700">
                      First Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      {...register("first_name")}
                      id="first_name"
                      placeholder="John"
                      className="h-11 border-gray-200 bg-gray-50 focus-visible:border-green-500 focus-visible:ring-green-500/20"
                    />
                    {errors.first_name && (
                      <p className="text-xs text-red-500">{errors.first_name.message}</p>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="last_name" className="text-sm font-medium text-gray-700">
                      Last Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      {...register("last_name")}
                      id="last_name"
                      placeholder="Doe"
                      className="h-11 border-gray-200 bg-gray-50 focus-visible:border-green-500 focus-visible:ring-green-500/20"
                    />
                    {errors.last_name && (
                      <p className="text-xs text-red-500">{errors.last_name.message}</p>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    {...register("email")}
                    id="email"
                    type="email"
                    placeholder="yourmail@domain.com"
                    className="h-11 border-gray-200 bg-gray-50 focus-visible:border-green-500 focus-visible:ring-green-500/20"
                  />
                  {errors.email && (
                    <p className="text-xs text-red-500">{errors.email.message}</p>
                  )}
                </div>

                {/* Phone (Required) */}
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                    Phone <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    {...register("phone")}
                    id="phone"
                    type="tel"
                    placeholder="+977 9800000000"
                    className="h-11 border-gray-200 bg-gray-50 focus-visible:border-green-500 focus-visible:ring-green-500/20"
                  />
                  {errors.phone && (
                    <p className="text-xs text-red-500">{errors.phone.message}</p>
                  )}
                </div>

                {/* Password */}
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                    Password <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      {...register("password")}
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a password"
                      className="h-11 pr-10 border-gray-200 bg-gray-50 focus-visible:border-green-500 focus-visible:ring-green-500/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      aria-label="Toggle password"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-red-500">{errors.password.message}</p>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                    Confirm Password <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      {...register("confirmPassword")}
                      id="confirmPassword"
                      type={showConfirm ? "text" : "password"}
                      placeholder="Confirm your password"
                      className={`h-11 pr-16 bg-gray-50 transition-colors ${
                        passwordMismatch ? "border-red-400" : passwordMatch ? "border-green-400" : "border-gray-200"
                      }`}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                      {passwordMatch && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="text-gray-400 hover:text-gray-600"
                        aria-label="Toggle confirm"
                      >
                        {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-11 text-white font-semibold mt-1 group rounded-lg"
                  style={{ backgroundColor: B }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = BD)}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = B)}
                >
                  {isSubmitting ? (
                    <>
                      <KhataSpinner variant="onPrimary" className="mr-2" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      Create Account <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                    </>
                  )}
                </Button>
              </form>

              <GoogleSignInButton label="signup_with" redirectTo={inviteRedirect || undefined} />

              <div className="border-t border-gray-100 my-5" />
              <p className="text-center text-sm text-gray-500">
                Already have an account?{" "}
                <Link href="/auth/login" className="font-semibold hover:underline" style={{ color: B }}>
                  Sign In
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
