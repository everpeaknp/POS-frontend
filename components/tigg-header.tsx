"use client";

import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TiggLogo } from "@/components/tigg-logo";
import { AvatarDropdown } from "@/components/avatar-dropdown";
import { mockUser } from "@/lib/mock-data";

export function TiggHeader() {
  const router = useRouter();
  return (
    <header className="bg-white border-b border-gray-100 px-6 py-3.5 flex items-center justify-between shadow-sm">
      <TiggLogo size="md" />
      <div className="flex items-center gap-3">
        <Button onClick={() => router.push("/erp/new")}
          className="bg-[#22C55E] hover:bg-[#16A34A] text-white text-sm font-semibold px-4 h-9 rounded-lg gap-1.5">
          <Plus className="h-4 w-4" /> ADD NEW ORGANIZATION
        </Button>
        <AvatarDropdown name={mockUser.name} />
      </div>
    </header>
  );
}
