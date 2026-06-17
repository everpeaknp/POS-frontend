'use client';

import { useRouter } from 'next/navigation';
import SiteForm from '@/components/construction/SiteForm';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function NewSitePage() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push('/dashboard/construction/sites');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/construction/sites"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New Construction Site</h1>
          <p className="mt-1 text-sm text-gray-600">
            Create a new construction project with budget allocation
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <SiteForm onSuccess={handleSuccess} />
      </div>
    </div>
  );
}
