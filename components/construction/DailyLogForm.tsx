'use client';



import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';
import { constructionApi, Site } from '@/lib/api/construction';
import FormField from '@/components/shared/FormField';
import { DateInput } from '@/components/shared/DateInput';

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

interface DailyLogFormProps {
  logId?: string;
  initialData?: Partial<DailyLogFormData>;
  hoursUntilImmutable?: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function DailyLogForm({
  logId,
  initialData,
  hoursUntilImmutable,
  onSuccess,
  onCancel,
}: DailyLogFormProps) {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSites, setLoadingSites] = useState(true);

  const isEdit = !!logId;

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<DailyLogFormData>({
    resolver: zodResolver(dailyLogSchema),
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      other_expenses: "0",
      ...initialData,
    },
  });

  useEffect(() => {
    fetchSites();
  }, []);

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

      if (isEdit && logId) {
        await constructionApi.dailyLogs.update(logId, payload);
        toast.success("Daily log updated successfully");
      } else {
        await constructionApi.dailyLogs.create(payload);
        toast.success("Daily log created successfully");
      }

      onSuccess?.();
    } catch (error: unknown) {
      const err = error as { response?: { data?: Record<string, unknown> } };
      console.error(`Failed to ${isEdit ? "update" : "create"} daily log:`, error);

      if (err.response?.data) {
        const errorData = err.response.data;

        if (errorData.date) {
          const dateError = Array.isArray(errorData.date) ? errorData.date[0] : errorData.date;
          toast.error(String(dateError));
        } else if (errorData.detail) {
          toast.error(String(errorData.detail));
        } else if (errorData.non_field_errors) {
          const nonFieldError = Array.isArray(errorData.non_field_errors)
            ? errorData.non_field_errors[0]
            : errorData.non_field_errors;
          toast.error(String(nonFieldError));
        } else {
          toast.error(
            `Failed to ${isEdit ? "update" : "create"} daily log. Please check your input.`
          );
        }
      } else {
        toast.error(`Failed to ${isEdit ? "update" : "create"} daily log. Please try again.`);
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {isEdit && hoursUntilImmutable !== undefined && hoursUntilImmutable < 24 && (
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-sm font-medium text-orange-800">
              This log will become immutable in {hoursUntilImmutable.toFixed(1)} hours
            </p>
          </div>
          <p className="text-xs text-orange-700 mt-1 ml-7">
            Daily logs cannot be edited after 24 hours from creation
          </p>
        </div>
      )}

      <div>
        <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2 mb-4">Log Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
          <Controller
            name="date"
            control={control}
            render={({ field }) => (
              <DateInput value={field.value || ''} onChange={field.onChange} />
            )}
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
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2 mb-4">Work & Progress</h3>
        <div className="space-y-4">
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
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-[#22C55E] text-white rounded-md hover:bg-[#16A34A] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {loading ? (isEdit ? "Updating..." : "Creating...") : isEdit ? "Update Daily Log" : "Create Daily Log"}
        </button>
      </div>
    </form>
  );
}
