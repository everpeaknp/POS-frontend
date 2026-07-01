import { redirect } from "next/navigation";

export default function ChartRedirectPage() {
  redirect("/dashboard/accounting/chart-of-accounts");
}
