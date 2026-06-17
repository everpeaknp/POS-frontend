// HR Mock Data

export interface Employee {
  id: string;
  name: string;
  designation: string;
  department: string;
  phone: string;
  email: string;
  joinDate: string;
  type: "Full-time" | "Part-time" | "Contract" | "Probation";
  salary: number;
  status: "active" | "inactive" | "on_leave";
}

export interface Department {
  id: string;
  name: string;
  head: string;
  headId: string;
  employeeCount: number;
  subDepts: number;
  color: string;
}

export interface LeaveRequest {
  id: string;
  employee: string;
  employeeId: string;
  type: string;
  from: string;
  to: string;
  days: number;
  reason: string;
  appliedOn: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
}

export interface LeaveType {
  id: string;
  name: string;
  code: string;
  daysPerYear: number;
  carryForward: boolean;
  paid: boolean;
  applicableTo: string;
  minNotice: number;
}

export interface Payroll {
  id: string;
  month: string;
  monthBS: string;
  department: string;
  employees: number;
  grossSalary: number;
  deductions: number;
  netPayroll: number;
  status: "draft" | "processing" | "paid";
}

export const mockEmployees: Employee[] = [
  {
    id: "EMP001",
    name: "Ram Sharma",
    designation: "Store Manager",
    department: "Operations",
    phone: "9841000001",
    email: "ram@fashionnep.com",
    joinDate: "2079-04-01",
    type: "Full-time",
    salary: 45000,
    status: "active",
  },
  {
    id: "EMP002",
    name: "Sita Thapa",
    designation: "Cashier",
    department: "Sales",
    phone: "9841000002",
    email: "sita@fashionnep.com",
    joinDate: "2080-01-15",
    type: "Full-time",
    salary: 28000,
    status: "active",
  },
  {
    id: "EMP003",
    name: "Hari KC",
    designation: "Accountant",
    department: "Finance",
    phone: "9841000003",
    email: "hari@fashionnep.com",
    joinDate: "2079-07-01",
    type: "Full-time",
    salary: 38000,
    status: "active",
  },
  {
    id: "EMP004",
    name: "Gita Rai",
    designation: "Sales Associate",
    department: "Sales",
    phone: "9841000004",
    email: "gita@fashionnep.com",
    joinDate: "2081-04-01",
    type: "Part-time",
    salary: 18000,
    status: "on_leave",
  },
  {
    id: "EMP005",
    name: "Bikash Gurung",
    designation: "IT Support",
    department: "IT",
    phone: "9841000005",
    email: "bikash@fashionnep.com",
    joinDate: "2082-01-01",
    type: "Probation",
    salary: 25000,
    status: "active",
  },
];

export const mockDepartments: Department[] = [
  {
    id: "DEPT001",
    name: "Operations",
    head: "Ram Sharma",
    headId: "EMP001",
    employeeCount: 8,
    subDepts: 2,
    color: "green",
  },
  {
    id: "DEPT002",
    name: "Sales",
    head: "Sita Thapa",
    headId: "EMP002",
    employeeCount: 5,
    subDepts: 0,
    color: "blue",
  },
  {
    id: "DEPT003",
    name: "Finance",
    head: "Hari KC",
    headId: "EMP003",
    employeeCount: 3,
    subDepts: 1,
    color: "purple",
  },
  {
    id: "DEPT004",
    name: "IT",
    head: "Bikash Gurung",
    headId: "EMP005",
    employeeCount: 2,
    subDepts: 0,
    color: "amber",
  },
  {
    id: "DEPT005",
    name: "Admin",
    head: "Gita Rai",
    headId: "EMP004",
    employeeCount: 4,
    subDepts: 0,
    color: "coral",
  },
];

