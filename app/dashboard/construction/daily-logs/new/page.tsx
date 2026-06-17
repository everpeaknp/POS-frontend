'use client';

import { useRouter } from 'next/navigation';
import { DashHeader } from '@/components/dashboard/dash-header';
import DailyLogForm from '@/components/construction/DailyLogForm';

export default function NewDailyLogPage() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push('/dashboard/construction/daily-logs');
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <DashHeader
        title="New Daily Log"
        subtitle="Record daily site activities and progress"
      />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 lg:p-8 w-full min-h-full">
          <DailyLogForm onSuccess={handleSuccess} onCancel={() => router.back()} />
        </div>
      </div>
    </div>
  );
}
