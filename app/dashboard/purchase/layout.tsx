import { Suspense } from "react";

export default function PurchaseLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={null}>{children}</Suspense>;
}