export const mockLeaveRequests: LeaveRequest[] = [
  {
    id: "LR001",
    employee: "Gita Rai",
    employeeId: "EMP004",
    type: "Sick",
    from: "2082-01-08",
    to: "2082-01-10",
    days: 3,
    reason: "Fever and cold",
    appliedOn: "2082-01-07",
    status: "approved",
  },
  {
    id: "LR002",
    employee: "Sita Thapa",
    employeeId: "EMP002",
    type: "Annual",
    from: "2082-01-15",
    to: "2082-01-17",
    days: 3,
    reason: "Family function",
    appliedOn: "2082-01-10",
    status: "pending",
  },
  {
    id: "LR003",
    employee: "Bikash Gurung",
    employeeId: "EMP005",
    type: "Personal",
    from: "2082-01-20",
    to: "2082-01-20",
    days: 1,
    reason: "Personal work",
    appliedOn: "2082-01-11",
    status: "pending",
  },
];

export const mockLeaveTypes: LeaveType[] = [
  {
    id: "LT001",
    name: "Annual Leave",
    code: "AL",
    daysPerYear: 18,
    carryForward: true,
    paid: true,
    applicableTo: "All",
    minNotice: 3,
  },
  {
    id: "LT002",
    name: "Sick Leave",
    code: "SL",
    daysPerYear: 12,
    carryForward: false,
    paid: true,
    applicableTo: "All",
    minNotice: 0,
  },
  {
    id: "LT003",
    name: "Personal Leave",
    code: "PL",
    daysPerYear: 6,
    carryForward: false,
    paid: true,
    applicableTo: "All",
    minNotice: 1,
  },
  {
    id: "LT004",
    name: "Maternity Leave",
    code: "ML",
    daysPerYear: 98,
    carryForward: false,
    paid: true,
    applicableTo: "Female",
    minNotice: 30,
  },
  {
    id: "LT005",
    name: "Paternity Leave",
    code: "PTL",
    daysPerYear: 15,
    carryForward: false,
    paid: true,
    applicableTo: "Male",
    minNotice: 7,
  },
  {
    id: "LT006",
    name: "Mourning Leave",
    code: "BL",
    daysPerYear: 13,
    carryForward: false,
    paid: true,
    applicableTo: "All",
    minNotice: 0,
  },
  {
    id: "LT007",
    name: "Unpaid Leave",
    code: "UL",
    daysPerYear: 999,
    carryForward: false,
    paid: false,
    applicableTo: "All",
    minNotice: 7,
  },
];

export const mockPayrollList: Payroll[] = [
  {
    id: "PR001",
    month: "Poush 2081",
    monthBS: "2081-09",
    department: "All",
    employees: 5,
    grossSalary: 154000,
    deductions: 22000,
    netPayroll: 132000,
    status: "paid",
  },
  {
    id: "PR002",
    month: "Mangsir 2081",
    monthBS: "2081-08",
    department: "All",
    employees: 5,
    grossSalary: 154000,
    deductions: 22000,
    netPayroll: 132000,
    status: "paid",
  },
  {
    id: "PR003",
    month: "Magh 2081",
    monthBS: "2081-10",
    department: "All",
    employees: 5,
    grossSalary: 154000,
    deductions: 22000,
    netPayroll: 132000,
    status: "draft",
  },
];

export const attendanceData = [
  { date: "2082-01-01", employee: "EMP001", status: "present", checkIn: "09:00", checkOut: "17:30" },
  { date: "2082-01-01", employee: "EMP002", status: "present", checkIn: "09:15", checkOut: "17:45" },
  { date: "2082-01-01", employee: "EMP003", status: "absent", checkIn: "", checkOut: "" },
  { date: "2082-01-02", employee: "EMP001", status: "present", checkIn: "09:05", checkOut: "17:30" },
  { date: "2082-01-02", employee: "EMP002", status: "late", checkIn: "09:45", checkOut: "17:45" },
  { date: "2082-01-02", employee: "EMP003", status: "present", checkIn: "09:00", checkOut: "17:30" },
];
