'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { constructionApi, Site, Worker } from '@/lib/api/construction';
import { DateInput } from '@/components/shared/DateInput';
import { constructionTableWrapClass } from '@/components/dashboard/ConstructionPageShell';

const attendanceSchema = z.object({
  site: z.string().min(1, 'Site is required'),
  date: z.string().min(1, 'Date is required'),
});

type AttendanceFormData = z.infer<typeof attendanceSchema>;

interface AttendanceRecord {
  worker: string;
  status: 'present' | 'absent' | 'half_day' | 'overtime';
  check_in?: string;
  check_out?: string;
}

const STATUS_OPTIONS = [
  { value: 'present', label: 'Present' },
  { value: 'absent', label: 'Absent' },
  { value: 'half_day', label: 'Half day' },
  { value: 'overtime', label: 'Overtime' },
] as const;

function sameId(a: string | number | null | undefined, b: string | number | null | undefined) {
  if (a === null || a === undefined || a === '') return false;
  if (b === null || b === undefined || b === '') return false;
  return String(a) === String(b);
}

function formatTimeForInput(value?: string | null): string {
  if (!value) return '';
  return value.slice(0, 5);
}

export default function AttendanceGrid() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialDate = searchParams.get('date') ?? new Date().toISOString().split('T')[0];
  const initialSite = searchParams.get('site') ?? '';

  const [sites, setSites] = useState<Site[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Map<string, AttendanceRecord>>(new Map());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AttendanceFormData>({
    resolver: zodResolver(attendanceSchema),
    defaultValues: {
      site: initialSite,
      date: initialDate,
    },
  });

  const selectedSite = watch('site');
  const selectedDate = watch('date');

  useEffect(() => {
    const fetchSites = async () => {
      try {
        const sitesData = await constructionApi.sites.list({ status: 'active' });
        const sitesList = Array.isArray(sitesData) ? sitesData : [];
        setSites(sitesList);
        if (!initialSite && sitesList.length > 0) {
          setValue('site', String(sitesList[0].id));
        }
      } catch (error) {
        console.error('Failed to load sites:', error);
        toast.error('Failed to load sites');
      }
    };
    fetchSites();
  }, [initialSite, setValue]);

  const buildDefaultRecords = useCallback((workersList: Worker[]) => {
    const initialRecords = new Map<string, AttendanceRecord>();
    workersList.forEach((worker: Worker) => {
      const workerId = String(worker.id);
      initialRecords.set(workerId, {
        worker: workerId,
        status: 'present',
      });
    });
    return initialRecords;
  }, []);

  useEffect(() => {
    if (!selectedSite || !selectedDate) {
      setLoading(false);
      return;
    }

    const loadGrid = async () => {
      try {
        setLoading(true);
        const [workersData, attendanceData] = await Promise.all([
          constructionApi.workers.list({ status: 'active' }),
          constructionApi.attendance.list({ site: selectedSite, date: selectedDate }),
        ]);

        const workersList = Array.isArray(workersData) ? workersData : [];
        const attendanceList = Array.isArray(attendanceData) ? attendanceData : [];

        const siteWorkers = workersList.filter(
          (w: Worker) => !w.assigned_site || sameId(w.assigned_site, selectedSite),
        );
        setWorkers(siteWorkers);

        const existingByWorker = new Map(
          attendanceList.map((a) => [String(a.worker), a]),
        );

        const initialRecords = buildDefaultRecords(siteWorkers);
        siteWorkers.forEach((worker: Worker) => {
          const workerId = String(worker.id);
          const existing = existingByWorker.get(workerId);
          if (existing) {
            initialRecords.set(workerId, {
              worker: workerId,
              status: existing.status,
              check_in: formatTimeForInput(existing.check_in),
              check_out: formatTimeForInput(existing.check_out),
            });
          }
        });
        setAttendanceRecords(initialRecords);
      } catch (error) {
        console.error('Failed to load workers:', error);
        toast.error('Failed to load workers');
      } finally {
        setLoading(false);
      }
    };

    loadGrid();
  }, [selectedSite, selectedDate, buildDefaultRecords]);

  const updateAttendanceStatus = (workerId: string, status: AttendanceRecord['status']) => {
    const id = String(workerId);
    setAttendanceRecords((prev) => {
      const newRecords = new Map(prev);
      const record = newRecords.get(id) || { worker: id, status: 'absent' as const };
      newRecords.set(id, { ...record, status });
      return newRecords;
    });
  };

  const updateCheckTime = (workerId: string, field: 'check_in' | 'check_out', value: string) => {
    const id = String(workerId);
    setAttendanceRecords((prev) => {
      const newRecords = new Map(prev);
      const record = newRecords.get(id) || { worker: id, status: 'absent' as const };
      newRecords.set(id, { ...record, [field]: value });
      return newRecords;
    });
  };

  const handleMarkAll = (status: AttendanceRecord['status']) => {
    setAttendanceRecords((prev) => {
      const newRecords = new Map(prev);
      workers.forEach((worker) => {
        const workerId = String(worker.id);
        const record = newRecords.get(workerId) || { worker: workerId, status: 'absent' as const };
        newRecords.set(workerId, { ...record, status });
      });
      return newRecords;
    });
  };

  const onSubmit = async (data: AttendanceFormData) => {
    try {
      setSubmitting(true);

      const attendances = Array.from(attendanceRecords.values());

      const payload = {
        site: data.site,
        date: data.date,
        attendances: attendances.map((record) => ({
          worker: record.worker,
          status: record.status,
          check_in: record.check_in || undefined,
          check_out: record.check_out || undefined,
        })),
      };

      const result = await constructionApi.attendance.bulkMark(payload);
      const created = result?.created?.length ?? 0;
      const updated = result?.updated?.length ?? 0;
      const errorCount = result?.errors?.length ?? 0;

      if (errorCount > 0) {
        const firstError = result?.errors?.[0];
        const detail =
          firstError?.errors && typeof firstError.errors === 'object'
            ? JSON.stringify(firstError.errors)
            : undefined;
        toast.error(
          detail
            ? `Saved ${created + updated} records; ${errorCount} failed: ${detail}`
            : `Saved ${created + updated} records; ${errorCount} failed`,
        );
      } else {
        toast.success(
          updated > 0
            ? `Attendance updated for ${updated + created} workers`
            : `Attendance marked for ${created} workers`,
        );
        router.push('/dashboard/construction/attendance');
      }
    } catch (error: any) {
      console.error('Failed to mark attendance:', error);
      const message = error.response?.data?.detail || 'Failed to mark attendance';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-sm text-gray-500">Loading workers...</div>
    );
  }

  return (
  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Site <span className="text-red-500">*</span>
        </label>
        <select
          {...register('site')}
          className="w-full h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
        >
          <option value="">Select site</option>
          {sites.map((site) => (
            <option key={site.id} value={site.id}>
              {site.name} — {site.location}
            </option>
          ))}
        </select>
        {errors.site && <p className="mt-1 text-sm text-red-600">{errors.site.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Date <span className="text-red-500">*</span>
        </label>
        <Controller
          name="date"
          control={control}
          render={({ field }) => (
            <DateInput value={field.value || ''} onChange={field.onChange} />
          )}
        />
        {errors.date && <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>}
      </div>
    </div>

    {selectedSite && (
      <>
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleMarkAll('present')}
            disabled={submitting || workers.length === 0}
          >
            Mark all present
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleMarkAll('absent')}
            disabled={submitting || workers.length === 0}
          >
            Mark all absent
          </Button>
        </div>

        {workers.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            No active workers assigned to this site
          </div>
        ) : (
          <div className={constructionTableWrapClass}>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Worker', 'Category', 'Status', 'Check-in', 'Check-out'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {workers.map((worker) => {
                  const workerId = String(worker.id);
                  const record = attendanceRecords.get(workerId);
                  const status = record?.status || 'absent';

                  return (
                    <tr key={workerId} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-medium text-gray-900">{worker.name}</td>
                      <td className="px-4 py-3 text-gray-600 capitalize">{worker.category}</td>
                      <td className="px-4 py-3">
                        <Select
                          value={status}
                          onValueChange={(v) =>
                            v && updateAttendanceStatus(workerId, v as AttendanceRecord['status'])
                          }
                          disabled={submitting}
                        >
                          <SelectTrigger className="h-8 w-32 text-xs border-gray-200">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map((s) => (
                              <SelectItem key={s.value} value={s.value}>
                                {s.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="time"
                          value={record?.check_in || ''}
                          onChange={(e) => updateCheckTime(workerId, 'check_in', e.target.value)}
                          disabled={submitting || status === 'absent'}
                          className="h-8 px-2 border border-gray-200 rounded text-xs disabled:bg-gray-100"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="time"
                          value={record?.check_out || ''}
                          onChange={(e) => updateCheckTime(workerId, 'check_out', e.target.value)}
                          disabled={submitting || status === 'absent'}
                          className="h-8 px-2 border border-gray-200 rounded text-xs disabled:bg-gray-100"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex gap-3 pt-4 border-t border-gray-100">
          <Button
            type="submit"
            className="bg-[#22C55E] hover:bg-[#16A34A] text-white"
            disabled={submitting || workers.length === 0}
          >
            {submitting ? 'Saving...' : 'Save Attendance'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={submitting}
          >
            Cancel
          </Button>
        </div>
      </>
    )}
  </form>
  );
}
