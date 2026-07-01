"use client";

import { DateInput } from "@/components/shared/DateInput";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DashHeader } from "@/components/dashboard/dash-header";
import toast from "react-hot-toast";
import { getEmployees, bulkMarkAttendance, type Employee, type AttendanceRecord } from "@/lib/api/hr";

interface AttendanceFormData {
  [employeeId: string]: {
    status: string;
    check_in: string;
    check_out: string;
    remarks: string;
  };
}

export default function MarkAttendancePage() {
  const router = useRouter();
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<AttendanceFormData>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const data = await getEmployees({ status: 'active' });
      const employeesList = data.results || [];
      setEmployees(employeesList);
      
      // Initialize attendance data with default values
      const initialAttendance: AttendanceFormData = {};
      employeesList.forEach((emp) => {
        initialAttendance[emp.id] = {
          status: 'present',
          check_in: '',
          check_out: '',
          remarks: ''
        };
      });
      setAttendance(initialAttendance);
    } catch (error) {
      console.error('Failed to load employees:', error);
      toast.error("Failed to load employees");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAll = (status: string) => {
    const updatedAttendance = { ...attendance };
    employees.forEach((emp) => {
      updatedAttendance[emp.id] = {
        ...updatedAttendance[emp.id],
        status
      };
    });
    setAttendance(updatedAttendance);
  };

  const updateAttendanceField = (employeeId: string, field: keyof AttendanceFormData[string], value: string) => {
    setAttendance({
      ...attendance,
      [employeeId]: {
        ...attendance[employeeId],
        [field]: value
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      
      // Prepare records for bulk submission
      const records: AttendanceRecord[] = employees.map((emp) => {
        const empAttendance = attendance[emp.id];
        const record: AttendanceRecord = {
          employee: emp.id,
          status: empAttendance.status
        };
        
        if (empAttendance.check_in) record.check_in = empAttendance.check_in;
        if (empAttendance.check_out) record.check_out = empAttendance.check_out;
        if (empAttendance.remarks) record.remarks = empAttendance.remarks;
        
        return record;
      });

      const response = await bulkMarkAttendance({
        date,
        records
      });

      toast.success(response.message || "Attendance marked successfully");
      router.push("/dashboard/hr/attendance");
    } catch (error: any) {
      console.error('Failed to mark attendance:', error);
      
      if (error.response?.data) {
        const errors = error.response.data;
        if (typeof errors === 'object') {
          Object.entries(errors).forEach(([field, messages]) => {
            const message = Array.isArray(messages) ? messages[0] : messages;
            toast.error(`${field}: ${message}`);
          });
        } else {
          toast.error(errors.message || "Failed to mark attendance");
        }
      } else {
        toast.error("Failed to mark attendance");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Mark Attendance" subtitle="Loading..." />
        <div className="flex-1 p-6 flex items-center justify-center">
          <div className="text-gray-500">Loading employees...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title="Mark Attendance" subtitle="Record employee attendance" />
      <div className="flex-1 p-6 space-y-4">
        <Link href="/dashboard/hr/attendance" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4" /> Back to Attendance
        </Link>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="mb-6">
            <label className="text-sm font-medium text-gray-700">Date</label>
            <DateInput value={date} onChange={(date) => setDate(date)} />
          </div>

          <div className="flex gap-3 mb-6">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleMarkAll('present')}
              disabled={submitting}
            >
              Mark All Present
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleMarkAll('absent')}
              disabled={submitting}
            >
              Mark All Absent
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {["Employee", "Department", "Status", "Check-in", "Check-out", "Remarks"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {employees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-medium text-gray-900">{emp.name}</td>
                      <td className="px-4 py-3 text-gray-600">{emp.department_name}</td>
                      <td className="px-4 py-3">
                        <Select 
                          value={attendance[emp.id]?.status || 'present'} 
                          onValueChange={(v) => v && updateAttendanceField(emp.id, 'status', v)}
                          disabled={submitting}
                        >
                          <SelectTrigger className="h-8 w-32 text-xs border-gray-200"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {["present", "absent", "late", "half-day", "leave"].map((s) => (
                              <SelectItem key={s} value={s}>
                                {s.charAt(0).toUpperCase() + s.slice(1).replace('-', ' ')}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-4 py-3">
                        <input 
                          type="time" 
                          value={attendance[emp.id]?.check_in || ''}
                          onChange={(e) => updateAttendanceField(emp.id, 'check_in', e.target.value)}
                          className="h-8 px-2 border border-gray-200 rounded text-xs"
                          disabled={submitting}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input 
                          type="time" 
                          value={attendance[emp.id]?.check_out || ''}
                          onChange={(e) => updateAttendanceField(emp.id, 'check_out', e.target.value)}
                          className="h-8 px-2 border border-gray-200 rounded text-xs"
                          disabled={submitting}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input 
                          type="text" 
                          placeholder="Remarks" 
                          value={attendance[emp.id]?.remarks || ''}
                          onChange={(e) => updateAttendanceField(emp.id, 'remarks', e.target.value)}
                          className="h-8 px-2 border border-gray-200 rounded text-xs w-32"
                          disabled={submitting}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-100">
              <Button 
                type="submit" 
                className="bg-[#22C55E] hover:bg-[#16A34A] text-white"
                disabled={submitting}
              >
                {submitting ? "Saving..." : "Save Attendance"}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => router.back()}
                disabled={submitting}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
