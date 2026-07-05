import { redirect } from "next/navigation";

export default async function HrAttendanceEmployeeRedirect({
  params,
}: {
  params: Promise<{ employeeId: string }>;
}) {
  const { employeeId } = await params;
  redirect(`/dashboard/hr/employees/${employeeId}`);
}
