import { redirect } from "next/navigation";

/** Sessions live under Security — keep old URL working. */
export default function SessionsRedirectPage() {
  redirect("/settings/security");
}
