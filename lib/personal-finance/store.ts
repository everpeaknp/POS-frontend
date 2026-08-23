/**
 * Personal Finance Local Store
 * 
 * This module provides client-side storage for Personal Finance data using localStorage.
 * Each tenant/user has isolated data based on their scope (tenant slug).
 * 
 * TODO: Replace with real backend API calls when endpoints are ready
 */

import { useState, useEffect, useCallback } from "react";

// ============================================================================
// TYPES
// ============================================================================

export interface PFCategory {
  id: string;
  name: string;
  type: "income" | "expense";
  icon?: string;
  color?: string;
  description?: string;
  parentId?: string;
  isSystem?: boolean;
  createdAt: string;
}

export interface PFAccount {
  id: string;
  name: string;
  type: "bank" | "cash" | "credit_card" | "loan" | "investment";
  balance: number;
  bankName?: string;
  accountNumber?: string;
  description?: string;
  isSystem?: boolean;
  createdAt: string;
}

export interface PFTransaction {
  id: string;
  type: "income" | "expense" | "transfer";
  amount: number;
  categoryId: string;
  accountId: string;
  toAccountId?: string; // for transfers
  description: string;
  date: string; // YYYY-MM-DD
  notes?: string;
  receiptUrl?: string; // URL or base64 of receipt image
  createdAt: string;
}

export interface PFBudget {
  id: string;
  categoryId: string;
  amount: number;
  month: string; // YYYY-MM
  createdAt: string;
}

export interface PFLoan {
  id: string;
  name: string;
  type: "home" | "car" | "personal" | "education" | "business" | "other";
  principalAmount: number;
  interestRate: number;
  tenure: number; // in months
  startDate: string;
  emiAmount: number;
  remainingBalance: number;
  lender?: string;
  accountId?: string;
  status: "active" | "paid" | "defaulted";
  createdAt: string;
}

// ============================================================================
// STORAGE KEYS
// ============================================================================

const STORAGE_PREFIX = "pf_";

function getStorageKey(scope: string | null, entity: string): string {
  const safeScope = scope || "default";
  return `${STORAGE_PREFIX}${safeScope}_${entity}`;
}

// ============================================================================
// GENERIC STORAGE FUNCTIONS
// ============================================================================

function getFromStorage<T>(key: string, defaultValue: T[] = []): T[] {
  if (typeof window === "undefined") return defaultValue;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading from localStorage (${key}):`, error);
    return defaultValue;
  }
}

function setToStorage<T>(key: string, value: T[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing to localStorage (${key}):`, error);
  }
}

// ============================================================================
// CATEGORIES
// ============================================================================

const DEFAULT_CATEGORIES: PFCategory[] = [
  // Expense Categories
  { id: "cat_1", name: "Groceries", type: "expense", description: "Food and household items", isSystem: true, createdAt: new Date().toISOString() },
  { id: "cat_2", name: "Rent", type: "expense", description: "Monthly rent payment", isSystem: true, createdAt: new Date().toISOString() },
  { id: "cat_3", name: "Utilities", type: "expense", description: "Electricity, water, internet, phone", isSystem: true, createdAt: new Date().toISOString() },
  { id: "cat_4", name: "Dining", type: "expense", description: "Restaurants and food delivery", isSystem: true, createdAt: new Date().toISOString() },
  { id: "cat_5", name: "Entertainment", type: "expense", description: "Movies, streaming, hobbies", isSystem: true, createdAt: new Date().toISOString() },
  { id: "cat_6", name: "Transportation", type: "expense", description: "Fuel, public transport, vehicle maintenance", isSystem: true, createdAt: new Date().toISOString() },
  { id: "cat_7", name: "Healthcare", type: "expense", description: "Medical expenses and insurance", isSystem: true, createdAt: new Date().toISOString() },
  { id: "cat_12", name: "Shopping", type: "expense", description: "Clothing and personal items", isSystem: true, createdAt: new Date().toISOString() },
  { id: "cat_13", name: "Education", type: "expense", description: "Courses, books, tuition", isSystem: true, createdAt: new Date().toISOString() },
  { id: "cat_14", name: "Other Expenses", type: "expense", description: "Miscellaneous expenses", isSystem: true, createdAt: new Date().toISOString() },
  // Income Categories
  { id: "cat_8", name: "Salary", type: "income", description: "Monthly salary income", isSystem: true, createdAt: new Date().toISOString() },
  { id: "cat_9", name: "Freelance", type: "income", description: "Freelance project income", isSystem: true, createdAt: new Date().toISOString() },
  { id: "cat_10", name: "Investment Returns", type: "income", description: "Interest, dividends, capital gains", isSystem: true, createdAt: new Date().toISOString() },
  { id: "cat_11", name: "Other Income", type: "income", description: "Miscellaneous income", isSystem: false, createdAt: new Date().toISOString() },
];

export function getCategories(scope: string | null): PFCategory[] {
  const key = getStorageKey(scope, "categories");
  const stored = getFromStorage<PFCategory>(key);
  return stored.length > 0 ? stored : DEFAULT_CATEGORIES;
}

export function setCategoriesForScope(scope: string | null, categories: PFCategory[]): void {
  const key = getStorageKey(scope, "categories");
  setToStorage(key, categories);
}

// ============================================================================
// ACCOUNTS
// ============================================================================

const DEFAULT_ACCOUNTS: PFAccount[] = [
  {
    id: "acc_1",
    name: "Cash Wallet",
    type: "cash",
    balance: 5000,
    description: "Cash on hand and wallet",
    isSystem: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "acc_2",
    name: "Checking Account",
    type: "bank",
    balance: 50000,
    bankName: "Nabil Bank",
    description: "Primary checking/current account",
    isSystem: true,
    createdAt: new Date().toISOString(),
  },
];

