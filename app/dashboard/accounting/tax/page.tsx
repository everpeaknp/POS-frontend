import { redirect } from "next/navigation";

export default function TaxRedirectPage() {
  redirect("/dashboard/accounting/tax-management");
}
