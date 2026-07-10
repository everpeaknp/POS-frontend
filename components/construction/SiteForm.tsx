'use client';

import { KhataSpinner } from "@/components/shared/KhataSpinner";

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import FormField from '@/components/shared/FormField';
import { DateInput } from '@/components/shared/DateInput';
import { sitesAPI } from '@/lib/api/construction';
import apiClient from '@/lib/api/client';

// Zod schema matching backend Site model
const siteSchema = z.object({
  name: z.string().min(1, 'Site name is required').max(255, 'Name too long'),
  location: z.string().min(1, 'Location is required').max(500, 'Location too long'),
  client_name: z.string().max(255, 'Client name too long').optional().or(z.literal('')),
  allocated_budget: z.string()
    .min(1, 'Allocated budget is required')
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
      message: 'Must be a valid positive number',
    }),
  start_date: z.string().min(1, 'Start date is required'),
  estimated_end_date: z.string().optional().or(z.literal('')),
  manager: z.string().min(1, 'Assigned manager is required'),
  warehouse: z.string().min(1, 'Warehouse is required'),
  status: z.enum(['planned', 'active', 'on_hold', 'completed']),
  description: z.string().optional().or(z.literal('')),
});

type SiteFormData = z.infer<typeof siteSchema>;

interface Manager {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
}

interface Warehouse {
  id: string;
  name: string;
  location: string;
}

