"use client";

import { useState, useMemo, useEffect } from "react";
import { Plus, Trash2, ExternalLink, Download, DollarSign, TrendingUp, TrendingDown, Copy, Check } from "@/lib/icons/lucide-react-shim";
import { WhatsAppIcon, FacebookMessengerIcon, TelegramIcon, EnvelopeIcon } from "@/lib/icons/lucide-react-shim";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import toast from "react-hot-toast";
import { partyTransactionAPI, partyLenderAPI, partyTransactionShareAPI, PartyTransaction, PartyLender } from "@/lib/api/personal-finance";

interface PartyTransactionForm extends Omit<PartyTransaction, 'id' | 'party_name' | 'direction_display' | 'payment_method_display' | 'created_at' | 'updated_at'> {
  party_name?: string;
}

interface Props {
  partyId: number;
}

export function PartyTransactions({ partyId }: Props) {
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

  const [formData, setFormData] = useState<Partial<PartyTransactionForm>>({
    party: partyId,
    direction: 'in',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    payment_method: null,
    receipt: null,
    note: '',
  });

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

  const openAddDialog = () => {
    setEditingTransaction(null);
    setReceiptFile(null);
    setDirection('in');
    setFormData({
      party: partyId,
      direction: 'in',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      payment_method: null,
      receipt: null,
      note: '',
    });
    setShowDialog(true);
  };

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
      if (formData.direction === 'out' && formData.payment_method) {
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
    <div className="space-y-6">
      {/* Summary Cards */}
      {party && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg p-4 border border-emerald-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-emerald-700 uppercase tracking-wider">Total Given</p>
                <p className="text-2xl font-bold text-emerald-900 mt-2">Rs. {party.total_given.toLocaleString('en-NP', { maximumFractionDigits: 2 })}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-emerald-600 opacity-20" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-blue-700 uppercase tracking-wider">Total Received</p>
                <p className="text-2xl font-bold text-blue-900 mt-2">Rs. {party.total_received.toLocaleString('en-NP', { maximumFractionDigits: 2 })}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-blue-600 opacity-20" />
            </div>
          </div>

          <div className={`rounded-lg p-4 border ${
            party.net_balance >= 0 
              ? 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200' 
              : 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-xs font-medium uppercase tracking-wider ${
                  party.net_balance >= 0 ? 'text-orange-700' : 'text-purple-700'
                }`}>
                  {party.net_balance >= 0 ? 'You will get' : 'You owe'}
                </p>
                <p className={`text-2xl font-bold mt-2 ${
                  party.net_balance >= 0 ? 'text-orange-900' : 'text-purple-900'
                }`}>
                  Rs. {Math.abs(party.net_balance).toLocaleString('en-NP', { maximumFractionDigits: 2 })}
                </p>
              </div>
              <DollarSign className={`h-8 w-8 opacity-20 ${
                party.net_balance >= 0 ? 'text-orange-600' : 'text-purple-600'
              }`} />
            </div>
          </div>
        </div>
      )}

      {/* Share Ledger Button */}
      <div className="flex gap-2">
        <Button
          onClick={() => handleShare('party_ledger')}
          variant="outline"
          className="gap-2"
        >
          <ExternalLink className="h-4 w-4" />
          Share Ledger
        </Button>
        <Button
          onClick={openAddDialog}
          className="bg-[#22C55E] hover:bg-[#22C55E]/90 gap-2 ml-auto"
        >
          <Plus className="h-4 w-4" />
          Add Transaction
        </Button>
      </div>

      {/* Transactions */}
      <div className="space-y-4">
        {/* Out Transactions */}
        {outTransactions.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-lg text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
              Money Given ({outTransactions.length})
            </h3>
            <div className="space-y-2">
              {outTransactions.map(txn => (
                <div key={txn.id} className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                  <div>
                    <p className="font-medium text-gray-900">{txn.date}</p>
                    {txn.payment_method && (
                      <Badge className="mt-1 bg-emerald-200 text-emerald-900">{txn.payment_method_display}</Badge>
                    )}
                    {txn.note && <p className="text-sm text-gray-600 mt-1">{txn.note}</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-semibold text-emerald-900">Rs. {parseFloat(txn.amount).toLocaleString('en-NP', { maximumFractionDigits: 2 })}</p>
                    <div className="flex gap-1">
                      {txn.receipt_url && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={() => txn.receipt_url && window.open(txn.receipt_url, '_blank')}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={() => handleShare('transaction', txn.id)}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                        onClick={() => setDeleteConfirmId(txn.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* In Transactions */}
        {inTransactions.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-lg text-gray-900 mb-4 flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-blue-600" />
              Money Received ({inTransactions.length})
            </h3>
            <div className="space-y-2">
              {inTransactions.map(txn => (
                <div key={txn.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div>
                    <p className="font-medium text-gray-900">{txn.date}</p>
                    {txn.note && <p className="text-sm text-gray-600 mt-1">{txn.note}</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-semibold text-blue-900">Rs. {parseFloat(txn.amount).toLocaleString('en-NP', { maximumFractionDigits: 2 })}</p>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={() => handleShare('transaction', txn.id)}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                        onClick={() => setDeleteConfirmId(txn.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {transactions.length === 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <p className="text-gray-500 mb-4">No transactions yet</p>
            <Button onClick={openAddDialog} className="bg-[#22C55E] hover:bg-[#22C55E]/90">
              <Plus className="h-4 w-4 mr-2" />
              Add First Transaction
            </Button>
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
            {/* Direction Toggle */}
            <div>
              <Label>Transaction Type</Label>
              <div className="flex gap-2 mt-2">
                <Button
                  variant={direction === 'in' ? 'default' : 'outline'}
                  onClick={() => {
                    setDirection('in');
                    setFormData({ ...formData, direction: 'in', payment_method: null });
                  }}
                  className={direction === 'in' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                >
                  Money In (Received)
                </Button>
                <Button
                  variant={direction === 'out' ? 'default' : 'outline'}
                  onClick={() => {
                    setDirection('out');
                    setFormData({ ...formData, direction: 'out' });
                  }}
                  className={direction === 'out' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                >
                  Money Out (Given)
                </Button>
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
              <Input
                type="date"
                value={formData.date || ''}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="mt-1"
              />
            </div>

            {direction === 'out' && (
              <>
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
              </>
            )}

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
