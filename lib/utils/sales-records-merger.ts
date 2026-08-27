/**
 * Sales Records Merger Utility
 * Merges Invoice and POSTransaction records into a unified sorted list
 */

import { type POSTransaction } from '@/lib/api/pos';

export interface Invoice {
  id: string;
  invoice_number: string;
  date: string;
  customer?: string;
  customer_name?: string;
  amount: number;
  paid_amount: number;
  balance: number;
  payment_type: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export type SalesRecord = (Invoice | POSTransaction) & { recordType: 'invoice' | 'receipt' };

/**
 * Convert Invoice to unified SalesRecord
 */
export function invoiceToSalesRecord(invoice: Invoice): SalesRecord {
  return {
    ...invoice,
    recordType: 'invoice',
  };
}

/**
 * Convert POSTransaction to unified SalesRecord
 */
export function posToSalesRecord(transaction: POSTransaction): SalesRecord {
  return {
    ...transaction,
    recordType: 'receipt',
  };
}

/**
 * Merge and sort Invoice and POSTransaction records
 * Returns records sorted by date (most recent first)
 */
export function mergeSalesRecords(
  invoices: Invoice[],
  posTransactions: POSTransaction[]
): SalesRecord[] {
  const merged: SalesRecord[] = [
    ...invoices.map(invoiceToSalesRecord),
    ...posTransactions.map(posToSalesRecord),
  ];

  // Sort by date (most recent first)
  // Invoice.date is a date string, POSTransaction.date is ISO datetime
  return merged.sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return dateB - dateA; // Most recent first
  });
}

/**
 * Get display number (invoice_number or transaction_number)
 */
export function getSalesRecordNumber(record: SalesRecord): string {
  if (record.recordType === 'invoice') {
    return (record as Invoice).invoice_number;
  }
  return (record as POSTransaction).transaction_number || '';
}

/**
 * Get display customer name
 */
export function getSalesRecordCustomer(record: SalesRecord): string {
  if (record.recordType === 'invoice') {
    const invoice = record as Invoice;
    return invoice.customer_name || invoice.customer || 'Unknown';
  }
  const pos = record as POSTransaction;
  return pos.customer_name || 'Walk-in';
}

/**
 * Get display amount
 */
export function getSalesRecordAmount(record: SalesRecord): number {
  if (record.recordType === 'invoice') {
    return (record as Invoice).amount;
  }
  return (record as POSTransaction).total || 0;
}

/**
 * Get display status
 */
export function getSalesRecordStatus(record: SalesRecord): string {
  return record.status || 'Unknown';
}

/**
 * Get display type badge text
 */
export function getSalesRecordTypeLabel(record: SalesRecord): string {
  return record.recordType === 'invoice' ? 'Invoice' : 'Receipt';
}

/**
 * Filter records by type
 */
export function filterByType(records: SalesRecord[], type: 'all' | 'invoice' | 'receipt'): SalesRecord[] {
  if (type === 'all') return records;
  return records.filter((r) => r.recordType === type);
}

/**
 * Filter records by search query (number or customer)
 */
export function searchSalesRecords(records: SalesRecord[], query: string): SalesRecord[] {
  if (!query.trim()) return records;

  const lowerQuery = query.toLowerCase();
  return records.filter((record) => {
    const number = getSalesRecordNumber(record).toLowerCase();
    const customer = getSalesRecordCustomer(record).toLowerCase();
    return number.includes(lowerQuery) || customer.includes(lowerQuery);
  });
}

/**
 * Filter records by status
 */
export function filterByStatus(records: SalesRecord[], status: string): SalesRecord[] {
  if (status === 'All') return records;
  return records.filter((r) => r.status === status);
}

/**
 * Get all unique statuses from records
 */
export function getAllStatuses(records: SalesRecord[]): string[] {
  const statuses = new Set<string>();
  records.forEach((r) => {
    if (r.status) statuses.add(r.status);
  });
  return Array.from(statuses).sort();
}
