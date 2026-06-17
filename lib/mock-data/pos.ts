// POS Mock Data

export interface PosSession {
  id: string;
  openedAt: string;
  closedAt: string | null;
  cashier: string;
  openingCash: number;
  totalSales: number;
  totalOrders: number;
  cashSales: number;
  digitalSales: number;
  closingCash: number | null;
  status: "open" | "closed";
}

export interface PosProduct {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
  image: string | null;
}

export interface PosCustomer {
  id: string;
  name: string;
  phone: string;
  email: string;
  loyaltyPoints: number;
  totalVisits: number;
  totalSpent: number;
  lastVisit: string;
  status: "active" | "inactive";
}

export interface PosBill {
  id: string;
  sessionId: string;
  billNumber: string;
  date: string;
  time: string;
  customer: string;
  items: Array<{ product: string; qty: number; price: number; total: number }>;
  subtotal: number;
  discount: number;
  vat: number;
  grandTotal: number;
  paymentMethod: "cash" | "esewa" | "khalti" | "card";
  amountReceived: number;
  change: number;
}

export const mockPosSessions: PosSession[] = [
  {
    id: "SES-0001",
    openedAt: "2082-01-10 09:00",
    closedAt: "2082-01-10 21:00",
    cashier: "Ram Sharma",
    openingCash: 5000,
    totalSales: 48500,
    totalOrders: 34,
    cashSales: 32000,
    digitalSales: 16500,
    closingCash: 37000,
    status: "closed",
  },
  {
    id: "SES-0002",
    openedAt: "2082-01-11 09:15",
    closedAt: null,
    cashier: "Sita Thapa",
    openingCash: 5000,
    totalSales: 12400,
    totalOrders: 9,
    cashSales: 8400,
    digitalSales: 4000,
    closingCash: null,
    status: "open",
  },
];

export const mockPosProducts: PosProduct[] = [
  { id: "P001", name: "Cotton Kurta - Blue", sku: "SKU-001", category: "Clothing", price: 850, stock: 120, image: null },
  { id: "P002", name: "Silk Saree - Red", sku: "SKU-002", category: "Clothing", price: 3500, stock: 15, image: null },
  { id: "P003", name: "Woolen Shawl", sku: "SKU-004", category: "Accessories", price: 1100, stock: 85, image: null },
  { id: "P004", name: "Ethnic Topi", sku: "SKU-005", category: "Accessories", price: 250, stock: 200, image: null },
  { id: "P005", name: "Cotton Shirt - White", sku: "SKU-006", category: "Clothing", price: 650, stock: 60, image: null },
  { id: "P006", name: "Leather Belt", sku: "SKU-007", category: "Accessories", price: 450, stock: 40, image: null },
];

export const mockPosCustomers: PosCustomer[] = [
  { id: "PC001", name: "Anita Gurung", phone: "9841222001", email: "anita@email.com", loyaltyPoints: 450, totalVisits: 12, totalSpent: 38500, lastVisit: "2082-01-10", status: "active" },
  { id: "PC002", name: "Bikash Rai", phone: "9841222002", email: "", loyaltyPoints: 120, totalVisits: 5, totalSpent: 12000, lastVisit: "2082-01-08", status: "active" },
  { id: "PC003", name: "Champa Lama", phone: "9841222003", email: "champa@email.com", loyaltyPoints: 890, totalVisits: 24, totalSpent: 95000, lastVisit: "2082-01-09", status: "active" },
];

export const mockPosBills: PosBill[] = [
  {
    id: "B001",
    sessionId: "SES-0001",
    billNumber: "BILL-0001",
    date: "2082-01-10",
    time: "09:30",
    customer: "Anita Gurung",
    items: [
      { product: "Cotton Kurta - Blue", qty: 2, price: 850, total: 1700 },
      { product: "Leather Belt", qty: 1, price: 450, total: 450 },
    ],
    subtotal: 2150,
    discount: 0,
    vat: 279.5,
    grandTotal: 2429.5,
    paymentMethod: "cash",
    amountReceived: 2500,
    change: 70.5,
  },
  {
    id: "B002",
    sessionId: "SES-0001",
    billNumber: "BILL-0002",
    date: "2082-01-10",
    time: "10:15",
    customer: "Walk-in",
    items: [{ product: "Ethnic Topi", qty: 3, price: 250, total: 750 }],
    subtotal: 750,
    discount: 75,
    vat: 87.75,
    grandTotal: 762.75,
    paymentMethod: "esewa",
    amountReceived: 762.75,
    change: 0,
  },
];

export const hourlyData = [
  { hour: "6 AM", sales: 0 },
  { hour: "7 AM", sales: 2500 },
  { hour: "8 AM", sales: 5200 },
  { hour: "9 AM", sales: 8400 },
  { hour: "10 AM", sales: 6800 },
  { hour: "11 AM", sales: 7200 },
  { hour: "12 PM", sales: 9500 },
  { hour: "1 PM", sales: 5600 },
  { hour: "2 PM", sales: 4200 },
  { hour: "3 PM", sales: 3800 },
  { hour: "4 PM", sales: 6100 },
  { hour: "5 PM", sales: 8900 },
  { hour: "6 PM", sales: 7300 },
  { hour: "7 PM", sales: 6200 },
  { hour: "8 PM", sales: 4100 },
  { hour: "9 PM", sales: 2800 },
  { hour: "10 PM", sales: 0 },
];

export const paymentMethodData = [
  { name: "Cash", value: 32000, percent: 66 },
  { name: "eSewa", value: 10000, percent: 21 },
  { name: "Khalti", value: 4500, percent: 9 },
  { name: "Card", value: 2000, percent: 4 },
];
