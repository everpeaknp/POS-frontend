'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { inventoryApi, BulkPricing } from '@/lib/api/inventory';
import { formatNPR } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function HardwareBulkPricingPage() {
  const [pricingRules, setPricingRules] = useState<BulkPricing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPricingRules();
  }, []);

  const fetchPricingRules = async () => {
    try {
      setLoading(true);
      const response = await inventoryApi.bulkPricing.list();
      // Handle paginated response
      const data = response.data;
      const rules = Array.isArray(data) ? data : (data.results || []);
      setPricingRules(rules);
    } catch (error: any) {
      console.error('Failed to fetch bulk pricing:', error);
      toast.error('Failed to load bulk pricing rules');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, productName?: string) => {
    if (!confirm(`Are you sure you want to delete this pricing rule${productName ? ` for ${productName}` : ''}?`)) return;

    try {
      await inventoryApi.bulkPricing.delete(Number(id));
      toast.success('Pricing rule deleted successfully');
      setPricingRules(pricingRules.filter(p => String(p.id) !== id));
    } catch (error: any) {
      console.error('Failed to delete pricing rule:', error);
      toast.error('Failed to delete pricing rule');
    }
  };

  const filteredRules = pricingRules.filter((rule) =>
    rule.product_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hardware Bulk Pricing</h1>
          <p className="mt-1 text-sm text-gray-600">
            Configure volume-based pricing tiers for hardware products
          </p>
        </div>
        <Link
          href="/dashboard/hardware/bulk-pricing/new"
          className="inline-flex items-center px-4 py-2 bg-[#22C55E] text-white rounded-lg hover:bg-[#16A34A] transition-colors font-medium"
        >
          + New Pricing Rule
        </Link>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow p-4">
        <input
          type="text"
          placeholder="Search by product name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#22C55E] focus:border-transparent"
        />
      </div>

      {/* Pricing Rules Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Min Quantity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Max Quantity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Unit Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Discount %
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#22C55E]"></div>
                  </div>
                </td>
              </tr>
            ) : filteredRules.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  No bulk pricing rules found
                </td>
              </tr>
            ) : (
              filteredRules.map((rule) => (
                <tr key={rule.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{rule.product_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{rule.min_quantity}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {rule.max_quantity || 'Unlimited'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{formatNPR(rule.unit_price)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{rule.discount_percent}%</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(String(rule.id), rule.product_name);
                      }}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
