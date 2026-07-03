import type { ReactNode } from 'react';
import type { CompanyPrintInfo } from '@/lib/print/company-info';

interface PrintCompanyHeaderProps {
  company: CompanyPrintInfo;
  documentTitle: string;
  documentNumber: string;
  documentDate: ReactNode;
  secondaryDate?: { label: string; value: ReactNode };
}

export function PrintCompanyHeader({
  company,
  documentTitle,
  documentNumber,
  documentDate,
  secondaryDate,
}: PrintCompanyHeaderProps) {
  const panLabel = company.vatRegistered ? 'PAN/VAT' : 'PAN';

  return (
    <div className="flex justify-between items-start mb-8 pb-6 border-b-2 border-gray-300">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{company.name}</h1>
        {company.address && (
          <p className="text-sm text-gray-600 mt-2">{company.address}</p>
        )}
        {company.phone && (
          <p className="text-sm text-gray-600">Phone: {company.phone}</p>
        )}
        {company.email && (
          <p className="text-sm text-gray-600">Email: {company.email}</p>
        )}
        {company.website && (
          <p className="text-sm text-gray-600">Website: {company.website}</p>
        )}
        {company.pan && (
          <p className="text-sm text-gray-600">{panLabel}: {company.pan}</p>
        )}
      </div>
      <div className="text-right">
        <h2 className="text-2xl font-bold text-gray-900">{documentTitle}</h2>
        <p className="text-sm text-gray-600 mt-2">#{documentNumber}</p>
        <p className="text-sm text-gray-600">Date: {documentDate}</p>
        {secondaryDate && (
          <p className="text-sm text-gray-600">
            {secondaryDate.label}: {secondaryDate.value}
          </p>
        )}
      </div>
    </div>
  );
}
