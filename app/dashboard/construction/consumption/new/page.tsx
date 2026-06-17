'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ConsumptionForm } from '@/components/construction';

export default function NewMaterialConsumptionPage() {
  const router = useRouter();

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Log Material Consumption</h1>
        <p className="text-gray-600 mt-1">
          Record materials used at construction sites. Stock will be automatically deducted.
        </p>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <ConsumptionForm />
      </div>
    </div>
  );
}
