"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { partyLenderAPI, PartyLender } from "@/lib/api/personal-finance";
import toast from "react-hot-toast";

interface PartySelectorProps {
  value: number | null;
  onChange: (partyId: number | null, partyName: string) => void;
  label?: string;
  required?: boolean;
}

export function PartySelector({ value, onChange, label = "Select Party", required = true }: PartySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [parties, setParties] = useState<PartyLender[]>([]);
  const [filteredParties, setFilteredParties] = useState<PartyLender[]>([]);
  const [selectedPartyName, setSelectedPartyName] = useState("");
  const [showNewPartyDialog, setShowNewPartyDialog] = useState(false);
  const [newPartyData, setNewPartyData] = useState({ name: "", mobile: "", pan: "", email: "" });
  const [creatingParty, setCreatingParty] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load parties on mount
  useEffect(() => {
    const loadParties = async () => {
      try {
        const data = await partyLenderAPI.list();
        setParties(data);
        if (value) {
          const selected = data.find(p => p.id === value);
          if (selected) setSelectedPartyName(selected.name);
        }
      } catch (error) {
        console.error("Failed to load parties:", error);
      }
    };
    loadParties();
  }, [value]);

  // Filter parties based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredParties(parties);
    } else {
      const lower = searchTerm.toLowerCase();
      setFilteredParties(
        parties.filter(p =>
          p.name.toLowerCase().includes(lower) ||
          p.mobile?.toLowerCase().includes(lower) ||
          p.pan?.toLowerCase().includes(lower)
        )
      );
    }
  }, [searchTerm, parties]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectParty = (party: PartyLender) => {
    onChange(party.id, party.name);
    setSelectedPartyName(party.name);
    setSearchTerm("");
    setIsOpen(false);
  };

  const handleCreateParty = async () => {
    if (!newPartyData.name.trim()) {
      toast.error("Party name is required");
      return;
    }

    try {
      setCreatingParty(true);
      const formData = new FormData();
      formData.append("name", newPartyData.name);
      if (newPartyData.mobile) formData.append("mobile", newPartyData.mobile);
      if (newPartyData.pan) formData.append("pan", newPartyData.pan);
      if (newPartyData.email) formData.append("email", newPartyData.email);

      const createdParty = await partyLenderAPI.create(formData);
      
      // Add new party to list and select it
      setParties([...parties, createdParty]);
      handleSelectParty(createdParty);
      setShowNewPartyDialog(false);
      setNewPartyData({ name: "", mobile: "", pan: "", email: "" });
      toast.success("Party created successfully");
    } catch (error) {
      console.error("Failed to create party:", error);
      toast.error("Failed to create party");
    } finally {
      setCreatingParty(false);
    }
  };

  const handleClear = () => {
    onChange(null, "");
    setSelectedPartyName("");
    setSearchTerm("");
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{label} {required && <span className="text-red-500">*</span>}</Label>
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            Clear
          </button>
        )}
      </div>

      <div ref={dropdownRef} className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-left text-sm bg-white hover:bg-gray-50 flex items-center justify-between"
        >
          <span className={selectedPartyName ? "text-gray-900" : "text-gray-500"}>
            {selectedPartyName || "Select a party..."}
          </span>
          <svg className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50">
            <div className="p-2 border-b border-gray-200">
              <Input
                placeholder="Search parties..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-8"
                autoFocus
              />
            </div>

            <div className="max-h-60 overflow-y-auto">
              {filteredParties.length > 0 ? (
                filteredParties.map(party => (
                  <button
                    key={party.id}
                    type="button"
                    onClick={() => handleSelectParty(party)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
                  >
                    <div className="font-medium">{party.name}</div>
                    {(party.mobile || party.pan) && (
                      <div className="text-xs text-gray-500">
                        {party.mobile && <span>{party.mobile}</span>}
                        {party.mobile && party.pan && <span> • </span>}
                        {party.pan && <span>{party.pan}</span>}
                      </div>
                    )}
                  </button>
                ))
              ) : (
                <div className="px-3 py-4 text-center text-sm text-gray-500">
                  {searchTerm ? "No parties found" : "No parties yet"}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setShowNewPartyDialog(true);
              }}
              className="w-full px-3 py-2 border-t border-gray-200 text-left text-sm text-[#22C55E] hover:bg-emerald-50 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add New Party
            </button>
          </div>
        )}
      </div>

      {/* New Party Dialog */}
      <Dialog open={showNewPartyDialog} onOpenChange={setShowNewPartyDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Party</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-4">
            <div>
              <Label>Name <span className="text-red-500">*</span></Label>
              <Input
                placeholder="Party name"
                value={newPartyData.name}
                onChange={(e) => setNewPartyData({ ...newPartyData, name: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Mobile</Label>
              <Input
                placeholder="Mobile number"
                value={newPartyData.mobile}
                onChange={(e) => setNewPartyData({ ...newPartyData, mobile: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label>PAN</Label>
              <Input
                placeholder="PAN number"
                value={newPartyData.pan}
                onChange={(e) => setNewPartyData({ ...newPartyData, pan: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="Email address"
                value={newPartyData.email}
                onChange={(e) => setNewPartyData({ ...newPartyData, email: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowNewPartyDialog(false);
                setNewPartyData({ name: "", mobile: "", pan: "", email: "" });
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateParty}
              disabled={creatingParty}
              className="bg-[#22C55E] hover:bg-[#22C55E]/90"
            >
              {creatingParty ? "Creating..." : "Create Party"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
