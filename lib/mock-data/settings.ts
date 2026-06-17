// Settings Mock Data

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string | null;
  lastActive: string | null;
  status: "active" | "invited" | "inactive";
}

export interface Role {
  id: string;
  name: string;
  color: string;
  description: string;
  usersCount: number;
  permissionsCount: string;
  createdAt: string;
}

export interface Integration {
  id: string;
  name: string;
  category: string;
  description: string;
  status: "connected" | "not_connected" | "coming_soon";
  icon: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  userId: string;
  action: string;
  module: string;
  record: string | null;
  description: string;
  ip: string;
  device: string;
  before: any;
  after: any;
}

export const mockOrgSettings = {
  name: "FashionNep",
  legalName: "FashionNep Pvt. Ltd.",
  type: "Pvt. Ltd.",
  industry: "Retail - Fashion",
  email: "info@fashionnep.com",
  phone: "01-4123456",
  supportEmail: "support@fashionnep.com",
  supportPhone: "01-4123457",
  website: "www.fashionnep.com",
  establishedDate: "2079-04-01",
  pan: "123456789",
  vatNumber: "123456789",
  vatRegistrationDate: "2079-04-01",
  registrationNumber: "12345/078/079",
  registrationDate: "2079-04-01",
  province: "Bagmati",
  district: "Kathmandu",
  city: "Kathmandu Metropolitan City",
  ward: "10",
  street: "New Road, Kathmandu",
  fiscalYearStart: "Shrawan",
  fiscalYearEnd: "Ashadh",
  currentFiscalYear: "2081/82",
  accountingMethod: "Accrual",
  currency: "NPR",
  dateFormat: "YYYY-MM-DD",
  numberFormat: "Nepali",
  language: "English",
  timezone: "Asia/Kathmandu",
  theme: "Light",
  primaryColor: "#22C55E",
};

export const mockUsers: User[] = [
  {
    id: "U001",
    name: "Admin User",
    email: "admin@fashionnep.com",
    role: "Admin",
    department: "Management",
    lastActive: "2082-01-11 22:45",
    status: "active",
  },
  {
    id: "U002",
    name: "Ram Sharma",
    email: "ram@fashionnep.com",
    role: "Manager",
    department: "Operations",
    lastActive: "2082-01-11 21:30",
    status: "active",
  },
  {
    id: "U003",
    name: "Sita Thapa",
    email: "sita@fashionnep.com",
    role: "Cashier",
    department: "Sales",
    lastActive: "2082-01-11 18:00",
    status: "active",
  },
  {
    id: "U004",
    name: "Hari KC",
    email: "hari@fashionnep.com",
    role: "Accountant",
    department: "Finance",
    lastActive: "2082-01-10 17:00",
    status: "active",
  },
  {
    id: "U005",
    name: "New Invite",
    email: "newuser@fashionnep.com",
    role: "Viewer",
    department: null,
    lastActive: null,
    status: "invited",
  },
];

export const mockRoles: Role[] = [
  {
    id: "R001",
    name: "Admin",
    color: "purple",
    description: "Full access to all modules",
    usersCount: 1,
    permissionsCount: "All",
    createdAt: "2079-04-01",
  },
  {
    id: "R002",
    name: "Manager",
    color: "blue",
    description: "Access to most modules, no settings",
    usersCount: 1,
    permissionsCount: "42/50",
    createdAt: "2079-04-01",
  },
  {
    id: "R003",
    name: "Cashier",
    color: "green",
    description: "POS and sales only",
    usersCount: 1,
    permissionsCount: "12/50",
    createdAt: "2079-04-01",
  },
  {
    id: "R004",
    name: "Accountant",
    color: "amber",
    description: "Accounting and finance access",
    usersCount: 1,
    permissionsCount: "18/50",
    createdAt: "2079-04-01",
  },
  {
    id: "R005",
    name: "Viewer",
    color: "gray",
    description: "Read-only access to reports",
    usersCount: 1,
    permissionsCount: "8/50",
    createdAt: "2082-01-01",
  },
];

