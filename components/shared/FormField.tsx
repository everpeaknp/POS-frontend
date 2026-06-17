'use client';

import React from 'react';
import { FieldError } from 'react-hook-form';

interface FormFieldProps {
  label: string;
  name: string;
  error?: FieldError;
  required?: boolean;
  children: React.ReactNode;
  hint?: string;
}

export default function FormField({
  label,
  name,
  error,
  required = false,
  children,
  hint,
}: FormFieldProps) {
  return (
    <div className="space-y-2">
      <label
        htmlFor={name}
        className="block text-sm font-medium text-gray-700"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      {children}
      
      {hint && !error && (
        <p className="text-xs text-gray-500">{hint}</p>
      )}
      
      {error && (
        <p className="text-sm text-red-600 flex items-center gap-1">
          <svg
            className="w-4 h-4"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {error.message}
        </p>
      )}
    </div>
  );
}
