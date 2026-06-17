"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogOut, User, ChevronDown } from "lucide-react";
import { useAuth } from "@/lib/context/AuthContext";
import toast from "react-hot-toast";

interface DashHeaderProps {
  title: string;
  subtitle?: string;
}

export function DashHeader({ title, subtitle }: DashHeaderProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    router.push("/auth/login");
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
      <div>
        <h1 className="text-lg font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      
      {/* User Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2 hover:bg-gray-50 rounded-lg px-3 py-2 transition-colors"
        >
          <div className="w-9 h-9 rounded-full bg-[#22C55E] text-white text-sm font-semibold flex items-center justify-center">
            {user ? getInitials(user.first_name, user.last_name) : "U"}
          </div>
          <div className="hidden md:block text-left">
            <p className="text-sm font-medium text-gray-900">
              {user ? `${user.first_name} ${user.last_name}` : "User"}
            </p>
            <p className="text-xs text-gray-500">{user?.role || "Role"}</p>
          </div>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
        </button>

        {/* Dropdown Menu */}
        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-100 py-2 z-50">
            {/* User Info */}
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-900">
                {user ? `${user.first_name} ${user.last_name}` : "User"}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{user?.email || "email@example.com"}</p>
              <p className="text-xs text-gray-400 mt-1">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
                  {user?.role || "Role"}
                </span>
              </p>
              {user?.tenant && (
                <p className="text-xs text-gray-400 mt-2">
                  Organization: <span className="font-medium text-gray-600">{user.tenant.name}</span>
                </p>
              )}
            </div>

            {/* Menu Items */}
            <div className="py-1">
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  router.push("/dashboard/settings/profile");
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <User className="w-4 h-4 text-gray-400" />
                My Profile
              </button>
              
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
