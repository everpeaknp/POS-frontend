"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { HRPageShell } from "@/components/dashboard/HRPageShell";

export default function HrAttendanceEmployeeRedirect() {
  const router = useRouter();
  const params = useParams();
  const employeeId = params.employeeId as string;

  useEffect(() => {
    router.replace(`/dashboard/hr/employees/${employeeId}`);
  }, [router, employeeId]);

  return (
    <HRPageShell title="Redirecting..." variant="redirect" loading />
  );
}
