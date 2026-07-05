"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  subtitle?: string;
  showButton?: boolean;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

export function EmptyState({ 
  icon: Icon, 
  title, 
  description,
  subtitle, 
  showButton,
  actionLabel,
  actionHref,
  onAction
}: EmptyStateProps) {
  const router = useRouter();
  
  const handleAction = () => {
    if (onAction) {
      onAction();
    } else if (actionHref) {
      router.push(actionHref);
    } else {
      router.push("/erp/new");
    }
  };

  const buttonText = actionLabel || "Add New Organization";
  const displayDescription = description || subtitle;
  
  // Show button if explicitly set to true, or if action props are provided
  const shouldShowButton = showButton !== undefined 
    ? showButton 
    : !!(actionLabel || actionHref || onAction);

  return (
    <div className="flex flex-col items-center justify-center py-28 gap-5">
      <div className="w-24 h-24 rounded-2xl bg-[#22C55E]/10 border border-[#22C55E]/20 flex items-center justify-center">
        <Icon className="h-12 w-12 text-[#22C55E]" />
      </div>
      <div className="text-center">
        <p className="text-foreground text-base font-semibold">{title}</p>
        {displayDescription && <p className="text-muted-foreground text-sm mt-1">{displayDescription}</p>}
      </div>
      {shouldShowButton && (
        <Button 
          onClick={handleAction}
          className="bg-[#22C55E] hover:bg-[#22C555] text-white font-semibold mt-1 gap-1.5 h-10 px-5 rounded-lg"
        >
          <Plus className="h-4 w-4" /> {buttonText}
        </Button>
      )}
    </div>
  );
}
