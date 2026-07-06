"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"
import { DateInput } from "@/components/shared/DateInput";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HRPageShell, hrCardClass } from "@/components/dashboard/HRPageShell";
import toast from "react-hot-toast";
import { getEmployee, updateEmployee, getDepartments, type Department, type EmployeeFormData } from "@/lib/api/hr";
import { isAtLeastAge, maxBirthDateForMinAge } from "@/lib/dates";

const MIN_EMPLOYEE_AGE = 18;
const MAX_EMPLOYEE_DOB = maxBirthDateForMinAge(MIN_EMPLOYEE_AGE);

const DESIGNATIONS = [
  { value: "Manager", label: "Manager" },
  { value: "Assistant Manager", label: "Assistant Manager" },
  { value: "Team Leader", label: "Team Leader" },
  { value: "Senior Executive", label: "Senior Executive" },
  { value: "Executive", label: "Executive" },
  { value: "Junior Executive", label: "Junior Executive" },
  { value: "Supervisor", label: "Supervisor" },
  { value: "Officer", label: "Officer" },
  { value: "Senior Officer", label: "Senior Officer" },
  { value: "Accountant", label: "Accountant" },
  { value: "Cashier", label: "Cashier" },
  { value: "Sales Representative", label: "Sales Representative" },
  { value: "Marketing Executive", label: "Marketing Executive" },
  { value: "HR Executive", label: "HR Executive" },
  { value: "IT Support", label: "IT Support" },
  { value: "Developer", label: "Developer" },
  { value: "Senior Developer", label: "Senior Developer" },
  { value: "Designer", label: "Designer" },
  { value: "Analyst", label: "Analyst" },
  { value: "Coordinator", label: "Coordinator" },
  { value: "Assistant", label: "Assistant" },
  { value: "Intern", label: "Intern" },
  { value: "Trainee", label: "Trainee" },
  { value: "Consultant", label: "Consultant" },
  { value: "Specialist", label: "Specialist" },
  { value: "Engineer", label: "Engineer" },
  { value: "Technician", label: "Technician" },
  { value: "Driver", label: "Driver" },
  { value: "Security Guard", label: "Security Guard" },
  { value: "Receptionist", label: "Receptionist" },
  { value: "Clerk", label: "Clerk" },
  { value: "Other", label: "Other" },
];

