import { redirect } from "next/navigation";

export default function SalesOverviewRedirect() {
  redirect("/dashboard/sales");
}
