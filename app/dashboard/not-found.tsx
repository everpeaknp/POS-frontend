import { NotFoundView } from "@/components/shared/NotFoundView";

export default function DashboardNotFound() {
  return (
    <NotFoundView
      variant="embedded"
      title="Page not found"
      description="This dashboard route does not exist. Use the sidebar to navigate, or return to the main dashboard."
      primaryHref="/dashboard"
      primaryLabel="Dashboard home"
      secondaryHref="/dashboard/settings"
      secondaryLabel="Settings"
    />
  );
}
