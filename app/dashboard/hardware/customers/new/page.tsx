'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function NewHardwareCustomerPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to sales customer creation
    router.push('/dashboard/sales/customers/new');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#22C55E]"></div>
    </div>
  );
}
