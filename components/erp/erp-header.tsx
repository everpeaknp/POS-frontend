"use client";

import { KhataLogo } from "@/components/khata-logo";
import { UserMenuDropdown } from "@/components/shared/UserMenuDropdown";

export function ErpHeader() {
  return (
    <header className="bg-white dark:bg-card sticky top-0 z-20">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
        <KhataLogo size="md" />
        <UserMenuDropdown detail="email" />
      </div>
    </header>
  );
}
