import { KhataSpinner } from "@/components/shared/KhataSpinner";
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, HardHat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  ConstructionPageShell,
  constructionCardClass,
  constructionTableWrapClass,
  constructionFilterPillActive,
  constructionFilterPillInactive,
} from '@/components/dashboard/ConstructionPageShell';
import { EmptyState } from '@/components/shared/EmptyState';
import { constructionApi, Worker } from '@/lib/api/construction';
import { formatNPR } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function WorkersPage() {
  const router = useRouter();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [workerToDelete, setWorkerToDelete] = useState<Worker | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchWorkers();
  }, [filter]);

  const fetchWorkers = async () => {
    try {
      setLoading(true);
      const params = filter !== 'all' ? { status: filter } : {};
      const workersData = await constructionApi.workers.list(params);
      setWorkers(Array.isArray(workersData) ? workersData : []);
    } catch (error: any) {
      console.error('Failed to fetch workers:', error);
      toast.error('Failed to load workers');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, worker: Worker) => {
    e.stopPropagation();
    setWorkerToDelete(worker);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!workerToDelete) return;

    try {
      setDeleting(true);
      await constructionApi.workers.delete(workerToDelete.id);
      toast.success('Worker deleted successfully');
      setWorkers(workers.filter(w => w.id !== workerToDelete.id));
      setDeleteModalOpen(false);
      setWorkerToDelete(null);
    } catch (error: any) {
      console.error('Failed to delete worker:', error);
      toast.error(error.response?.data?.detail || 'Failed to delete worker');
    } finally {
      setDeleting(false);
    }
  };

  const handleEditClick = (e: React.MouseEvent, workerId: string) => {
    e.stopPropagation();
    router.push(`/dashboard/construction/workers/${workerId}/edit`);
  };

  const getCategoryDisplay = (category: string) => {
    const categoryMap: Record<string, string> = {
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
    return categoryMap[category] || category;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'mason': 'bg-blue-100 text-blue-800',
      'carpenter': 'bg-yellow-100 text-yellow-800',
      'electrician': 'bg-purple-100 text-purple-800',
      'plumber': 'bg-green-100 text-green-800',
      'painter': 'bg-pink-100 text-pink-800',
      'helper': 'bg-gray-100 text-gray-800',
      'welder': 'bg-orange-100 text-orange-800',
      'driver': 'bg-indigo-100 text-indigo-800',
      'operator': 'bg-cyan-100 text-cyan-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status: string) => {
    return status === 'active' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  };

  if (loading) {
    return (
      <ConstructionPageShell
        title="Construction Workers"
        subtitle="Manage your construction workforce"
        loading
        loadingMessage="Loading workers…"
      />
    );
  }

  if (workers.length === 0 && filter === 'all') {
    return (
      <ConstructionPageShell
        title="Construction Workers"
        subtitle="Manage your construction workforce"
      >
        <EmptyState
            icon={HardHat}
            title="No workers yet"
            description="Add your first worker to start managing your construction workforce."
            actionLabel="New Worker"
            actionHref="/dashboard/construction/workers/new"
          />
      </ConstructionPageShell>
    );
  }

  return (
    <ConstructionPageShell
      title="Construction Workers"
      subtitle="Manage your construction workforce"
      toolbar={
        <div className="flex flex-wrap gap-2">
          {['all', 'active', 'inactive'].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                filter === status
                  ? constructionFilterPillActive
                  : constructionFilterPillInactive
              }`}
            >
              {status === 'all' ? 'All Workers' : status}
            </button>
          ))}
        </div>
      }
      action={
        <Link href="/dashboard/construction/workers/new">
          <Button size="sm" className="h-9 bg-[#22C55E] hover:bg-[#16A34A] text-white gap-1.5">
            <Plus className="h-4 w-4" />
            New Worker
          </Button>
        </Link>
      }
    >
      {workers.length === 0 ? (
        <div className={`${constructionCardClass} p-12 text-center`}>
          <p className="text-gray-500">No workers found matching your filters</p>
        </div>
      ) : (
        <div className={constructionTableWrapClass}>
          <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Worker
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Daily Wage
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned Site
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {workers.map((worker) => (
                <tr
                  key={worker.id}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => router.push(`/dashboard/construction/workers/${worker.id}`)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-[#22C55E] flex items-center justify-center">
                        <span className="text-white font-medium text-sm">
                          {worker.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{worker.name}</div>
                        {worker.id_number && (
                          <div className="text-sm text-gray-500">ID: {worker.id_number}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getCategoryColor(worker.category)}`}>
                      {getCategoryDisplay(worker.category)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-gray-900">{formatNPR(worker.daily_wage)}</div>
                    <div className="text-xs text-gray-500">per day</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{worker.phone || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{worker.assigned_site_name || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(worker.status)}`}>
                      {worker.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={(e) => handleEditClick(e, worker.id)}
                        className="p-2 text-[#22C55E] hover:bg-green-50 rounded-md transition-colors"
                        title="Edit worker"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => handleDeleteClick(e, worker)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        title="Delete worker"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

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
              Are you sure you want to delete <span className="font-semibold">{workerToDelete?.name}</span>? 
              This will permanently remove the worker and all associated attendance records.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setDeleteModalOpen(false);
                  setWorkerToDelete(null);
                }}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
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
