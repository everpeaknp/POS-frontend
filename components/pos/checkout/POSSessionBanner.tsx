import { Button } from "@/components/ui/button";
import { Receipt } from "lucide-react";

interface POSSessionBannerProps {
  onStartSession: () => void;
}

export function POSSessionBanner({ onStartSession }: POSSessionBannerProps) {
  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-500/10 dark:to-orange-500/10 border-b border-amber-200 dark:border-amber-500/20 p-4 shadow-sm dark:shadow-none">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="bg-amber-500 p-2.5 rounded-xl shadow-md dark:shadow-none">
            <Receipt className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="font-bold text-amber-900 dark:text-amber-300">No Active POS Session</div>
            <div className="text-sm text-amber-700 dark:text-amber-400/80">Start a session to begin making sales</div>
          </div>
        </div>
        <Button
          onClick={onStartSession}
          className="bg-amber-600 hover:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-500 text-white shadow-md hover:shadow-lg dark:shadow-none transition-all"
        >
          Start Session
        </Button>
      </div>
    </div>
  );
}
