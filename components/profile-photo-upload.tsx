"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ImageIcon, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ProfilePhotoUploadProps {
  existingUrl?: string | null;
  initials?: string;
  disabled?: boolean;
  onChange: (file: File | null) => void;
  onRemove?: () => void;
  className?: string;
  layout?: "horizontal" | "stacked";
  align?: "center" | "start";
  variant?: "default" | "compact";
}

export function ProfilePhotoUpload({
  existingUrl,
  initials = "U",
  disabled = false,
  onChange,
  onRemove,
  className,
  layout = "stacked",
  align = "center",
  variant = "default",
}: ProfilePhotoUploadProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const isCompact = variant === "compact";

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

    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setError("Please upload a JPG, PNG, GIF, or WebP image");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
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
  const hasPhoto = Boolean(displayUrl);

  const handleRemove = () => {
    handlePhotoChange(null);
    onRemove?.();
    if (inputRef.current) inputRef.current.value = "";
  };

  const openFilePicker = () => {
    if (!disabled) inputRef.current?.click();
  };

  const avatarSize = isCompact ? "h-20 w-20" : "h-24 w-24";

  const avatarButton = (
    <button
      type="button"
      onClick={openFilePicker}
      disabled={disabled}
      className={cn(
        "group relative shrink-0 overflow-hidden rounded-full border-2 border-border bg-muted",
        avatarSize,
        layout === "stacked" && align === "center" && !isCompact && "mx-auto",
        !disabled && "cursor-pointer transition-colors hover:border-[#22C55E]/50"
      )}
      aria-label={hasPhoto ? "Replace profile photo" : "Upload profile photo"}
    >
      {displayUrl ? (
        <img src={displayUrl} alt="Profile" className="h-full w-full object-cover" />
      ) : (
        <span className="flex h-full w-full items-center justify-center bg-[#22C55E]/10 text-lg font-semibold text-[#16A34A]">
          {initials.slice(0, 2).toUpperCase()}
        </span>
      )}
      {!disabled && (
        <span className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/40">
          <ImageIcon className="h-5 w-5 text-white opacity-0 transition-opacity group-hover:opacity-100" />
        </span>
      )}
    </button>
  );

  const compactActions = !disabled && (
    <div className="flex flex-col items-center gap-1.5">
      <button
        type="button"
        onClick={openFilePicker}
        className="text-xs font-medium text-[#22C55E] hover:underline"
      >
        {hasPhoto ? "Replace" : "Upload"}
      </button>
      {hasPhoto && (
        <button
          type="button"
          onClick={handleRemove}
          className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:underline"
        >
          <Trash2 className="h-3 w-3" />
          Remove
        </button>
      )}
    </div>
  );

  const defaultActions = !disabled && (
    <div
      className={cn(
        "flex gap-2",
        layout === "stacked" ? "w-full flex-col" : "flex-wrap justify-center sm:justify-start"
      )}
    >
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={cn("h-9", layout === "stacked" && "w-full")}
        onClick={openFilePicker}
      >
        <ImageIcon className="mr-1.5 h-3.5 w-3.5" />
        {hasPhoto ? "Replace photo" : "Upload photo"}
      </Button>
      {hasPhoto && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn(
            "h-9 text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/30",
            layout === "stacked" && "w-full"
          )}
          onClick={handleRemove}
        >
          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
          Remove photo
        </Button>
      )}
    </div>
  );

  const hint = (
    <p className="text-[11px] text-muted-foreground">
      JPG, PNG, GIF or WebP · Max 5MB
    </p>
  );

  if (isCompact) {
    return (
      <div className={cn("flex flex-col items-center gap-3", className)}>
        {avatarButton}
        {compactActions}
        {hint}
        {error && <p className="text-xs text-red-500">{error}</p>}
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
          onChange={(e) => handlePhotoChange(e.target.files?.[0] || null)}
          className="hidden"
          disabled={disabled}
        />
      </div>
    );
  }

  return (
    <div className={cn(className)}>
      {layout === "stacked" ? (
        <div
          className={cn(
            "flex flex-col gap-4",
            align === "center" ? "items-center text-center" : "items-start text-left"
          )}
        >
          {avatarButton}
          {defaultActions}
          {hint}
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
          {avatarButton}
          <div className="min-w-0 flex-1 space-y-2 text-center sm:text-left">
            {defaultActions}
            {hint}
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
        onChange={(e) => handlePhotoChange(e.target.files?.[0] || null)}
        className="hidden"
        disabled={disabled}
      />
    </div>
  );
}
