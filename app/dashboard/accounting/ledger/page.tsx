import { redirect } from "next/navigation";

export default function LedgerRedirectPage() {
  redirect("/dashboard/accounting/general-ledger");
}
