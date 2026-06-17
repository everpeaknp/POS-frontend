'use client';

import { useRouter } from 'next/navigation';
import SiteForm from '@/components/construction/SiteForm';
import { DashHeader } from '@/components/dashboard/dash-header';

export default function NewSitePage() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push('/dashboard/construction/sites');
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <DashHeader
        title="New Construction Site"
        subtitle="Create a new construction project with budget allocation"
      />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 lg:p-8 w-full min-h-full">
          <SiteForm onSuccess={handleSuccess} onCancel={() => router.back()} />
        </div>
      </div>
    </div>
  );
}
