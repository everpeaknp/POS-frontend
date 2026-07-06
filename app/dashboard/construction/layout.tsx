import { Suspense } from "react";

export default function ConstructionLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={null}>{children}</Suspense>;
}
