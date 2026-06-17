"use client";

import { Loader2 } from "lucide-react";

export function OrgCreationLoading() {
  return (
    <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 w-full max-w-md text-center">
        {/* Animated Spinner */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <Loader2 className="h-16 w-16 text-[#22C55E] animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-8 w-8 bg-green-100 rounded-full animate-pulse" />
            </div>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-900 mb-3">
          Getting Your Organization Ready...
        </h2>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-6">
          Your organization is being configured. Please wait...
        </p>

        {/* Progress Dots */}
        <div className="flex justify-center gap-2">
          <div className="h-2 w-2 bg-[#22C55E] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="h-2 w-2 bg-[#22C55E] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="h-2 w-2 bg-[#22C55E] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>

        {/* Info Text */}
        <p className="text-xs text-gray-500 mt-8">
          This may take a few moments. Please do not close this window.
        </p>
      </div>
    </div>
  );
}
