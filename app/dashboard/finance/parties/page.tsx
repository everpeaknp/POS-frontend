"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Search, Edit2, Trash2, Users, Phone, Mail, LayoutGrid, List, ChevronRight, TrendingUp, TrendingDown, ExternalLink, Copy, Check, ArrowDownLeft, ArrowUpRight, Upload, DollarSign } from "@/lib/icons/lucide-react-shim";
import { WhatsAppIcon, FacebookMessengerIcon, TelegramIcon, EnvelopeIcon } from "@/lib/icons/lucide-react-shim";
import { DashHeader } from "@/components/dashboard/dash-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProfilePhotoUpload } from "@/components/profile-photo-upload";
import { DateInput } from "@/components/shared/DateInput";
import { PartyTransactions } from "./transactions";
import { PartySelector } from "./party-selector";
import { useAuth } from "@/lib/context/AuthContext";
import toast from "react-hot-toast";
import { partyLenderAPI, partyTransactionAPI, partyTransactionShareAPI } from "@/lib/api/personal-finance";

interface Party {
  id: number;
  name: string;
  pan?: string;
  mobile?: string;
  email?: string;
  photo?: string;
  photo_url?: string;
  total_given: number;
  total_received: number;
  net_balance: number;
  share_token?: string;
  createdAt: string;
}

