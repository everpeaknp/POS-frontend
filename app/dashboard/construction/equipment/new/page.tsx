'use client';

import { useRouter } from 'next/navigation';
import { DashHeader } from '@/components/dashboard/dash-header';
import EquipmentForm from '@/components/construction/EquipmentForm';

export default function NewEquipmentPage() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push('/dashboard/construction/equipment');
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <DashHeader
        title="New Equipment"
        subtitle="Add new construction equipment to your inventory"
      />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 lg:p-8 w-full">
          <EquipmentForm onSuccess={handleSuccess} onCancel={() => router.back()} />
        </div>
      </div>
    </div>
  );
}
