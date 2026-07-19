"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Building2, ChevronDown, LogOut, User } from "lucide-react";
import { useAuth } from "@/lib/context/AuthContext";
import { getMediaUrl } from "@/lib/utils";
import toast from "react-hot-toast";

interface UserMenuDropdownProps {
  showUserDetails?: boolean;
  detail?: "role" | "email";
  /** When omitted, organization shows only inside an opened workspace (/dashboard). */
  showOrganization?: boolean;
}

function shouldShowOrganization(pathname: string) {
  return pathname.startsWith("/dashboard");
}

function detailForPath(pathname: string, detail: "role" | "email") {
  return shouldShowOrganization(pathname) ? detail : "email";
}

export function UserMenuDropdown({
  showUserDetails = true,
  detail = "role",
  showOrganization,
}: UserMenuDropdownProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    setOpen(false);
    logout();
    toast.success("Logged out successfully");
    router.push("/auth/login");
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase();
  };

  const avatarUrl = getMediaUrl(user?.avatar);
  const displayName = user ? `${user.first_name} ${user.last_name}`.trim() : "User";
  const organizationVisible =
    (showOrganization ?? shouldShowOrganization(pathname)) && Boolean(user?.tenant);
  const resolvedDetail = detailForPath(pathname, detail);

  const navigate = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const detailsBreakpoint = resolvedDetail === "email" ? "sm" : "md";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-accent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22C55E] focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        aria-label="User menu"
        aria-expanded={open}
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#22C55E] text-white text-sm font-semibold overflow-hidden shrink-0">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            user ? getInitials(user.first_name, user.last_name) : "U"
          )}
        </span>
        {showUserDetails && (
          <>
            <div className={`hidden ${detailsBreakpoint}:block text-left min-w-0`}>
              <p className="text-sm font-medium text-foreground leading-tight truncate">{displayName}</p>
              <p className="text-xs text-muted-foreground truncate">
                {resolvedDetail === "email" ? user?.email : user?.role || "Role"}
              </p>
            </div>
            <ChevronDown
              className={`hidden ${detailsBreakpoint}:block h-4 w-4 text-muted-foreground transition-transform shrink-0 ${open ? "rotate-180" : ""}`}
            />
          </>
        )}
        {!showUserDetails && (
          <ChevronDown
            className={`hidden sm:block h-4 w-4 text-gray-400 transition-transform shrink-0 ${open ? "rotate-180" : ""}`}
          />
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-popover text-popover-foreground rounded-xl shadow-lg border border-border py-1 z-[200]">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm font-semibold text-foreground truncate">{displayName}</p>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{user?.email}</p>
            {organizationVisible && (
              <p className="text-xs text-muted-foreground mt-2 truncate">
                Organization: <span className="font-medium text-foreground">{user!.tenant!.name}</span>
              </p>
            )}
          </div>

          <div className="py-1">
            <button
              type="button"
              onClick={() => navigate("/erp")}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-accent transition-colors"
            >
              <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
              ERP
            </button>
            <button
              type="button"
              onClick={() => navigate("/settings/profile")}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-accent transition-colors"
            >
              <User className="h-4 w-4 text-muted-foreground shrink-0" />
              My Profile
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
