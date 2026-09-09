"use client";

import { PageLoading } from "@/components/shared/PageLoading";
import { useState, useEffect, useMemo, useCallback } from "react";
import { Plus, Search, Trash2, Pencil, CreditCard, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { DashHeader } from "@/components/dashboard/dash-header";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Combobox } from "@/components/ui/combobox";
import { paymentMethodsAPI, accountsAPI, type PaymentMethod, type Account } from "@/lib/api/accounting";
import { getErrorMessage } from "@/lib/utils/form-errors";
import toast from "react-hot-toast";

const METHOD_TYPES = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'digital_wallet', label: 'Digital Wallet' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
];

const TYPE_COLORS: Record<string, string> = {
  cash: 'bg-slate-100 text-slate-800',
  card: 'bg-blue-100 text-blue-800',
  digital_wallet: 'bg-purple-100 text-purple-800',
  cheque: 'bg-orange-100 text-orange-800',
  bank_transfer: 'bg-indigo-100 text-indigo-800',
};

export default function PaymentMethodsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [methodToDelete, setMethodToDelete] = useState<PaymentMethod | null>(null);
  const [deleting, setDeleting] = useState(false);
  
  // Form state
  const [showDialog, setShowDialog] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    method_type: '' as PaymentMethod['method_type'] | '',
    linked_account: '',
    is_active: true,
  });
  const [saving, setSaving] = useState(false);

  const fetchPaymentMethods = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await paymentMethodsAPI.list({ ordering: 'name' });
      setPaymentMethods(data);
    } catch (err: unknown) {
      console.error("Failed to fetch payment methods:", err);
      setPaymentMethods([]);
      setError("Failed to load payment methods. Check that the backend is running.");
      toast.error("Failed to load payment methods");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAccounts = useCallback(async () => {
    try {
      const data = await accountsAPI.list({ 
        status: 'active',
        ordering: 'code'
      });
      // Filter to Cash and Bank accounts only
      const cashBankAccounts = data.filter(a => 
        a.sub_type === 'Cash' || a.sub_type === 'Bank'
      );
      setAccounts(cashBankAccounts);
    } catch (err: unknown) {
      console.error("Failed to fetch accounts:", err);
      toast.error("Failed to load accounts");
    }
  }, []);

  useEffect(() => {
    fetchPaymentMethods();
    fetchAccounts();
  }, [fetchPaymentMethods, fetchAccounts]);

  const handleDelete = async () => {
    if (!methodToDelete) return;
    setDeleting(true);
    try {
      await paymentMethodsAPI.delete(methodToDelete.id);
      toast.success("Payment method deleted");
      setMethodToDelete(null);
      fetchPaymentMethods();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const handleDeactivate = async (method: PaymentMethod) => {
    try {
      await paymentMethodsAPI.patch(method.id, { is_active: false });
      toast.success("Payment method deactivated");
      fetchPaymentMethods();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleActivate = async (method: PaymentMethod) => {
    try {
      await paymentMethodsAPI.patch(method.id, { is_active: true });
      toast.success("Payment method activated");
      fetchPaymentMethods();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    }
  };

  const openCreateDialog = () => {
    setEditingMethod(null);
    setFormData({
      name: '',
      method_type: '',
      linked_account: '',
      is_active: true,
    });
    setShowDialog(true);
  };

  const openEditDialog = (method: PaymentMethod) => {
    setEditingMethod(method);
    setFormData({
      name: method.name,
      method_type: method.method_type,
      linked_account: method.linked_account,
      is_active: method.is_active,
    });
    setShowDialog(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.method_type || !formData.linked_account) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSaving(true);
    try {
      if (editingMethod) {
        await paymentMethodsAPI.update(editingMethod.id, formData);
        toast.success("Payment method updated");
      } else {
        await paymentMethodsAPI.create(formData);
        toast.success("Payment method created");
      }
      setShowDialog(false);
      fetchPaymentMethods();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const filtered = useMemo(() => {
    return paymentMethods.filter((pm) => {
      const q = search.toLowerCase();
      const matchesSearch =
        pm.name.toLowerCase().includes(q) ||
        pm.method_type.toLowerCase().includes(q) ||
        pm.linked_account_name?.toLowerCase().includes(q);
      
      const matchesStatus = 
        statusFilter === 'all' ||
        (statusFilter === 'active' && pm.is_active) ||
        (statusFilter === 'inactive' && !pm.is_active);
      
      return matchesSearch && matchesStatus;
    });
  }, [paymentMethods, search, statusFilter]);

  const accountOptions = useMemo(
    () =>
      accounts.map((a) => ({
        value: a.id,
        label: `${a.code} — ${a.name}`,
        subtitle: a.sub_type,
      })),
    [accounts]
  );

  if (loading) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Payment Methods" subtitle="Loading..." />
        <PageLoading message="Loading payment methods…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Payment Methods" subtitle="Could not load" />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchPaymentMethods} className="bg-[#4A5D7A] hover:bg-[#2E3E52] text-white">
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <DashHeader 
        title="Payment Methods" 
        subtitle="Configure payment methods and their linked GL accounts"
      />

      <div className="space-y-6 p-6">
        {/* Filters and Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search payment methods..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val as typeof statusFilter)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog} className="bg-[#4A5D7A] hover:bg-[#2E3E52] text-white">
                <Plus className="mr-2 h-4 w-4" />
                Add Payment Method
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingMethod ? 'Edit Payment Method' : 'Add Payment Method'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Visa Card, eSewa, Cheque - NIC Asia"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="method_type">Method Type *</Label>
                  <Select
                    value={formData.method_type}
                    onValueChange={(val) => setFormData({ ...formData, method_type: val as PaymentMethod['method_type'] })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type..." />
                    </SelectTrigger>
                    <SelectContent>
                      {METHOD_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="linked_account">Linked Account *</Label>
                  <Combobox
                    options={accountOptions}
                    value={formData.linked_account}
                    onValueChange={(val) => setFormData({ ...formData, linked_account: val })}
                    placeholder="Select account..."
                    emptyText="No accounts found"
                    searchPlaceholder="Search accounts..."
                  />
                  <p className="text-xs text-muted-foreground">
                    Select the GL account where payments using this method will be posted
                  </p>
                </div>

                {editingMethod && (
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="is_active" className="font-normal">Active</Label>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving} className="bg-[#4A5D7A] hover:bg-[#2E3E52] text-white">
                    {saving ? 'Saving...' : editingMethod ? 'Update' : 'Create'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Payment Methods Table */}
        <div className="rounded-lg border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Type</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Linked Account</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      {search || statusFilter !== 'all'
                        ? 'No payment methods found matching your filters'
                        : 'No payment methods yet. Create one to get started.'}
                    </td>
                  </tr>
                ) : (
                  filtered.map((method) => (
                    <tr key={method.id} className="border-b hover:bg-muted/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{method.name}</span>
                          {method.is_system_default && (
                            <Badge variant="outline" className="text-xs">System</Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={TYPE_COLORS[method.method_type] || 'bg-gray-100 text-gray-800'}>
                          {method.method_type_display || method.method_type}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div>
                          <div className="font-medium">{method.linked_account_name}</div>
                          <div className="text-xs text-muted-foreground">{method.linked_account_code}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={method.is_active ? 'default' : 'secondary'}>
                          {method.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(method)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          
                          {method.is_system_default ? (
                            // System default: can only deactivate/activate
                            method.is_active ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeactivate(method)}
                                className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                              >
                                Deactivate
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleActivate(method)}
                                className="text-slate-600 hover:text-slate-700 hover:bg-slate-50"
                              >
                                Activate
                              </Button>
                            )
                          ) : (
                            // Non-system: can delete
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setMethodToDelete(method)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm font-medium text-muted-foreground">Total Methods</div>
            <div className="text-2xl font-bold">{paymentMethods.length}</div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm font-medium text-muted-foreground">Active</div>
            <div className="text-2xl font-bold text-slate-600">
              {paymentMethods.filter(pm => pm.is_active).length}
            </div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm font-medium text-muted-foreground">Inactive</div>
            <div className="text-2xl font-bold text-gray-500">
              {paymentMethods.filter(pm => !pm.is_active).length}
            </div>
          </div>
        </div>
      </div>

      <DeleteConfirmDialog
        open={!!methodToDelete}
        onOpenChange={(open) => !open && setMethodToDelete(null)}
        onConfirm={handleDelete}
        title="Delete Payment Method"
        description={`Are you sure you want to delete "${methodToDelete?.name}"? This action cannot be undone.`}
        loading={deleting}
      />
    </>
  );
}
