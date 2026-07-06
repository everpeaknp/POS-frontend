import Link from "next/link";
import { LucideIcon, Plus } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
}: EmptyStateProps) {
  const showButton = actionLabel && (actionHref || onAction);

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center min-h-[50vh]">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <Icon className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 mb-6 max-w-md">{description}</p>
      {showButton && (
        <>
          {actionHref && !onAction ? (
            <Link
              href={actionHref}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#22C55E] text-white text-sm font-medium rounded-lg hover:bg-[#16A34A] transition-colors"
            >
              <Plus className="h-4 w-4" />
              {actionLabel}
            </Link>
          ) : (
            <button
              onClick={onAction}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#22C55E] text-white text-sm font-medium rounded-lg hover:bg-[#16A34A] transition-colors"
            >
              <Plus className="h-4 w-4" />
              {actionLabel}
            </button>
          )}
        </>
      )}
    </div>
  );
}
