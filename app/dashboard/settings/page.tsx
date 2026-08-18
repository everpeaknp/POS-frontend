"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";

export default function SettingsPage() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    router.replace(
      user.tenant?.account_type === "personal"
        ? "/dashboard/settings/profile"
        : "/dashboard/settings/org"
    );
  }, [user, router]);

  return null;
}
