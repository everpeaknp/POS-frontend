'use client';

import { useRouter } from 'next/navigation';
import { DashHeader } from '@/components/dashboard/dash-header';
import WorkerForm from '@/components/construction/WorkerForm';

export default function NewWorkerPage() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push('/dashboard/construction/workers');
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <DashHeader
        title="New Worker"
        subtitle="Add a new construction worker to your workforce"
      />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 lg:p-8 w-full">
          <WorkerForm onSuccess={handleSuccess} onCancel={() => router.back()} />
        </div>
      </div>
    </div>
  );
}
