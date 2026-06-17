'use client';

import { useState, useEffect, useMemo } from 'react';
import { Calendar, Filter, Download, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { journalEntriesAPI, accountsAPI, type JournalEntry, type Account } from '@/lib/api/accounting';
import { formatCurrency } from '@/lib/utils';

interface LedgerRow {
  id: string;
  date: string;
  entryNumber: string;
  accountCode: string;
  accountName: string;
  accountType: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  reference?: string;
  status: string;
}

export default function GeneralLedgerPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedAccountType, setSelectedAccountType] = useState<string>('');
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('posted');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [entriesRes, accountsRes] = await Promise.all([
        journalEntriesAPI.list({ ordering: 'date,entry_number' }),
        accountsAPI.list({ status: 'active', ordering: 'code' }),
      ]);

      const entriesData = Array.isArray(entriesRes) ? entriesRes : (entriesRes as any).results || [];
      const accountsData = Array.isArray(accountsRes) ? accountsRes : (accountsRes as any).results || [];

      setEntries(entriesData);
      setAccounts(accountsData);
    } catch (error: any) {
      console.error('Failed to load ledger data:', error);
      toast.error('Failed to load ledger data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
    toast.success('Ledger refreshed');
  };

  // Transform journal entries into ledger rows with running balance
  const ledgerRows = useMemo(() => {
    const rows: LedgerRow[] = [];

    // Filter entries by status
    let filteredEntries = entries;
    if (selectedStatus) {
      filteredEntries = filteredEntries.filter(e => e.status === selectedStatus);
    }

    // Filter by date range
    if (dateFrom) {
      filteredEntries = filteredEntries.filter(e => e.date >= dateFrom);
    }
    if (dateTo) {
      filteredEntries = filteredEntries.filter(e => e.date <= dateTo);
    }

    // Process each entry and its lines
    filteredEntries.forEach(entry => {
      entry.lines.forEach(line => {
        const account = accounts.find(a => a.id === line.account);
        if (!account) return;

        // Filter by account type
        if (selectedAccountType && account.type !== selectedAccountType) return;

        // Filter by specific account
        if (selectedAccount && account.id !== selectedAccount) return;

        // Filter by search term
        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase();
          const matchesSearch = 
            entry.entry_number.toLowerCase().includes(searchLower) ||
            account.name.toLowerCase().includes(searchLower) ||
            account.code.toLowerCase().includes(searchLower) ||
            line.description.toLowerCase().includes(searchLower) ||
            (entry.reference?.toLowerCase().includes(searchLower) || false);
          
          if (!matchesSearch) return;
        }

        rows.push({
          id: `${entry.id}-${line.id}`,
          date: entry.date,
          entryNumber: entry.entry_number,
          accountCode: account.code,
          accountName: account.name,
          accountType: account.type,
          description: line.description,
          debit: line.debit,
          credit: line.credit,
          balance: 0, // Will be calculated below
          reference: entry.reference,
          status: entry.status,
        });
      });
    });

    // Sort by date and entry number
    rows.sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.entryNumber.localeCompare(b.entryNumber);
    });

    // Calculate running balance
    let runningBalance = 0;
    rows.forEach(row => {
      runningBalance += row.debit - row.credit;
      row.balance = runningBalance;
    });

    return rows;
  }, [entries, accounts, dateFrom, dateTo, selectedAccountType, selectedAccount, selectedStatus, searchTerm]);

  // Calculate totals
  const totals = useMemo(() => {
    const totalDebit = ledgerRows.reduce((sum, row) => sum + row.debit, 0);
    const totalCredit = ledgerRows.reduce((sum, row) => sum + row.credit, 0);
    const netBalance = totalDebit - totalCredit;

    return { totalDebit, totalCredit, netBalance };
  }, [ledgerRows]);

  // Get unique account types
  const accountTypes = useMemo(() => {
    return Array.from(new Set(accounts.map(a => a.type))).sort();
  }, [accounts]);

  // Get filtered accounts for dropdown
  const filteredAccounts = useMemo(() => {
    if (!selectedAccountType) return accounts;
    return accounts.filter(a => a.type === selectedAccountType);
  }, [accounts, selectedAccountType]);

  const handleExport = () => {
    // Create CSV content
    const headers = ['Date', 'Entry #', 'Account Code', 'Account Name', 'Description', 'Debit', 'Credit', 'Balance', 'Reference'];
    const csvRows = [
      headers.join(','),
      ...ledgerRows.map(row => [
        row.date,
        row.entryNumber,
        row.accountCode,
        `"${row.accountName}"`,
        `"${row.description}"`,
        row.debit.toFixed(2),
        row.credit.toFixed(2),
        row.balance.toFixed(2),
        row.reference || '',
      ].join(','))
    ];

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `general-ledger-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success('Ledger exported successfully');
  };

  const clearFilters = () => {
    setDateFrom('');
    setDateTo('');
    setSelectedAccountType('');
    setSelectedAccount('');
    setSelectedStatus('posted');
    setSearchTerm('');
    toast.success('Filters cleared');
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading general ledger...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">General Ledger</h1>
          <p className="text-gray-600 mt-1">
            Complete transaction history with running balance
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Debits</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(totals.totalDebit)}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Credits</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(totals.totalCredit)}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Net Balance</p>
              <p className={`text-2xl font-bold mt-1 ${
                totals.netBalance >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatCurrency(Math.abs(totals.netBalance))}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {totals.netBalance >= 0 ? 'Debit Balance' : 'Credit Balance'}
              </p>
            </div>
            <div className={`p-3 rounded-lg ${
              totals.netBalance >= 0 ? 'bg-green-100' : 'bg-red-100'
            }`}>
              <Filter className={`w-6 h-6 ${
                totals.netBalance >= 0 ? 'text-green-600' : 'text-red-600'
              }`} />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Date From */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date From
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Date To */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date To
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Account Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account Type
            </label>
            <select
              value={selectedAccountType}
              onChange={(e) => {
                setSelectedAccountType(e.target.value);
                setSelectedAccount(''); // Reset account selection
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              {accountTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* Specific Account */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Specific Account
            </label>
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!selectedAccountType && filteredAccounts.length > 50}
            >
              <option value="">All Accounts</option>
              {filteredAccounts.map(account => (
                <option key={account.id} value={account.id}>
                  {account.code} - {account.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="posted">Posted</option>
              <option value="reversed">Reversed</option>
            </select>
          </div>

          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Entry #, account, description..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Clear Filters Button */}
          <div className="flex items-end">
            <button
              onClick={clearFilters}
              className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-600">
          Showing {ledgerRows.length} transaction{ledgerRows.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Entry #
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Account
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Debit
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Credit
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Running Balance
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Reference
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {ledgerRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    No transactions found. Try adjusting your filters.
                  </td>
                </tr>
              ) : (
                ledgerRows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                      {new Date(row.date).toLocaleDateString('en-GB')}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                      <span className="font-mono">{row.entryNumber}</span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div>
                        <div className="font-medium text-gray-900">{row.accountName}</div>
                        <div className="text-gray-500 text-xs">
                          {row.accountCode} • {row.accountType}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {row.description}
                    </td>
                    <td className="px-4 py-3 text-sm text-right whitespace-nowrap">
                      {row.debit > 0 ? (
                        <span className="text-green-600 font-medium">
                          {formatCurrency(row.debit)}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-right whitespace-nowrap">
                      {row.credit > 0 ? (
                        <span className="text-red-600 font-medium">
                          {formatCurrency(row.credit)}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-right whitespace-nowrap">
                      <span className={`font-semibold ${
                        row.balance >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(Math.abs(row.balance))}
                      </span>
                      <span className="text-xs text-gray-500 ml-1">
                        {row.balance >= 0 ? 'Dr' : 'Cr'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                      {row.reference || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {ledgerRows.length > 0 && (
              <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                <tr className="font-semibold">
                  <td colSpan={4} className="px-4 py-3 text-sm text-gray-900 text-right">
                    TOTALS:
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-green-600">
                    {formatCurrency(totals.totalDebit)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-red-600">
                    {formatCurrency(totals.totalCredit)}
                  </td>
                  <td className={`px-4 py-3 text-sm text-right ${
                    totals.netBalance >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(Math.abs(totals.netBalance))}
                    <span className="text-xs ml-1">
                      {totals.netBalance >= 0 ? 'Dr' : 'Cr'}
                    </span>
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Balance Verification */}
      {ledgerRows.length > 0 && (
        <div className={`rounded-lg p-4 ${
          Math.abs(totals.totalDebit - totals.totalCredit) < 0.01
            ? 'bg-green-50 border border-green-200'
            : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-center gap-3">
            {Math.abs(totals.totalDebit - totals.totalCredit) < 0.01 ? (
              <>
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-green-900">Books are Balanced</p>
                  <p className="text-sm text-green-700">
                    Total debits equal total credits. The accounting equation is satisfied.
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="p-2 bg-red-100 rounded-lg">
                  <TrendingDown className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="font-semibold text-red-900">Books are Out of Balance</p>
                  <p className="text-sm text-red-700">
                    Difference: {formatCurrency(Math.abs(totals.totalDebit - totals.totalCredit))}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
