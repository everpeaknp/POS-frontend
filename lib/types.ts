export interface Organization {
  id: string;
  slug: string;
  name: string;
  subdomain: string;
  icon: string;
  trialDaysLeft: number;
  status: "trial" | "active" | "expired";
  user_role?: string;
  workspace_name?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface NewOrgForm {
  organizationName: string;
  industry: string;
  address: string;
  accountingStartDate: string;
  registeredWithVAT: string;
  workspaceName: string;
  referralCode: string;
  agreeToTerms: boolean;
  logo: File | null;
}
