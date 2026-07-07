"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ArrowRight, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErpHeader } from "@/components/erp/erp-header";
import confetti from "canvas-confetti";

interface OrgCreationSuccessProps {
  organizationName: string;
}

export function OrgCreationSuccess({ organizationName }: OrgCreationSuccessProps) {
  const router = useRouter();

  useEffect(() => {
    // Trigger confetti animation
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      // Fire confetti from two sides
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  const handleGoToDashboard = () => {
    router.push("/dashboard");
  };

  const handleGoToAccount = () => {
    router.push("/dashboard/settings/org");
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] dark:bg-background flex flex-col">
      <ErpHeader />
      <main className="flex-1 flex items-center justify-center px-4 py-10">
      <div className="bg-white dark:bg-card rounded-2xl shadow-sm border border-gray-200/80 dark:border-border p-10 sm:p-12 w-full max-w-md text-center">
        {/* Success Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-12 w-12 text-[#22C55E]" />
            </div>
            <div className="absolute -top-1 -right-1">
              <span className="text-4xl">🎉</span>
            </div>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          Congratulations!
        </h2>

        {/* Description */}
        <p className="text-gray-600 text-base mb-2">
          Your organization setup is complete.
        </p>
        
        <p className="text-sm text-gray-500 mb-8">
          <strong className="text-[#22C55E]">{organizationName}</strong> is ready to use!
        </p>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={handleGoToDashboard}
            className="w-full h-12 bg-[#22C55E] hover:bg-[#16A34A] text-white font-semibold text-base gap-2"
          >
            Go to My Organization
            <ArrowRight className="h-5 w-5" />
          </Button>

          <Button
            onClick={handleGoToAccount}
            variant="outline"
            className="w-full h-12 border-gray-300 text-gray-700 hover:bg-gray-50 font-medium text-base gap-2"
          >
            <User className="h-5 w-5" />
            Go to My Account
          </Button>
        </div>

        {/* Additional Info */}
        <p className="text-xs text-gray-500 mt-8">
          You can access your organization anytime from the dashboard
        </p>
      </div>
      </main>
    </div>
  );
}
