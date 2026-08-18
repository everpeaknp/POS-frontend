"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DashHeader } from "@/components/dashboard/dash-header";
import { ProfilePhotoUpload } from "@/components/profile-photo-upload";
import { partyLenderAPI } from "@/lib/api/personal-finance";
import toast from "react-hot-toast";

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-sm">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</Label>
      {children}
    </div>
  );
}

export default function NewPartyPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    pan: "",
    mobile: "",
    email: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Party name is required");
      return;
    }

    setSubmitting(true);
    try {
      // Create FormData to handle file upload
      const submitData = new FormData();
      submitData.append('name', formData.name);
      if (formData.pan) submitData.append('pan', formData.pan);
      if (formData.mobile) submitData.append('mobile', formData.mobile);
      if (formData.email) submitData.append('email', formData.email);
      if (photoFile) submitData.append('photo', photoFile);
      
      await partyLenderAPI.create(submitData);
      
      toast.success("Party/Lender added successfully");
      router.push("/dashboard/personal-finance/parties");
      router.refresh();
    } catch (error: unknown) {
      console.error("Failed to create party:", error);
      toast.error("Failed to create party");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <DashHeader title="Add Party / Lender" subtitle="Add a new party or lender to your records" />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 lg:p-8 w-full min-h-full">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2 mb-4">Party Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <Field label="Name" required>
                  <Input
                    className="h-9 text-sm border-gray-200"
                    placeholder="e.g., Ram Kumar Sharma"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </Field>

                <Field label="PAN Number">
                  <Input
                    className="h-9 text-sm border-gray-200"
                    placeholder="e.g., 123456789"
                    value={formData.pan}
                    onChange={(e) => setFormData((prev) => ({ ...prev, pan: e.target.value }))}
                  />
                </Field>

                <Field label="Mobile Number">
                  <Input
                    className="h-9 text-sm border-gray-200"
                    placeholder="e.g., +977-9841234567"
                    value={formData.mobile}
                    onChange={(e) => setFormData((prev) => ({ ...prev, mobile: e.target.value }))}
                  />
                </Field>

                <Field label="Email Address">
                  <Input
                    type="email"
                    className="h-9 text-sm border-gray-200"
                    placeholder="e.g., contact@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  />
                </Field>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2 mb-4">Photo</h3>
              <Field label="Profile Photo">
                <div className="mt-2">
                  <ProfilePhotoUpload
                    existingUrl={null}
                    initials={formData.name ? formData.name.substring(0, 2) : "P"}
                    onChange={(file) => setPhotoFile(file)}
                    onRemove={() => setPhotoFile(null)}
                    variant="compact"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Optional: Upload a photo for this party/lender
                </p>
              </Field>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-700">
                <strong>Note:</strong> Only the Name field is required. All other fields (PAN, Mobile, Email, Photo) are optional.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#22C55E] hover:bg-[#16A34A] text-white px-6"
                disabled={submitting}
              >
                {submitting ? "Saving..." : "Save Party"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
