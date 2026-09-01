"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ExternalLink, Download, DollarSign, TrendingUp, TrendingDown, Copy, Check, Search } from "@/lib/icons/lucide-react-shim";
import { WhatsAppIcon, FacebookMessengerIcon, TelegramIcon, EnvelopeIcon } from "@/lib/icons/lucide-react-shim";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { DateInput } from "@/components/shared/DateInput";
import { FormattedDate } from "@/components/shared/FormattedDate";
import { useDateSystem } from "@/lib/context/DateSystemContext";
import toast from "react-hot-toast";
import { partyTransactionAPI, partyLenderAPI, partyTransactionShareAPI, PartyTransaction, PartyLender } from "@/lib/api/personal-finance";

interface PartyTransactionForm extends Omit<PartyTransaction, 'id' | 'party_name' | 'direction_display' | 'payment_method_display' | 'created_at' | 'updated_at'> {
  party_name?: string;
}

interface Props {
  partyId: number;
  onOpenDialog?: (direction?: 'in' | 'out') => void;
}

export function PartyTransactions({ partyId, onOpenDialog }: Props) {
  const router = useRouter();
  const { dateSystem } = useDateSystem();
  const [transactions, setTransactions] = useState<PartyTransaction[]>([]);
  const [party, setParty] = useState<PartyLender | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<PartyTransaction | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [direction, setDirection] = useState<'in' | 'out'>('in');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [shareCopied, setShareCopied] = useState(false);
  
  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'in' | 'out'>('all');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  const [formData, setFormData] = useState<Partial<PartyTransactionForm>>({
    party: partyId,
    direction: 'in',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    payment_method: null,
    receipt: null,
    note: '',
  });
  
  const [transactionId, setTransactionId] = useState<string>('');

  // Generate URL-friendly slug from party name
  const generatePartySlug = (party: PartyLender | null): string => {
    if (!party) return String(partyId);
    return party.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/-+/g, '-')
      + `-${party.id}`;
  };

  // Generate short alphanumeric ID from number
  const generateShortId = (id: number): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    let num = id;
    
    // Convert to base-36 and pad
    while (result.length < 6) {
      result = chars[num % chars.length] + result;
      num = Math.floor(num / chars.length);
      if (num === 0 && result.length < 6) {
        result = chars[0] + result;
      }
    }
    
    return result.slice(-6);
  };

  // Generate transaction ID
  useEffect(() => {
    const generateTransactionId = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let result = '';
      for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    };
    
    if (showDialog && !editingTransaction) {
      setTransactionId(generateTransactionId());
    }
  }, [showDialog, editingTransaction]);

  // Load party data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [partyData, txnData] = await Promise.all([
          partyLenderAPI.get(partyId),
          partyTransactionAPI.list(),
        ]);
        
        setParty(partyData);
        const partyTransactions = txnData.filter(t => t.party === partyId);
        setTransactions(partyTransactions);
      } catch (error) {
        console.error("Failed to load data:", error);
        toast.error("Failed to load party data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [partyId]);

  // Transactions by direction
  const outTransactions = useMemo(() => transactions.filter(t => t.direction === 'out'), [transactions]);
  const inTransactions = useMemo(() => transactions.filter(t => t.direction === 'in'), [transactions]);

  // Filtered transactions based on search and filters
  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(t => t.direction === filterType);
    }

    // Filter by payment method
    if (filterPaymentMethod !== 'all') {
      filtered = filtered.filter(t => t.payment_method === filterPaymentMethod);
    }

    // Filter by date range
    if (dateFrom) {
      filtered = filtered.filter(t => t.date >= dateFrom);
    }
    if (dateTo) {
      filtered = filtered.filter(t => t.date <= dateTo);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t => {
        const shortId = generateShortId(t.id).toLowerCase();
        const amount = t.amount.toString();
        const note = t.note?.toLowerCase() || '';
        const paymentMethod = t.payment_method_display?.toLowerCase() || '';
        
        return shortId.includes(query) || 
               amount.includes(query) || 
               note.includes(query) ||
               paymentMethod.includes(query);
      });
    }

    return filtered;
  }, [transactions, filterType, filterPaymentMethod, searchQuery, dateFrom, dateTo]);

  const openAddDialog = (defaultDirection: 'in' | 'out' = 'in') => {
    setEditingTransaction(null);
    setReceiptFile(null);
    setDirection(defaultDirection);
    setFormData({
      party: partyId,
      direction: defaultDirection,
      amount: '',
      date: new Date().toISOString().split('T')[0],
      payment_method: null,
      receipt: null,
      note: '',
    });
    setShowDialog(true);
  };

  // Expose openAddDialog to parent
  useEffect(() => {
    if (onOpenDialog) {
      (window as any).__openTransactionDialog = openAddDialog;
    }
    return () => {
      delete (window as any).__openTransactionDialog;
    };
  }, [onOpenDialog]);

  const openEditDialog = (transaction: PartyTransaction) => {
    setEditingTransaction(transaction);
    setReceiptFile(null);
    setDirection(transaction.direction);
    setFormData({
      party: transaction.party,
      direction: transaction.direction,
      amount: transaction.amount,
      date: transaction.date,
      payment_method: transaction.payment_method,
      receipt: transaction.receipt,
      note: transaction.note,
    });
    setShowDialog(true);
  };

  const handleSave = async () => {
    // Validation
    if (!formData.amount || !formData.date) {
      toast.error("Amount and date are required");
      return;
    }

    try {
      const updateData = new FormData();
      updateData.append('party', String(formData.party));
      updateData.append('direction', formData.direction || 'in');
      updateData.append('amount', String(formData.amount));
      updateData.append('date', formData.date);
      if (formData.payment_method) {
        updateData.append('payment_method', formData.payment_method);
      }
      if (receiptFile) {
        updateData.append('receipt', receiptFile);
      }
      if (formData.note) {
        updateData.append('note', formData.note);
      }

      if (editingTransaction) {
        await partyTransactionAPI.update(editingTransaction.id, updateData);
        toast.success("Transaction updated");
      } else {
        await partyTransactionAPI.create(updateData);
        toast.success("Transaction added");
      }

      setShowDialog(false);
      setReceiptFile(null);
      
      // Reload transactions
      const txnData = await partyTransactionAPI.list();
      const partyTransactions = txnData.filter(t => t.party === partyId);
      setTransactions(partyTransactions);

      // Reload party to update totals
      const updatedParty = await partyLenderAPI.get(partyId);
      setParty(updatedParty);
    } catch (error) {
      console.error("Failed to save transaction:", error);
      toast.error("Failed to save transaction");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await partyTransactionAPI.delete(id);
      toast.success("Transaction deleted");
      setDeleteConfirmId(null);
      
      // Reload
      const txnData = await partyTransactionAPI.list();
      const partyTransactions = txnData.filter(t => t.party === partyId);
      setTransactions(partyTransactions);

      const updatedParty = await partyLenderAPI.get(partyId);
      setParty(updatedParty);
    } catch (error) {
      console.error("Failed to delete transaction:", error);
      toast.error("Failed to delete transaction");
    }
  };

  const handleShare = async (type: 'transaction' | 'party_ledger', transactionId?: number) => {
    try {
      if (type === 'transaction' && transactionId) {
        // Get the transaction to extract its share_token
        const txn = transactions.find(t => t.id === transactionId);
        if (txn && txn.share_token) {
          const shareUrl = `${window.location.origin}/shares/${txn.share_token}`;
          setShareLink(shareUrl);
          setShareModalOpen(true);
        }
      } else if (type === 'party_ledger') {
        // For party ledger, create a share link
        const shareData = {
          share_type: type,
          party: partyId,
          is_active: true,
        };
        const share = await partyTransactionShareAPI.create(shareData);
        const shareUrl = `${window.location.origin}/shares/${share.token}`;
        setShareLink(shareUrl);
        setShareModalOpen(true);
      }
    } catch (error) {
      console.error("Failed to create share:", error);
      toast.error("Failed to create share link");
    }
  };

  const handleCopyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-gray-500">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-wrap items-center gap-2 bg-gray-50 p-4 rounded-lg border border-gray-200 print:hidden">
        {/* Search */}
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search by ID, amount, note..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
        </div>

        {/* Date Range Filters */}
        <div className="w-36">
          <DateInput
            value={dateFrom}
            onChange={(date) => setDateFrom(date)}
            className="h-10"
          />
        </div>
        <div className="w-36">
          <DateInput
            value={dateTo}
            onChange={(date) => setDateTo(date)}
            className="h-10"
          />
        </div>

        {/* Filter by Type */}
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as 'all' | 'in' | 'out')}
          className="px-3 py-2 h-10 border border-gray-300 rounded-md text-sm bg-white"
        >
          <option value="all">All Types</option>
          <option value="in">Money In</option>
          <option value="out">Money Out</option>
        </select>

        {/* Filter by Payment Method */}
        <select
          value={filterPaymentMethod}
          onChange={(e) => setFilterPaymentMethod(e.target.value)}
          className="px-3 py-2 h-10 border border-gray-300 rounded-md text-sm bg-white"
        >
          <option value="all">All Methods</option>
          <option value="cash">Cash</option>
          <option value="esewa">eSewa</option>
          <option value="bank">Bank Transfer</option>
        </select>

        {/* Clear Filters */}
        {(searchQuery || filterType !== 'all' || filterPaymentMethod !== 'all' || dateFrom || dateTo) && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchQuery('');
              setFilterType('all');
              setFilterPaymentMethod('all');
              setDateFrom('');
              setDateTo('');
            }}
            className="whitespace-nowrap h-10"
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Transactions Table */}
      <div className="space-y-4">
        {filteredTransactions.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            {transactions.length === 0 ? (
              <>
                <p className="text-gray-500 mb-4">No transactions yet</p>
                <Button onClick={() => openAddDialog()} className="bg-[#22C55E] hover:bg-[#22C55E]/90">
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Transaction
                </Button>
              </>
            ) : (
              <>
                <p className="text-gray-500 mb-4">No transactions match your filters</p>
                <Button
                  onClick={() => {
                    setSearchQuery('');
                    setFilterType('all');
                    setFilterPaymentMethod('all');
                    setDateFrom('');
                    setDateTo('');
                  }}
                  variant="outline"
                >
                  Clear Filters
                </Button>
              </>
            )}
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                      <Badge variant="outline" className="ml-2 text-xs font-normal">{dateSystem}</Badge>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Method</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receipt</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Note</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider print:hidden">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredTransactions.map(txn => (
                    <tr 
                      key={txn.id} 
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => router.push(`/dashboard/personal-finance/parties/${generatePartySlug(party)}/${generateShortId(txn.id)}`)}
                    >
                      <td className="px-4 py-3 text-sm">
                        <span className="font-mono text-xs text-gray-900">#{generateShortId(txn.id)}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <div>
                          <p className="font-medium"><FormattedDate value={txn.date} /></p>
                          <p className="text-xs text-gray-500">{new Date(txn.created_at).toLocaleTimeString('en-NP', { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <Badge className={txn.direction === 'out' ? 'bg-red-100 text-red-700 border-0' : 'bg-emerald-100 text-emerald-700 border-0'}>
                          {txn.direction === 'out' ? 'Money Out' : 'Money In'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`font-semibold ${txn.direction === 'out' ? 'text-red-900' : 'text-emerald-900'}`}>
                          Rs. {parseFloat(txn.amount).toLocaleString('en-NP', { maximumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {txn.payment_method ? (
                          <Badge variant="outline" className="text-xs">
                            {txn.payment_method_display}
                          </Badge>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {txn.receipt_url ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs gap-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(txn.receipt_url!, '_blank');
                            }}
                          >
                            <ExternalLink className="h-3 w-3" />
                            View
                          </Button>
                        ) : (
                          <span className="text-gray-400 text-xs">No receipt</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {txn.note ? (
                          <span className="text-xs line-clamp-2">{txn.note}</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-right print:hidden">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShare('transaction', txn.id);
                            }}
                            title="Share"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-red-600 hover:bg-red-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmId(txn.id);
                            }}
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingTransaction ? "Edit Transaction" : "Add Transaction"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Direction Tabs */}
            <div>
              <Label>Transaction Type</Label>
              <div className="flex gap-1 mt-2 bg-gray-100 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => {
                    setDirection('in');
                    setFormData({ ...formData, direction: 'in' });
                  }}
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    direction === 'in'
                      ? 'bg-white text-emerald-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Money In (Received)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDirection('out');
                    setFormData({ ...formData, direction: 'out' });
                  }}
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    direction === 'out'
                      ? 'bg-white text-red-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Money Out (Given)
                </button>
              </div>
            </div>

            <div>
              <Label>Amount <span className="text-red-500">*</span></Label>
              <Input
                type="number"
                value={formData.amount || ''}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="Enter amount"
                className="mt-1"
                step="0.01"
                min="0"
              />
            </div>

            <div>
              <Label>Date <span className="text-red-500">*</span></Label>
              <DateInput
                value={formData.date || ''}
                onChange={(date) => setFormData({ ...formData, date })}
                className="mt-1"
              />
            </div>

            <div>
              <Label>Payment Method</Label>
              <select
                value={formData.payment_method || ''}
                onChange={(e) => setFormData({ ...formData, payment_method: (e.target.value as any) || null })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm mt-1"
              >
                <option value="">Select payment method...</option>
                <option value="cash">Cash</option>
                <option value="esewa">eSewa</option>
                <option value="bank">Bank Transfer</option>
              </select>
            </div>

            <div>
              <Label>Receipt (Image/PDF)</Label>
              <Input
                type="file"
                onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                accept="image/*,.pdf"
                className="mt-1"
              />
            </div>

            <div>
              <Label>Note</Label>
              <Input
                value={formData.note || ''}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                placeholder="Add a note (optional)"
                className="mt-1"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t pt-4">
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-[#22C55E] hover:bg-[#22C55E]/90">
              {editingTransaction ? "Update" : "Add"} Transaction
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      {deleteConfirmId && (
        <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Delete Transaction</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-gray-600 py-4">
              Are you sure you want to delete this transaction?
            </p>
            <div className="flex justify-end gap-2 border-t pt-4">
              <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
                Cancel
              </Button>
              <Button
                onClick={() => handleDelete(deleteConfirmId)}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Share Link Modal */}
      <Dialog open={shareModalOpen} onOpenChange={setShareModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Transaction</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <p className="text-sm text-gray-600">
              Share this link to allow others to view this transaction details without logging in:
            </p>
            
            <div className="flex gap-2">
              <input
                type="text"
                value={shareLink}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50"
              />
              <Button
                onClick={handleCopyShareLink}
                className={`gap-2 ${shareCopied ? 'bg-green-600 hover:bg-green-700' : 'bg-[#22C55E] hover:bg-[#22C55E]/90'}`}
              >
                {shareCopied ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy
                  </>
                )}
              </Button>
            </div>

            {/* Social Share Icons */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(shareLink)}`, '_blank')}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
                title="Share on WhatsApp"
              >
                <WhatsAppIcon className="h-5 w-5 text-green-600" />
              </button>
              <button
                onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareLink)}`, '_blank')}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
                title="Share on Facebook Messenger"
              >
                <FacebookMessengerIcon className="h-5 w-5 text-blue-600" />
              </button>
              <button
                onClick={() => window.open(`https://t.me/share/url?url=${encodeURIComponent(shareLink)}`, '_blank')}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
                title="Share on Telegram"
              >
                <TelegramIcon className="h-5 w-5 text-blue-500" />
              </button>
              <button
                onClick={() => window.open(`mailto:?body=${encodeURIComponent(shareLink)}`, '_blank')}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
                title="Share via Email"
              >
                <EnvelopeIcon className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t pt-4">
            <Button
              onClick={() => setShareModalOpen(false)}
              className="bg-[#22C55E] hover:bg-[#22C55E]/90"
            >
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
