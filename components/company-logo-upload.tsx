"use client";

import { useEffect, useState } from "react";
import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface CompanyLogoUploadProps {
  existingUrl?: string | null;
  disabled?: boolean;
  onChange: (file: File | null) => void;
  onClearExisting?: () => void;
  className?: string;
}

export function CompanyLogoUpload({
  existingUrl,
  disabled = false,
  onChange,
  onClearExisting,
  className,
}: CompanyLogoUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      if (preview?.startsWith("blob:")) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const handleLogoChange = (file: File | null) => {
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

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      if (img.width < 300 || img.height < 300) {
        setError("Image must be at least 300x300 pixels");
        URL.revokeObjectURL(objectUrl);
        return;
      }

      if (preview?.startsWith("blob:")) {
        URL.revokeObjectURL(preview);
      }
      onChange(file);
      setPreview(objectUrl);
    };

    img.onerror = () => {
      setError("Failed to load image");
      URL.revokeObjectURL(objectUrl);
    };

    img.src = objectUrl;
  };

  const displayUrl = preview || existingUrl || null;

  const handleRemove = () => {
    if (preview) {
      handleLogoChange(null);
      return;
    }
    if (existingUrl) {
      onClearExisting?.();
      onChange(null);
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      <h4 className="text-sm font-semibold text-gray-700">Company logo</h4>
      <div
        className={cn(
          "border-2 border-dashed border-gray-200 rounded-xl p-5 text-center bg-white transition-colors",
          !disabled && "hover:border-[#22C55E]/40"
        )}
      >
        {displayUrl ? (
          <div className="space-y-4">
            <div className="w-full aspect-square border-2 border-gray-200 rounded-lg overflow-hidden bg-white">
              <img src={displayUrl} alt="Company logo" className="w-full h-full object-cover" />
            </div>
            {!disabled && (
              <button
                type="button"
                onClick={handleRemove}
                className="text-sm text-red-600 hover:text-red-700 font-medium"
              >
                Remove Logo
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="w-20 h-20 mx-auto bg-gray-200 rounded-lg flex items-center justify-center">
              <ImageIcon className="w-10 h-10 text-gray-400" />
            </div>
            {!disabled && (
              <div>
                <label htmlFor="company-logo-upload" className="cursor-pointer">
                  <span className="text-sm font-medium text-[#22C55E] hover:text-[#16A34A]">
                    Upload a logo
                  </span>
                  <input
                    id="company-logo-upload"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif"
                    onChange={(e) => handleLogoChange(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                </label>
              </div>
            )}
            <p className="text-xs text-gray-500">
              JPG, PNG or GIF
              <br />
              Min 300x300px
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
