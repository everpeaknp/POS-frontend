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
  createdAt: string;
}

export interface PFAccount {
  id: string;
  name: string;
  type: "bank" | "cash" | "wallet" | "investment" | "credit_card";
  balance: number;
  currency: string;
  institution?: string;
  accountNumber?: string;
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
  { id: "cat_1", name: "Groceries", type: "expense", createdAt: new Date().toISOString() },
  { id: "cat_2", name: "Transportation", type: "expense", createdAt: new Date().toISOString() },
  { id: "cat_3", name: "Utilities", type: "expense", createdAt: new Date().toISOString() },
  { id: "cat_4", name: "Entertainment", type: "expense", createdAt: new Date().toISOString() },
  { id: "cat_5", name: "Healthcare", type: "expense", createdAt: new Date().toISOString() },
  { id: "cat_6", name: "Shopping", type: "expense", createdAt: new Date().toISOString() },
  { id: "cat_7", name: "Dining", type: "expense", createdAt: new Date().toISOString() },
  // Income Categories
  { id: "cat_8", name: "Salary", type: "income", createdAt: new Date().toISOString() },
  { id: "cat_9", name: "Freelance", type: "income", createdAt: new Date().toISOString() },
  { id: "cat_10", name: "Investment", type: "income", createdAt: new Date().toISOString() },
  { id: "cat_11", name: "Other Income", type: "income", createdAt: new Date().toISOString() },
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
    name: "Cash",
    type: "cash",
    balance: 5000,
    currency: "NPR",
    createdAt: new Date().toISOString(),
  },
  {
    id: "acc_2",
    name: "Main Bank Account",
    type: "bank",
    balance: 50000,
    currency: "NPR",
    institution: "Sample Bank",
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
