"use client";

import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import { DashHeader } from "@/components/dashboard/dash-header";
import { getHRReports, HRReports } from "@/lib/api/hr";
import toast from "react-hot-toast";

export default function HRReportsPage() {
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<HRReports | null>(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const data = await getHRReports();
      setReports(data);
    } catch (error: any) {
      toast.error("Failed to load HR reports");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="HR Reports" subtitle="Employee and payroll analytics" />
        <div className="flex-1 p-6 flex items-center justify-center">
          <p className="text-gray-500">Loading reports...</p>
        </div>
      </div>
    );
  }

  if (!reports) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="HR Reports" subtitle="Employee and payroll analytics" />
        <div className="flex-1 p-6 flex items-center justify-center">
          <p className="text-gray-500">No data available</p>
        </div>
      </div>
    );
  }

  const departmentData = reports.department_data.map(d => ({
    name: d.name,
    employees: d.employee_count
  }));

  const attendanceData = reports.attendance_trend;

  const employmentTypeData = reports.employment_type_data.map(e => ({
    type: e.employment_type,
    count: e.count,
    percentage: e.percentage
  }));

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title="HR Reports" subtitle="Employee and payroll analytics" />
      <div className="flex-1 p-6 space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <p className="text-xs text-gray-500 font-medium">Total Employees</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{reports.summary.total_employees}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <p className="text-xs text-gray-500 font-medium">Active Employees</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{reports.summary.active_employees}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <p className="text-xs text-gray-500 font-medium">On Leave</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{reports.summary.on_leave}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <p className="text-xs text-gray-500 font-medium">Avg Salary</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">Rs. {Math.round(reports.summary.avg_salary).toLocaleString()}</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Employees by Department</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={departmentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="employees" fill="#22C55E" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Attendance Rate Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => `${value}%`} />
                <Line type="monotone" dataKey="rate" stroke="#22C55E" strokeWidth={2} dot={{ fill: "#22C55E" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Employment Type Distribution */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Employment Type Distribution</h3>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Employment Type", "Count", "Percentage"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {employmentTypeData.map((type) => (
                <tr key={type.type} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-medium text-gray-900">{type.type}</td>
                  <td className="px-4 py-3 text-gray-600">{type.count}</td>
                  <td className="px-4 py-3 text-gray-600">{type.percentage}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
