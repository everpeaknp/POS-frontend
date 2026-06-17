'use client';

import { useRouter } from 'next/navigation';
import { DashHeader } from '@/components/dashboard/dash-header';
import { ConsumptionForm } from '@/components/construction';

export default function NewMaterialConsumptionPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col h-full min-h-0">
      <DashHeader
        title="Log Material Consumption"
        subtitle="Record materials used at construction sites. Stock will be automatically deducted."
      />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 lg:p-8 w-full">
          <ConsumptionForm
            onSuccess={() => router.push('/dashboard/construction/material-consumption')}
            onCancel={() => router.back()}
          />
        </div>
      </div>
    </div>
  );
}
