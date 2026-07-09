import { notFound } from "next/navigation";

/** Unmatched /settings/* paths render the settings not-found view. */
export default function SettingsUnknownRoutePage() {
  notFound();
}
