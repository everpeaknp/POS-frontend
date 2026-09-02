import type { AccountType } from "@/components/account-type-selection";

interface CreationCopy {
  loadingMessage: string;
  successHeading: string;
  secondaryLabel: string;
  secondaryHref: string;
}

/** Loading/success screen copy shown right after tenant creation, tailored per workplace type instead of always saying "organization". */
export function getCreationCopy(accountType: AccountType | null | undefined): CreationCopy {
  switch (accountType) {
    case "personal":
      return {
        loadingMessage: "Setting up your personal finance…",
        successHeading: "You're all set",
        secondaryLabel: "Personal finance settings",
        secondaryHref: "/dashboard/finance/settings",
      };
    case "retail":
      return {
        loadingMessage: "Getting your retail store ready…",
        successHeading: "Your store is ready",
        secondaryLabel: "Store settings",
        secondaryHref: "/dashboard/settings/org",
      };
    case "construction":
      return {
        loadingMessage: "Getting your construction workspace ready…",
        successHeading: "Your construction workspace is ready",
        secondaryLabel: "Workspace settings",
        secondaryHref: "/dashboard/settings/org",
      };
    case "hardware":
      return {
        loadingMessage: "Getting your hardware store ready…",
        successHeading: "Your store is ready",
        secondaryLabel: "Store settings",
        secondaryHref: "/dashboard/settings/org",
      };
    case "organization":
    default:
      return {
        loadingMessage: "Getting your organization ready…",
        successHeading: "Your organization is ready",
        secondaryLabel: "Organization settings",
        secondaryHref: "/dashboard/settings/org",
      };
  }
}

/** Each workplace type's dedicated dashboard route — where "Go to dashboard" should land right after creation, instead of the generic `/dashboard` (which then has to client-redirect). */
export function getDashboardHref(accountType: AccountType | null | undefined): string {
  switch (accountType) {
    case "personal":
      return "/dashboard/finance";
    case "retail":
      return "/dashboard/retail";
    case "construction":
      return "/dashboard/construction";
    case "hardware":
      return "/dashboard/hardware";
    case "organization":
    default:
      return "/dashboard";
  }
}
