import { NotFoundView } from "@/components/shared/NotFoundView";

export default function SettingsNotFound() {
  return (
    <NotFoundView
      variant="embedded"
      title="Page not found"
      description="This settings route does not exist. Use the sidebar to navigate, or return to your profile."
      primaryHref="/settings/profile"
      primaryLabel="Account settings"
      secondaryHref="/erp"
      secondaryLabel="Organizations"
    />
  );
}
