import { TenantProvider } from '@/lib/context/TenantContext';
import { Sidebar } from '@/components/dashboard/sidebar';
import { DashHeader } from '@/components/dashboard/dash-header';

export default async function TenantLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  
  return (
    <TenantProvider slug={slug}>
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <DashHeader title="Dashboard" subtitle="Manage your business" />
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </TenantProvider>
  );
}
