"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"
import { DateInput } from "@/components/shared/DateInput";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { HRPageShell, hrCardClass } from "@/components/dashboard/HRPageShell";
import toast from "react-hot-toast";
import { createEmployee, getDepartments, type Department, type EmployeeFormData } from "@/lib/api/hr";
import { isAtLeastAge, maxBirthDateForMinAge } from "@/lib/dates";

const MIN_EMPLOYEE_AGE = 18;
const MAX_EMPLOYEE_DOB = maxBirthDateForMinAge(MIN_EMPLOYEE_AGE);

const STEPS = [
  { id: 1, name: "Personal", key: "personal" },
  { id: 2, name: "Employment", key: "employment" },
  { id: 3, name: "Salary", key: "salary" },
  { id: 4, name: "Documents", key: "documents" },
  { id: 5, name: "Access", key: "access" },
];

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

export default function NewEmployeePage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [formData, setFormData] = useState<EmployeeFormData>({
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
  });

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    try {
      const data = await getDepartments();
      setDepartments(data);
    } catch (error) {
      console.error('Failed to load departments:', error);
      toast.error("Failed to load departments");
    }
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!formData.name || !formData.dob || !formData.gender || !formData.phone || !formData.email) {
          toast.error("Please fill in all personal information fields");
          return false;
        }
        if (!isAtLeastAge(formData.dob, MIN_EMPLOYEE_AGE)) {
          toast.error(`Employee must be at least ${MIN_EMPLOYEE_AGE} years old`);
          return false;
        }
        return true;
      case 2:
        if (departments.length === 0) {
          toast.error("Create a department before adding employees");
          return false;
        }
        if (!formData.department || !formData.designation || !formData.employment_type || !formData.join_date) {
          toast.error("Please fill in all employment details");
          return false;
        }
        return true;
      case 3:
        if (!formData.basic_salary || Number(formData.basic_salary) <= 0) {
          toast.error("Please enter a valid salary amount");
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) {
      toast.error("Please complete all required steps");
      return;
    }
    
    setLoading(true);

    try {
      const payload = {
        ...formData,
        basic_salary: Number(formData.basic_salary),
        status: 'active',
      };
      
      await createEmployee(payload);

      toast.success("Employee created successfully");
      router.push("/dashboard/hr/employees");
    } catch (error: any) {
      console.error('Failed to create employee:', error);
      
      if (error.response?.data) {
        const errorData = error.response.data;
        
        if (typeof errorData === 'object') {
          Object.entries(errorData).forEach(([field, messages]) => {
            const errorMsg = Array.isArray(messages) ? messages.join(', ') : messages;
            toast.error(`${field}: ${errorMsg}`);
          });
        } else {
          toast.error(errorData.message || "Failed to create employee");
        }
      } else {
        toast.error("Failed to create employee");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <HRPageShell title="Add New Employee" subtitle="Create a new employee record">
      <div className={`${hrCardClass} p-6 lg:p-8 w-full`}>
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {STEPS.map((step, index) => (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                      currentStep > step.id 
                        ? 'bg-[#22C55E] border-[#22C55E] text-white' 
                        : currentStep === step.id 
                        ? 'bg-[#22C55E] border-[#22C55E] text-white' 
                        : 'bg-white border-gray-300 text-gray-400'
                    }`}>
                      {currentStep > step.id ? <Check className="h-5 w-5" /> : step.id}
                    </div>
                    <span className={`mt-2 text-xs font-medium ${
                      currentStep >= step.id ? 'text-gray-900' : 'text-gray-400'
                    }`}>
                      {step.name}
                    </span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className={`h-0.5 flex-1 mx-2 transition-colors ${
                      currentStep > step.id ? 'bg-[#22C55E]' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            onKeyDown={(e) => {
              if (e.key === "Enter" && currentStep < STEPS.length) {
                e.preventDefault();
              }
            }}
            className="space-y-6"
          >
            {currentStep === 1 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2 mb-4">Personal Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="name" className="text-sm font-medium text-gray-700">Full Name*</Label>
                    <Input 
                      id="name" 
                      placeholder="Enter full name" 
                      value={formData.name} 
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                      className="mt-1 h-9 border-gray-200" 
                    />
                  </div>
                  <div>
                    <Label htmlFor="dob" className="text-sm font-medium text-gray-700">Date of Birth (18+)*</Label>
                    <DateInput 
                      id="dob" 
                      value={formData.dob} 
                      onChange={(date) => setFormData({ ...formData, dob: date})} 
                      max={MAX_EMPLOYEE_DOB}
                      className="mt-1 h-9 border-gray-200" 
                    />
                  </div>
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
                    />
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
                    />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2 mb-4">Employment Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="department" className="text-sm font-medium text-gray-700">Department*</Label>
                    <Select value={formData.department || ""} onValueChange={(v) => setFormData({ ...formData, department: v || "" })}>
                      <SelectTrigger className="mt-1 h-9 border-gray-200"><SelectValue placeholder="Select department" /></SelectTrigger>
                      <SelectContent>
                        {departments.map((d) => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {departments.length === 0 && (
                      <p className="mt-1 text-xs text-amber-600">
                        No departments found.{" "}
                        <Link href="/dashboard/hr/departments/new" className="underline font-medium">
                          Create a department first
                        </Link>
                        .
                      </p>
                    )}
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
                    />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2 mb-4">Salary Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="salary" className="text-sm font-medium text-gray-700">Basic Salary (Rs.)*</Label>
                    <Input 
                      id="salary" 
                      type="number" 
                      placeholder="Enter salary" 
                      value={formData.basic_salary || ''} 
                      onChange={(e) => setFormData({ ...formData, basic_salary: Number(e.target.value) })} 
                      className="mt-1 h-9 border-gray-200" 
                    />
                  </div>
                </div>
                <div className="mt-4 bg-green-50 border border-green-100 rounded-lg p-4 w-full">
                  <p className="text-sm text-green-700">PF (Provident Fund): 10% employee + 10% employer</p>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2 mb-4">Documents</h3>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center w-full">
                  <p className="text-sm text-gray-600">Document uploads can be added after employee creation.</p>
                  <p className="text-xs text-gray-500 mt-2">You can upload documents like ID proof, certificates, etc. from the employee profile page.</p>
                </div>
              </div>
            )}

            {currentStep === 5 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2 mb-4">System Access</h3>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center w-full">
                  <p className="text-sm text-gray-600">System login access can be configured after employee creation.</p>
                  <p className="text-xs text-gray-500 mt-2">You can grant system access and assign roles from the employee profile page.</p>
                </div>
              </div>
            )}

            <div className="flex justify-between gap-3 pt-4 border-t border-gray-100">
              <div>
                {currentStep > 1 && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handlePrevious}
                    disabled={loading}
                  >
                    Previous
                  </Button>
                )}
              </div>
              <div className="flex gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => router.back()} 
                  disabled={loading}
                >
                  Cancel
                </Button>
                {currentStep < STEPS.length ? (
                  <Button 
                    type="button" 
                    onClick={handleNext}
                    className="bg-[#22C55E] hover:bg-[#16A34A] text-white"
                    disabled={loading}
                  >
                    Next
                  </Button>
                ) : (
                  <Button 
                    type="submit" 
                    className="bg-[#22C55E] hover:bg-[#16A34A] text-white" 
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save Employee'}
                  </Button>
                )}
              </div>
            </div>
          </form>
      </div>
    </HRPageShell>
  );
}
