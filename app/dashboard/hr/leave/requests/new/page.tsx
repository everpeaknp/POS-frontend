"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"
import { DateInput } from "@/components/shared/DateInput";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HRPageShell, hrCardClass } from "@/components/dashboard/HRPageShell";
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

  return (
    <HRPageShell
      title="Apply for Leave"
      subtitle="Submit a new leave request"
      variant="fullscreen"
      loading={loading}
    >
      {!loading && (
        <div className={`${hrCardClass} p-6 lg:p-8 w-full min-h-full`}>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2 mb-4">Leave Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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

                <div>
                  <Label htmlFor="from" className="text-sm font-medium text-gray-700">From Date*</Label>
                  <DateInput 
                    id="from" 
                     
                    value={formData.start_date} 
                    onChange={(date) => setFormData({ ...formData, start_date: date})} 
                    className="mt-1 h-9 border-gray-200" 
                    required 
                    disabled={submitting}
                  />
                </div>

                <div>
                  <Label htmlFor="to" className="text-sm font-medium text-gray-700">To Date*</Label>
                  <DateInput 
                    id="to" 
                     
                    value={formData.end_date} 
                    onChange={(date) => setFormData({ ...formData, end_date: date})} 
                    className="mt-1 h-9 border-gray-200" 
                    required 
                    disabled={submitting}
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2 mb-4">Reason</h3>
              <div>
                <Label htmlFor="reason" className="text-sm font-medium text-gray-700">Reason*</Label>
                <textarea 
                  id="reason"
                  placeholder="Enter reason for leave" 
                  value={formData.reason} 
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, reason: e.target.value })} 
                  className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm min-h-[100px] resize-none focus:outline-none focus:ring-2 focus:ring-[#22C55E]" 
                  required 
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => router.back()}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-[#22C55E] hover:bg-[#16A34A] text-white px-6"
                disabled={submitting}
              >
                {submitting ? "Submitting..." : "Submit Request"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </HRPageShell>
  );
}
