import { NotFoundView } from "@/components/shared/NotFoundView";

/** Dedicated /404 route — must not fall through to app/[slug]. */
export default function FourOhFourPage() {
  return <NotFoundView variant="full" />;
}
