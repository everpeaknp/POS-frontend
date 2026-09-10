"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import toast from "react-hot-toast";

export default function GoogleCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loginWithGoogle } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleGoogleCallback = async () => {
      // Get authorization code from URL
      const code = searchParams.get("code");
      const error = searchParams.get("error");
      const state = searchParams.get("state");

      // Handle errors
      if (error) {
        setError(`Google sign-in failed: ${error}`);
        toast.error("Google sign-in was cancelled or failed");
        setTimeout(() => router.push("/auth/login"), 2000);
        return;
      }

      if (!code) {
        setError("No authorization code received from Google");
        toast.error("Google sign-in failed");
        setTimeout(() => router.push("/auth/login"), 2000);
        return;
      }

      try {
        // Parse state to get redirect destination
        let redirectTo = "/erp";
        if (state) {
          try {
            const parsed = JSON.parse(state);
            if (parsed.redirectTo) {
              redirectTo = parsed.redirectTo;
            }
          } catch {
            // Ignore state parsing errors
          }
        }

        // Send authorization code to backend
        await loginWithGoogle({ code }, redirectTo);
        toast.success("Successfully signed in with Google!");
        
        // Redirect will happen automatically from loginWithGoogle
      } catch (err: any) {
        console.error("Google sign-in error:", err);
        const errorMessage = err.response?.data?.detail || "Failed to sign in with Google";
        setError(errorMessage);
        toast.error(errorMessage);
        setTimeout(() => router.push("/auth/login"), 3000);
      }
    };

    handleGoogleCallback();
  }, [searchParams, loginWithGoogle, router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-4">
            <svg
              className="mx-auto h-12 w-12 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Sign-in Failed</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500">Redirecting to login page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-4">
          <div className="mx-auto h-12 w-12 relative">
            <svg
              className="animate-spin h-12 w-12 text-green-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          </div>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Signing you in...</h2>
        <p className="text-gray-600">Please wait while we complete your Google sign-in</p>
      </div>
    </div>
  );
}
