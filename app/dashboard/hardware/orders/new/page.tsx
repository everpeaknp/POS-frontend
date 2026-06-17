'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function NewHardwareOrderPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to sales order creation with hardware context
    router.push('/dashboard/sales/orders/new');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#22C55E]"></div>
    </div>
  );
}
