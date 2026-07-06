import Link from "next/link";
import { ArrowLeft, Home, LayoutDashboard } from "lucide-react";
import { KhataLogo } from "@/components/khata-logo";

interface NotFoundViewProps {
  code?: string;
  title?: string;
  description?: string;
  variant?: "full" | "embedded";
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}

const primaryBtn =
  "inline-flex items-center justify-center gap-2 h-10 px-5 rounded-lg text-sm font-medium bg-[#22C55E] hover:bg-[#16A34A] text-white transition-colors";
const secondaryBtn =
  "inline-flex items-center justify-center gap-2 h-10 px-5 rounded-lg text-sm font-medium border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors";

export function NotFoundView({
  code = "404",
  title = "Page not found",
  description = "The page you are looking for does not exist, was moved, or you do not have access to it.",
  variant = "full",
  primaryHref = "/dashboard",
  primaryLabel = "Go to Dashboard",
  secondaryHref = "/auth/login",
  secondaryLabel = "Back to Login",
}: NotFoundViewProps) {
  const isFull = variant === "full";
  const PrimaryIcon = primaryHref.startsWith("/dashboard") ? LayoutDashboard : Home;

  const content = (
    <div className="w-full max-w-md text-center">
      <div className="mb-6 flex justify-center">
        <KhataLogo size="md" />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 sm:p-10">
        <p className="text-6xl sm:text-7xl font-bold tracking-tight text-[#22C55E] leading-none">
          {code}
        </p>
        <h1 className="mt-4 text-xl font-bold text-gray-900">{title}</h1>
        <p className="mt-2 text-sm text-gray-500 leading-relaxed">{description}</p>

        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link href={primaryHref} className={primaryBtn}>
            <PrimaryIcon className="h-4 w-4" />
            {primaryLabel}
          </Link>
          <Link href={secondaryHref} className={secondaryBtn}>
            <ArrowLeft className="h-4 w-4" />
            {secondaryLabel}
          </Link>
        </div>
      </div>

      <p className="mt-6 text-xs text-gray-400">
        Need help? Contact your organization administrator.
      </p>
    </div>
  );

  if (!isFull) {
    return (
      <div className="flex flex-col min-h-full items-center justify-center p-6 sm:p-10">
        {content}
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#F3F4F6] flex flex-col lg:flex-row">
      <div
        className="hidden lg:flex lg:w-5/12 flex-col justify-between p-12 text-white shrink-0"
        style={{ backgroundColor: "#1A2E1A" }}
      >
        <KhataLogo size="md" />
        <div>
          <h2 className="text-3xl font-bold leading-tight mb-3">
            This page could not be found
          </h2>
          <p className="text-green-300/90 text-sm leading-relaxed max-w-sm">
            Check the URL for typos, or return to your dashboard to continue managing your business.
          </p>
        </div>
        <p className="text-green-400/60 text-xs">Khata — Nepal&apos;s Business Operating System</p>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        {content}
      </div>
    </main>
  );
}
