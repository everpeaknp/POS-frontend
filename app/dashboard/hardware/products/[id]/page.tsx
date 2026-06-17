'use client';

import { useRouter, useParams } from 'next/navigation';
import { useEffect } from 'react';

export default function HardwareProductDetailPage() {
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    // Redirect to inventory product detail
    router.push(`/dashboard/inventory/products/${params.id}`);
  }, [router, params.id]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#22C55E]"></div>
    </div>
  );
}
