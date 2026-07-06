'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';
import { constructionApi, Equipment, Site } from '@/lib/api/construction';
import FormField from '@/components/shared/FormField';
import {
  ConstructionPageShell,
  constructionCardClass,
} from '@/components/dashboard/ConstructionPageShell';

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

export default function EditEquipmentPage() {
  const router = useRouter();
  const params = useParams();
  const equipmentId = params.id as string;

  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<EquipmentFormData>({
    resolver: zodResolver(equipmentSchema),
  });

  const ownershipType = watch('ownership_type');

  useEffect(() => {
    if (equipmentId) {
      fetchData();
    }
  }, [equipmentId]);

  const fetchData = async () => {
    try {
      setLoadingData(true);
      const [equipmentData, sitesData] = await Promise.all([
        constructionApi.equipment.get(equipmentId),
        constructionApi.sites.list(),
      ]);
      
      setEquipment(equipmentData);
      setSites(Array.isArray(sitesData) ? sitesData : []);
      
      // Populate form with existing data
      reset({
        name: equipmentData.name,
        equipment_type: equipmentData.equipment_type,
        ownership_type: equipmentData.ownership_type,
        registration_number: equipmentData.registration_number || '',
        rental_cost_per_day: equipmentData.rental_cost_per_day?.toString() || '',
        assigned_site: equipmentData.assigned_site || '',
        status: equipmentData.status,
        notes: equipmentData.notes || '',
      });
    } catch (error: any) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load equipment details');
      router.push('/dashboard/construction/equipment');
    } finally {
      setLoadingData(false);
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

      await constructionApi.equipment.update(equipmentId, payload);
      toast.success('Equipment updated successfully');
      router.push(`/dashboard/construction/equipment/${equipmentId}`);
    } catch (error: any) {
      console.error('Failed to update equipment:', error);
      const message = error.response?.data?.detail || 'Failed to update equipment';
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

  if (loadingData) {
    return (
      <ConstructionPageShell
        title="Edit Equipment"
        subtitle="Loading equipment..."
        variant="form"
        loading
      />
    );
  }

  return (
    <ConstructionPageShell
      title="Edit Equipment"
      subtitle="Update equipment information"
      variant="form"
    >
      <div className={`${constructionCardClass} p-6 lg:p-8`}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

          <div className="flex justify-end gap-3">
            <Link
              href={`/dashboard/construction/equipment/${equipmentId}`}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-[#22C55E] text-white rounded-md hover:bg-[#16A34A] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Updating...' : 'Update Equipment'}
            </button>
          </div>
        </form>
      </div>
    </ConstructionPageShell>
  );
}
