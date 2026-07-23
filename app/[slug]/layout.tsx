import { notFound } from "next/navigation";
import { TenantProvider } from "@/lib/context/TenantContext";
import { Sidebar } from "@/components/dashboard/sidebar";
import { DashHeader } from "@/components/dashboard/dash-header";

/** Never treat these as workspace slugs (static routes / system paths). */
const RESERVED_SLUGS = new Set([
  "404",
  "auth",
  "dashboard",
  "erp",
  "settings",
  "invite",
  "onboarding",
  "workspace",
  "api",
  "debug-pos",
]);

export default async function TenantLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  if (RESERVED_SLUGS.has(slug.toLowerCase())) {
    notFound();
  }

  return (
    <TenantProvider slug={slug}>
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <DashHeader title="Dashboard" subtitle="Manage your business" />
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </TenantProvider>
  );
}
