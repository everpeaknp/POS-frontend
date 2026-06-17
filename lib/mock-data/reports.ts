// Reports Mock Data

export const mockSalesReportData = {
  summary: { totalSales: 485200, totalOrders: 312, avgOrderValue: 1555, topCustomer: "Ram Sharma" },
  trend: [
    { date: "2082-01-01", sales: 32000 },
    { date: "2082-01-02", sales: 28500 },
    { date: "2082-01-03", sales: 45000 },
    { date: "2082-01-04", sales: 38000 },
    { date: "2082-01-05", sales: 52000 },
    { date: "2082-01-06", sales: 41000 },
    { date: "2082-01-07", sales: 36000 },
    { date: "2082-01-08", sales: 48500 },
    { date: "2082-01-09", sales: 55000 },
    { date: "2082-01-10", sales: 62000 },
  ],
  byPaymentMethod: [
    { method: "Cash", amount: 220000, percentage: 45 },
    { method: "eSewa", amount: 145000, percentage: 30 },
    { method: "Khalti", amount: 72800, percentage: 15 },
    { method: "Card", amount: 48520, percentage: 10 },
  ],
  byCategory: [
    { category: "Clothing", amount: 320000, percentage: 66 },
    { category: "Accessories", amount: 98000, percentage: 20 },
    { category: "Footwear", amount: 67200, percentage: 14 },
  ],
  topCustomers: [
    { rank: 1, name: "Ram Sharma", orders: 12, amount: 85200, percentage: 17.6 },
    { rank: 2, name: "Sita Thapa", orders: 8, amount: 62000, percentage: 12.8 },
    { rank: 3, name: "Hari KC", orders: 15, amount: 48500, percentage: 10.0 },
  ],
};

export const mockPurchaseReportData = {
  summary: { totalPurchases: 385000, totalOrders: 48, avgOrderValue: 8021, topSupplier: "ABC Suppliers" },
  trend: [
    { date: "2082-01-01", purchases: 45000 },
    { date: "2082-01-03", purchases: 82000 },
    { date: "2082-01-05", purchases: 28000 },
    { date: "2082-01-07", purchases: 95000 },
    { date: "2082-01-09", purchases: 62000 },
    { date: "2082-01-10", purchases: 73000 },
  ],
  topSuppliers: [
    { rank: 1, name: "ABC Suppliers Pvt. Ltd.", orders: 24, amount: 185000, percentage: 48 },
    { rank: 2, name: "XYZ Traders", orders: 12, amount: 120000, percentage: 31.2 },
    { rank: 3, name: "Nepal Distributors", orders: 8, amount: 80000, percentage: 20.8 },
  ],
  payablesAging: [
    { supplier: "ABC Suppliers", current: 45000, days31: 0, days61: 0, days90: 0, total: 45000 },
    { supplier: "XYZ Traders", current: 0, days31: 42000, days61: 0, days90: 0, total: 42000 },
    { supplier: "Nepal Distributors", current: 0, days31: 0, days61: 0, days90: 120000, total: 120000 },
  ],
};

export const mockInventoryReport = {
  summary: { totalProducts: 6, totalUnits: 282, lowStock: 1, outOfStock: 1 },
  stockByProduct: [
    { sku: "CK-001", name: "Cotton Kurta", stock: 150 },
    { sku: "SS-001", name: "Silk Saree", stock: 45 },
    { sku: "DJ-001", name: "Denim Jeans", stock: 12 },
    { sku: "WS-001", name: "Woolen Shawl", stock: 8 },
    { sku: "LS-001", name: "Linen Shirt", stock: 3 },
    { sku: "ED-001", name: "Ethnic Dress", stock: 64 },
  ],
};

export const mockTaxReport = {
  vat: {
    outputVat: 55000,
    inputVat: 42000,
    netPayable: 13000,
    returnsFiled: 3,
    monthly: [
      { month: "Kartik 2081", salesExVat: 280000, outputVat: 36400, purchasesExVat: 180000, inputVat: 23400, netVat: 13000, status: "filed" },
      { month: "Mangsir 2081", salesExVat: 320000, outputVat: 41600, purchasesExVat: 210000, inputVat: 27300, netVat: 14300, status: "filed" },
      { month: "Poush 2081", salesExVat: 290000, outputVat: 37700, purchasesExVat: 195000, inputVat: 25350, netVat: 12350, status: "unfiled" },
    ],
  },
  tds: [
    { supplier: "ABC Suppliers Pvt. Ltd.", pan: "301234567", type: "Goods", gross: 85000, rate: 1.5, tds: 1275, date: "2082-01-10", submitted: true },
    { supplier: "Office Space Nepal", pan: "301234568", type: "Rent", gross: 30000, rate: 10, tds: 3000, date: "2082-01-01", submitted: true },
  ],
};

export const monthlyRevenueExpense = [
  { month: "Shrawan", revenue: 320000, expense: 180000 },
  { month: "Bhadra", revenue: 350000, expense: 195000 },
  { month: "Ashwin", revenue: 380000, expense: 210000 },
  { month: "Kartik", revenue: 420000, expense: 225000 },
  { month: "Mangsir", revenue: 450000, expense: 240000 },
  { month: "Poush", revenue: 485200, expense: 260000 },
];

export const businessKPIs = {
  grossProfitMargin: 48.2,
  netProfitMargin: 31.8,
  currentRatio: 1.77,
  inventoryTurnover: 4.2,
};
