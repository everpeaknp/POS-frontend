import { redirect } from "next/navigation";

export default function PnlRedirectPage() {
  redirect("/dashboard/accounting/profit-loss");
}
