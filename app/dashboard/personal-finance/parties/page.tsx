"use client";

import { useState, useMemo, useEffect } from "react";
import { Plus, Search, Edit2, Trash2, Users, User, Phone, Mail } from "lucide-react";
import { DashHeader } from "@/components/dashboard/dash-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ProfilePhotoUpload } from "@/components/profile-photo-upload";
import { useAuth } from "@/lib/context/AuthContext";
import toast from "react-hot-toast";
import { partyLenderAPI } from "@/lib/api/personal-finance";

// MOCK DATA STRUCTURE
// TODO: Replace with real backend API calls when endpoints are ready

interface Party {
  id: number;
  name: string;
  pan?: string;
  mobile?: string;
  email?: string;
  photo?: string;
  createdAt: string;
}

export default function PartiesPage() {
  const { user } = useAuth();
  const [parties, setParties] = useState<Party[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingParty, setEditingParty] = useState<Party | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  // Form state
  const [formData, setFormData] = useState<Omit<Party, "id" | "createdAt">>({
    name: "",
    pan: "",
    mobile: "",
    email: "",
    photo: "",
  });

  const workspaceName = user?.tenant?.workspace_name || user?.tenant?.name || "Workspace";
  const subtitle = `${workspaceName} · Manage parties and lenders`;

  // Load parties from backend
  const loadParties = async () => {
    try {
      setLoading(true);
      const data = await partyLenderAPI.list();
      setParties(data.map(p => ({
        id: p.id,
        name: p.name,
        pan: p.pan,
        mobile: p.mobile,
        email: p.email,
        photo: p.photo,
        createdAt: p.created_at,
      })));
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

  // Filtered parties
  const filteredParties = useMemo(() => {
    if (!searchTerm) return parties;
    
    const lower = searchTerm.toLowerCase();
    return parties.filter(
      (p) =>
        p.name.toLowerCase().includes(lower) ||
        p.pan?.toLowerCase().includes(lower) ||
        p.mobile?.toLowerCase().includes(lower) ||
        p.email?.toLowerCase().includes(lower)
    );
  }, [parties, searchTerm]);

  const openAddDialog = () => {
    setEditingParty(null);
    setPhotoFile(null);
    setFormData({
      name: "",
      pan: "",
      mobile: "",
      email: "",
      photo: "",
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
    });
    setShowDialog(true);
  };

  const handleSave = async () => {
    // Validation - only name is required
    if (!formData.name.trim()) {
      toast.error("Party name is required");
      return;
    }

    try {
      if (editingParty) {
        // Update existing party
        const updateData = new FormData();
        updateData.append('name', formData.name);
        if (formData.pan) updateData.append('pan', formData.pan);
        if (formData.mobile) updateData.append('mobile', formData.mobile);
        if (formData.email) updateData.append('email', formData.email);
        if (photoFile) updateData.append('photo', photoFile);

        await partyLenderAPI.update(editingParty.id, updateData);
        toast.success("Party updated successfully");
      } else {
        // Add new party
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
      loadParties(); // Reload list from backend
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
      loadParties(); // Reload list from backend
    } catch (error) {
      console.error("Failed to delete party:", error);
      toast.error("Failed to delete party");
    }
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title="Parties / Lenders" subtitle={subtitle} />

      <div className="flex-1 p-6 space-y-4">
        {/* Summary Card */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Parties</p>
              <p className="text-2xl font-bold text-gray-900">{parties.length}</p>
            </div>
            <Users className="h-8 w-8 text-[#22C55E]" />
          </div>
        </div>

        {/* Toolbar */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search parties by name, PAN, mobile, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button onClick={openAddDialog} className="bg-[#22C55E] hover:bg-[#22C55E]/90">
              <Plus className="h-4 w-4 mr-2" />
              Add Party
            </Button>
          </div>
        </div>

        {/* Parties Grid */}
        {loading ? (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <p className="text-gray-500">Loading parties...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredParties.length === 0 ? (
              <div className="col-span-full bg-white border border-gray-200 rounded-lg p-12 text-center">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">
                  {searchTerm ? "No parties match your search" : "No parties added yet"}
                </p>
                {!searchTerm && (
                  <Button onClick={openAddDialog} className="bg-[#22C55E] hover:bg-[#22C55E]/90">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Party
                  </Button>
                )}
              </div>
            ) : (
              filteredParties.map((party) => (
              <div
                key={party.id}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-start gap-3 mb-4">
                  {/* Avatar */}
                  {party.photo ? (
                    <img
                      src={party.photo}
                      alt={party.name}
                      className="h-12 w-12 rounded-full object-cover border-2 border-gray-200"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-[#22C55E]/10 border-2 border-[#22C55E]/20 flex items-center justify-center">
                      <span className="text-sm font-semibold text-[#22C55E]">
                        {getInitials(party.name)}
                      </span>
                    </div>
                  )}

                  {/* Name and Actions */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">{party.name}</h3>
                    {party.pan && (
                      <p className="text-xs text-gray-500 mt-1">PAN: {party.pan}</p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(party)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteConfirmId(party.id)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Contact Details */}
                <div className="space-y-2 border-t border-gray-100 pt-3">
                  {party.mobile && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="truncate">{party.mobile}</span>
                    </div>
                  )}
                  {party.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="truncate">{party.email}</span>
                    </div>
                  )}
                  {!party.mobile && !party.email && (
                    <p className="text-xs text-gray-400 italic">No contact details</p>
                  )}
                </div>
              </div>
            ))
          )}
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingParty ? "Edit Party" : "Add Party"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Ram Kumar Sharma"
                className="mt-1"
              />
            </div>

            <div>
              <Label>PAN Number</Label>
              <Input
                value={formData.pan}
                onChange={(e) => setFormData({ ...formData, pan: e.target.value })}
                placeholder="e.g., 123456789 (optional)"
                className="mt-1"
              />
            </div>

            <div>
              <Label>Mobile Number</Label>
              <Input
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                placeholder="e.g., +977-9841234567 (optional)"
                className="mt-1"
              />
            </div>

            <div>
              <Label>Email Address</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="e.g., contact@example.com (optional)"
                className="mt-1"
              />
            </div>

            <div>
              <Label>Photo</Label>
              <div className="mt-2">
                <ProfilePhotoUpload
                  existingUrl={formData.photo || null}
                  initials={formData.name ? formData.name.substring(0, 2) : "P"}
                  onChange={(file) => setPhotoFile(file)}
                  onRemove={() => {
                    setPhotoFile(null);
                    setFormData({ ...formData, photo: "" });
                  }}
                  variant="compact"
                />
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <p className="text-xs text-blue-700">
                <strong>Note:</strong> Only Name is required. All other fields are optional.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t pt-4">
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-[#22C55E] hover:bg-[#22C55E]/90">
              {editingParty ? "Update" : "Add"} Party
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      {deleteConfirmId && (
        <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Delete Party</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-gray-600 py-4">
              Are you sure you want to delete this party? This action cannot be undone.
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
    </div>
  );
}
