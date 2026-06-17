"use client";

import { useRef, useState } from "react";
import { Upload, X, ImageIcon } from "lucide-react";

interface LogoUploadProps {
  value: File | null;
  onChange: (file: File | null) => void;
}

export function LogoUpload({ value, onChange }: LogoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = (file: File) => {
    onChange(file);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) handleFile(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleRemove = () => {
    onChange(null);
    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-gray-700">Company Logo</label>
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onClick={() => !value && inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-3 transition-all min-h-[180px] ${
          dragging
            ? "border-[#1E40AF] bg-blue-50 scale-[1.01]"
            : value
            ? "border-blue-300 bg-blue-50/50"
            : "border-gray-200 bg-gray-50/50 hover:border-gray-300 hover:bg-gray-50 cursor-pointer"
        }`}
      >
        {preview ? (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Logo preview" className="h-24 w-24 object-contain rounded-lg border border-gray-200 bg-white p-1" />
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleRemove(); }}
              className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-sm transition-colors"
              aria-label="Remove logo"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <>
            <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center shadow-sm">
              {dragging ? (
                <ImageIcon className="h-6 w-6 text-[#1E40AF]" />
              ) : (
                <Upload className="h-6 w-6 text-gray-400" />
              )}
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700">
                {dragging ? "Drop to upload" : "Upload logo here"}
              </p>
              <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 2MB</p>
              <p className="text-xs text-gray-400">Recommended: 200×200px</p>
            </div>
          </>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden"
        onChange={handleChange} aria-label="Upload company logo" />
    </div>
  );
}
