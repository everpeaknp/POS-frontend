import { NotFoundView } from "@/components/shared/NotFoundView";

export default function ErpNotFound() {
  return (
    <NotFoundView
      variant="embedded"
      title="Page not found"
      description="This workspace route does not exist. Return to your organization list to continue."
      primaryHref="/erp"
      primaryLabel="Organizations"
      secondaryHref="/auth/login"
      secondaryLabel="Back to Login"
    />
  );
}
