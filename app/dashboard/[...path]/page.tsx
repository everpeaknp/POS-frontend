import { notFound } from "next/navigation";

/** Unmatched /dashboard/* paths render the dashboard not-found view. */
export default function DashboardUnknownRoutePage() {
  notFound();
}