export default function EditEmployeePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [tab, setTab] = useState("personal");
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    dob: "",
    gender: "",
    phone: "",
    email: "",
    department: "",
    designation: "",
    employment_type: "",
    join_date: "",
    basic_salary: 0,
    status: "active",
  });

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoadingData(true);
      const [employeeData, departmentsData] = await Promise.all([
        getEmployee(id),
        getDepartments()
      ]);
      
      setDepartments(departmentsData);
      setFormData({
        name: employeeData.name || "",
        dob: employeeData.dob || "",
        gender: employeeData.gender || "",
        phone: employeeData.phone || "",
        email: employeeData.email || "",
        department: employeeData.department || "",
        designation: employeeData.designation || "",
        employment_type: employeeData.employment_type || "",
        join_date: employeeData.join_date || "",
        basic_salary: Number(employeeData.basic_salary) || 0,
        status: employeeData.status || "active",
      });
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error("Failed to load employee data");
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name || !formData.dob || !formData.gender || !formData.phone || 
        !formData.email || !formData.department || !formData.designation || 
        !formData.employment_type || !formData.join_date || !formData.basic_salary) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (!isAtLeastAge(formData.dob, MIN_EMPLOYEE_AGE)) {
      toast.error(`Employee must be at least ${MIN_EMPLOYEE_AGE} years old`);
      return;
    }
    
    setLoading(true);

    try {
      const payload = {
        ...formData,
        basic_salary: Number(formData.basic_salary),
      };
      
      await updateEmployee(id, payload);
      toast.success("Employee updated successfully");
      router.push(`/dashboard/hr/employees/${id}`);
    } catch (error: any) {
      console.error('Failed to update employee:', error);
      
      // Show detailed validation errors
      if (error.response?.data) {
        const errorData = error.response.data;
        
        // Display field-specific errors
        if (typeof errorData === 'object') {
          Object.entries(errorData).forEach(([field, messages]) => {
            const errorMsg = Array.isArray(messages) ? messages.join(', ') : messages;
            toast.error(`${field}: ${errorMsg}`);
          });
        } else {
          toast.error(errorData.message || "Failed to update employee");
        }
      } else {
        toast.error("Failed to update employee");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <HRPageShell
      title="Edit Employee"
      subtitle="Update employee information"
      variant="form"
      loading={loadingData}
    >
      <Link href={`/dashboard/hr/employees/${id}`} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 -mt-2">
        <ChevronLeft className="h-4 w-4" /> Back to Employee Profile
      </Link>

      {!loadingData && (
        <div className={`${hrCardClass} p-6`}>
          <Tabs value={tab} onValueChange={setTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5 mb-6">
              <TabsTrigger value="personal">Personal</TabsTrigger>
              <TabsTrigger value="employment">Employment</TabsTrigger>
              <TabsTrigger value="salary">Salary</TabsTrigger>
              <TabsTrigger value="status">Status</TabsTrigger>
              <TabsTrigger value="access">Access</TabsTrigger>
            </TabsList>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Tab */}
              <TabsContent value="personal" className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name" className="text-sm font-medium text-gray-700">Full Name*</Label>
                    <Input 
                      id="name" 
                      placeholder="Enter full name" 
                      value={formData.name} 
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                      className="mt-1 h-9 border-gray-200" 
                      required 
                    />
                  </div>
                  <div>
                    <Label htmlFor="dob" className="text-sm font-medium text-gray-700">Date of Birth*</Label>
                    <DateInput 
                      id="dob" 
                      value={formData.dob} 
                      onChange={(date) => setFormData({ ...formData, dob: date})} 
                      max={MAX_EMPLOYEE_DOB}
                      className="mt-1 h-9 border-gray-200" 
                      required 
                    />
                    <p className="text-xs text-gray-500 mt-1">Employee must be at least {MIN_EMPLOYEE_AGE} years old</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="gender" className="text-sm font-medium text-gray-700">Gender*</Label>
                    <Select value={formData.gender || ""} onValueChange={(v) => setFormData({ ...formData, gender: v || "" })}>
                      <SelectTrigger className="mt-1 h-9 border-gray-200"><SelectValue placeholder="Select gender" /></SelectTrigger>
                      <SelectContent>
                        {["Male", "Female", "Other"].map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="phone" className="text-sm font-medium text-gray-700">Phone*</Label>
                    <Input 
                      id="phone" 
                      placeholder="Enter phone number" 
                      value={formData.phone} 
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })} 
                      className="mt-1 h-9 border-gray-200" 
                      required 
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email*</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="Enter email" 
                    value={formData.email} 
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                    className="mt-1 h-9 border-gray-200" 
                    required 
                  />
                </div>
              </TabsContent>

              {/* Employment Tab */}
              <TabsContent value="employment" className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="department" className="text-sm font-medium text-gray-700">Department*</Label>
                    <Select value={formData.department || ""} onValueChange={(v) => setFormData({ ...formData, department: v || "" })}>
                      <SelectTrigger className="mt-1 h-9 border-gray-200"><SelectValue placeholder="Select department" /></SelectTrigger>
                      <SelectContent>
                        {departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="designation" className="text-sm font-medium text-gray-700">Designation*</Label>
                    <Combobox
                      options={DESIGNATIONS}
                      value={formData.designation || ""}
                      onValueChange={(v) => setFormData({ ...formData, designation: v })}
                      placeholder="Search designation..."
                      emptyText="No designation found"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="type" className="text-sm font-medium text-gray-700">Employment Type*</Label>
                    <Select value={formData.employment_type || ""} onValueChange={(v) => setFormData({ ...formData, employment_type: v || "" })}>
                      <SelectTrigger className="mt-1 h-9 border-gray-200"><SelectValue placeholder="Select type" /></SelectTrigger>
                      <SelectContent>
                        {["Full-time", "Part-time", "Contract", "Probation"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="joinDate" className="text-sm font-medium text-gray-700">Join Date*</Label>
                    <DateInput 
                      id="joinDate" 
                       
                      value={formData.join_date} 
                      onChange={(date) => setFormData({ ...formData, join_date: date})} 
                      className="mt-1 h-9 border-gray-200" 
                      required 
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Salary Tab */}
              <TabsContent value="salary" className="space-y-6">
                <div>
                  <Label htmlFor="salary" className="text-sm font-medium text-gray-700">Basic Salary (Rs.)*</Label>
                  <Input 
                    id="salary" 
                    type="number" 
                    placeholder="Enter salary" 
                    value={formData.basic_salary || ''} 
                    onChange={(e) => setFormData({ ...formData, basic_salary: Number(e.target.value) })} 
                    className="mt-1 h-9 border-gray-200" 
                    required 
                  />
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                  <p className="text-sm text-blue-700">PF (Provident Fund): 10% employee + 10% employer</p>
                  <p className="text-sm text-blue-700 mt-1">
                    Current PF: Rs. {(Number(formData.basic_salary) * 0.1).toLocaleString()} (Employee) + 
                    Rs. {(Number(formData.basic_salary) * 0.1).toLocaleString()} (Employer)
                  </p>
                </div>
              </TabsContent>

              {/* Status Tab */}
              <TabsContent value="status" className="space-y-6">
                <div>
                  <Label htmlFor="status" className="text-sm font-medium text-gray-700">Employment Status*</Label>
                  <Select value={formData.status || ""} onValueChange={(v) => setFormData({ ...formData, status: v || "" })}>
                    <SelectTrigger className="mt-1 h-9 border-gray-200"><SelectValue placeholder="Select status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="on_leave">On Leave</SelectItem>
                      <SelectItem value="terminated">Terminated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

              {/* Access Tab */}
              <TabsContent value="access" className="space-y-6">
                <div className="text-sm text-gray-600">System login access can be configured separately.</div>
              </TabsContent>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <Button type="submit" className="bg-[#22C55E] hover:bg-[#16A34A] text-white" disabled={loading}>
                  {loading ? 'Updating...' : 'Update Employee'}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
                  Cancel
                </Button>
              </div>
            </form>
          </Tabs>
        </div>
      )}
    </HRPageShell>
  );
}
