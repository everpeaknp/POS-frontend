import { redirect } from "next/navigation";

export default function BankRedirectPage() {
  redirect("/dashboard/accounting/bank-accounts");
}
