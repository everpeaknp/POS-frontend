'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import WorkerForm from '@/components/construction/WorkerForm';
import { constructionApi, Worker } from '@/lib/api/construction';
import toast from 'react-hot-toast';

export default function EditWorkerPage() {
  const router = useRouter();
  const params = useParams();
  const workerId = params.id as string;

  const [worker, setWorker] = useState<Worker | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (workerId) {
      fetchWorker();
    }
  }, [workerId]);

  const fetchWorker = async () => {
    try {
      setLoading(true);
      const workerData = await constructionApi.workers.get(workerId);
      setWorker(workerData);
    } catch (error: any) {
      console.error('Failed to fetch worker:', error);
      toast.error('Failed to load worker details');
      router.push('/dashboard/construction/workers');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    router.push(`/dashboard/construction/workers/${workerId}`);
  };

  const handleCancel = () => {
    router.push(`/dashboard/construction/workers/${workerId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#22C55E]"></div>
      </div>
    );
  }

  if (!worker) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Worker not found</p>
        <Link
          href="/dashboard/construction/workers"
          className="mt-4 inline-block text-[#22C55E] hover:text-[#16A34A]"
        >
          Back to Workers
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href={`/dashboard/construction/workers/${workerId}`}
          className="text-gray-500 hover:text-gray-700"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Worker</h1>
          <p className="mt-1 text-sm text-gray-600">Update worker information</p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <WorkerForm
          workerId={workerId}
          initialData={{
            name: worker.name,
            phone: worker.phone || '',
            address: worker.address || '',
            category: worker.category,
            daily_wage: worker.daily_wage.toString(),
            assigned_site: worker.assigned_site || '',
            status: worker.status,
            id_number: worker.id_number || '',
            emergency_contact: worker.emergency_contact || '',
          }}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}
