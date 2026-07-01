import { redirect } from "next/navigation";

export default function JournalRedirectPage() {
  redirect("/dashboard/accounting/journal-entries");
}
