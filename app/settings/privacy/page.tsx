import { redirect } from "next/navigation";

/** Privacy settings were folded into Security — keep old URL working. */
export default function PrivacyRedirectPage() {
  redirect("/settings/security");
}
