// Mock data for dashboard
export const stats = {
  revenue: "Rs. 4,85,200",
  revenueChange: 12.5,
  orders: 1240,
  ordersChange: 8.2,
  customers: 380,
  customersChange: 5.1,
  products: 94,
  productsChange: 3.8,
};

export const recentOrders = [
  { id: "ORD-001", customer: "Ram Sharma", amount: "Rs. 12,500", status: "Paid" },
  { id: "ORD-002", customer: "Sita Thapa", amount: "Rs. 8,300", status: "Pending" },
  { id: "ORD-003", customer: "Hari Gurung", amount: "Rs. 15,700", status: "Paid" },
  { id: "ORD-004", customer: "Gita Rai", amount: "Rs. 6,200", status: "Cancelled" },
  { id: "ORD-005", customer: "Krishna Magar", amount: "Rs. 9,800", status: "Paid" },
];

export const topProducts = [
  { name: "Product A", sales: 245, max: 300 },
  { name: "Product B", sales: 189, max: 300 },
  { name: "Product C", sales: 156, max: 300 },
  { name: "Product D", sales: 134, max: 300 },
  { name: "Product E", sales: 98, max: 300 },
];

export const recentCustomers = [
  { name: "Ram Sharma", email: "ram@example.com", initials: "RS", joined: "2 days ago" },
  { name: "Sita Thapa", email: "sita@example.com", initials: "ST", joined: "3 days ago" },
  { name: "Hari Gurung", email: "hari@example.com", initials: "HG", joined: "5 days ago" },
  { name: "Gita Rai", email: "gita@example.com", initials: "GR", joined: "1 week ago" },
  { name: "Krishna Magar", email: "krishna@example.com", initials: "KM", joined: "1 week ago" },
];

export const revenueData = {
  today: [
    { time: "6 AM", value: 2400 },
    { time: "9 AM", value: 3800 },
    { time: "12 PM", value: 5200 },
    { time: "3 PM", value: 4100 },
    { time: "6 PM", value: 6800 },
    { time: "9 PM", value: 3200 },
  ],
  week: [
    { time: "Mon", value: 12000 },
    { time: "Tue", value: 19000 },
    { time: "Wed", value: 15000 },
    { time: "Thu", value: 22000 },
    { time: "Fri", value: 28000 },
    { time: "Sat", value: 35000 },
    { time: "Sun", value: 25000 },
  ],
  month: [
    { time: "Week 1", value: 45000 },
    { time: "Week 2", value: 52000 },
    { time: "Week 3", value: 48000 },
    { time: "Week 4", value: 61000 },
  ],
  year: [
    { time: "Jan", value: 65000 },
    { time: "Feb", value: 59000 },
    { time: "Mar", value: 80000 },
    { time: "Apr", value: 81000 },
    { time: "May", value: 56000 },
    { time: "Jun", value: 55000 },
    { time: "Jul", value: 70000 },
    { time: "Aug", value: 85000 },
    { time: "Sep", value: 92000 },
    { time: "Oct", value: 78000 },
    { time: "Nov", value: 88000 },
    { time: "Dec", value: 95000 },
  ],
};