interface SiteFormProps {
  siteId?: string;
  initialData?: Partial<SiteFormData>;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function SiteForm({
  siteId,
  initialData,
  onSuccess,
  onCancel,
}: SiteFormProps) {
  const router = useRouter();
  const [managers, setManagers] = useState<Manager[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);

  const isEdit = !!siteId;

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<SiteFormData>({
    resolver: zodResolver(siteSchema),
    defaultValues: {
      status: 'planned',
      client_name: '',
      estimated_end_date: '',
      description: '',
      ...initialData,
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const [employeesRes, warehousesRes] = await Promise.all([
          apiClient.get('/hr/employees/', { params: { status: 'active' } }),
          apiClient.get('/inventory/warehouses/'),
        ]);
        
        const employeesData = employeesRes.data.results || employeesRes.data || [];
        const warehousesData = warehousesRes.data.results || warehousesRes.data || [];
        
        const managersData = employeesData.filter((emp: any) => 
          emp.designation && 
          (emp.designation.toLowerCase().includes('manager') || 
           emp.designation.toLowerCase().includes('supervisor'))
        );
        
        // Transform employee data to match Manager interface
        const transformedManagers = managersData.map((emp: any) => ({
          id: emp.id,
          username: emp.name,
          first_name: emp.name.split(' ')[0] || emp.name,
          last_name: emp.name.split(' ').slice(1).join(' ') || '',
          email: emp.email,
          role: emp.designation,
        }));
        
        setManagers(transformedManagers);
        setWarehouses(warehousesData);
        
        if (transformedManagers.length === 0) {
          toast.error('No managers or supervisors found in HR employees. Please create employees with Manager or Supervisor designation.');
        }
        if (warehousesData.length === 0) {
          toast.error('No warehouses found. Please create a warehouse first.');
        }
      } catch (error: any) {
        console.error('Failed to load form data:', error);
        console.error('Error response:', error.response);
        toast.error('Failed to load form data. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const onSubmit = async (data: SiteFormData) => {
    try {
      // Convert allocated_budget to number for API
      const payload = {
        ...data,
        allocated_budget: Number(data.allocated_budget),
      };

      if (isEdit && siteId) {
        await sitesAPI.update(siteId, payload);
        toast.success('Site updated successfully!');
      } else {
        await sitesAPI.create(payload);
        toast.success('Site created successfully!');
        reset();
      }

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      } else {
        // Redirect to sites list page
        router.push('/dashboard/construction/sites');
      }
    } catch (error: any) {
      const message = error.response?.data?.detail 
        || error.response?.data?.message
        || 'Operation failed. Please try again.';
      toast.error(message);
      
      // Handle field-specific errors from backend
      if (error.response?.data) {
        Object.keys(error.response.data).forEach((field) => {
          if (field !== 'detail' && field !== 'message') {
            const fieldErrors = error.response.data[field];
            const errorMsg = Array.isArray(fieldErrors) ? fieldErrors[0] : fieldErrors;
            toast.error(`${field}: ${errorMsg}`);
          }
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <KhataSpinner size="lg" />
        <span className="ml-3 text-gray-600">Loading form data...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <div>
        <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2 mb-4">Site Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <FormField
            label="Site Name"
            name="name"
            error={errors.name}
            required
          >
            <input
              {...register('name')}
              type="text"
              id="name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
              placeholder="Enter site name"
            />
          </FormField>

          <FormField
            label="Location"
            name="location"
            error={errors.location}
            required
          >
            <input
              {...register('location')}
              type="text"
              id="location"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
              placeholder="Enter site location"
            />
          </FormField>

          <FormField
            label="Client Name"
            name="client_name"
            error={errors.client_name}
          >
            <input
              {...register('client_name')}
              type="text"
              id="client_name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
              placeholder="Enter client name (optional)"
            />
          </FormField>

          <FormField
            label="Allocated Budget (NPR)"
            name="allocated_budget"
            error={errors.allocated_budget}
            required
            hint="Total budget allocated for this construction site"
          >
            <input
              {...register('allocated_budget')}
              type="text"
              id="allocated_budget"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
              placeholder="0.00"
            />
          </FormField>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2 mb-4">Schedule & Assignment</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <FormField
            label="Start Date"
            name="start_date"
            error={errors.start_date}
            required
          >
            <Controller
              name="start_date"
              control={control}
              render={({ field }) => (
                <DateInput value={field.value || ''} onChange={field.onChange} />
              )}
            />
          </FormField>

          <FormField
            label="Estimated End Date"
            name="estimated_end_date"
            error={errors.estimated_end_date}
          >
            <Controller
              name="estimated_end_date"
              control={control}
              render={({ field }) => (
                <DateInput value={field.value || ''} onChange={field.onChange} />
              )}
            />
          </FormField>

          <FormField
            label="Assigned Manager"
            name="manager"
            error={errors.manager}
            required
            hint="Select a manager to oversee this site"
          >
            <select
              {...register('manager')}
              id="manager"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
            >
              <option value="">Select manager</option>
              {managers.map((manager) => (
                <option key={manager.id} value={manager.id}>
                  {manager.username} - {manager.role}
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            label="Warehouse"
            name="warehouse"
            error={errors.warehouse}
            required
            hint="Warehouse for site materials"
          >
            <select
              {...register('warehouse')}
              id="warehouse"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
            >
              <option value="">Select warehouse</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name} - {warehouse.location}
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
              id="status"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
            >
              <option value="planned">Planned</option>
              <option value="active">Active</option>
              <option value="on_hold">On Hold</option>
              <option value="completed">Completed</option>
            </select>
          </FormField>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2 mb-4">Description</h3>
        <FormField
          label="Description"
          name="description"
          error={errors.description}
        >
          <textarea
            {...register('description')}
            id="description"
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
            placeholder="Optional site description, notes, or special requirements"
          />
        </FormField>
      </div>

      {/* Form Actions */}
      <div className="flex gap-3 pt-4 border-t">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 bg-[#22C55E] text-white rounded-md hover:bg-[#16A34A] disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {isSubmitting ? 'Saving...' : isEdit ? 'Update Site' : 'Create Site'}
        </button>
        
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
          >
            Cancel
          </button>
        )}
        
        {!isEdit && (
          <button
            type="button"
            onClick={() => reset()}
            disabled={isSubmitting}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
          >
            Reset
          </button>
        )}
      </div>
    </form>
  );
}
