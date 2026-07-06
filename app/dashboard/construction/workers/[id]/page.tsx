import { KhataSpinner } from "@/components/shared/KhataSpinner";
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  ConstructionPageShell,
  constructionCardClass,
} from '@/components/dashboard/ConstructionPageShell';
import { constructionApi, Worker } from '@/lib/api/construction';
import { formatNPR } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function WorkerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const workerId = params.id as string;

  const [worker, setWorker] = useState<Worker | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await constructionApi.workers.delete(workerId);
      toast.success('Worker deleted successfully');
      router.push('/dashboard/construction/workers');
    } catch (error: any) {
      console.error('Failed to delete worker:', error);
      toast.error(error.response?.data?.detail || 'Failed to delete worker');
      setDeleting(false);
      setDeleteModalOpen(false);
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'active' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  };

  const getCategoryDisplay = (category: string) => {
    const displays: Record<string, string> = {
      'mason': 'Mason',
      'laborer': 'Laborer',
      'carpenter': 'Carpenter',
      'electrician': 'Electrician',
      'plumber': 'Plumber',
      'engineer': 'Engineer',
      'supervisor': 'Supervisor',
      'helper': 'Helper',
      'painter': 'Painter',
      'welder': 'Welder',
      'driver': 'Driver',
      'operator': 'Equipment Operator',
      'other': 'Other',
    };
    return displays[category] || category;
  };

  if (loading) {
    return (
      <ConstructionPageShell title="Worker Details" subtitle="Loading worker information…" loading />
    );
  }

  if (!worker) {
    return (
      <ConstructionPageShell title="Worker Not Found" subtitle="This worker could not be loaded">
        <div className={`${constructionCardClass} p-12 text-center`}>
          <p className="text-gray-500">Worker not found</p>
          <Link
            href="/dashboard/construction/workers"
            className="mt-4 inline-block text-[#22C55E] hover:text-[#16A34A]"
          >
            Back to Workers
          </Link>
        </div>
      </ConstructionPageShell>
    );
  }

  return (
    <ConstructionPageShell
      title={worker.name}
      subtitle={getCategoryDisplay(worker.category)}
      action={
        <div className="flex gap-2">
          <Link href={`/dashboard/construction/workers/${workerId}/edit`}>
            <Button size="sm" className="h-9 bg-[#22C55E] hover:bg-[#16A34A] text-white">
              Edit Worker
            </Button>
          </Link>
          <Button
            size="sm"
            variant="destructive"
            className="h-9"
            onClick={() => setDeleteModalOpen(true)}
          >
            Delete
          </Button>
        </div>
      }
    >
      <Link
        href="/dashboard/construction/workers"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 -mt-2"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Workers
      </Link>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className={`${constructionCardClass} p-6`}>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Full Name</p>
              <p className="font-medium text-gray-900">{worker.name}</p>
            </div>
            {worker.phone && (
              <div>
                <p className="text-sm text-gray-500">Phone Number</p>
                <p className="font-medium text-gray-900">{worker.phone}</p>
              </div>
            )}
            {worker.id_number && (
              <div>
                <p className="text-sm text-gray-500">ID Number</p>
                <p className="font-medium text-gray-900">{worker.id_number}</p>
              </div>
            )}
            {worker.emergency_contact && (
              <div>
                <p className="text-sm text-gray-500">Emergency Contact</p>
                <p className="font-medium text-gray-900">{worker.emergency_contact}</p>
              </div>
            )}
            {worker.address && (
              <div>
                <p className="text-sm text-gray-500">Address</p>
                <p className="font-medium text-gray-900">{worker.address}</p>
              </div>
            )}
          </div>
          </div>

          <div className={`${constructionCardClass} p-6`}>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Work Information</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Category</p>
              <p className="font-medium text-gray-900">{getCategoryDisplay(worker.category)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Daily Wage</p>
              <p className="text-xl font-bold text-[#22C55E]">{formatNPR(worker.daily_wage)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(worker.status)}`}>
                {worker.status.toUpperCase()}
              </span>
            </div>
            {worker.assigned_site_name && (
              <div>
                <p className="text-sm text-gray-500">Assigned Site</p>
                <p className="font-medium text-gray-900">{worker.assigned_site_name}</p>
              </div>
            )}
          </div>
          </div>
        </div>

        <div className={`${constructionCardClass} p-6`}>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Record Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Created At</p>
              <p className="font-medium text-gray-900">{new Date(worker.created_at).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Last Updated</p>
              <p className="font-medium text-gray-900">{new Date(worker.updated_at).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Worker</h3>
                <p className="text-sm text-gray-500">This action cannot be undone</p>
              </div>
            </div>
            
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete <span className="font-semibold">{worker.name}</span>? 
              This will permanently remove the worker and all associated data.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModalOpen(false)}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {deleting && (
                  <KhataSpinner variant="onPrimary" />
                )}
                {deleting ? 'Deleting...' : 'Delete Worker'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConstructionPageShell>
  );
}
