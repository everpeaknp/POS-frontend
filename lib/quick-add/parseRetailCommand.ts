/**
 * parseRetailCommand.ts
 *
 * Parses natural language commands for Retail/Kirana dashboards.
 * Supports inventory operations like adding items, restocking, etc.
 */

export interface ParsedRetailCommand {
  intent: 'add-item' | 'restock' | 'stock-out' | 'unknown';
  itemName?: string;
  quantity?: number;
  missingFields?: string[];
  error?: string;
}

/**
 * Parse a command for Retail/Kirana dashboards
 */
export function parseRetailCommand(input: string): ParsedRetailCommand {
  const normalized = input.trim().toLowerCase();

  if (!normalized) {
    return {
      intent: 'unknown',
      error: 'Please enter a command',
    };
  }

  // Pattern 1: "add [item] to inventory"
  // Example: "add momo to inventory"
  const addItemMatch = normalized.match(/^(?:add|थप्नुहोस्)\s+(.+?)\s+(?:to|in|मा)\s+(?:inventory|stock|स्टक)/i);
  if (addItemMatch) {
    const itemName = addItemMatch[1].trim();
    return {
      intent: 'add-item',
      itemName,
      missingFields: ['price', 'unit', 'quantity'],
    };
  }

  // Pattern 2: "add [quantity] new order received in [item]" or "add [quantity] stock to [item]"
  // Example: "add 500 new order received in momo"
  // Example: "add 500 stock to momo"
  const restockMatch = normalized.match(/^(?:add|थप्नुहोस्)\s+(\d+)\s+(?:new\s+)?(?:order\s+)?(?:received\s+)?(?:in|to|मा)\s+(.+?)$/i);
  if (restockMatch) {
    const quantity = parseInt(restockMatch[1], 10);
    const itemName = restockMatch[2].trim();
    return {
      intent: 'restock',
      itemName,
      quantity,
    };
  }

  // Pattern 3: "remove/deduct [quantity] stock from [item]"
  // Example: "remove 400 stock from chowmein"
  // Example: "deduct 400 from chowmein"
  const stockOutMatch = normalized.match(/^(?:remove|deduct|घटाउनुहोस्|निकाल्नुहोस्)\s+(\d+)\s+(?:stock\s+)?(?:from|बाट)\s+(.+?)$/i);
  if (stockOutMatch) {
    const quantity = parseInt(stockOutMatch[1], 10);
    const itemName = stockOutMatch[2].trim();
    return {
      intent: 'stock-out',
      itemName,
      quantity,
    };
  }

  // If nothing matched
  return {
    intent: 'unknown',
    error: "I couldn't understand that — try 'add [item] to inventory' or 'add [number] new stock to [item]'",
  };
}

/**
 * Fuzzy match an item name against existing products
 */
export function fuzzyMatchProduct(
  input: string,
  products: Array<{ id: string; name: string }>
): { id: string; name: string } | null {
  const normalized = input.toLowerCase().trim();

  // Exact match first
  const exact = products.find(p => p.name.toLowerCase() === normalized);
  if (exact) return exact;

  // Partial match (product name contains input or vice versa)
  const partial = products.find(
    p =>
      p.name.toLowerCase().includes(normalized) ||
      normalized.includes(p.name.toLowerCase())
  );
  if (partial) return partial;

  return null;
}
