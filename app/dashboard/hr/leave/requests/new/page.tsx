"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DashHeader } from "@/components/dashboard/dash-header";
import { getLeaveTypes, createLeaveRequest, type LeaveType } from "@/lib/api/hr";
import toast from "react-hot-toast";

export default function NewLeaveRequestPage() {
  const router = useRouter();
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    leave_type: "",
    start_date: "",
    end_date: "",
    reason: "",
  });

  useEffect(() => {
    loadLeaveTypes();
  }, []);

  const loadLeaveTypes = async () => {
    try {
      setLoading(true);
      const data = await getLeaveTypes();
      setLeaveTypes(data.results || []);
    } catch (error) {
      console.error('Failed to load leave types:', error);
      toast.error("Failed to load leave types");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.leave_type || !formData.start_date || !formData.end_date || !formData.reason) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setSubmitting(true);
      
      await createLeaveRequest({
        leave_type: formData.leave_type,
        start_date: formData.start_date,
        end_date: formData.end_date,
        reason: formData.reason,
      });

      toast.success("Leave request submitted successfully");
      router.push("/dashboard/hr/leave");
    } catch (error: any) {
      console.error('Failed to submit leave request:', error);
      
      if (error.response?.data) {
        const errors = error.response.data;
        if (typeof errors === 'object') {
          Object.entries(errors).forEach(([field, messages]) => {
            const message = Array.isArray(messages) ? messages[0] : messages;
            toast.error(`${field}: ${message}`);
          });
        } else {
          toast.error(errors.message || "Failed to submit leave request");
        }
      } else {
        toast.error("Failed to submit leave request");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Apply for Leave" subtitle="Submit a new leave request" />
        <div className="flex-1 p-6 flex items-center justify-center">
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title="Apply for Leave" subtitle="Submit a new leave request" />
      <div className="flex-1 p-6">
        <Link href="/dashboard/hr/leave" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to Leave
        </Link>

        <div className="max-w-2xl bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="type" className="text-sm font-medium text-gray-700">Leave Type*</Label>
              <Select 
                value={formData.leave_type} 
                onValueChange={(v) => v && setFormData({ ...formData, leave_type: v })}
                disabled={submitting}
              >
                <SelectTrigger className="mt-1 h-9 border-gray-200"><SelectValue placeholder="Select leave type" /></SelectTrigger>
                <SelectContent>
                  {leaveTypes.map((lt) => (
                    <SelectItem key={lt.id} value={String(lt.id)}>
                      {lt.name} ({lt.days_allowed} days)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="from" className="text-sm font-medium text-gray-700">From Date*</Label>
                <Input 
                  id="from" 
                  type="date" 
                  value={formData.start_date} 
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} 
                  className="mt-1 h-9 border-gray-200" 
                  required 
                  disabled={submitting}
                />
              </div>
              <div>
                <Label htmlFor="to" className="text-sm font-medium text-gray-700">To Date*</Label>
                <Input 
                  id="to" 
                  type="date" 
                  value={formData.end_date} 
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} 
                  className="mt-1 h-9 border-gray-200" 
                  required 
                  disabled={submitting}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="reason" className="text-sm font-medium text-gray-700">Reason*</Label>
              <textarea 
                id="reason"
                placeholder="Enter reason for leave" 
                value={formData.reason} 
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, reason: e.target.value })} 
                className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm min-h-[100px]" 
                required 
                disabled={submitting}
              />
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-100">
              <Button 
                type="submit" 
                className="bg-[#22C55E] hover:bg-[#16A34A] text-white"
                disabled={submitting}
              >
                {submitting ? "Submitting..." : "Submit Request"}
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
