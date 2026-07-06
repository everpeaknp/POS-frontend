"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CheckCircle2, ImageIcon, Loader2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProfilePhotoUpload } from "@/components/profile-photo-upload";
import { useAuth } from "@/lib/context/AuthContext";
import { getMediaUrl } from "@/lib/utils";
import type { ProfileUpdateData } from "@/lib/types/user";
import toast from "react-hot-toast";
import { SettingsPageShell } from "@/components/settings/SettingsPageShell";
import {
  SettingsCard,
  SettingsCardBody,
  SettingsCardHeader,
  SettingsField,
  SettingsNotice,
  SettingsPageContent,
  settingsInputClass,
} from "@/components/settings/settings-ui";

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
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
      setRemoveAvatar(false);
    }
  }, [user]);

  const updateField = (key: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const updateData: ProfileUpdateData = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        phone: formData.phone.trim(),
      };
      if (avatarFile) updateData.avatar = avatarFile;
      if (removeAvatar) updateData.remove_avatar = true;

      await updateUser(updateData);
      toast.success("Profile updated successfully");
      setAvatarFile(null);
      setRemoveAvatar(false);
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

  const displayAvatarUrl = removeAvatar ? null : existingAvatarUrl;

  return (
    <SettingsPageShell
      title="Profile"
      subtitle="Manage your personal information and profile photo"
    >
      <SettingsPageContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,17rem)_1fr]">
            <SettingsCard>
              <SettingsCardHeader
                icon={ImageIcon}
                title="Profile photo"
                description="Your avatar across Khata"
              />
              <SettingsCardBody className="flex justify-center">
                <ProfilePhotoUpload
                  layout="stacked"
                  align="center"
                  existingUrl={displayAvatarUrl}
                  initials={initials}
                  disabled={isLoading}
                  onChange={(file) => {
                    setAvatarFile(file);
                    if (file) setRemoveAvatar(false);
                  }}
                  onRemove={() => setRemoveAvatar(true)}
                />
              </SettingsCardBody>
            </SettingsCard>

            <SettingsCard>
              <SettingsCardHeader
                icon={User}
                title="Personal information"
                description="Name and contact details"
              />
              <SettingsCardBody className="space-y-5">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <SettingsField label="First name">
                    <input
                      className={settingsInputClass}
                      value={formData.first_name}
                      onChange={(e) => updateField("first_name", e.target.value)}
                      disabled={isLoading}
                      required
                      autoComplete="given-name"
                    />
                  </SettingsField>

                  <SettingsField label="Last name">
                    <input
                      className={settingsInputClass}
                      value={formData.last_name}
                      onChange={(e) => updateField("last_name", e.target.value)}
                      disabled={isLoading}
                      required
                      autoComplete="family-name"
                    />
                  </SettingsField>
                </div>

                <SettingsField label="Phone number" hint="Used for account recovery and alerts">
                  <input
                    type="tel"
                    className={settingsInputClass}
                    placeholder="+977 98XXXXXXXX"
                    value={formData.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    disabled={isLoading}
                    autoComplete="tel"
                  />
                </SettingsField>

                <SettingsField label="Email address" hint="Managed in Security settings">
                  <div className="relative">
                    <input
                      type="email"
                      className={`${settingsInputClass} bg-muted pr-10 text-muted-foreground`}
                      value={formData.email}
                      readOnly
                      disabled
                    />
                    <CheckCircle2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#22C55E]" />
                  </div>
                </SettingsField>

                {user && (
                  <p className="text-xs text-muted-foreground">
                    Signed in as{" "}
                    <span className="font-medium text-foreground">{user.username}</span>
                    {" · "}
                    <span className="capitalize">{user.role}</span>
                  </p>
                )}

                <div className="flex justify-end border-t border-border pt-5">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="bg-[#22C55E] px-6 text-white hover:bg-[#16A34A]"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save changes"
                    )}
                  </Button>
                </div>
              </SettingsCardBody>
            </SettingsCard>
          </div>

          <SettingsNotice variant="info">
            To change your email or password, visit{" "}
            <Link href="/settings/security" className="font-medium underline underline-offset-2">
              Security settings
            </Link>
            .
          </SettingsNotice>
        </form>
      </SettingsPageContent>
    </SettingsPageShell>
  );
}
