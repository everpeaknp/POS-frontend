'use client';

import { useEffect, useState } from 'react';
import { tenantApi } from '@/lib/api/tenant';
import { tenantToCompanyInfo, type CompanyPrintInfo } from '@/lib/print/company-info';

export function useCompanyInfo() {
  const [companyInfo, setCompanyInfo] = useState<CompanyPrintInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    tenantApi
      .getCurrent()
      .then((tenant) => {
        if (!cancelled) {
          setCompanyInfo(tenantToCompanyInfo(tenant));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCompanyInfo(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { companyInfo, loading };
}
