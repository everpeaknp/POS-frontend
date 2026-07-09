import { redirect } from "next/navigation";

/** Legacy tenant-slug URLs now use the unified /dashboard hub. */
export default function TenantSlugRedirectPage() {
  redirect("/dashboard");
}
