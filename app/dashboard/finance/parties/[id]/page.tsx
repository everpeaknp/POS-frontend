"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { ChevronLeft, Edit2, Mail, Phone, ExternalLink, Copy, Check, User, Calendar, TrendingUp, TrendingDown, DollarSign, ArrowUpRight, ArrowDownLeft, Plus, Printer } from "@/lib/icons/lucide-react-shim";
import { WhatsAppIcon, FacebookMessengerIcon, TelegramIcon, EnvelopeIcon } from "@/lib/icons/lucide-react-shim";
import { DashHeader } from "@/components/dashboard/dash-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormattedDate } from "@/components/shared/FormattedDate";
import { useDateSystemStore } from "@/lib/stores/dateSystemStore";
import { PartyTransactions } from "../transactions";
import { useAuth } from "@/lib/context/AuthContext";
import toast from "react-hot-toast";
import { partyLenderAPI } from "@/lib/api/personal-finance";

interface Party {
  id: number;
  name: string;
  pan?: string | null;
  mobile?: string | null;
  email?: string | null;
  photo?: string | null;
  photo_url?: string | null;
  total_given: number;
  total_received: number;
  net_balance: number;
  share_token?: string | null;
  createdAt: string;
}

export default function PartyDetailPage() {
  const { user } = useAuth();
  const dateSystem = useDateSystemStore((state) => state.dateSystem);
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const editTransactionParam = searchParams.get('edit-transaction');
  const initialEditTransactionId = editTransactionParam ? parseInt(editTransactionParam, 10) : null;

  // Extract party ID from slug (slug format: "party-name-123")
  const extractIdFromSlug = (slug: string): number => {
    const parts = slug.split('-');
    const lastPart = parts[parts.length - 1];
    const id = parseInt(lastPart, 10);
    return isNaN(id) ? parseInt(slug, 10) : id; // Fallback to parsing the whole slug if it's just a number
  };
  
  const partyId = extractIdFromSlug(params.id as string);
  
  const [party, setParty] = useState<Party | null>(null);
  const [loading, setLoading] = useState(true);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [shareCopied, setShareCopied] = useState(false);
  
  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    pan: '',
    mobile: '',
    email: '',
  });

  const workspaceName = user?.tenant?.workspace_name || user?.tenant?.name || "Workspace";

  const loadParty = async () => {
    try {
      setLoading(true);
      const data = await partyLenderAPI.get(partyId);
      const mappedParty: Party = {
        id: data.id,
        name: data.name,
        pan: data.pan,
        mobile: data.mobile,
        email: data.email,
        photo: typeof data.photo === 'string' ? data.photo : null,
        photo_url: data.photo_url,
        total_given: data.total_given,
        total_received: data.total_received,
        net_balance: data.net_balance,
        share_token: data.share_token,
        createdAt: data.created_at,
      };
      setParty(mappedParty);
    } catch (error) {
      console.error("Failed to load party:", error);
      toast.error("Failed to load party details");
      router.push("/dashboard/finance/parties");
    } finally {
      setLoading(false);
    }
  };

  const handleEditSave = async () => {
    if (!editFormData.name.trim()) {
      toast.error('Party name is required');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('name', editFormData.name);
      if (editFormData.pan) formData.append('pan', editFormData.pan);
      if (editFormData.mobile) formData.append('mobile', editFormData.mobile);
      if (editFormData.email) formData.append('email', editFormData.email);
      if (photoFile) {
        formData.append('photo', photoFile);
      }

      await partyLenderAPI.update(party!.id, formData);
      toast.success('Party updated successfully');
      setEditDialogOpen(false);
      await loadParty(); // Reload party data
    } catch (error: any) {
      console.error('Failed to update party:', error);
      toast.error(error.response?.data?.message || 'Failed to update party');
    }
  };

  useEffect(() => {
    if (partyId) {
      loadParty();
    }
  }, [partyId]);

  // Page size for the printed ledger. Hiding the dashboard chrome (sidebar,
  // icon rail, widgets) and letting #printable-ledger flow across pages is
  // handled by the shared print stylesheet in app/dashboard/layout.tsx —
  // this only needs to set the paper size/margins, so it's pure CSS with no
  // DOM manipulation (moving React-managed nodes around the DOM directly, as
  // this used to do, fights React's own reconciliation of that subtree).
  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'party-ledger-print-page-style';
    style.textContent = `
      @media print {
        @page {
          size: A4;
          margin: 15mm;
        }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);


  const handleShare = async () => {
    if (!party) return;

    try {
      // Always issue a fresh token — each "Share Ledger" click should hand
      // out a brand-new link and invalidate any link shared previously.
      const updatedParty = await partyLenderAPI.regenerateShareLink(party.id);
      if (!updatedParty.share_token) {
        toast.error("Failed to generate share link");
        return;
      }
      setParty((prev) => (prev ? { ...prev, share_token: updatedParty.share_token } : null));

      const shareUrl = `${window.location.origin}/shares/party/${updatedParty.share_token}`;
      setShareLink(shareUrl);
      setShareModalOpen(true);
    } catch (error: any) {
      console.error("Failed to generate share link:", error);
      toast.error(error.response?.data?.message || "Failed to generate share link");
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

  const getInitials = (name: string) => {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-full bg-gray-50">
        <DashHeader title="Party Details" subtitle={`${workspaceName} · Loading...`} />
        <div className="flex-1 p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-accent-custom,#22C55E)] mx-auto mb-4"></div>
            <p className="text-gray-500">Loading party details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!party) {
    return null;
  }

  return (
    <div className="flex flex-col min-h-full bg-gray-50 print:bg-white">
      <div className="print:hidden">
        <DashHeader title={party.name} subtitle={`${workspaceName} · Party Details & Ledger`} />
      </div>

      <div id="printable-ledger" className="flex-1 p-6 space-y-4 print:p-0 print:space-y-3 print:bg-white">
        {/* Print-only Header */}
        <div className="hidden print:block bg-white border-b-2 border-gray-800 pb-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{workspaceName}</h1>
              <p className="text-sm text-gray-600">Party Ledger Statement</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Generated on</p>
              <p className="text-sm font-medium">{new Date().toLocaleDateString('en-NP', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>
        </div>
        {/* Print-only Party Info — plain key/value block, no card chrome */}
        <div className="hidden print:block mb-4 pb-4 border-b border-gray-300">
          <h2 className="text-lg font-bold text-gray-900 mb-3">{party.name}</h2>
          <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 text-sm">
            {party.mobile && (
              <div className="flex gap-2">
                <span className="text-gray-500 w-20 shrink-0">Mobile</span>
                <span className="text-gray-900 font-medium">{party.mobile}</span>
              </div>
            )}
            {party.email && (
              <div className="flex gap-2">
                <span className="text-gray-500 w-20 shrink-0">Email</span>
                <span className="text-gray-900 font-medium">{party.email}</span>
              </div>
            )}
            {party.pan && (
              <div className="flex gap-2">
                <span className="text-gray-500 w-20 shrink-0">PAN</span>
                <span className="text-gray-900 font-medium">{party.pan}</span>
              </div>
            )}
            <div className="flex gap-2">
              <span className="text-gray-500 w-20 shrink-0">Since</span>
              <span className="text-gray-900 font-medium">
                <FormattedDate value={party.createdAt} /> ({dateSystem})
              </span>
            </div>
          </div>
        </div>

        {/* Hero Section - Party Profile (screen only) */}
        <div className="bg-gradient-to-br from-[var(--color-accent-custom,#22C55E)] to-emerald-600 rounded-lg shadow-md overflow-hidden print:hidden">
          <div className="p-6 print:p-4">
            {/* Edit Profile Button - Top Right */}
            <div className="flex justify-end mb-4 print:hidden">
              <Button
                onClick={() => {
                  setEditFormData({
                    name: party.name,
                    pan: party.pan || '',
                    mobile: party.mobile || '',
                    email: party.email || '',
                  });
                  setPhotoFile(null);
                  setEditDialogOpen(true);
                }}
                size="sm"
                className="bg-white text-[var(--color-accent-custom,#22C55E)] hover:bg-white/90 gap-1.5 h-8 text-xs"
              >
                <Edit2 className="h-3.5 w-3.5" />
                Edit Profile
              </Button>
            </div>
            
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
              {/* Photo */}
              <div className="shrink-0">
                {party.photo_url ? (
                  <img 
                    src={party.photo_url} 
                    alt={party.name} 
                    className="h-20 w-20 rounded-full object-cover border-4 border-white shadow-lg" 
                  />
                ) : (
                  <div className="h-20 w-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-4 border-white shadow-lg">
                    <span className="text-3xl font-bold text-white">{getInitials(party.name)}</span>
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="flex-1 text-white print:text-gray-900">
                <h1 className="text-2xl font-bold mb-2 print:text-xl">{party.name}</h1>
                <div className="flex flex-wrap gap-2 mb-3 print:mb-2">
                  {party.mobile && (
                    <div className="flex items-center gap-1.5 text-white/90 bg-white/10 backdrop-blur-sm rounded-md px-2.5 py-1 print:bg-gray-100 print:text-gray-900 print:border print:border-gray-300">
                      <Phone className="h-3.5 w-3.5" />
                      <span className="text-xs font-medium">{party.mobile}</span>
                    </div>
                  )}
                  {party.email && (
                    <div className="flex items-center gap-1.5 text-white/90 bg-white/10 backdrop-blur-sm rounded-md px-2.5 py-1 print:bg-gray-100 print:text-gray-900 print:border print:border-gray-300">
                      <Mail className="h-3.5 w-3.5" />
                      <span className="text-xs font-medium">{party.email}</span>
                    </div>
                  )}
                  {party.pan && (
                    <div className="flex items-center gap-1.5 text-white/90 bg-white/10 backdrop-blur-sm rounded-md px-2.5 py-1 print:bg-gray-100 print:text-gray-900 print:border print:border-gray-300">
                      <User className="h-3.5 w-3.5" />
                      <span className="text-xs font-medium">PAN: {party.pan}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-white/90 bg-white/10 backdrop-blur-sm rounded-md px-2.5 py-1 print:bg-gray-100 print:text-gray-900 print:border print:border-gray-300">
                    <Calendar className="h-3.5 w-3.5" />
                    <span className="text-xs font-medium">Since <FormattedDate value={party.createdAt} /> ({dateSystem})</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Print-only Summary — plain 3-column row, no card chrome */}
        <div className="hidden print:grid grid-cols-3 gap-6 mb-4 pb-4 border-b border-gray-300">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Money Given</p>
            <p className="text-xl font-bold text-gray-900">Rs. {party.total_given.toLocaleString('en-NP')}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Money Received</p>
            <p className="text-xl font-bold text-gray-900">Rs. {party.total_received.toLocaleString('en-NP')}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
              {party.net_balance >= 0 ? 'Net Balance (Receivable)' : 'Net Balance (Payable)'}
            </p>
            <p className="text-xl font-bold text-gray-900">Rs. {Math.abs(party.net_balance).toLocaleString('en-NP')}</p>
          </div>
        </div>

        {/* Financial Summary Cards (screen only) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:hidden">
          {/* Money Given Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-2xl font-bold text-gray-900 mb-2">
                  Rs. {party.total_given.toLocaleString('en-NP')}
                </p>
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Money Given</h3>
                <p className="text-xs text-gray-400">Total paid to party</p>
              </div>
              <div className="p-2.5 bg-red-50 rounded-lg">
                <ArrowUpRight className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>

          {/* Money Received Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-2xl font-bold text-gray-900 mb-2">
                  Rs. {party.total_received.toLocaleString('en-NP')}
                </p>
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Money Received</h3>
                <p className="text-xs text-gray-400">Total received from party</p>
              </div>
              <div className="p-2.5 bg-emerald-50 rounded-lg">
                <ArrowDownLeft className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </div>

          {/* Net Balance Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className={`text-2xl font-bold mb-2 ${
                  party.net_balance >= 0 ? 'text-orange-600' : 'text-purple-600'
                }`}>
                  Rs. {Math.abs(party.net_balance).toLocaleString('en-NP')}
                </p>
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Net Balance
                </h3>
                <p className="text-xs text-gray-400">
                  {party.net_balance >= 0 ? 'Receivable from party' : 'Payable to party'}
                </p>
              </div>
              <div className={`p-2.5 rounded-lg ${
                party.net_balance >= 0 ? 'bg-orange-50' : 'bg-purple-50'
              }`}>
                <DollarSign className={`h-6 w-6 ${
                  party.net_balance >= 0 ? 'text-orange-600' : 'text-purple-600'
                }`} />
              </div>
            </div>
          </div>
        </div>

        {/* Transaction History Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden print:shadow-none print:border-none print:rounded-none">
          <div className="border-b border-gray-200 bg-gray-50/50 px-5 py-3 print:bg-white print:border-gray-300 print:px-0">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Transaction History</h2>
                <p className="text-xs text-gray-600 mt-0.5 print:hidden">Complete ledger of all transactions</p>
              </div>
              <div className="flex gap-2 print:hidden">
                <Button
                  onClick={() => window.print()}
                  size="sm"
                  variant="outline"
                  className="border-gray-300 hover:bg-gray-50 gap-1.5 h-8"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Print Ledger
                </Button>
                <Button
                  onClick={handleShare}
                  size="sm"
                  variant="outline"
                  className="border-gray-300 hover:bg-gray-50 gap-1.5 h-8"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Share Ledger
                </Button>
                <Button 
                  onClick={() => {
                    if ((window as any).__openTransactionDialog) {
                      (window as any).__openTransactionDialog('in');
                    }
                  }}
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 gap-1.5 h-8"
                >
                  <ArrowDownLeft className="h-3.5 w-3.5" />
                  Payment In
                </Button>
                <Button 
                  onClick={() => {
                    if ((window as any).__openTransactionDialog) {
                      (window as any).__openTransactionDialog('out');
                    }
                  }}
                  size="sm"
                  className="bg-red-600 hover:bg-red-700 gap-1.5 h-8"
                >
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  Payment Out
                </Button>
              </div>
            </div>
          </div>
          
          <div className="p-5 print:p-0 print:pt-3">
            <PartyTransactions
              partyId={party.id}
              onOpenDialog={() => {}}
              initialEditTransactionId={initialEditTransactionId}
              onInitialEditConsumed={() => router.replace(`/dashboard/finance/parties/${params.id}`, { scroll: false })}
            />
          </div>
        </div>

        {/* Print Footer */}
        <div className="hidden print:block mt-8 pt-4 border-t-2 border-gray-300">
          <div className="text-center text-xs text-gray-600 space-y-1">
            <p className="font-medium">End of Statement</p>
            <p>This is a computer-generated ledger statement and does not require a signature.</p>
            <p className="text-gray-500 mt-2">Generated from {workspaceName} - Personal Finance Management System</p>
            <p className="text-gray-400 mt-1">Page generated on {new Date().toLocaleString('en-NP')}</p>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      <Dialog open={shareModalOpen} onOpenChange={setShareModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5 text-[var(--color-accent-custom,#22C55E)]" />
              Share Party Ledger
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <p className="text-sm text-gray-600">
              Share this secure link to allow others to view {party.name}'s ledger without logging in.
              Any link shared before this one will stop working.
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                value={shareLink}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 font-mono"
              />
              <Button
                onClick={handleCopyShareLink}
                className={`gap-2 ${shareCopied ? 'bg-green-600 hover:bg-green-700' : 'bg-[var(--color-accent-custom,#22C55E)] hover:bg-[var(--color-accent-custom,#22C55E)]/90'}`}
              >
                {shareCopied ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy
                  </>
                )}
              </Button>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm font-medium text-gray-700 mb-3">Share via</p>
              <div className="flex gap-2">
                <button
                  onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(shareLink)}`, '_blank')}
                  className="flex-1 p-3 hover:bg-gray-100 rounded-lg transition flex items-center justify-center gap-2 border border-gray-200"
                  title="Share on WhatsApp"
                >
                  <WhatsAppIcon className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium">WhatsApp</span>
                </button>
                <button
                  onClick={() => window.open(`https://t.me/share/url?url=${encodeURIComponent(shareLink)}`, '_blank')}
                  className="flex-1 p-3 hover:bg-gray-100 rounded-lg transition flex items-center justify-center gap-2 border border-gray-200"
                  title="Share on Telegram"
                >
                  <TelegramIcon className="h-5 w-5 text-blue-500" />
                  <span className="text-sm font-medium">Telegram</span>
                </button>
                <button
                  onClick={() => window.open(`mailto:?body=${encodeURIComponent(shareLink)}`, '_blank')}
                  className="flex-1 p-3 hover:bg-gray-100 rounded-lg transition flex items-center justify-center gap-2 border border-gray-200"
                  title="Share via Email"
                >
                  <EnvelopeIcon className="h-5 w-5 text-gray-600" />
                  <span className="text-sm font-medium">Email</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t pt-4">
            <Button
              onClick={() => setShareModalOpen(false)}
              className="bg-[var(--color-accent-custom,#22C55E)] hover:bg-[var(--color-accent-custom,#22C55E)]/90"
            >
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Profile Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="h-5 w-5 text-[var(--color-accent-custom,#22C55E)]" />
              Edit Party Profile
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                placeholder="Enter party name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-pan">PAN Number</Label>
              <Input
                id="edit-pan"
                value={editFormData.pan}
                onChange={(e) => setEditFormData({ ...editFormData, pan: e.target.value })}
                placeholder="Enter PAN number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-mobile">Mobile Number</Label>
              <Input
                id="edit-mobile"
                value={editFormData.mobile}
                onChange={(e) => setEditFormData({ ...editFormData, mobile: e.target.value })}
                placeholder="Enter mobile number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editFormData.email}
                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                placeholder="Enter email address"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-photo">Photo</Label>
              <Input
                id="edit-photo"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setPhotoFile(file);
                  }
                }}
              />
              {photoFile && (
                <p className="text-xs text-gray-600">Selected: {photoFile.name}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t pt-4">
            <Button
              onClick={() => setEditDialogOpen(false)}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditSave}
              className="bg-[var(--color-accent-custom,#22C55E)] hover:bg-[var(--color-accent-custom,#22C55E)]/90"
            >
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
