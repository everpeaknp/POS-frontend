"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ArrowRight, User } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50/90 dark:bg-background flex flex-col">
      <main className="flex-1 flex items-center justify-center px-4 py-10">
      <div className="bg-white dark:bg-card rounded-[28px] shadow-[0_18px_45px_rgba(22,163,74,0.12)] border border-green-100/60 dark:border-border p-10 sm:p-12 w-full max-w-md text-center">
        <div className="flex justify-center mb-6">
          <div className="h-[84px] w-[84px] bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle2 className="h-12 w-12 text-[#166534]" />
          </div>
        </div>

        <h2 className="text-3xl font-bold text-gray-900 dark:text-foreground mb-3 tracking-tight">
          Your workspace is ready
        </h2>

        <p className="text-gray-500 dark:text-muted-foreground text-base mb-2 leading-relaxed">
          <strong className="text-[#16A34A]">{organizationName}</strong> is set up and ready to use.
        </p>

        <div className="space-y-3 mt-8">
          <Button
            onClick={handleGoToDashboard}
            className="w-full h-12 rounded-xl bg-gradient-to-r from-[#16A34A] to-[#22C55E] hover:from-[#15803d] hover:to-[#16A34A] text-white font-extrabold text-base gap-2 border-transparent shadow-md shadow-green-500/20"
          >
            Go to dashboard
            <ArrowRight className="h-5 w-5" />
          </Button>

          <Button
            onClick={handleGoToAccount}
            variant="secondary"
            className="w-full h-12 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-900 border-transparent font-bold text-base gap-2 shadow-none"
          >
            <User className="h-5 w-5" />
            Organization settings
          </Button>
        </div>

        <p className="text-xs text-gray-500 mt-8">
          You can access your organization anytime from the dashboard
        </p>
      </div>
      </main>
    </div>
  );
}
