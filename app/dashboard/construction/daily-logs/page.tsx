'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FileText, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/EmptyState';
import {
  ConstructionPageShell,
  constructionCardClass,
  constructionTableWrapClass,
} from '@/components/dashboard/ConstructionPageShell';
import { constructionApi, DailyLog } from '@/lib/api/construction';
import toast from 'react-hot-toast';

export default function DailyLogsPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await constructionApi.dailyLogs.list();
      setLogs(Array.isArray(data) ? data : []);
    } catch (error: unknown) {
      console.error('Failed to fetch daily logs:', error);
      toast.error('Failed to load daily logs');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (!loading && logs.length === 0) {
    return (
      <ConstructionPageShell
        title="Daily Site Logs"
        subtitle="Track daily progress and activities at construction sites"
        loading={loading}
      >
        <EmptyState
            icon={FileText}
            title="No daily logs"
            description="Create your first daily site log to track progress"
            actionLabel="New Log"
            actionHref="/dashboard/construction/daily-logs/new"
          />
      </ConstructionPageShell>
    );
  }

  return (
    <ConstructionPageShell
      title="Daily Site Logs"
      subtitle="Track daily progress and activities at construction sites"
      loading={loading}
      action={
        <Link href="/dashboard/construction/daily-logs/new">
          <Button size="sm" className="h-9 bg-[#22C55E] hover:bg-[#16A34A] text-white gap-1.5">
            <Plus className="h-4 w-4" />
            New Log
          </Button>
        </Link>
      }
    >
      <div className={constructionTableWrapClass}>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Site & Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Work Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Weather
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{log.site_name}</div>
                        <div className="text-sm text-gray-500">{formatDate(log.date)}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-md truncate" title={log.work_description}>
                        {log.work_description}
                      </div>
                      {log.progress_notes && (
                        <div className="text-xs text-gray-500 mt-1 max-w-md truncate" title={log.progress_notes}>
                          {log.progress_notes}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{log.weather || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{log.submitted_by_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {log.reviewed_by_name ? (
                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-[#22C55E] text-white">
                          Reviewed
                        </span>
                      ) : (
                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => router.push(`/dashboard/construction/daily-logs/${log.id}`)}
                        className="text-[#22C55E] hover:text-[#16A34A] mr-4"
                      >
                        View
                      </button>
                      <button
                        onClick={() => router.push(`/dashboard/construction/daily-logs/${log.id}/edit`)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
    </ConstructionPageShell>
  );
}
