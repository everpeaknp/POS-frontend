import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format currency in NPR format
 * @param amount - The amount to format
 * @param options - Formatting options
 * @returns Formatted currency string (Rs. X,XX,XXX.XX)
 */
export function formatCurrency(
  amount: number | string | null | undefined,
  options?: {
    showSymbol?: boolean;
    decimals?: number;
    showZero?: boolean;
  }
): string {
  const {
    showSymbol = true,
    decimals = 2,
    showZero = true,
  } = options || {};

  // Handle null/undefined
  if (amount === null || amount === undefined) {
    return showZero ? (showSymbol ? 'Rs. 0.00' : '0.00') : '-';
  }

  // Convert to number
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  // Handle NaN
  if (isNaN(numAmount)) {
    return showZero ? (showSymbol ? 'Rs. 0.00' : '0.00') : '-';
  }

  // Handle zero
  if (numAmount === 0 && !showZero) {
    return '-';
  }

  // Format the number
  const formatted = numAmount.toLocaleString('en-NP', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return showSymbol ? `Rs. ${formatted}` : formatted;
}

/**
 * Alias for formatCurrency - Format numbers in NPR format
 * @param amount - The amount to format
 * @param options - Formatting options
 * @returns Formatted currency string (Rs. X,XX,XXX.XX)
 */
export function formatNPR(
  amount: number | string | null | undefined,
  options?: {
    showSymbol?: boolean;
    decimals?: number;
    showZero?: boolean;
  }
): string {
  return formatCurrency(amount, options);
}

/**
 * Format number without currency symbol
 * @param amount - The amount to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted number string (X,XX,XXX.XX)
 */
export function formatNumber(
  amount: number | string | null | undefined,
  decimals: number = 2
): string {
  return formatCurrency(amount, { showSymbol: false, decimals });
}

/**
 * Format percentage
 * @param value - The percentage value
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted percentage string (XX.XX%)
 */
export function formatPercentage(
  value: number | string | null | undefined,
  decimals: number = 2
): string {
  if (value === null || value === undefined) return '0%';
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) return '0%';
  
  return `${numValue.toFixed(decimals)}%`;
}

/**
 * Format quantity (no currency symbol, variable decimals)
 * @param quantity - The quantity to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted quantity string
 */
export function formatQuantity(
  quantity: number | string | null | undefined,
  decimals: number = 2
): string {
  if (quantity === null || quantity === undefined) return '0';
  
  const numQty = typeof quantity === 'string' ? parseFloat(quantity) : quantity;
  
  if (isNaN(numQty)) return '0';
  
  // Remove trailing zeros for quantities
  return numQty.toLocaleString('en-NP', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}
