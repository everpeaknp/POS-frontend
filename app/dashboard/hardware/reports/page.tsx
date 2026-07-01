'use client';

import { DateInput } from "@/components/shared/DateInput";
import { useState } from 'react';
import { formatNPR } from '@/lib/utils';

export default function HardwareReportsPage() {
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(1)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Hardware Reports</h1>
        <p className="mt-1 text-sm text-gray-600">
          Comprehensive reports for hardware business operations
        </p>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <DateInput value={dateRange.start} onChange={(date) => setDateRange({ ...dateRange, start: date })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
            <DateInput value={dateRange.end} onChange={(date) => setDateRange({ ...dateRange, end: date })} />
          </div>
        </div>
      </div>

      {/* Report Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Sales Performance</h3>
          <p className="text-sm text-gray-600 mb-4">Hardware sales trends and performance metrics</p>
          <button className="text-[#22C55E] hover:text-[#16A34A] text-sm font-medium">
            View Report →
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Inventory Valuation</h3>
          <p className="text-sm text-gray-600 mb-4">Current stock value and inventory metrics</p>
          <button className="text-[#22C55E] hover:text-[#16A34A] text-sm font-medium">
            View Report →
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Credit Summary</h3>
          <p className="text-sm text-gray-600 mb-4">Outstanding balances and credit utilization</p>
          <button className="text-[#22C55E] hover:text-[#16A34A] text-sm font-medium">
            View Report →
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Top Products</h3>
          <p className="text-sm text-gray-600 mb-4">Best-selling hardware products by revenue</p>
          <button className="text-[#22C55E] hover:text-[#16A34A] text-sm font-medium">
            View Report →
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Payment Collection</h3>
          <p className="text-sm text-gray-600 mb-4">Payment trends and collection efficiency</p>
          <button className="text-[#22C55E] hover:text-[#16A34A] text-sm font-medium">
            View Report →
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Bulk Pricing Analysis</h3>
          <p className="text-sm text-gray-600 mb-4">Volume discount utilization and impact</p>
          <button className="text-[#22C55E] hover:text-[#16A34A] text-sm font-medium">
            View Report →
          </button>
        </div>
      </div>
    </div>
  );
}
