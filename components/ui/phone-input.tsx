'use client';

import React from 'react';
import { PhoneInput as ReactPhoneInput, type CountryIso2 } from 'react-international-phone';
import 'react-international-phone/style.css';

export interface PhoneInputProps {
  value: string;
  onChange: (phone: string) => void;
  defaultCountry?: CountryIso2;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  name?: string;
  id?: string;
  required?: boolean;
  'aria-invalid'?: boolean;
  'aria-describedby'?: string;
}

export function PhoneInput({
  value,
  onChange,
  defaultCountry = 'np',
  disabled = false,
  placeholder = '+977 9800000000',
  className = '',
  inputClassName = '',
  name,
  id,
  required,
  'aria-invalid': ariaInvalid,
  'aria-describedby': ariaDescribedBy,
}: PhoneInputProps) {
  return (
    <div className={className}>
      <ReactPhoneInput
        defaultCountry={defaultCountry}
        value={value}
        onChange={onChange}
        disabled={disabled}
        inputProps={{
          placeholder,
          name,
          id,
          required,
          'aria-invalid': ariaInvalid,
          'aria-describedby': ariaDescribedBy,
        }}
        className="phone-input-wrapper"
        inputClassName={`phone-input ${inputClassName}`}
        countrySelectorStyleProps={{
          buttonClassName: 'phone-input-country-button',
          dropdownStyleProps: {
            className: 'phone-input-dropdown',
          },
        }}
      />
    </div>
  );
}

// Export validation helper
export function isValidPhoneNumber(phone: string): boolean {
  // Basic validation: check if phone has at least country code + number
  // More sophisticated validation can be added using libphonenumber-js
  const cleaned = phone.replace(/\s+/g, '');
  return cleaned.length >= 10 && cleaned.startsWith('+');
}

// Export phone formatting helper
export function formatPhoneForAPI(phone: string): string {
  // Returns phone number in E.164 format (e.g., +9779800000000)
  return phone.replace(/\s+/g, '');
}

// Export phone display helper
export function formatPhoneForDisplay(phone: string): string {
  // If phone already has country code, return as is
  if (phone.startsWith('+')) {
    return phone;
  }
  // If phone doesn't have country code, add Nepal's default
  if (phone && !phone.startsWith('+')) {
    return `+977${phone}`;
  }
  return phone;
}
