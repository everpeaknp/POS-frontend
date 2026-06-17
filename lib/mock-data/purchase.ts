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

export const mockSuppliers = [
  { id: "S001", name: "ABC Suppliers Pvt. Ltd.", phone: "9841111001", email: "abc@suppliers.com", pan: "301234567", address: "Kathmandu, Bagmati", totalOrders: 24, totalPurchased: 850000, outstanding: 45000, status: "active", type: "Company", creditLimit: 500000, paymentTerms: "Net 30", bankName: "Nepal Bank Ltd", bankAccount: "0123456789", leadTime: 7 },
  { id: "S002", name: "XYZ Traders", phone: "9841111002", email: "xyz@traders.com", pan: "301234568", address: "Pokhara, Gandaki", totalOrders: 12, totalPurchased: 420000, outstanding: 0, status: "active", type: "Company", creditLimit: 300000, paymentTerms: "Net 15", bankName: "Nabil Bank", bankAccount: "9876543210", leadTime: 5 },
  { id: "S003", name: "Nepal Distributors", phone: "9841111003", email: "nepal@dist.com", pan: "301234569", address: "Butwal, Lumbini", totalOrders: 8, totalPurchased: 280000, outstanding: 120000, status: "inactive", type: "Company", creditLimit: 200000, paymentTerms: "Net 60", bankName: "Himalayan Bank", bankAccount: "1122334455", leadTime: 14 },
  { id: "S004", name: "Himalayan Goods", phone: "9841111004", email: "himalayan@goods.com", pan: "301234570", address: "Biratnagar, Koshi", totalOrders: 6, totalPurchased: 150000, outstanding: 30000, status: "active", type: "Individual", creditLimit: 100000, paymentTerms: "Immediate", bankName: "Everest Bank", bankAccount: "5566778899", leadTime: 3 },
];

export const mockPurchaseOrders = [
  { id: "PO-0001", date: "2082-01-10", supplier: "ABC Suppliers Pvt. Ltd.", supplierId: "S001", expectedDate: "2082-01-20", items: 3, total: 85000, status: "Received", reference: "REF-101", paymentTerms: "Net 30" },
  { id: "PO-0002", date: "2082-01-08", supplier: "XYZ Traders", supplierId: "S002", expectedDate: "2082-01-18", items: 2, total: 42000, status: "Sent", reference: "", paymentTerms: "Net 15" },
  { id: "PO-0003", date: "2082-01-05", supplier: "Nepal Distributors", supplierId: "S003", expectedDate: "2082-01-15", items: 5, total: 120000, status: "Partially Received", reference: "REF-102", paymentTerms: "Net 60" },
  { id: "PO-0004", date: "2082-01-03", supplier: "Himalayan Goods", supplierId: "S004", expectedDate: "2082-01-13", items: 1, total: 15000, status: "Draft", reference: "", paymentTerms: "Immediate" },
  { id: "PO-0005", date: "2082-01-01", supplier: "ABC Suppliers Pvt. Ltd.", supplierId: "S001", expectedDate: "2082-01-11", items: 4, total: 62000, status: "Cancelled", reference: "REF-103", paymentTerms: "Net 30" },
];

export const mockPurchaseRequests = [
  { id: "PR-0001", date: "2082-01-10", requestedBy: "Ram Sharma", department: "Operations", items: 3, estimatedAmount: 45000, requiredBy: "2082-01-20", status: "Approved", priority: "High" },
  { id: "PR-0002", date: "2082-01-08", requestedBy: "Sita Thapa", department: "IT", items: 1, estimatedAmount: 85000, requiredBy: "2082-01-25", status: "Pending Approval", priority: "Medium" },
  { id: "PR-0003", date: "2082-01-05", requestedBy: "Hari KC", department: "Admin", items: 5, estimatedAmount: 12000, requiredBy: "2082-01-15", status: "Converted to PO", priority: "Low" },
  { id: "PR-0004", date: "2082-01-03", requestedBy: "Gita Rai", department: "Finance", items: 2, estimatedAmount: 28000, requiredBy: "2082-01-18", status: "Rejected", priority: "Medium" },
];

export const mockPurchaseInvoices = [
  { id: "PINV-0001", date: "2082-01-10", dueDate: "2082-01-25", supplier: "ABC Suppliers Pvt. Ltd.", poRef: "PO-0001", amount: 85000, paid: 85000, balance: 0, status: "Paid" },
  { id: "PINV-0002", date: "2082-01-08", dueDate: "2082-01-23", supplier: "XYZ Traders", poRef: "PO-0002", amount: 42000, paid: 0, balance: 42000, status: "Overdue" },
  { id: "PINV-0003", date: "2082-01-05", dueDate: "2082-02-05", supplier: "Nepal Distributors", poRef: "PO-0003", amount: 120000, paid: 50000, balance: 70000, status: "Partially Paid" },
  { id: "PINV-0004", date: "2082-01-03", dueDate: "2082-01-18", supplier: "Himalayan Goods", poRef: "PO-0004", amount: 15000, paid: 0, balance: 15000, status: "Received" },
];

export const mockDebitNotes = [
  { id: "DN-0001", date: "2082-01-10", supplier: "ABC Suppliers Pvt. Ltd.", invoiceRef: "PINV-0001", amount: 5000, reason: "Return", status: "Issued" },
  { id: "DN-0002", date: "2082-01-08", supplier: "XYZ Traders", invoiceRef: "PINV-0002", amount: 2000, reason: "Overcharge", status: "Applied" },
];

export const mockPurchaseProducts = [
  { id: "PP001", name: "Cotton Fabric (per meter)", unit: "Meter", price: 450, tax: 13 },
  { id: "PP002", name: "Silk Fabric (per meter)", unit: "Meter", price: 1200, tax: 13 },
  { id: "PP003", name: "Denim Fabric (per meter)", unit: "Meter", price: 800, tax: 13 },
  { id: "PP004", name: "Woolen Yarn (per kg)", unit: "Kg", price: 1500, tax: 13 },
  { id: "PP005", name: "Embroidery Thread", unit: "Roll", price: 250, tax: 13 },
  { id: "PP006", name: "Packaging Box", unit: "Pcs", price: 35, tax: 13 },
];

export const monthlyPurchases = [
  { month: "Bai", purchases: 280000 }, { month: "Jes", purchases: 245000 },
  { month: "Asa", purchases: 360000 }, { month: "Shr", purchases: 320000 },
  { month: "Bha", purchases: 395000 }, { month: "Asw", purchases: 340000 },
  { month: "Kar", purchases: 420000 }, { month: "Man", purchases: 375000 },
  { month: "Pou", purchases: 460000 }, { month: "Mag", purchases: 410000 },
  { month: "Fal", purchases: 480000 }, { month: "Cha", purchases: 435000 },
];

export const purchaseByCategory = [
  { name: "Fabrics", value: 45 },
  { name: "Yarn & Thread", value: 25 },
  { name: "Packaging", value: 15 },
  { name: "Accessories", value: 10 },
  { name: "Others", value: 5 },
];
