'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';
import { constructionApi, Site, Worker } from '@/lib/api/construction';
import FormField from '@/components/shared/FormField';

const workerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().optional(),
  address: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  daily_wage: z.string()
    .min(1, 'Daily wage is required')
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
      message: 'Must be a valid number',
    }),
  assigned_site: z.string().optional(),
  status: z.enum(['active', 'inactive']),
  id_number: z.string().optional(),
  emergency_contact: z.string().optional(),
});

type WorkerFormData = z.infer<typeof workerSchema>;

interface WorkerFormProps {
  workerId?: string;
  initialData?: Partial<WorkerFormData>;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function WorkerForm({ workerId, initialData, onSuccess, onCancel }: WorkerFormProps) {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSites, setLoadingSites] = useState(true);

  const isEdit = !!workerId;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<WorkerFormData>({
    resolver: zodResolver(workerSchema),
    defaultValues: {
      status: 'active',
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

  const onSubmit = async (data: WorkerFormData) => {
    try {
      setLoading(true);
      
      const payload = {
        name: data.name,
        phone: data.phone || '',
        address: data.address || '',
        category: data.category as Worker['category'],
        daily_wage: Number(data.daily_wage),
        assigned_site: data.assigned_site || undefined,
        status: data.status,
        id_number: data.id_number || '',
        emergency_contact: data.emergency_contact || '',
      };

      if (isEdit && workerId) {
        await constructionApi.workers.update(workerId, payload);
        toast.success('Worker updated successfully');
      } else {
        await constructionApi.workers.create(payload);
        toast.success('Worker added successfully');
      }
      
      onSuccess?.();
    } catch (error: any) {
      console.error('Failed to create worker:', error);
      const message = error.response?.data?.detail || 'Failed to add worker';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { value: 'mason', label: 'Mason' },
    { value: 'laborer', label: 'Laborer' },
    { value: 'carpenter', label: 'Carpenter' },
    { value: 'electrician', label: 'Electrician' },
    { value: 'plumber', label: 'Plumber' },
    { value: 'engineer', label: 'Engineer' },
    { value: 'supervisor', label: 'Supervisor' },
    { value: 'helper', label: 'Helper' },
    { value: 'painter', label: 'Painter' },
    { value: 'welder', label: 'Welder' },
    { value: 'driver', label: 'Driver' },
    { value: 'operator', label: 'Equipment Operator' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          label="Worker Name"
          name="name"
          error={errors.name}
          required
        >
          <input
            {...register('name')}
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
            placeholder="Enter worker name"
          />
        </FormField>

        <FormField
          label="Category"
          name="category"
          error={errors.category}
          required
        >
          <select
            {...register('category')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
          >
            <option value="">Select category</option>
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </FormField>

        <FormField
          label="Daily Wage (NPR)"
          name="daily_wage"
          error={errors.daily_wage}
          required
        >
          <input
            {...register('daily_wage')}
            type="number"
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
            placeholder="0.00"
          />
        </FormField>

        <FormField
          label="Phone Number"
          name="phone"
          error={errors.phone}
        >
          <input
            {...register('phone')}
            type="tel"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
            placeholder="Enter phone number"
          />
        </FormField>

        <FormField
          label="ID Number"
          name="id_number"
          error={errors.id_number}
        >
          <input
            {...register('id_number')}
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
            placeholder="Citizenship/ID number"
          />
        </FormField>

        <FormField
          label="Emergency Contact"
          name="emergency_contact"
          error={errors.emergency_contact}
        >
          <input
            {...register('emergency_contact')}
            type="tel"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
            placeholder="Emergency contact number"
          />
        </FormField>

        <FormField
          label="Assigned Site"
          name="assigned_site"
          error={errors.assigned_site}
        >
          <select
            {...register('assigned_site')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
            disabled={loadingSites}
          >
            <option value="">No site assigned</option>
            {sites.map((site) => (
              <option key={site.id} value={site.id}>
                {site.name}
              </option>
            ))}
          </select>
        </FormField>

        <FormField
          label="Status"
          name="status"
          error={errors.status}
          required
        >
          <select
            {...register('status')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </FormField>
      </div>

      <FormField
        label="Address"
        name="address"
        error={errors.address}
      >
        <textarea
          {...register('address')}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
          placeholder="Enter full address"
        />
      </FormField>

      <div className="flex justify-end gap-3">
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
          {loading && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          )}
          {loading ? (isEdit ? 'Updating Worker...' : 'Adding Worker...') : (isEdit ? 'Update Worker' : 'Add Worker')}
        </button>
      </div>
    </form>
  );
}
