'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Edit, Trash2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  ConstructionPageShell,
  constructionCardClass,
  constructionTableWrapClass,
} from '@/components/dashboard/ConstructionPageShell';
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
      <ConstructionPageShell title="Daily Log" subtitle="Loading log details…" loading />
    );
  }

  if (!log) {
    return (
      <ConstructionPageShell title="Log Not Found" subtitle="This daily log could not be loaded">
        <div className={`${constructionCardClass} p-12 text-center`}>
          <p className="text-gray-500">Daily log not found</p>
          <Link
            href="/dashboard/construction/daily-logs"
            className="mt-4 inline-block text-[#22C55E] hover:text-[#16A34A]"
          >
            Back to Daily Logs
          </Link>
        </div>
      </ConstructionPageShell>
    );
  }

  const editabilityNote = !log.is_editable
    ? 'Immutable — created more than 24 hours ago'
    : log.hours_until_immutable !== undefined && log.hours_until_immutable < 24
      ? `Editable for ${log.hours_until_immutable.toFixed(1)} more hours`
      : undefined;

  return (
    <ConstructionPageShell
      title="Daily Log Details"
      subtitle={[log.site_name, formatDate(log.date), editabilityNote].filter(Boolean).join(' · ')}
      action={
        <div className="flex gap-2">
          <Link href={`/dashboard/construction/daily-logs/${id}/edit`}>
            <Button
              size="sm"
              className="h-9 gap-1.5"
              disabled={!log.is_editable}
              variant={log.is_editable ? 'default' : 'secondary'}
            >
              <Edit className="h-4 w-4" />
              Edit
            </Button>
          </Link>
          <Button
            size="sm"
            variant="destructive"
            className="h-9 gap-1.5"
            onClick={handleDelete}
            disabled={deleting || !log.is_editable}
          >
            <Trash2 className="h-4 w-4" />
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      }
    >
      <Link
        href="/dashboard/construction/daily-logs"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 -mt-2"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Daily Logs
      </Link>

      <div className={`${constructionCardClass} p-6 space-y-6`}>
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
              <div className={constructionTableWrapClass}>
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
    </ConstructionPageShell>
  );
}