export const mockIntegrations: Integration[] = [
  {
    id: "I001",
    name: "eSewa",
    category: "Payments",
    description: "Accept eSewa payments in POS and invoices",
    status: "connected",
    icon: "green",
  },
  {
    id: "I002",
    name: "Khalti",
    category: "Payments",
    description: "Accept Khalti digital wallet payments",
    status: "connected",
    icon: "purple",
  },
  {
    id: "I003",
    name: "ConnectIPS",
    category: "Payments",
    description: "Bank transfer via ConnectIPS",
    status: "not_connected",
    icon: "blue",
  },
  {
    id: "I004",
    name: "fonePay",
    category: "Payments",
    description: "QR payment via fonePay network",
    status: "not_connected",
    icon: "red",
  },
  {
    id: "I005",
    name: "IME Pay",
    category: "Payments",
    description: "Accept IME Pay wallet payments",
    status: "not_connected",
    icon: "amber",
  },
  {
    id: "I006",
    name: "Viber",
    category: "Communication",
    description: "Send bills and notifications via Viber",
    status: "not_connected",
    icon: "blue",
  },
  {
    id: "I007",
    name: "WhatsApp",
    category: "Communication",
    description: "Send receipts via WhatsApp Business",
    status: "not_connected",
    icon: "green",
  },
  {
    id: "I008",
    name: "Gmail",
    category: "Communication",
    description: "Send emails via Gmail",
    status: "connected",
    icon: "red",
  },
  {
    id: "I009",
    name: "Tally",
    category: "Accounting",
    description: "Sync accounting data with Tally",
    status: "coming_soon",
    icon: "blue",
  },
  {
    id: "I010",
    name: "Nepal IRD",
    category: "Accounting",
    description: "Direct VAT filing to IRD system",
    status: "coming_soon",
    icon: "red",
  },
];

export const mockBillingInvoices = [
  {
    id: "BINV-001",
    date: "2082-01-01",
    period: "Poush 2081",
    plan: "Pro Trial",
    amount: 0,
    status: "paid",
  },
  {
    id: "BINV-002",
    date: "2081-12-01",
    period: "Mangsir 2081",
    plan: "Pro Trial",
    amount: 0,
    status: "paid",
  },
];

export const mockAuditLogs: AuditLog[] = [
  {
    id: "AL001",
    timestamp: "2082-01-11 22:45:12",
    user: "Admin User",
    userId: "U001",
    action: "Updated",
    module: "Inventory",
    record: "Product P001",
    description: "Updated selling price from Rs. 800 to Rs. 850",
    ip: "192.168.1.1",
    device: "Desktop",
    before: { sellingPrice: 800 },
    after: { sellingPrice: 850 },
  },
  {
    id: "AL002",
    timestamp: "2082-01-11 21:30:05",
    user: "Ram Sharma",
    userId: "U002",
    action: "Created",
    module: "Sales",
    record: "Invoice INV-0005",
    description: "Created new sales invoice for Ram Sharma — Rs. 24,000",
    ip: "192.168.1.2",
    device: "Desktop",
    before: null,
    after: { invoiceId: "INV-0005", amount: 24000 },
  },
  {
    id: "AL003",
    timestamp: "2082-01-11 18:00:33",
    user: "Sita Thapa",
    userId: "U003",
    action: "Login",
    module: "Auth",
    record: null,
    description: "User logged in successfully",
    ip: "192.168.1.3",
    device: "Mobile",
    before: null,
    after: null,
  },
  {
    id: "AL004",
    timestamp: "2082-01-11 17:45:00",
    user: "Hari KC",
    userId: "U004",
    action: "Export",
    module: "Reports",
    record: "Sales Report",
    description: "Exported Sales Report for Poush 2081 as PDF",
    ip: "192.168.1.4",
    device: "Desktop",
    before: null,
    after: null,
  },
  {
    id: "AL005",
    timestamp: "2082-01-11 16:20:15",
    user: "Admin User",
    userId: "U001",
    action: "Deleted",
    module: "Purchase",
    record: "PO PO-0005",
    description: "Deleted draft purchase order PO-0005",
    ip: "192.168.1.1",
    device: "Desktop",
    before: { poId: "PO-0005", status: "draft" },
    after: null,
  },
];
