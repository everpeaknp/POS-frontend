'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { DashHeader } from '@/components/dashboard/dash-header';
import { constructionApi, MaterialConsumption } from '@/lib/api/construction';
import { formatNPR } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function MaterialConsumptionPage() {
  const [consumptions, setConsumptions] = useState<MaterialConsumption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConsumptions();
  }, []);

  const fetchConsumptions = async () => {
    try {
      setLoading(true);
      const data = await constructionApi.materialConsumption.list();
      setConsumptions(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Failed to fetch material consumption:', error);
      toast.error('Failed to load material consumption records');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <DashHeader title="Material Consumption" subtitle="Track material usage across construction sites" />
      <div className="flex-1 overflow-y-auto p-6 space-y-4 w-full">
        <div className="flex justify-end">
          <Link
            href="/dashboard/construction/consumption/new"
            className="inline-flex items-center px-4 py-2 bg-[#22C55E] text-white rounded-lg hover:bg-[#16A34A] transition-colors font-medium gap-2"
          >
            <Plus className="h-4 w-4" />
            Log Consumption
          </Link>
        </div>

      {/* Consumption List */}
      {loading ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden w-full">
          <div className="animate-pulse p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      ) : consumptions.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center w-full">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No consumption records</h3>
          <p className="mt-1 text-sm text-gray-500">Start logging material consumption for your sites.</p>
          <div className="mt-6">
            <Link
              href="/dashboard/construction/consumption/new"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#22C55E] hover:bg-[#16A34A]"
            >
              + Log Consumption
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden w-full">
          <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Site
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unit Cost
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Cost
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Notes
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {consumptions.map((consumption) => (
                <tr key={consumption.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(consumption.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {consumption.site_name || consumption.site}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {consumption.product_name}
                    </div>
                    {consumption.product_sku && (
                      <div className="text-sm text-gray-500">{consumption.product_sku}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {Number(consumption.quantity).toFixed(2)} {consumption.product_unit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    NPR {Number(consumption.unit_cost).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    NPR {Number(consumption.total_cost).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={consumption.notes || ''}>
                    {consumption.notes || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
