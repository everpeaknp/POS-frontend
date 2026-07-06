import { KhataSpinner } from "@/components/shared/KhataSpinner";
'use client';

import { FormattedDate } from "@/components/shared/FormattedDate";
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  ConstructionPageShell,
  constructionCardClass,
} from '@/components/dashboard/ConstructionPageShell';
import { constructionApi, Equipment } from '@/lib/api/construction';
import { formatNPR } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function EquipmentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const equipmentId = params.id as string;

  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (equipmentId) {
      fetchEquipment();
    }
  }, [equipmentId]);

  const fetchEquipment = async () => {
    try {
      setLoading(true);
      const equipmentData = await constructionApi.equipment.get(equipmentId);
      setEquipment(equipmentData);
    } catch (error: any) {
      console.error('Failed to fetch equipment:', error);
      toast.error('Failed to load equipment details');
      router.push('/dashboard/construction/equipment');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await constructionApi.equipment.delete(equipmentId);
      toast.success('Equipment deleted successfully');
      router.push('/dashboard/construction/equipment');
    } catch (error: any) {
      console.error('Failed to delete equipment:', error);
      toast.error(error.response?.data?.detail || 'Failed to delete equipment');
      setDeleting(false);
      setDeleteModalOpen(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'available': 'bg-[#22C55E] text-white',
      'in_use': 'bg-yellow-500 text-white',
      'maintenance': 'bg-orange-500 text-white',
      'retired': 'bg-gray-500 text-white',
    };
    return colors[status] || 'bg-gray-500 text-white';
  };

  const getOwnershipColor = (type: string) => {
    return type === 'owned' 
      ? 'bg-[#22C55E] text-white' 
      : 'bg-blue-500 text-white';
  };

  const getStatusDisplay = (status: string) => {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <ConstructionPageShell title="Equipment Details" subtitle="Loading equipment information…" loading />
    );
  }

  if (!equipment) {
    return (
      <ConstructionPageShell title="Equipment Not Found" subtitle="This equipment could not be loaded">
        <div className={`${constructionCardClass} p-12 text-center`}>
          <p className="text-gray-500">Equipment not found</p>
          <Link
            href="/dashboard/construction/equipment"
            className="mt-4 inline-block text-[#22C55E] hover:text-[#16A34A]"
          >
            Back to Equipment
          </Link>
        </div>
      </ConstructionPageShell>
    );
  }

  return (
    <ConstructionPageShell
      title={equipment.name}
      subtitle={equipment.equipment_type}
      action={
        <div className="flex gap-2">
          <Link href={`/dashboard/construction/equipment/${equipmentId}/edit`}>
            <Button size="sm" className="h-9 bg-[#22C55E] hover:bg-[#16A34A] text-white">
              Edit Equipment
            </Button>
          </Link>
          <Button
            size="sm"
            variant="destructive"
            className="h-9"
            onClick={() => setDeleteModalOpen(true)}
          >
            Delete
          </Button>
        </div>
      }
    >
      <Link
        href="/dashboard/construction/equipment"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 -mt-2"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Equipment
      </Link>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className={`${constructionCardClass} p-6`}>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Equipment Details</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Equipment Name</p>
              <p className="font-medium text-gray-900">{equipment.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Type</p>
              <p className="font-medium text-gray-900">{equipment.equipment_type}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Ownership</p>
              <span className={`inline-block px-3 py-1 rounded text-xs font-medium ${getOwnershipColor(equipment.ownership_type)}`}>
                {equipment.ownership_type.toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <span className={`inline-block px-3 py-1 rounded text-xs font-medium ${getStatusColor(equipment.status)}`}>
                {getStatusDisplay(equipment.status)}
              </span>
            </div>
            {equipment.registration_number && (
              <div>
                <p className="text-sm text-gray-500">Registration Number</p>
                <p className="font-medium text-gray-900">{equipment.registration_number}</p>
              </div>
            )}
            {equipment.purchase_date && (
              <div>
                <p className="text-sm text-gray-500">Purchase Date</p>
                <p className="font-medium text-gray-900">
                  <FormattedDate value={equipment.purchase_date} />
                </p>
              </div>
            )}
          </div>
          </div>

          <div className={`${constructionCardClass} p-6`}>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Financial Information</h2>
          <div className="space-y-3">
            {equipment.ownership_type === 'owned' && equipment.purchase_cost && (
              <div>
                <p className="text-sm text-gray-500">Purchase Cost</p>
                <p className="text-xl font-bold text-[#22C55E]">{formatNPR(equipment.purchase_cost)}</p>
              </div>
            )}
            {equipment.ownership_type === 'rented' && equipment.rental_cost_per_day && (
              <div>
                <p className="text-sm text-gray-500">Rental Cost Per Day</p>
                <p className="text-xl font-bold text-[#22C55E]">{formatNPR(equipment.rental_cost_per_day)}</p>
              </div>
            )}
            {equipment.assigned_site_name && (
              <div>
                <p className="text-sm text-gray-500">Assigned Site</p>
                <p className="font-medium text-gray-900">{equipment.assigned_site_name}</p>
              </div>
            )}
            {equipment.notes && (
              <div>
                <p className="text-sm text-gray-500">Notes</p>
                <p className="font-medium text-gray-900">{equipment.notes}</p>
              </div>
            )}
          </div>
          </div>
        </div>

        <div className={`${constructionCardClass} p-6`}>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Record Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Created At</p>
              <p className="font-medium text-gray-900">{new Date(equipment.created_at).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Last Updated</p>
              <p className="font-medium text-gray-900">{new Date(equipment.updated_at).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Equipment</h3>
                <p className="text-sm text-gray-500">This action cannot be undone</p>
              </div>
            </div>
            
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete <span className="font-semibold">{equipment.name}</span>? 
              This will permanently remove the equipment and all associated data.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModalOpen(false)}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {deleting && (
                  <KhataSpinner variant="onPrimary" />
                )}
                {deleting ? 'Deleting...' : 'Delete Equipment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConstructionPageShell>
  );
}
