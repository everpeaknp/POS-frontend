'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit, Trash2, CheckCircle } from 'lucide-react';
import { constructionApi, DailyLog } from '@/lib/api/construction';
import toast from 'react-hot-toast';

export default function DailyLogDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [log, setLog] = useState<DailyLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchLog();
    }
  }, [id]);

  const fetchLog = async () => {
    try {
      setLoading(true);
      const data = await constructionApi.dailyLogs.get(id);
      setLog(data);
    } catch (error: any) {
      console.error('Failed to fetch daily log:', error);
      toast.error('Failed to load daily log');
      router.push('/dashboard/construction/daily-logs');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this daily log? This action cannot be undone.')) {
      return;
    }

    try {
      setDeleting(true);
      await constructionApi.dailyLogs.delete(id);
      toast.success('Daily log deleted successfully');
      router.push('/dashboard/construction/daily-logs');
    } catch (error: any) {
      console.error('Failed to delete daily log:', error);
      toast.error('Failed to delete daily log');
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#22C55E]"></div>
      </div>
    );
  }

  if (!log) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Daily log not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/construction/daily-logs"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Daily Log Details</h1>
            <p className="mt-1 text-sm text-gray-600">
              {log.site_name} - {formatDate(log.date)}
            </p>
            {!log.is_editable && (
              <p className="mt-1 text-xs text-red-600 font-medium">
                🔒 Immutable - Created more than 24 hours ago
              </p>
            )}
            {log.is_editable && log.hours_until_immutable !== undefined && log.hours_until_immutable < 24 && (
              <p className="mt-1 text-xs text-orange-600 font-medium">
                ⏰ Editable for {log.hours_until_immutable.toFixed(1)} more hours
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <Link
            href={`/dashboard/construction/daily-logs/${id}/edit`}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              log.is_editable
                ? 'bg-[#22C55E] text-white hover:bg-[#16A34A]'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed pointer-events-none'
            }`}
          >
            <Edit className="w-4 h-4" />
            Edit
          </Link>
          <button
            onClick={handleDelete}
            disabled={deleting || !log.is_editable}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              log.is_editable && !deleting
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 space-y-6">
          {/* Status Badge */}
          {log.reviewed_by_name && (
            <div className="flex items-center gap-2 text-[#22C55E]">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Reviewed</span>
            </div>
          )}

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Site
              </label>
              <p className="text-gray-900">{log.site_name}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <p className="text-gray-900">{formatDate(log.date)}</p>
            </div>

            {log.weather && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Weather
                </label>
                <p className="text-gray-900">{log.weather}</p>
              </div>
            )}

            {log.other_expenses && Number(log.other_expenses) > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Other Expenses
                </label>
                <p className="text-gray-900">NPR {Number(log.other_expenses).toFixed(2)}</p>
              </div>
            )}
          </div>

          {/* Work Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Work Description
            </label>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-900 whitespace-pre-wrap">{log.work_description}</p>
            </div>
          </div>

          {/* Progress Notes */}
          {log.progress_notes && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Progress Notes
              </label>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-900 whitespace-pre-wrap">{log.progress_notes}</p>
              </div>
            </div>
          )}

          {/* Other Expenses Description */}
          {log.other_expenses_description && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Other Expenses Description
              </label>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-900 whitespace-pre-wrap">{log.other_expenses_description}</p>
              </div>
            </div>
          )}

          {/* Manager Comments */}
          {log.manager_comments && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Manager Comments
              </label>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-900 whitespace-pre-wrap">{log.manager_comments}</p>
              </div>
            </div>
          )}

          {/* Material Consumptions */}
          {log.material_consumptions && log.material_consumptions.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Material Consumptions
              </label>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Product
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Quantity
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Unit Cost
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Total Cost
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {log.material_consumptions.map((consumption: any) => (
                      <tr key={consumption.id}>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {consumption.product_name}
                          {consumption.product_sku && (
                            <span className="text-gray-500 ml-2">({consumption.product_sku})</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {Number(consumption.quantity).toFixed(2)} {consumption.product_unit}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          NPR {Number(consumption.unit_cost).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          NPR {Number(consumption.total_cost).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Audit Info */}
          <div className="pt-6 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <span className="font-medium">Submitted by:</span> {log.submitted_by_name}
              </div>
              <div>
                <span className="font-medium">Created:</span> {formatDateTime(log.created_at)}
              </div>
              {log.reviewed_by_name && (
                <>
                  <div>
                    <span className="font-medium">Reviewed by:</span> {log.reviewed_by_name}
                  </div>
                  {log.reviewed_at && (
                    <div>
                      <span className="font-medium">Reviewed at:</span> {formatDateTime(log.reviewed_at)}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
