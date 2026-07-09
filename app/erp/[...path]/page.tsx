import { notFound } from "next/navigation";

/** Unmatched /erp/* paths render the ERP not-found view. */
export default function ErpUnknownRoutePage() {
  notFound();
}
