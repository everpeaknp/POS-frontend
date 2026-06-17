"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DashHeader } from "@/components/dashboard/dash-header";
import toast from "react-hot-toast";
import { createDepartment, getEmployees, type Employee } from "@/lib/api/hr";

export default function NewDepartmentPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    head: "",
    description: "",
  });
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingEmployees, setLoadingEmployees] = useState(true);

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      setLoadingEmployees(true);
      const data = await getEmployees({ status: 'active' });
      setEmployees(data.results || []);
    } catch (error) {
      console.error('Failed to load employees:', error);
      toast.error("Failed to load employees");
    } finally {
      setLoadingEmployees(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("Department name is required");
      return;
    }

    try {
      setLoading(true);
      const payload: any = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
      };

      if (formData.head) {
        payload.head = formData.head;
      }

      await createDepartment(payload);
      toast.success("Department created successfully");
      router.push("/dashboard/hr/departments");
    } catch (error: any) {
      console.error('Failed to create department:', error);
      
      if (error.response?.data) {
        const errors = error.response.data;
        if (typeof errors === 'object') {
          Object.entries(errors).forEach(([field, messages]) => {
            const message = Array.isArray(messages) ? messages[0] : messages;
            toast.error(`${field}: ${message}`);
          });
        } else {
          toast.error(errors.message || "Failed to create department");
        }
      } else {
        toast.error("Failed to create department");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-0">
      <DashHeader title="Add New Department" subtitle="Create a new department for your organization" />
      <div className="p-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 lg:p-8 w-full">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2 mb-4">Department Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="name" className="text-sm font-medium text-gray-700">Department Name*</Label>
                  <Input 
                    id="name" 
                    placeholder="Enter department name" 
                    value={formData.name} 
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                    className="mt-1 h-9 border-gray-200" 
                    required 
                    disabled={loading}
                  />
                </div>

                <div>
                  <Label htmlFor="head" className="text-sm font-medium text-gray-700">Department Head</Label>
                  <Select 
                    value={formData.head} 
                    onValueChange={(v) => setFormData({ ...formData, head: v ?? "" })}
                    disabled={loading || loadingEmployees}
                  >
                    <SelectTrigger className="mt-1 h-9 border-gray-200">
                      <SelectValue placeholder={loadingEmployees ? "Loading employees..." : "Select department head (optional)"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {employees.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.name} - {emp.designation}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2 mb-4">Description</h3>
              <div>
                <Label htmlFor="description" className="text-sm font-medium text-gray-700">Description</Label>
                <textarea 
                  id="description"
                  placeholder="Enter department description" 
                  value={formData.description} 
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, description: e.target.value })} 
                  className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
                  rows={4}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-[#22C55E] hover:bg-[#16A34A] text-white px-6"
                disabled={loading}
              >
                {loading ? "Saving..." : "Save Department"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
