import { Button } from "@/components/ui/button";
import { Receipt } from "lucide-react";

interface POSSessionBannerProps {
  onStartSession: () => void;
}

export function POSSessionBanner({ onStartSession }: POSSessionBannerProps) {
  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200 p-4 shadow-sm">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="bg-amber-500 p-2.5 rounded-xl shadow-md">
            <Receipt className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="font-bold text-amber-900">No Active POS Session</div>
            <div className="text-sm text-amber-700">Start a session to begin making sales</div>
          </div>
        </div>
        <Button
          onClick={onStartSession}
          className="bg-amber-600 hover:bg-amber-700 text-white shadow-md hover:shadow-lg transition-all"
        >
          Start Session
        </Button>
      </div>
    </div>
  );
}
