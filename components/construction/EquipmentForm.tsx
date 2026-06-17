'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';
import { constructionApi, Site } from '@/lib/api/construction';
import FormField from '@/components/shared/FormField';

const equipmentSchema = z.object({
  name: z.string().min(1, 'Equipment name is required'),
  equipment_type: z.string().min(1, 'Equipment type is required'),
  ownership_type: z.enum(['owned', 'rented']),
  registration_number: z.string().optional(),
  rental_cost_per_day: z.string().optional(),
  assigned_site: z.string().optional(),
  status: z.enum(['available', 'in_use', 'maintenance', 'retired']),
  notes: z.string().optional(),
});

type EquipmentFormData = z.infer<typeof equipmentSchema>;

interface EquipmentFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function EquipmentForm({ onSuccess, onCancel }: EquipmentFormProps) {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSites, setLoadingSites] = useState(true);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<EquipmentFormData>({
    resolver: zodResolver(equipmentSchema),
    defaultValues: {
      ownership_type: 'owned',
      status: 'available',
    },
  });

  const ownershipType = watch('ownership_type');

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

  const onSubmit = async (data: EquipmentFormData) => {
    try {
      setLoading(true);
      
      const payload = {
        name: data.name,
        equipment_type: data.equipment_type,
        ownership_type: data.ownership_type,
        registration_number: data.registration_number || '',
        rental_cost_per_day: data.rental_cost_per_day ? Number(data.rental_cost_per_day) : undefined,
        assigned_site: data.assigned_site || undefined,
        status: data.status,
        notes: data.notes || '',
      };

      await constructionApi.equipment.create(payload);
      toast.success('Equipment added successfully');
      onSuccess?.();
    } catch (error: any) {
      console.error('Failed to create equipment:', error);
      const message = error.response?.data?.detail || 'Failed to add equipment';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const equipmentTypes = [
    'Excavator',
    'Bulldozer',
    'Crane',
    'Concrete Mixer',
    'Compactor',
    'Loader',
    'Dump Truck',
    'Scaffolding',
    'Generator',
    'Welding Machine',
    'Other',
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <div>
        <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2 mb-4">Equipment Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <FormField
          label="Equipment Name"
          name="name"
          error={errors.name}
          required
        >
          <input
            {...register('name')}
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
            placeholder="Enter equipment name"
          />
        </FormField>

        <FormField
          label="Equipment Type"
          name="equipment_type"
          error={errors.equipment_type}
          required
        >
          <select
            {...register('equipment_type')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
          >
            <option value="">Select type</option>
            {equipmentTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </FormField>

        <FormField
          label="Ownership Type"
          name="ownership_type"
          error={errors.ownership_type}
          required
        >
          <select
            {...register('ownership_type')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
          >
            <option value="owned">Owned</option>
            <option value="rented">Rented</option>
          </select>
        </FormField>

        <FormField
          label="Registration Number"
          name="registration_number"
          error={errors.registration_number}
        >
          <input
            {...register('registration_number')}
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
            placeholder="Vehicle/Equipment registration"
          />
        </FormField>

        {ownershipType === 'rented' && (
          <FormField
            label="Rental Cost Per Day (NPR)"
            name="rental_cost_per_day"
            error={errors.rental_cost_per_day}
          >
            <input
              {...register('rental_cost_per_day')}
              type="number"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
              placeholder="0.00"
            />
          </FormField>
        )}

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
            <option value="available">Available</option>
            <option value="in_use">In Use</option>
            <option value="maintenance">Maintenance</option>
            <option value="retired">Retired</option>
          </select>
        </FormField>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2 mb-4">Notes</h3>
      <FormField
        label="Notes"
        name="notes"
        error={errors.notes}
      >
        <textarea
          {...register('notes')}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
          placeholder="Additional notes about the equipment"
        />
      </FormField>
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
          className="px-6 py-2 bg-[#22C55E] text-white rounded-md hover:bg-[#16A34A] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Adding...' : 'Add Equipment'}
        </button>
      </div>
    </form>
  );
}
