export const mockProducts = [
  { id: "PRD001", name: "Cotton Kurta", sku: "CK-001", category: "Kurta & Tops", unit: "Pcs", costPrice: 650, salePrice: 1200, stock: 145, reorderLevel: 20, warehouse: "Main Warehouse", status: "active" },
  { id: "PRD002", name: "Silk Saree", sku: "SS-001", category: "Sarees", unit: "Pcs", costPrice: 2200, salePrice: 4500, stock: 38, reorderLevel: 10, warehouse: "Main Warehouse", status: "active" },
  { id: "PRD003", name: "Denim Jacket", sku: "DJ-001", category: "Jackets", unit: "Pcs", costPrice: 1800, salePrice: 3200, stock: 12, reorderLevel: 15, warehouse: "Branch Store", status: "active" },
  { id: "PRD004", name: "Woolen Shawl", sku: "WS-001", category: "Accessories", unit: "Pcs", costPrice: 1400, salePrice: 2800, stock: 5, reorderLevel: 10, warehouse: "Main Warehouse", status: "low_stock" },
  { id: "PRD005", name: "Linen Shirt", sku: "LS-001", category: "Kurta & Tops", unit: "Pcs", costPrice: 900, salePrice: 1800, stock: 0, reorderLevel: 20, warehouse: "Main Warehouse", status: "out_of_stock" },
  { id: "PRD006", name: "Embroidered Dupatta", sku: "ED-001", category: "Accessories", unit: "Pcs", costPrice: 450, salePrice: 950, stock: 82, reorderLevel: 15, warehouse: "Branch Store", status: "active" },
];

export const mockCategories = [
  { id: "CAT001", name: "Kurta & Tops", products: 2, totalStock: 227 },
  { id: "CAT002", name: "Sarees", products: 1, totalStock: 38 },
  { id: "CAT003", name: "Jackets", products: 1, totalStock: 12 },
  { id: "CAT004", name: "Accessories", products: 2, totalStock: 87 },
];

export const mockWarehouses = [
  { id: "WH001", name: "Main Warehouse", location: "Thamel, Kathmandu", products: 4, totalValue: 485000, manager: "Ram Sharma" },
  { id: "WH002", name: "Branch Store", location: "Lakeside, Pokhara", products: 2, totalValue: 120000, manager: "Sita Thapa" },
];

export const mockAdjustments = [
  { id: "ADJ001", date: "2082-01-10", product: "Cotton Kurta", type: "Addition", qty: 50, reason: "Stock received", warehouse: "Main Warehouse", by: "Ram Sharma" },
  { id: "ADJ002", date: "2082-01-08", product: "Woolen Shawl", type: "Deduction", qty: 5, reason: "Damaged goods", warehouse: "Main Warehouse", by: "Sita Thapa" },
  { id: "ADJ003", date: "2082-01-05", product: "Denim Jacket", type: "Addition", qty: 20, reason: "Stock received", warehouse: "Branch Store", by: "Hari KC" },
];

export const mockTransfers = [
  { id: "TRF001", date: "2082-01-09", product: "Silk Saree", qty: 10, from: "Main Warehouse", to: "Branch Store", status: "Completed", by: "Ram Sharma" },
  { id: "TRF002", date: "2082-01-07", product: "Cotton Kurta", qty: 25, from: "Main Warehouse", to: "Branch Store", status: "In Transit", by: "Sita Thapa" },
];

export const mockUOM = [
  { id: "UOM001", name: "Pieces", abbreviation: "Pcs", type: "Count" },
  { id: "UOM002", name: "Meter", abbreviation: "Mtr", type: "Length" },
  { id: "UOM003", name: "Kilogram", abbreviation: "Kg", type: "Weight" },
  { id: "UOM004", name: "Roll", abbreviation: "Roll", type: "Count" },
  { id: "UOM005", name: "Box", abbreviation: "Box", type: "Count" },
];
