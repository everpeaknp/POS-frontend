import { NotFoundView } from "@/components/shared/NotFoundView";

export default function TenantNotFound() {
  return (
    <NotFoundView
      variant="full"
      code="404"
      title="Workspace not found"
      description="The workspace you are looking for does not exist or you do not have access to it."
      primaryHref="/dashboard"
      primaryLabel="Go to Dashboard"
      secondaryHref="/auth/login"
      secondaryLabel="Back to Login"
    />
  );
}
