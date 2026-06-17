"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, User, Mail, Phone, Camera, CheckCircle2, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/context/AuthContext";
import { userApi } from "@/lib/api/user";
import toast from "react-hot-toast";

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
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
    }
  }, [user]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const updateData: any = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
      };

      if (avatarFile) {
        updateData.avatar = avatarFile;
      }

      await updateUser(updateData);
      
      toast.success("Profile updated successfully", {
        style: {
          borderRadius: '12px',
          background: '#111827',
          color: '#fff',
        },
      });
      setIsEditing(false);
      setAvatarFile(null);
      setAvatarPreview(null);
    } catch (error: any) {
      console.error("Profile update error:", error);
      toast.error(error.response?.data?.detail || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyles = "w-full px-4 py-3 bg-gray-50 border border-gray-100 text-sm font-semibold rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-[#22C55E]/20 focus:border-[#22C55E] disabled:opacity-60 disabled:cursor-not-allowed";

  return (
    <main className="min-h-screen bg-[#FDFDFD] text-[#111827] selection:bg-[#22C55E]/20">
      <div className="max-w-[850px] mx-auto px-6 py-16">
        
        {/* Breadcrumb & Header */}
        <div className="mb-12">
          <Link
            href="/settings"
            className="group inline-flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-[#22C55E] transition-all mb-6"
          >
            <div className="p-1.5 rounded-lg bg-gray-50 group-hover:bg-[#22C55E]/10">
              <ArrowLeft className="h-4 w-4 stroke-[3px]" />
            </div>
            Back to Settings
          </Link>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-black tracking-tight text-gray-900">Profile</h1>
              <p className="text-gray-500 font-medium mt-2">Personalize your identity across the platform.</p>
            </div>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center justify-center px-6 py-2.5 text-sm font-bold text-white bg-[#22C55E] rounded-xl hover:bg-[#1da850] shadow-[0_4px_14px_0_rgba(34,197,94,0.39)] transition-all active:scale-95"
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.04)] overflow-hidden">
          <form onSubmit={handleSubmit} className="p-8 md:p-10">
            
            {/* Avatar Section */}
            <div className="flex flex-col sm:flex-row items-center gap-8 mb-12 pb-12 border-b border-gray-50">
              <div className="group relative">
                <div className="w-24 h-24 rounded-2xl bg-[#22C55E] flex items-center justify-center text-white font-black text-3xl shadow-[0_10px_25px_-5px_rgba(34,197,94,0.4)] overflow-hidden">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar preview" className="w-full h-full object-cover" />
                  ) : user?.avatar ? (
                    <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    user?.first_name?.[0] || "U"
                  )}
                </div>
                {isEditing && (
                  <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px] cursor-pointer">
                    <Camera className="w-6 h-6 text-white" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              <div className="text-center sm:text-left space-y-1">
                <h3 className="text-xl font-bold text-gray-900">Profile Photo</h3>
                <p className="text-sm text-gray-400 font-medium">PNG, JPG or GIF. Max 5MB.</p>
                {isEditing && (
                  <label className="text-[13px] font-bold text-[#22C55E] hover:underline mt-2 cursor-pointer inline-block">
                    Upload new image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Grid Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[12px] font-black text-gray-400 uppercase tracking-widest">
                  <User className="w-3 h-3" /> First Name
                </label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  disabled={!isEditing}
                  className={inputStyles}
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[12px] font-black text-gray-400 uppercase tracking-widest">
                  <User className="w-3 h-3" /> Last Name
                </label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  disabled={!isEditing}
                  className={inputStyles}
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[12px] font-black text-gray-400 uppercase tracking-widest">
                  <Mail className="w-3 h-3" /> Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={formData.email}
                    disabled={true} // Usually email is changed via a secure process
                    className={`${inputStyles} pr-10`}
                  />
                  <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#22C55E]" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[12px] font-black text-gray-400 uppercase tracking-widest">
                  <Phone className="w-3 h-3" /> Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  disabled={!isEditing}
                  className={inputStyles}
                />
              </div>
            </div>

            {/* Action Buttons */}
            {isEditing && (
              <div className="mt-10 pt-8 border-t border-gray-50 flex flex-col sm:flex-row gap-3">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 px-8 py-3 text-sm font-bold text-white bg-[#22C55E] rounded-xl hover:bg-[#1da850] shadow-[0_4px_14px_0_rgba(34,197,94,0.39)] transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#22C55E' }} />}
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setAvatarFile(null);
                    setAvatarPreview(null);
                    setFormData({
                      first_name: user?.first_name || "",
                      last_name: user?.last_name || "",
                      email: user?.email || "",
                      phone: user?.phone || "",
                    });
                  }}
                  disabled={isLoading}
                  className="px-8 py-3 text-sm font-bold text-gray-500 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Informational Footer */}
        <div className="mt-8 px-4 flex items-start gap-3">
          <div className="mt-1 w-2 h-2 rounded-full bg-[#22C55E]" />
          <p className="text-[13px] text-gray-400 font-medium">
            Your email is verified and connected to your primary account. To change your email, visit the <Link href="/settings/security" className="text-[#22C55E] hover:underline">Security Settings</Link>.
          </p>
        </div>
      </div>
    </main>
  );
}