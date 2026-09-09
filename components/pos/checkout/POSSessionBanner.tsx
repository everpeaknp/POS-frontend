import { Button } from "@/components/ui/button";
import { Receipt } from "lucide-react";
import { useLanguage } from "@/lib/context/LanguageContext";

interface POSSessionBannerProps {
  onStartSession: () => void;
}

export function POSSessionBanner({ onStartSession }: POSSessionBannerProps) {
  const { t } = useLanguage();
  
  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200 p-4 shadow-sm">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="bg-amber-500 p-2.5 rounded-xl shadow-md">
            <Receipt className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="font-bold text-amber-900">{t('pos.no_active_session')}</div>
            <div className="text-sm text-amber-700">{t('pos.start_session_instruction')}</div>
          </div>
        </div>
        <Button
          onClick={onStartSession}
          className="bg-amber-600 hover:bg-amber-700 text-white shadow-md hover:shadow-lg transition-all"
        >
          {t('pos.open_session')}
        </Button>
      </div>
    </div>
  );
}
