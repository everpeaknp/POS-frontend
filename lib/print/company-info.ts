import type { Tenant } from '@/lib/api/tenant';

export interface CompanyPrintInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  pan?: string;
  website?: string;
  vatRegistered?: boolean;
}

export function tenantToCompanyInfo(tenant: Tenant): CompanyPrintInfo {
  return {
    name: tenant.name || tenant.workspace_name || 'Organization',
    address: tenant.address || '',
    phone: tenant.phone || '',
    email: tenant.email || '',
    pan: tenant.pan_vat_number || undefined,
    website: tenant.website || undefined,
    vatRegistered: tenant.vat_registered,
  };
}
