'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { customerAPI, Customer } from '@/lib/api/sales';
import { formatNPR } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function HardwareAgingPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await customerAPI.list();
      const customersWithBalance = (response.data.results || []).filter(
        (c: Customer) => (c.current_balance || 0) > 0
      );
      setCustomers(customersWithBalance);
    } catch (error: any) {
      console.error('Failed to fetch customers:', error);
      toast.error('Failed to load aging data');
    } finally {
      setLoading(false);
    }
  };

  const totalOutstanding = customers.reduce((sum, c) => sum + (c.current_balance || 0), 0);
  const totalCreditLimit = customers.reduce((sum, c) => sum + (c.credit_limit || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Hardware Aging Report</h1>
        <p className="mt-1 text-sm text-gray-600">
          Track overdue customer balances and credit utilization
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Total Outstanding</div>
          <div className="text-2xl font-bold text-red-600">{formatNPR(totalOutstanding)}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Total Credit Limit</div>
          <div className="text-2xl font-bold text-gray-900">{formatNPR(totalCreditLimit)}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Customers with Balance</div>
          <div className="text-2xl font-bold text-gray-900">{customers.length}</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Credit Limit</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Outstanding</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Available</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#22C55E]"></div>
                  </div>
                </td>
              </tr>
            ) : customers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  No customers with outstanding balance
                </td>
              </tr>
            ) : (
              customers.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{item.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm text-gray-900">{formatNPR(item.credit_limit || 0)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-medium text-red-600">{formatNPR(item.current_balance || 0)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm text-gray-900">
                      {formatNPR((item.credit_limit || 0) - (item.current_balance || 0))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/dashboard/hardware/customers/${item.id}`);
                      }}
                      className="text-[#22C55E] hover:text-[#16A34A]"
                    >
                      View Details
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
