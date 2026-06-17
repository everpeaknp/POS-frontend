"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { DashHeader } from "@/components/dashboard/dash-header";
import toast from "react-hot-toast";
import { createEmployee, getDepartments, type Department, type EmployeeFormData } from "@/lib/api/hr";

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
      case 1: // Personal
        if (!formData.name || !formData.dob || !formData.gender || !formData.phone || !formData.email) {
          toast.error("Please fill in all personal information fields");
          return false;
        }
        return true;
      case 2: // Employment
        if (!formData.department || !formData.designation || !formData.employment_type || !formData.join_date) {
          toast.error("Please fill in all employment details");
          return false;
        }
        return true;
      case 3: // Salary
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
    
    // Validate all required fields
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
      
      console.log('Submitting employee data:', payload);
      
      await createEmployee(payload);

      toast.success("Employee created successfully");
      router.push("/dashboard/hr/employees");
    } catch (error: any) {
      console.error('Failed to create employee:', error);
      
      // Show detailed validation errors
      if (error.response?.data) {
        const errorData = error.response.data;
        console.log('Validation errors:', errorData);
        
        // Display field-specific errors
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
    <div className="flex flex-col min-h-full">
      <DashHeader title="Add New Employee" subtitle="Create a new employee record" />
      <div className="flex-1 p-6">
        <Link href="/dashboard/hr/employees" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to Employees
        </Link>

        <div className="max-w-4xl bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          {/* Step Indicator */}
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

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Personal Information */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                <div className="grid grid-cols-2 gap-4">
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
                    <Label htmlFor="dob" className="text-sm font-medium text-gray-700">Date of Birth*</Label>
                    <Input 
                      id="dob" 
                      type="date" 
                      value={formData.dob} 
                      onChange={(e) => setFormData({ ...formData, dob: e.target.value })} 
                      className="mt-1 h-9 border-gray-200" 
                    />
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
                  />
                </div>
              </div>
            )}

            {/* Step 2: Employment Details */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Employment Details</h3>
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
                    <Input 
                      id="joinDate" 
                      type="date" 
                      value={formData.join_date} 
                      onChange={(e) => setFormData({ ...formData, join_date: e.target.value })} 
                      className="mt-1 h-9 border-gray-200" 
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Salary Information */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Salary Information</h3>
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
                <div className="bg-green-50 border border-green-100 rounded-lg p-4">
                  <p className="text-sm text-green-700">PF (Provident Fund): 10% employee + 10% employer</p>
                </div>
              </div>
            )}

            {/* Step 4: Documents */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Documents</h3>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                  <p className="text-sm text-gray-600">Document uploads can be added after employee creation.</p>
                  <p className="text-xs text-gray-500 mt-2">You can upload documents like ID proof, certificates, etc. from the employee profile page.</p>
                </div>
              </div>
            )}

            {/* Step 5: Access */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">System Access</h3>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                  <p className="text-sm text-gray-600">System login access can be configured after employee creation.</p>
                  <p className="text-xs text-gray-500 mt-2">You can grant system access and assign roles from the employee profile page.</p>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between gap-3 pt-6 border-t border-gray-100">
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
      </div>
    </div>
  );
}