export function getAccounts(scope: string | null): PFAccount[] {
  const key = getStorageKey(scope, "accounts");
  const stored = getFromStorage<PFAccount>(key);
  return stored.length > 0 ? stored : DEFAULT_ACCOUNTS;
}

export function setAccountsForScope(scope: string | null, accounts: PFAccount[]): void {
  const key = getStorageKey(scope, "accounts");
  setToStorage(key, accounts);
}

// ============================================================================
// TRANSACTIONS
// ============================================================================

const DEFAULT_TRANSACTIONS: PFTransaction[] = [
  {
    id: "txn_1",
    type: "expense",
    amount: 2500,
    categoryId: "cat_1",
    accountId: "acc_1",
    description: "Grocery Shopping",
    date: "2026-08-15",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "txn_2",
    type: "income",
    amount: 50000,
    categoryId: "cat_8",
    accountId: "acc_2",
    description: "Salary Payment",
    date: "2026-08-01",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export function getTransactions(scope: string | null): PFTransaction[] {
  const key = getStorageKey(scope, "transactions");
  const stored = getFromStorage<PFTransaction>(key);
  return stored.length > 0 ? stored : DEFAULT_TRANSACTIONS;
}

export function setTransactionsForScope(scope: string | null, transactions: PFTransaction[]): void {
  const key = getStorageKey(scope, "transactions");
  setToStorage(key, transactions);
}

// ============================================================================
// BUDGETS
// ============================================================================

export function getBudgets(scope: string | null): PFBudget[] {
  const key = getStorageKey(scope, "budgets");
  return getFromStorage<PFBudget>(key, []);
}

export function setBudgetsForScope(scope: string | null, budgets: PFBudget[]): void {
  const key = getStorageKey(scope, "budgets");
  setToStorage(key, budgets);
}

// ============================================================================
// LOANS
// ============================================================================

export function getLoans(scope: string | null): PFLoan[] {
  const key = getStorageKey(scope, "loans");
  return getFromStorage<PFLoan>(key, []);
}

export function setLoansForScope(scope: string | null, loans: PFLoan[]): void {
  const key = getStorageKey(scope, "loans");
  setToStorage(key, loans);
}

// ============================================================================
// PREFERENCES
// ============================================================================

export interface PFPreferences {
  currency: string;
  dateFormat: string;
  timezone: string;
}

export const DEFAULT_PREFERENCES: PFPreferences = {
  currency: "NPR",
  dateFormat: "DD/MM/YYYY",
  timezone: "Asia/Kathmandu",
};

export function getPreferences(scope: string | null): PFPreferences {
  const key = getStorageKey(scope, "preferences");
  if (typeof window === "undefined") return DEFAULT_PREFERENCES;
  try {
    const item = localStorage.getItem(key);
    return item ? { ...DEFAULT_PREFERENCES, ...JSON.parse(item) } : DEFAULT_PREFERENCES;
  } catch (error) {
    console.error(`Error reading from localStorage (${key}):`, error);
    return DEFAULT_PREFERENCES;
  }
}

export function setPreferencesForScope(scope: string | null, prefs: PFPreferences): void {
  const key = getStorageKey(scope, "preferences");
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(prefs));
  } catch (error) {
    console.error(`Error writing to localStorage (${key}):`, error);
  }
}

// ============================================================================
// DATA MANAGEMENT (export / clear all scoped data)
// ============================================================================

export interface PFDataSnapshot {
  categories: PFCategory[];
  accounts: PFAccount[];
  transactions: PFTransaction[];
  budgets: PFBudget[];
  loans: PFLoan[];
  preferences: PFPreferences;
  exportedAt: string;
}

export function exportAllData(scope: string | null): PFDataSnapshot {
  return {
    categories: getCategories(scope),
    accounts: getAccounts(scope),
    transactions: getTransactions(scope),
    budgets: getBudgets(scope),
    loans: getLoans(scope),
    preferences: getPreferences(scope),
    exportedAt: new Date().toISOString(),
  };
}

/** Wipes all locally-stored Personal Finance data for this scope back to defaults. */
export function clearAllData(scope: string | null): void {
  setCategoriesForScope(scope, []);
  setAccountsForScope(scope, []);
  setTransactionsForScope(scope, []);
  setBudgetsForScope(scope, []);
  setLoansForScope(scope, []);
  setPreferencesForScope(scope, DEFAULT_PREFERENCES);
}

// ============================================================================
// REACT HOOK FOR SYNCED STATE
// ============================================================================

/**
 * Custom hook that syncs state with localStorage and provides automatic persistence
 * 
 * @param scope - Tenant/user scope for data isolation
 * @param getter - Function to get data from storage
 * @param setter - Function to set data to storage
 * @returns [data, setData] tuple similar to useState
 */
export function useSyncedList<T>(
  scope: string | null,
  getter: (scope: string | null) => T[],
  setter: (scope: string | null, data: T[]) => void
): [T[], React.Dispatch<React.SetStateAction<T[]>>] {
  const [data, setData] = useState<T[]>(() => getter(scope));

  // Sync to localStorage whenever data changes
  useEffect(() => {
    setter(scope, data);
  }, [data, scope, setter]);

  // Reload from localStorage when scope changes
  useEffect(() => {
    setData(getter(scope));
  }, [scope, getter]);

  return [data, setData];
}
