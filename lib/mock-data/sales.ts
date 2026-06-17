export const mockCustomers = [
  { id: "C001", name: "Ram Sharma", phone: "9841000001", email: "ram@email.com", pan: "123456789", address: "Kathmandu, Bagmati", totalOrders: 12, totalSpent: 485200, status: "active", type: "Individual", creditLimit: 100000, paymentTerms: "Net 30" },
  { id: "C002", name: "Sita Thapa", phone: "9841000002", email: "sita@email.com", pan: "987654321", address: "Pokhara, Gandaki", totalOrders: 7, totalSpent: 128000, status: "active", type: "Business", creditLimit: 200000, paymentTerms: "Net 15" },
  { id: "C003", name: "Hari KC", phone: "9841000003", email: "hari@email.com", pan: "456789123", address: "Butwal, Lumbini", totalOrders: 3, totalSpent: 52000, status: "inactive", type: "Individual", creditLimit: 50000, paymentTerms: "Immediate" },
  { id: "C004", name: "Gita Rai", phone: "9841000004", email: "gita@email.com", pan: "321654987", address: "Biratnagar, Koshi", totalOrders: 9, totalSpent: 210000, status: "active", type: "Business", creditLimit: 150000, paymentTerms: "Net 30" },
  { id: "C005", name: "Bikash Magar", phone: "9841000005", email: "bikash@email.com", pan: "654321789", address: "Dharan, Koshi", totalOrders: 5, totalSpent: 87500, status: "active", type: "Individual", creditLimit: 75000, paymentTerms: "Net 15" },
];

export const mockProducts = [
  { id: "P001", name: "Cotton Kurta", unit: "Pcs", price: 1200, tax: 13 },
  { id: "P002", name: "Silk Saree", unit: "Pcs", price: 4500, tax: 13 },
  { id: "P003", name: "Denim Jacket", unit: "Pcs", price: 3200, tax: 13 },
  { id: "P004", name: "Woolen Shawl", unit: "Pcs", price: 2800, tax: 13 },
  { id: "P005", name: "Linen Shirt", unit: "Pcs", price: 1800, tax: 13 },
  { id: "P006", name: "Embroidered Dupatta", unit: "Pcs", price: 950, tax: 13 },
];

export interface LineItem {
  id: string;
  product: string;
  description: string;
  qty: number;
  unit: string;
  unitPrice: number;
  discount: number;
  tax: number;
  amount: number;
}

export const mockSalesOrders = [
  { id: "SO-0001", date: "2082-01-10", customer: "Ram Sharma", customerId: "C001", items: 3, total: 24000, status: "Delivered", reference: "PO-101" },
  { id: "SO-0002", date: "2082-01-09", customer: "Sita Thapa", customerId: "C002", items: 1, total: 18000, status: "Confirmed", reference: "" },
  { id: "SO-0003", date: "2082-01-08", customer: "Hari KC", customerId: "C003", items: 5, total: 52000, status: "Draft", reference: "PO-102" },
  { id: "SO-0004", date: "2082-01-07", customer: "Gita Rai", customerId: "C004", items: 2, total: 9600, status: "Confirmed", reference: "" },
  { id: "SO-0005", date: "2082-01-06", customer: "Bikash Magar", customerId: "C005", items: 4, total: 31200, status: "Cancelled", reference: "PO-103" },
];

export const mockQuotations = [
  { id: "QT-0001", date: "2082-01-10", customer: "Ram Sharma", validUntil: "2082-01-25", amount: 24000, status: "Accepted" },
  { id: "QT-0002", date: "2082-01-08", customer: "Sita Thapa", validUntil: "2082-01-23", amount: 18000, status: "Sent" },
  { id: "QT-0003", date: "2082-01-05", customer: "Hari KC", validUntil: "2082-01-20", amount: 52000, status: "Expired" },
  { id: "QT-0004", date: "2082-01-03", customer: "Gita Rai", validUntil: "2082-01-18", amount: 9600, status: "Draft" },
];

export const mockInvoices = [
  { id: "INV-0001", date: "2082-01-10", dueDate: "2082-01-25", customer: "Ram Sharma", amount: 24000, paid: 24000, balance: 0, status: "Paid" },
  { id: "INV-0002", date: "2082-01-09", dueDate: "2082-01-24", customer: "Sita Thapa", amount: 18000, paid: 0, balance: 18000, status: "Overdue" },
  { id: "INV-0003", date: "2082-01-08", dueDate: "2082-02-08", customer: "Hari KC", amount: 52000, paid: 20000, balance: 32000, status: "Partially Paid" },
  { id: "INV-0004", date: "2082-01-07", dueDate: "2082-01-22", customer: "Gita Rai", amount: 9600, paid: 0, balance: 9600, status: "Sent" },
];

export const mockCreditNotes = [
  { id: "CN-0001", date: "2082-01-11", customer: "Ram Sharma", againstInvoice: "INV-0001", amount: 2400, status: "Issued" },
  { id: "CN-0002", date: "2082-01-10", customer: "Hari KC", againstInvoice: "INV-0003", amount: 5200, status: "Applied" },
];

export const monthlySales = [
  { month: "Bai", sales: 320000 }, { month: "Jes", sales: 285000 },
  { month: "Asa", sales: 410000 }, { month: "Shr", sales: 375000 },
  { month: "Bha", sales: 445000 }, { month: "Asw", sales: 390000 },
  { month: "Kar", sales: 480000 }, { month: "Man", sales: 425000 },
  { month: "Pou", sales: 510000 }, { month: "Mag", sales: 465000 },
  { month: "Fal", sales: 530000 }, { month: "Cha", sales: 485200 },
];

export const salesByCategory = [
  { name: "Kurta & Tops", value: 35 },
  { name: "Sarees", value: 25 },
  { name: "Jackets", value: 20 },
  { name: "Accessories", value: 12 },
  { name: "Others", value: 8 },
];
