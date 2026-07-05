"use client";

import { useEffect, useState } from "react";
import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfilePhotoUploadProps {
  existingUrl?: string | null;
  initials?: string;
  disabled?: boolean;
  onChange: (file: File | null) => void;
  className?: string;
}

export function ProfilePhotoUpload({
  existingUrl,
  initials = "U",
  disabled = false,
  onChange,
  className,
}: ProfilePhotoUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      if (preview?.startsWith("blob:")) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const handlePhotoChange = (file: File | null) => {
    setError("");

    if (!file) {
      onChange(null);
      if (preview?.startsWith("blob:")) {
        URL.revokeObjectURL(preview);
      }
      setPreview(null);
      return;
    }

    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
    if (!validTypes.includes(file.type)) {
      setError("Please upload a JPG, PNG, or GIF image");
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError("File size must be less than 5MB");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    if (preview?.startsWith("blob:")) {
      URL.revokeObjectURL(preview);
    }
    onChange(file);
    setPreview(objectUrl);
  };

  const displayUrl = preview || existingUrl || null;

  const handleRemove = () => {
    handlePhotoChange(null);
  };

  return (
    <div className={cn("space-y-3", className)}>
      <h4 className="text-sm font-semibold text-gray-700">Profile photo</h4>
      <div
        className={cn(
          "border-2 border-dashed border-gray-200 rounded-xl p-5 text-center bg-white transition-colors",
          !disabled && "hover:border-[#22C55E]/40"
        )}
      >
        {displayUrl ? (
          <div className="space-y-4">
            <div className="w-32 h-32 mx-auto border-2 border-gray-200 rounded-full overflow-hidden bg-white">
              <img src={displayUrl} alt="Profile photo" className="w-full h-full object-cover" />
            </div>
            {!disabled && (
              <button
                type="button"
                onClick={handleRemove}
                className="text-sm text-red-600 hover:text-red-700 font-medium"
              >
                Remove photo
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="w-20 h-20 mx-auto bg-[#22C55E]/10 rounded-full flex items-center justify-center text-[#16A34A] font-semibold text-xl">
              {initials ? (
                initials.slice(0, 2).toUpperCase()
              ) : (
                <ImageIcon className="w-10 h-10 text-gray-400" />
              )}
            </div>
            {!disabled && (
              <div>
                <label htmlFor="profile-photo-upload" className="cursor-pointer">
                  <span className="text-sm font-medium text-[#22C55E] hover:text-[#16A34A]">
                    Upload a photo
                  </span>
                  <input
                    id="profile-photo-upload"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif"
                    onChange={(e) => handlePhotoChange(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                </label>
              </div>
            )}
            <p className="text-xs text-gray-500">
              JPG, PNG or GIF
              <br />
              Max 5MB
            </p>
          </div>
        )}
        {error && <p className="text-xs text-red-500 mt-3">{error}</p>}
      </div>
    </div>
  );
}
