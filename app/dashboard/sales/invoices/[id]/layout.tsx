import { Suspense } from "react";

export default function InvoiceDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={null}>
      <div className="flex flex-col h-full min-h-0">{children}</div>
    </Suspense>
  );
}
