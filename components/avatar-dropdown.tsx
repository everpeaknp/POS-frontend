"use client";

import { useRouter } from "next/navigation";
import { Building2, Settings, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getInitials } from "@/lib/utils";

interface AvatarDropdownProps {
  name: string;
}

export function AvatarDropdown({ name }: AvatarDropdownProps) {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("tigg_user");
    router.push("/auth/login");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="w-9 h-9 rounded-full bg-purple-600 text-white text-sm font-semibold flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2" aria-label="User menu">
        {getInitials(name)}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={() => router.push("/erp/new")}
        >
          <Building2 className="mr-2 h-4 w-4" />
          Add New Company
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={() => router.push("/settings")}
        >
          <Settings className="mr-2 h-4 w-4" />
          User Settings
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer text-red-600 focus:text-red-600"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
