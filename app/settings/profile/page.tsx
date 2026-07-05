"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DashHeader } from "@/components/dashboard/dash-header";
import { ProfilePhotoUpload } from "@/components/profile-photo-upload";
import { useAuth } from "@/lib/context/AuthContext";
import { getMediaUrl } from "@/lib/utils";
import toast from "react-hot-toast";

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-sm">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  );
}

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [existingAvatarUrl, setExistingAvatarUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        email: user.email || "",
        phone: user.phone || "",
      });
      setExistingAvatarUrl(getMediaUrl(user.avatar));
      setAvatarFile(null);
    }
  }, [user]);

  const updateField = (key: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const updateData: Record<string, unknown> = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        phone: formData.phone.trim(),
      };
      if (avatarFile) updateData.avatar = avatarFile;

      await updateUser(updateData);
      toast.success("Profile updated successfully");
      setAvatarFile(null);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      toast.error(err.response?.data?.detail || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  const initials =
    `${formData.first_name?.[0] || ""}${formData.last_name?.[0] || ""}`.trim() ||
    user?.username?.[0] ||
    "U";

  return (
    <div className="flex flex-col h-full min-h-0">
      <DashHeader
        title="Profile"
        subtitle="Manage your personal information and profile photo"
      />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 lg:p-8 space-y-8 w-full min-h-full">
          {user && (
            <div className="flex flex-wrap gap-4 text-xs text-gray-500 pb-2 border-b border-gray-100">
              <span>
                Username:{" "}
                <span className="font-medium text-gray-700">{user.username}</span>
              </span>
              <span>
                Role:{" "}
                <span className="font-medium text-gray-700 capitalize">{user.role}</span>
              </span>
              {user.tenant && (
                <span>
                  Organization:{" "}
                  <span className="font-medium text-gray-700">{user.tenant.name}</span>
                </span>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2 mb-4">
                Personal Information
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="First name" required>
                    <Input
                      className="h-9 text-sm border-gray-200"
                      value={formData.first_name}
                      onChange={(e) => updateField("first_name", e.target.value)}
                      disabled={isLoading}
                    />
                  </Field>

                  <Field label="Last name" required>
                    <Input
                      className="h-9 text-sm border-gray-200"
                      value={formData.last_name}
                      onChange={(e) => updateField("last_name", e.target.value)}
                      disabled={isLoading}
                    />
                  </Field>

                  <Field label="Email address">
                    <div className="relative">
                      <Input
                        type="email"
                        className="h-9 text-sm border-gray-200 bg-gray-50 text-gray-600 pr-10"
                        value={formData.email}
                        readOnly
                        disabled
                      />
                      <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#22C55E]" />
                    </div>
                  </Field>

                  <Field label="Phone number">
                    <Input
                      type="tel"
                      className="h-9 text-sm border-gray-200"
                      placeholder="+977 98XXXXXXXX"
                      value={formData.phone}
                      onChange={(e) => updateField("phone", e.target.value)}
                      disabled={isLoading}
                    />
                  </Field>
                </div>

                <div className="lg:col-span-1">
                  <ProfilePhotoUpload
                    existingUrl={existingAvatarUrl}
                    initials={initials}
                    disabled={isLoading}
                    onChange={setAvatarFile}
                  />
                </div>
              </div>
            </div>

            <div className="text-xs text-gray-500">
              Your email is verified. To change it, go to{" "}
              <Link href="/settings/security" className="font-medium text-[#22C55E] hover:underline">
                Security settings
              </Link>
              .
            </div>

            <div className="pt-2 border-t border-gray-100">
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-[#22C55E] hover:bg-[#16A34A] text-white px-6"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