export default function PartiesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [parties, setParties] = useState<Party[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingParty, setEditingParty] = useState<Party | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [selectedPartyForTransactions, setSelectedPartyForTransactions] = useState<Party | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [balanceFilter, setBalanceFilter] = useState<"all" | "receivable" | "payable">("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [shareCopied, setShareCopied] = useState(false);
  
  // Transaction modal state
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<"in" | "out">("in");
  const [transactionLoading, setTransactionLoading] = useState(false);
  const [transactionPartyId, setTransactionPartyId] = useState<number | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string>("");
  const [transactionFormData, setTransactionFormData] = useState({
    amount: "",
    date: new Date().toISOString().split("T")[0],
    paymentMethod: "cash",
    note: "",
  });

  const [formData, setFormData] = useState<Omit<Party, "id" | "createdAt" | "total_given" | "total_received" | "net_balance">>({
    name: "",
    pan: "",
    mobile: "",
    email: "",
    photo: "",
    photo_url: "",
  });

  const workspaceName = user?.tenant?.workspace_name || user?.tenant?.name || "Workspace";
  const subtitle = `${workspaceName} · Manage parties and lenders`;

  // Generate URL-friendly slug from party name
  const generatePartySlug = (party: Party): string => {
    return party.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
      .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      + `-${party.id}`; // Append ID to ensure uniqueness
  };

  // Calculate totals
  const totals = useMemo(() => {
    return parties.reduce(
      (acc, party) => ({
        totalGiven: acc.totalGiven + party.total_given,
        totalReceived: acc.totalReceived + party.total_received,
        netBalance: acc.netBalance + party.net_balance,
      }),
      { totalGiven: 0, totalReceived: 0, netBalance: 0 }
    );
  }, [parties]);

  const loadParties = async () => {
    try {
      setLoading(true);
      const data = await partyLenderAPI.list();
      const mappedParties = data.map(p => ({
        id: p.id,
        name: p.name,
        pan: p.pan || undefined,
        mobile: p.mobile || undefined,
        email: p.email || undefined,
        photo: p.photo || undefined,
        photo_url: p.photo_url || undefined,
        total_given: p.total_given,
        total_received: p.total_received,
        net_balance: p.net_balance,
        share_token: p.share_token,
        createdAt: p.created_at,
      }));
      setParties(mappedParties as Party[]);
    } catch (error) {
      console.error("Failed to load parties:", error);
      toast.error("Failed to load parties");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadParties();
  }, []);

  useEffect(() => {
    if (searchParams.get("new") === "1") {
      openAddDialog();
      router.replace("/dashboard/finance/parties", { scroll: false });
    }
    
    // Handle edit query parameter
    const editId = searchParams.get("edit");
    if (editId && parties.length > 0) {
      const partyToEdit = parties.find(p => p.id === Number(editId));
      if (partyToEdit) {
        openEditDialog(partyToEdit);
        router.replace("/dashboard/finance/parties", { scroll: false });
      }
    }
    
    // Handle action query parameter for Money In/Out and Add Transaction
    const action = searchParams.get("action");
    if (action === "money-in") {
      openTransactionModal("in");
      router.replace("/dashboard/finance/parties", { scroll: false });
    } else if (action === "money-out") {
      openTransactionModal("out");
      router.replace("/dashboard/finance/parties", { scroll: false });
    } else if (action === "add-transaction") {
      openTransactionModal("in");
      router.replace("/dashboard/finance/parties", { scroll: false });
    }
  }, [searchParams, router, parties]);

  const filteredParties = useMemo(() => {
    let filtered = parties;
    
    // Search filter
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(lower) ||
          p.pan?.toLowerCase().includes(lower) ||
          p.mobile?.toLowerCase().includes(lower) ||
          p.email?.toLowerCase().includes(lower)
      );
    }
    
    // Balance filter
    if (balanceFilter === "receivable") {
      filtered = filtered.filter((p) => p.net_balance > 0);
    } else if (balanceFilter === "payable") {
      filtered = filtered.filter((p) => p.net_balance < 0);
    }
    
    // Date range filter (filter by party creation date)
    if (dateFrom) {
      filtered = filtered.filter((p) => p.createdAt >= dateFrom);
    }
    if (dateTo) {
      filtered = filtered.filter((p) => p.createdAt <= dateTo);
    }
    
    return filtered;
  }, [parties, searchTerm, balanceFilter, dateFrom, dateTo]);

  const openAddDialog = () => {
    setEditingParty(null);
    setPhotoFile(null);
    setFormData({
      name: "",
      pan: "",
      mobile: "",
      email: "",
      photo: "",
      photo_url: "",
    });
    setShowDialog(true);
  };

  const openEditDialog = (party: Party) => {
    setEditingParty(party);
    setPhotoFile(null);
    setFormData({
      name: party.name,
      pan: party.pan || "",
      mobile: party.mobile || "",
      email: party.email || "",
      photo: party.photo || "",
      photo_url: party.photo_url || "",
    });
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("Party name is required");
      return;
    }

    try {
      if (editingParty) {
        const updateData = new FormData();
        updateData.append('name', formData.name);
        if (formData.pan) updateData.append('pan', formData.pan);
        if (formData.mobile) updateData.append('mobile', formData.mobile);
        if (formData.email) updateData.append('email', formData.email);
        if (photoFile) updateData.append('photo', photoFile);
        await partyLenderAPI.update(editingParty.id, updateData);
        toast.success("Party updated successfully");
      } else {
        const createData = new FormData();
        createData.append('name', formData.name);
        if (formData.pan) createData.append('pan', formData.pan);
        if (formData.mobile) createData.append('mobile', formData.mobile);
        if (formData.email) createData.append('email', formData.email);
        if (photoFile) createData.append('photo', photoFile);
        await partyLenderAPI.create(createData);
        toast.success("Party added successfully");
      }

      setShowDialog(false);
      setPhotoFile(null);
      loadParties();
    } catch (error) {
      console.error("Failed to save party:", error);
      toast.error("Failed to save party");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await partyLenderAPI.delete(id);
      toast.success("Party deleted successfully");
      setDeleteConfirmId(null);
      loadParties();
    } catch (error) {
      console.error("Failed to delete party:", error);
      toast.error("Failed to delete party");
    }
  };

  const handleShare = async (party: Party) => {
    try {
      // Check if party already has a share token via the share_token field
      // If it does, we can use it directly
      if (party.share_token) {
        const shareUrl = `${window.location.origin}/shares/party/${party.share_token}`;
        setShareLink(shareUrl);
        setShareModalOpen(true);
        return;
      }
      
      // Otherwise create a new share
      const shareData = await partyTransactionShareAPI.create({
        share_type: 'party_ledger',
        party: party.id,
        is_active: true,
      });
      
      const shareUrl = `${window.location.origin}/shares/party/${shareData.token}`;
      setShareLink(shareUrl);
      setShareModalOpen(true);
      
      // Reload parties to get the updated data
      await loadParties();
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

  const openTransactionModal = (type: "in" | "out") => {
    setTransactionType(type);
    setTransactionPartyId(null);
    setReceiptFile(null);
    setReceiptPreview("");
    setTransactionFormData({
      amount: "",
      date: new Date().toISOString().split("T")[0],
      paymentMethod: "cash",
      note: "",
    });
    setTransactionModalOpen(true);
  };

  const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ["image/jpeg", "image/png", "image/gif", "application/pdf"];
      if (!validTypes.includes(file.type)) {
        toast.error("Please upload an image (JPG, PNG, GIF) or PDF file");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }
      setReceiptFile(file);
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setReceiptPreview(event.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setReceiptPreview("pdf");
      }
    }
  };

  const handleRemoveReceipt = () => {
    setReceiptFile(null);
    setReceiptPreview("");
  };

  const handleSaveTransaction = async () => {
    if (!transactionPartyId) {
      toast.error("Please select a party");
      return;
    }
    if (!transactionFormData.amount || parseFloat(transactionFormData.amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (!transactionFormData.date) {
      toast.error("Please select a date");
      return;
    }
    if (!transactionFormData.paymentMethod) {
      toast.error("Please select a payment method");
      return;
    }

    try {
      setTransactionLoading(true);
      const createData = new FormData();
      createData.append("party", String(transactionPartyId));
      createData.append("direction", transactionType);
      createData.append("amount", transactionFormData.amount);
      createData.append("date", transactionFormData.date);
      createData.append("payment_method", transactionFormData.paymentMethod);
      if (transactionFormData.note) createData.append("note", transactionFormData.note);
      if (receiptFile) createData.append("receipt", receiptFile);

      await partyTransactionAPI.create(createData);
      toast.success("Transaction recorded successfully");
      setTransactionModalOpen(false);
      loadParties();
    } catch (error) {
      console.error("Failed to create transaction:", error);
      toast.error("Failed to record transaction");
    } finally {
      setTransactionLoading(false);
    }
  };

  if (selectedPartyForTransactions) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader 
          title={selectedPartyForTransactions.name} 
          subtitle="Party Transactions"
        />
        <div className="flex-1 p-6 space-y-4">
          <Button
            variant="outline"
            onClick={() => setSelectedPartyForTransactions(null)}
            className="gap-2 mb-4"
          >
            <ChevronRight className="h-4 w-4 rotate-180" />
            Back to Parties
          </Button>
          <PartyTransactions partyId={selectedPartyForTransactions.id} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title="Parties / Lenders" subtitle={subtitle} />

      <div className="flex-1 p-6 space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Money Given Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-2xl font-bold text-gray-900 mb-2">
                  Rs. {totals.totalGiven.toLocaleString('en-NP')}
                </p>
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Total Given</h3>
                <p className="text-xs text-gray-400">Total paid to all parties</p>
              </div>
              <div className="p-2.5 bg-red-50 rounded-lg">
                <ArrowUpRight className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>

          {/* Total Received Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-2xl font-bold text-gray-900 mb-2">
                  Rs. {totals.totalReceived.toLocaleString('en-NP')}
                </p>
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Total Received</h3>
                <p className="text-xs text-gray-400">Total received from all parties</p>
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
                  totals.netBalance >= 0 ? 'text-blue-600' : 'text-gray-700'
                }`}>
                  Rs. {Math.abs(totals.netBalance).toLocaleString('en-NP')}
                </p>
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Net Balance
                </h3>
                <p className="text-xs text-gray-400">
                  {totals.netBalance >= 0 ? 'Total receivable' : 'Total payable'}
                </p>
              </div>
              <div className={`p-2.5 rounded-lg ${
                totals.netBalance >= 0 ? 'bg-blue-50' : 'bg-gray-100'
              }`}>
                <DollarSign className={`h-6 w-6 ${
                  totals.netBalance >= 0 ? 'text-blue-600' : 'text-gray-700'
                }`} />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search parties..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={balanceFilter} onValueChange={(value) => setBalanceFilter(value as "all" | "receivable" | "payable")}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Parties" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Parties</SelectItem>
                <SelectItem value="receivable">Receivable Only</SelectItem>
                <SelectItem value="payable">Payable Only</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <DateInput
                value={dateFrom}
                onChange={setDateFrom}
                className="w-[150px] h-9"
              />
              <span className="text-sm text-gray-400">to</span>
              <DateInput
                value={dateTo}
                onChange={setDateTo}
                className="w-[150px] h-9"
              />
            </div>

            <Button onClick={openAddDialog} className="bg-[var(--color-accent-custom,#22C55E)] hover:bg-[var(--color-accent-custom,#22C55E)]/90">
              <Plus className="h-4 w-4 mr-2" />
              Add Party
            </Button>
            
            <Button onClick={() => openTransactionModal("in")} className="bg-emerald-600 hover:bg-emerald-700">
              <ArrowDownLeft className="h-4 w-4 mr-2" />
              Money In
            </Button>
            
            <Button onClick={() => openTransactionModal("out")} className="bg-red-600 hover:bg-red-700">
              <ArrowUpRight className="h-4 w-4 mr-2" />
              Money Out
            </Button>
            
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("list")}
                className={`h-9 w-9 ${viewMode === "list" ? "bg-[var(--color-accent-custom,#22C55E)] hover:bg-[var(--color-accent-custom,#22C55E)]/90" : ""}`}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("grid")}
                className={`h-9 w-9 ${viewMode === "grid" ? "bg-[var(--color-accent-custom,#22C55E)] hover:bg-[var(--color-accent-custom,#22C55E)]/90" : ""}`}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <p className="text-gray-500">Loading parties...</p>
          </div>
        ) : viewMode === "list" ? (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            {filteredParties.length === 0 ? (
              <div className="p-12 text-center">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">
                  {searchTerm ? "No parties match your search" : "No parties added yet"}
                </p>
                {!searchTerm && (
                  <Button onClick={openAddDialog} className="bg-[var(--color-accent-custom,#22C55E)] hover:bg-[var(--color-accent-custom,#22C55E)]/90">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Party
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Party</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Given</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Received</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Net Balance</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredParties.map((party) => (
                      <tr 
                        key={party.id} 
                        onClick={() => router.push(`/dashboard/finance/parties/${generatePartySlug(party)}`)}
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {party.photo_url ? (
                              <img src={party.photo_url} alt={party.name} className="h-10 w-10 rounded-full object-cover" />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-[var(--color-accent-custom,#22C55E)]/10 flex items-center justify-center">
                                <span className="text-xs font-semibold text-[var(--color-accent-custom,#22C55E)]">{getInitials(party.name)}</span>
                              </div>
                            )}
                            <span className="text-sm font-medium text-left">{party.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-red-600 font-semibold">
                          Rs. {party.total_given.toLocaleString('en-NP')}
                        </td>
                        <td className="px-4 py-3 text-sm text-blue-600 font-semibold">
                          Rs. {party.total_received.toLocaleString('en-NP')}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold">
                          <Badge className={party.net_balance >= 0 ? 'bg-blue-100 text-blue-900' : 'bg-gray-200 text-gray-900'}>
                            {party.net_balance >= 0 ? 'Get' : 'Owe'} Rs. {Math.abs(party.net_balance).toLocaleString('en-NP')}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm">{party.mobile || party.email || "-"}</td>
                        <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2">
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleShare(party);
                              }} 
                              className="h-8 w-8 p-0 hover:bg-gray-100"
                              title="Share Ledger"
                            >
                              <ExternalLink className="h-4 w-4 text-gray-600" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditDialog(party);
                              }} 
                              className="h-8 w-8 p-0 hover:bg-gray-100"
                              title="Edit"
                            >
                              <Edit2 className="h-4 w-4 text-gray-600" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteConfirmId(party.id);
                              }} 
                              className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredParties.length === 0 ? (
              <div className="col-span-full bg-white border border-gray-200 rounded-lg p-12 text-center">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <Button onClick={openAddDialog} className="bg-[var(--color-accent-custom,#22C55E)]">Add Your First Party</Button>
              </div>
            ) : (
              filteredParties.map((party) => (
                <div key={party.id} className="bg-white border border-gray-200 rounded-lg p-4">
                  <button
                    onClick={() => router.push(`/dashboard/finance/parties/${generatePartySlug(party)}`)}
                    className="flex items-start gap-3 mb-4 w-full text-left hover:opacity-80 transition-opacity"
                  >
                    {party.photo_url ? (
                      <img src={party.photo_url} alt={party.name} className="h-12 w-12 rounded-full" />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-[var(--color-accent-custom,#22C55E)]/10 flex items-center justify-center">
                        <span className="text-sm font-semibold text-[var(--color-accent-custom,#22C55E)]">{getInitials(party.name)}</span>
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-medium hover:text-[var(--color-accent-custom,#22C55E)] transition-colors">{party.name}</h3>
                    </div>
                  </button>
                  <div className="flex gap-1 mt-2">
                    <Button size="sm" onClick={() => handleShare(party)} variant="outline" className="text-xs">
                      Share
                    </Button>
                    <Button size="sm" onClick={() => setSelectedPartyForTransactions(party)} className="bg-[var(--color-accent-custom,#22C55E)]">
                      View Txn
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openEditDialog(party)} className="h-8 w-8 p-0">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-2 border-t pt-3 mt-3">
                    <p className="text-xs"><strong>Given:</strong> Rs. {party.total_given.toLocaleString('en-NP')}</p>
                    <p className="text-xs"><strong>Received:</strong> Rs. {party.total_received.toLocaleString('en-NP')}</p>
                    <p className={`text-xs font-semibold ${party.net_balance >= 0 ? 'text-orange-600' : 'text-purple-600'}`}>
                      {party.net_balance >= 0 ? 'Get' : 'Owe'}: Rs. {Math.abs(party.net_balance).toLocaleString('en-NP')}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingParty ? "Edit Party" : "Add Party"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="block text-center mb-2">Photo</Label>
              <div className="flex justify-center">
                <ProfilePhotoUpload
                  existingUrl={formData.photo_url || null}
                  initials={formData.name?.substring(0, 2) || "P"}
                  onChange={(file) => setPhotoFile(file)}
                  onRemove={() => { setPhotoFile(null); setFormData({ ...formData, photo: "", photo_url: "" }); }}
                  variant="compact"
                />
              </div>
            </div>
            <div>
              <Label>Name <span className="text-red-500">*</span></Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div>
              <Label>Mobile</Label>
              <Input value={formData.mobile} onChange={(e) => setFormData({ ...formData, mobile: e.target.value })} />
            </div>
            <div>
              <Label>PAN</Label>
              <Input value={formData.pan} onChange={(e) => setFormData({ ...formData, pan: e.target.value })} />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t pt-4">
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handleSave} className="bg-[var(--color-accent-custom,#22C55E)]">Save</Button>
          </div>
        </DialogContent>
      </Dialog>

      {deleteConfirmId && (
        <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Delete Party</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-gray-600 py-4">
              This will permanently delete this party and all of its transaction history. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
              <Button onClick={() => handleDelete(deleteConfirmId)} className="bg-red-600">Delete</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Share Ledger Modal */}
      <Dialog open={shareModalOpen} onOpenChange={setShareModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Party Ledger</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <p className="text-sm text-gray-600">
              Share this link to allow others to view this party's ledger without logging in:
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
                className={`gap-2 ${shareCopied ? 'bg-green-600 hover:bg-green-700' : 'bg-[var(--color-accent-custom,#22C55E)] hover:bg-[var(--color-accent-custom,#22C55E)]/90'}`}
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
              className="bg-[var(--color-accent-custom,#22C55E)] hover:bg-[var(--color-accent-custom,#22C55E)]/90"
            >
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transaction Modal (Money In/Out) */}
      <Dialog open={transactionModalOpen} onOpenChange={setTransactionModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-blue-600" />
              Add Transaction
            </DialogTitle>
          </DialogHeader>
          
          {/* Tabs for In/Out */}
          <div className="flex gap-2 border-b border-gray-200 pb-2">
            <button
              onClick={() => {
                setTransactionType("in");
                setReceiptFile(null);
                setReceiptPreview("");
              }}
              className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                transactionType === "in"
                  ? "bg-emerald-100 text-emerald-700 border-2 border-emerald-500"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <ArrowDownLeft className="h-4 w-4" />
                Money In
              </div>
            </button>
            <button
              onClick={() => {
                setTransactionType("out");
              }}
              className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                transactionType === "out"
                  ? "bg-red-100 text-red-700 border-2 border-red-500"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <ArrowUpRight className="h-4 w-4" />
                Money Out
              </div>
            </button>
          </div>
          
          <div className="space-y-3 py-2">
            {/* Party Selector */}
            <PartySelector
              value={transactionPartyId}
              onChange={(id) => setTransactionPartyId(id)}
              label="Select Party"
              required
            />

            {/* Amount */}
            <div>
              <Label>Amount (Rs.) <span className="text-red-500">*</span></Label>
              <Input
                type="number"
                placeholder="Enter amount"
                value={transactionFormData.amount}
                onChange={(e) => setTransactionFormData({ ...transactionFormData, amount: e.target.value })}
                className="mt-1"
                step="0.01"
                min="0"
              />
            </div>

            {/* Date */}
            <div>
              <Label>Date <span className="text-red-500">*</span></Label>
              <DateInput
                value={transactionFormData.date}
                onChange={(date) => setTransactionFormData({ ...transactionFormData, date })}
                className="mt-1"
              />
            </div>

            {/* Payment Method (for both In and Out) */}
            <div>
              <Label>Payment Method <span className="text-red-500">*</span></Label>
              <select
                value={transactionFormData.paymentMethod}
                onChange={(e) => setTransactionFormData({ ...transactionFormData, paymentMethod: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-custom,#22C55E)]"
              >
                <option value="">Select payment method...</option>
                <option value="cash">Cash</option>
                <option value="esewa">eSewa</option>
                <option value="bank">Bank Transfer</option>
              </select>
            </div>

            {/* Receipt Upload (for both In and Out) */}
            <div>
              <Label>Receipt (Image/PDF)</Label>
              <div className="mt-1">
                {!receiptFile ? (
                  <label className="flex items-center justify-center w-full px-3 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[var(--color-accent-custom,#22C55E)] hover:bg-emerald-50 transition">
                    <div className="flex flex-col items-center gap-1">
                      <Upload className="h-4 w-4 text-gray-400" />
                      <span className="text-xs text-gray-600">
                        Click to upload
                      </span>
                    </div>
                    <input
                      type="file"
                      onChange={handleReceiptChange}
                      accept="image/png,image/jpeg,image/gif,.pdf"
                      className="hidden"
                    />
                  </label>
                ) : (
                  <div className="space-y-2">
                    {receiptPreview === "pdf" ? (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-red-100 rounded flex items-center justify-center">
                            <span className="text-xs font-bold text-red-600">PDF</span>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-900">{receiptFile.name}</p>
                            <p className="text-xs text-gray-500">
                              {(receiptFile.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleRemoveReceipt}
                          className="text-red-600 hover:bg-red-50 h-7 px-2"
                        >
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <img
                          src={receiptPreview}
                          alt="Receipt preview"
                          className="w-full max-h-32 object-contain rounded-lg border border-gray-200"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleRemoveReceipt}
                          className="w-full text-red-600 hover:bg-red-50 h-7 text-xs"
                        >
                          Remove Image
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Note (Optional) */}
            <div>
              <Label>Note (Optional)</Label>
              <textarea
                placeholder="Add a note..."
                value={transactionFormData.note}
                onChange={(e) => setTransactionFormData({ ...transactionFormData, note: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-custom,#22C55E)]"
                rows={2}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t pt-3">
            <Button
              variant="outline"
              onClick={() => setTransactionModalOpen(false)}
              disabled={transactionLoading}
              className="h-8"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveTransaction}
              disabled={transactionLoading}
              className={`h-8 ${transactionType === "in" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-blue-600 hover:bg-blue-700"}`}
            >
              {transactionLoading ? "Saving..." : "Record Transaction"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
