"use client";

// OrgForm component - routes to account-type-specific forms

import { PersonalForm } from "./onboarding/PersonalForm";
import { RetailForm } from "./onboarding/RetailForm";
import { ConstructionForm } from "./onboarding/ConstructionForm";
import { HardwareForm } from "./onboarding/HardwareForm";
import { OrganizationForm } from "./onboarding/OrganizationForm";

export type AccountType = "organization" | "personal" | "construction" | "hardware" | "retail";

interface OrgFormProps {
  accountType?: AccountType;
  initialData?: any;
  onSubmit?: (data: any) => Promise<void>;
  onNext?: (data: any) => void;
  submitLabel?: string;
  isSubmitting?: boolean;
  showBackButton?: boolean;
  onBack?: () => void;
}

export function OrgForm(props: OrgFormProps) {
  const { accountType = "organization" } = props;

  // Route to appropriate form component based on account type
  if (accountType === "personal") {
    return <PersonalForm {...props} />;
  }

  if (accountType === "retail") {
    return <RetailForm {...props} />;
  }

  if (accountType === "construction") {
    return <ConstructionForm {...props} />;
  }

  if (accountType === "hardware") {
    return <HardwareForm {...props} />;
  }

  // Default: organization
  return <OrganizationForm {...props} />;
}
