'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';
import { constructionApi, Site, DailyLog } from '@/lib/api/construction';
import FormField from '@/components/shared/FormField';

const dailyLogSchema = z.object({
  site: z.string().min(1, 'Site is required'),
  date: z.string().min(1, 'Date is required'),
  work_description: z.string().min(1, 'Work description is required'),
  progress_notes: z.string().optional(),
  weather: z.string().optional(),
  other_expenses: z.string().optional(),
  other_expenses_description: z.string().optional(),
});

type DailyLogFormData = z.infer<typeof dailyLogSchema>;

export default function EditDailyLogPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [sites, setSites] = useState<Site[]>([]);
  const [log, setLog] = useState<DailyLog | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingSites, setLoadingSites] = useState(true);
  const [loadingLog, setLoadingLog] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<DailyLogFormData>({
    resolver: zodResolver(dailyLogSchema),
  });

  useEffect(() => {
    fetchSites();
    if (id) {
      fetchLog();
    }
  }, [id]);

  const fetchSites = async () => {
    try {
      setLoadingSites(true);
      const sitesData = await constructionApi.sites.list();
      setSites(Array.isArray(sitesData) ? sitesData : []);
    } catch (error) {
      console.error('Failed to load sites:', error);
      toast.error('Failed to load sites');
    } finally {
      setLoadingSites(false);
    }
  };

  const fetchLog = async () => {
    try {
      setLoadingLog(true);
      const logData = await constructionApi.dailyLogs.get(id);
      setLog(logData);
      
      // Check if log is editable
      if (!logData.is_editable) {
        toast.error('This daily log cannot be edited. It was created more than 24 hours ago.');
        router.push(`/dashboard/construction/daily-logs/${id}`);
        return;
      }
      
      // Populate form with existing data
      reset({
        site: logData.site,
        date: logData.date,
        work_description: logData.work_description,
        progress_notes: logData.progress_notes || '',
        weather: logData.weather || '',
        other_expenses: logData.other_expenses?.toString() || '0',
        other_expenses_description: logData.other_expenses_description || '',
      });
    } catch (error) {
      console.error('Failed to load daily log:', error);
      toast.error('Failed to load daily log');
      router.push('/dashboard/construction/daily-logs');
    } finally {
      setLoadingLog(false);
    }
  };

  const onSubmit = async (data: DailyLogFormData) => {
    try {
      setLoading(true);
      
      const payload = {
        site: data.site,
        date: data.date,
        work_description: data.work_description,
        progress_notes: data.progress_notes || '',
        weather: data.weather || '',
        other_expenses: data.other_expenses ? Number(data.other_expenses) : 0,
        other_expenses_description: data.other_expenses_description || '',
      };

      await constructionApi.dailyLogs.update(id, payload);
      toast.success('Daily log updated successfully');
      router.push(`/dashboard/construction/daily-logs/${id}`);
    } catch (error: any) {
      console.error('Failed to update daily log:', error);
      
      // Handle validation errors
      if (error.response?.data) {
        const errorData = error.response.data;
        
        if (errorData.date) {
          const dateError = Array.isArray(errorData.date) ? errorData.date[0] : errorData.date;
          toast.error(dateError);
        } else if (errorData.detail) {
          toast.error(errorData.detail);
        } else if (errorData.non_field_errors) {
          const nonFieldError = Array.isArray(errorData.non_field_errors) 
            ? errorData.non_field_errors[0] 
            : errorData.non_field_errors;
          toast.error(nonFieldError);
        } else {
          toast.error('Failed to update daily log. Please check your input.');
        }
      } else {
        toast.error('Failed to update daily log. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const weatherOptions = [
    'Sunny',
    'Cloudy',
    'Rainy',
    'Stormy',
    'Foggy',
    'Windy',
  ];

  if (loadingLog) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#22C55E]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href={`/dashboard/construction/daily-logs/${id}`}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Daily Log</h1>
          <p className="mt-1 text-sm text-gray-600">
            Update daily site activities and progress
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow p-6">
        {log && log.hours_until_immutable !== undefined && log.hours_until_immutable < 24 && (
          <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm font-medium text-orange-800">
                This log will become immutable in {log.hours_until_immutable.toFixed(1)} hours
              </p>
            </div>
            <p className="text-xs text-orange-700 mt-1 ml-7">
              Daily logs cannot be edited after 24 hours from creation
            </p>
          </div>
        )}
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              label="Site"
              name="site"
              error={errors.site}
              required
            >
              <select
                {...register('site')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
                disabled={loadingSites}
              >
                <option value="">Select site</option>
                {sites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField
              label="Date"
              name="date"
              error={errors.date}
              required
            >
              <input
                {...register('date')}
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
              />
            </FormField>

            <FormField
              label="Weather"
              name="weather"
              error={errors.weather}
            >
              <select
                {...register('weather')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
              >
                <option value="">Select weather</option>
                {weatherOptions.map((weather) => (
                  <option key={weather} value={weather}>
                    {weather}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField
              label="Other Expenses (NPR)"
              name="other_expenses"
              error={errors.other_expenses}
            >
              <input
                {...register('other_expenses')}
                type="number"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
                placeholder="0.00"
              />
            </FormField>
          </div>

          <FormField
            label="Work Description"
            name="work_description"
            error={errors.work_description}
            required
          >
            <textarea
              {...register('work_description')}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
              placeholder="Describe the work done today..."
            />
          </FormField>

          <FormField
            label="Progress Notes"
            name="progress_notes"
            error={errors.progress_notes}
          >
            <textarea
              {...register('progress_notes')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
              placeholder="Additional notes about progress, challenges, etc."
            />
          </FormField>

          <FormField
            label="Other Expenses Description"
            name="other_expenses_description"
            error={errors.other_expenses_description}
          >
            <textarea
              {...register('other_expenses_description')}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
              placeholder="Describe other expenses (if any)"
            />
          </FormField>

          <div className="flex justify-end gap-3">
            <Link
              href={`/dashboard/construction/daily-logs/${id}`}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-[#22C55E] text-white rounded-md hover:bg-[#16A34A] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {loading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              {loading ? 'Updating...' : 'Update Daily Log'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
