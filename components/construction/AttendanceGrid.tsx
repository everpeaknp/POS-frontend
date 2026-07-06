import { KhataSpinner } from "@/components/shared/KhataSpinner";
'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';
import { constructionApi, Site, Worker } from '@/lib/api/construction';
import { formatNPR } from '@/lib/utils';
import { DateInput } from '@/components/shared/DateInput';

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

export default function AttendanceGrid() {
  const [sites, setSites] = useState<Site[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Map<string, AttendanceRecord>>(new Map());
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<AttendanceFormData>({
    resolver: zodResolver(attendanceSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
    },
  });

  const selectedSite = watch('site');
  const selectedDate = watch('date');

  // Fetch sites on mount
  useEffect(() => {
    const fetchSites = async () => {
      try {
        const sitesData = await constructionApi.sites.list();
        setSites(Array.isArray(sitesData) ? sitesData : []);
      } catch (error) {
        console.error('Failed to load sites:', error);
        toast.error('Failed to load sites');
      }
    };
    fetchSites();
  }, []);

  // Fetch workers when site is selected
  useEffect(() => {
    if (!selectedSite) return;

    const fetchWorkers = async () => {
      try {
        setLoading(true);
        const workersData = await constructionApi.workers.list({ assigned_site: selectedSite });
        const activeWorkers = Array.isArray(workersData) 
          ? workersData.filter((w: Worker) => w.status === 'active')
          : [];
        setWorkers(activeWorkers);
        
        // Initialize attendance records with 'absent' status
        const initialRecords = new Map<string, AttendanceRecord>();
        activeWorkers.forEach((worker: Worker) => {
          initialRecords.set(worker.id, {
            worker: worker.id,
            status: 'absent',
          });
        });
        setAttendanceRecords(initialRecords);
      } catch (error) {
        console.error('Failed to load workers:', error);
        toast.error('Failed to load workers');
      } finally {
        setLoading(false);
      }
    };

    fetchWorkers();
  }, [selectedSite]);

  const updateAttendanceStatus = (workerId: string, status: AttendanceRecord['status']) => {
    setAttendanceRecords(prev => {
      const newRecords = new Map(prev);
      const record = newRecords.get(workerId) || { worker: workerId, status: 'absent' };
      newRecords.set(workerId, { ...record, status });
      return newRecords;
    });
  };

  const updateCheckTime = (workerId: string, field: 'check_in' | 'check_out', value: string) => {
    setAttendanceRecords(prev => {
      const newRecords = new Map(prev);
      const record = newRecords.get(workerId) || { worker: workerId, status: 'absent' };
      newRecords.set(workerId, { ...record, [field]: value });
      return newRecords;
    });
  };

  const calculateWage = (worker: Worker, status: AttendanceRecord['status']) => {
    switch (status) {
      case 'present':
        return worker.daily_wage;
      case 'half_day':
        return worker.daily_wage / 2;
      case 'overtime':
        return worker.daily_wage * 1.5;
      case 'absent':
      default:
        return 0;
    }
  };

  const getTotalWages = () => {
    let total = 0;
    attendanceRecords.forEach((record, workerId) => {
      const worker = workers.find(w => w.id === workerId);
      if (worker) {
        total += calculateWage(worker, record.status);
      }
    });
    return total;
  };

  const onSubmit = async (data: AttendanceFormData) => {
    try {
      setSubmitting(true);

      // Prepare bulk attendance data
      const attendances = Array.from(attendanceRecords.values());

      const payload = {
        site: data.site,
        date: data.date,
        attendances: attendances.map(record => ({
          worker: record.worker,
          status: record.status,
          check_in: record.check_in || undefined,
          check_out: record.check_out || undefined,
        })),
      };

      await constructionApi.attendance.bulkMark(payload);
      
      toast.success(`Attendance marked for ${attendances.length} workers`);
      
      // Reset to absent status after successful submission
      const resetRecords = new Map<string, AttendanceRecord>();
      workers.forEach(worker => {
        resetRecords.set(worker.id, {
          worker: worker.id,
          status: 'absent',
        });
      });
      setAttendanceRecords(resetRecords);
    } catch (error: any) {
      console.error('Failed to mark attendance:', error);
      const message = error.response?.data?.detail || 'Failed to mark attendance';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: AttendanceRecord['status']) => {
    switch (status) {
      case 'present':
        return 'bg-[#22C55E] text-white border-[#22C55E]';
      case 'half_day':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'overtime':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'absent':
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="space-y-6 w-full">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 lg:p-8 w-full min-h-full">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Daily Attendance Grid</h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Site <span className="text-red-500">*</span>
              </label>
              <select
                {...register('site')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
              >
                <option value="">Select Site</option>
                {sites.map(site => (
                  <option key={site.id} value={site.id}>
                    {site.name} - {site.location}
                  </option>
                ))}
              </select>
              {errors.site && (
                <p className="mt-1 text-sm text-red-600">{errors.site.message}</p>
              )}
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
              {errors.date && (
                <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
              )}
            </div>
          </div>

          {/* Workers Grid */}
          {selectedSite && (
            <>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <KhataSpinner size="lg" />
                </div>
              ) : workers.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No active workers assigned to this site
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto w-full">
                    <table className="min-w-full divide-y divide-gray-200 w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Worker Name
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Category
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Daily Wage
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Check In
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Check Out
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Wage Amount
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {workers.map(worker => {
                          const record = attendanceRecords.get(worker.id);
                          const status = record?.status || 'absent';
                          const wageAmount = calculateWage(worker, status);

                          return (
                            <tr key={worker.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                {worker.name}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                {worker.category}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                {formatNPR(worker.daily_wage)}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="flex gap-1 justify-center">
                                  {(['present', 'absent', 'half_day', 'overtime'] as const).map(s => (
                                    <button
                                      key={s}
                                      type="button"
                                      onClick={() => updateAttendanceStatus(worker.id, s)}
                                      className={`px-2 py-1 text-xs font-medium rounded border transition-colors ${
                                        status === s
                                          ? getStatusColor(s)
                                          : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                                      }`}
                                    >
                                      {s === 'half_day' ? 'Half' : s === 'overtime' ? 'OT' : s.charAt(0).toUpperCase()}
                                    </button>
                                  ))}
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <input
                                  type="time"
                                  value={record?.check_in || ''}
                                  onChange={e => updateCheckTime(worker.id, 'check_in', e.target.value)}
                                  disabled={status === 'absent'}
                                  className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#22C55E] disabled:bg-gray-100"
                                />
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <input
                                  type="time"
                                  value={record?.check_out || ''}
                                  onChange={e => updateCheckTime(worker.id, 'check_out', e.target.value)}
                                  disabled={status === 'absent'}
                                  className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#22C55E] disabled:bg-gray-100"
                                />
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                                {formatNPR(wageAmount)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot className="bg-gray-50">
                        <tr>
                          <td colSpan={6} className="px-4 py-3 text-right text-sm font-bold text-gray-900">
                            Total Labor Cost:
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-bold text-gray-900">
                            {formatNPR(getTotalWages())}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <button
                      type="submit"
                      disabled={submitting || workers.length === 0}
                      className="px-6 py-2 bg-[#22C55E] text-white rounded-md hover:bg-[#16A34A] disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                      {submitting && (
                        <KhataSpinner variant="onPrimary" />
                      )}
                      {submitting ? 'Saving...' : 'Save Attendance'}
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </form>
      </div>

      {/* Legend */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 lg:p-6 w-full">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Status Legend</h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 text-xs font-medium rounded border bg-[#22C55E] text-white border-[#22C55E]">
              Present
            </span>
            <span className="text-sm text-gray-600">Full wage</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 text-xs font-medium rounded border bg-yellow-100 text-yellow-800 border-yellow-300">
              Half Day
            </span>
            <span className="text-sm text-gray-600">50% wage</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 text-xs font-medium rounded border bg-blue-100 text-blue-800 border-blue-300">
              Overtime
            </span>
            <span className="text-sm text-gray-600">150% wage</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 text-xs font-medium rounded border bg-gray-100 text-gray-800 border-gray-300">
              Absent
            </span>
            <span className="text-sm text-gray-600">No wage</span>
          </div>
        </div>
      </div>
    </div>
  );
}
