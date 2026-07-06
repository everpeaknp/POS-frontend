'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/EmptyState';
import {
  ConstructionPageShell,
  constructionCardClass,
  constructionTableWrapClass,
  constructionFilterPillActive,
  constructionFilterPillInactive,
} from '@/components/dashboard/ConstructionPageShell';
import { constructionApi, Equipment } from '@/lib/api/construction';
import { formatNPR } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function EquipmentPage() {
  const router = useRouter();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchEquipment();
  }, [filter]);

  const fetchEquipment = async () => {
    try {
      setLoading(true);
      const params = filter !== 'all' ? { status: filter } : {};
      const data = await constructionApi.equipment.list(params);
      setEquipment(Array.isArray(data) ? data : []);
    } catch (error: unknown) {
      console.error('Failed to fetch equipment:', error);
      toast.error('Failed to load equipment');
    } finally {
      setLoading(false);
    }
  };

  const getOwnershipColor = (type: string) => {
    return type === 'owned' ? 'bg-[#22C55E] text-white' : 'bg-blue-500 text-white';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      available: 'bg-[#22C55E] text-white',
      in_use: 'bg-yellow-500 text-white',
      maintenance: 'bg-orange-500 text-white',
      retired: 'bg-gray-500 text-white',
    };
    return colors[status] || 'bg-gray-500 text-white';
  };

  const filterToolbar = (
    <div className="flex flex-wrap gap-2">
      {['all', 'available', 'in_use', 'maintenance'].map((status) => (
        <button
          key={status}
          type="button"
          onClick={() => setFilter(status)}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            filter === status
              ? constructionFilterPillActive
              : constructionFilterPillInactive
          }`}
        >
          {status === 'all'
            ? 'All Equipment'
            : status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
        </button>
      ))}
    </div>
  );

  if (!loading && equipment.length === 0 && filter === 'all') {
    return (
      <ConstructionPageShell
        title="Construction Equipment"
        subtitle="Manage equipment inventory and usage"
        loading={loading}
      >
        <EmptyState
            icon={Wrench}
            title="No equipment"
            description="Get started by adding equipment to your inventory"
            actionLabel="New Equipment"
            actionHref="/dashboard/construction/equipment/new"
          />
      </ConstructionPageShell>
    );
  }

  return (
    <ConstructionPageShell
      title="Construction Equipment"
      subtitle="Manage equipment inventory and usage"
      loading={loading}
      toolbar={filterToolbar}
      action={
        <Link href="/dashboard/construction/equipment/new">
          <Button size="sm" className="h-9 bg-[#22C55E] hover:bg-[#16A34A] text-white gap-1.5">
            <Plus className="h-4 w-4" />
            New Equipment
          </Button>
        </Link>
      }
    >
      {equipment.length === 0 ? (
        <div className={`${constructionCardClass} p-12 text-center`}>
          <p className="text-gray-500">No equipment found</p>
        </div>
      ) : (
        <div className={constructionTableWrapClass}>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Equipment Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ownership
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cost/Day
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned Site
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {equipment.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{item.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.equipment_type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${getOwnershipColor(item.ownership_type)}`}
                      >
                        {item.ownership_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(item.status)}`}
                      >
                        {item.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.ownership_type === 'rented' && item.rental_cost_per_day
                        ? formatNPR(item.rental_cost_per_day)
                        : item.purchase_cost
                          ? formatNPR(item.purchase_cost)
                          : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.assigned_site_name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.registration_number || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => router.push(`/dashboard/construction/equipment/${item.id}`)}
                        className="text-[#22C55E] hover:text-[#16A34A] mr-3"
                      >
                        View
                      </button>
                      <button
                        onClick={() => router.push(`/dashboard/construction/equipment/${item.id}/edit`)}
                        className="text-[#22C55E] hover:text-[#16A34A]"
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
      )}
    </ConstructionPageShell>
  );
}
