'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MaterialConsumptionForm } from '@/components/construction';

export default function MaterialConsumptionPage() {
  const router = useRouter();

  const handleSuccess = () => {
    // Optionally redirect or refresh
    router.push('/dashboard/construction/sites');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Material Consumption</h1>
        <p className="mt-2 text-gray-600">
          Log material usage at construction sites. Stock is automatically deducted.
        </p>
      </div>

      <MaterialConsumptionForm onSuccess={handleSuccess} />
    </div>
  );
}
