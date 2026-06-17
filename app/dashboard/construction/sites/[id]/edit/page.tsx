'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import SiteForm from '@/components/construction/SiteForm';
import { constructionApi, Site } from '@/lib/api/construction';
import toast from 'react-hot-toast';

export default function EditSitePage() {
  const router = useRouter();
  const params = useParams();
  const siteId = params.id as string;

  const [site, setSite] = useState<Site | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (siteId) {
      fetchSite();
    }
  }, [siteId]);

  const fetchSite = async () => {
    try {
      setLoading(true);
      const siteData = await constructionApi.sites.get(siteId);
      setSite(siteData);
    } catch (error: any) {
      console.error('Failed to fetch site:', error);
      toast.error('Failed to load site details');
      router.push('/dashboard/construction/sites');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    router.push(`/dashboard/construction/sites/${siteId}`);
  };

  const handleCancel = () => {
    router.push(`/dashboard/construction/sites/${siteId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#22C55E]"></div>
      </div>
    );
  }

  if (!site) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Site not found</p>
        <Link
          href="/dashboard/construction/sites"
          className="mt-4 inline-block text-[#22C55E] hover:text-[#16A34A]"
        >
          Back to Sites
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href={`/dashboard/construction/sites/${siteId}`}
          className="text-gray-500 hover:text-gray-700"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Site</h1>
          <p className="mt-1 text-sm text-gray-600">Update construction site information</p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <SiteForm
          siteId={siteId}
          initialData={{
            name: site.name,
            location: site.location,
            client_name: site.client_name || '',
            allocated_budget: site.allocated_budget.toString(),
            start_date: site.start_date,
            estimated_end_date: site.estimated_end_date || '',
            manager: site.manager,
            warehouse: site.warehouse,
            status: site.status,
            description: site.description || '',
          }}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}
