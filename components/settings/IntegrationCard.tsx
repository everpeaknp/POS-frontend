"use client";

import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface IntegrationCardProps {
  name: string;
  description: string;
  icon: LucideIcon;
  iconClassName?: string;
  status: "connected" | "not_connected" | "coming_soon";
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export function IntegrationCard({
  name,
  description,
  icon: Icon,
  iconClassName = "bg-gray-100 text-gray-600",
  status,
  onConnect,
  onDisconnect,
}: IntegrationCardProps) {
  const isConnected = status === "connected";
  const isComingSoon = status === "coming_soon";

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${iconClassName}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="font-semibold text-gray-800">{name}</p>
          {isConnected && (
            <span className="text-xs text-green-600 font-medium">Connected</span>
          )}
          {status === "not_connected" && (
            <span className="text-xs text-gray-500 font-medium">Not connected</span>
          )}
          {isComingSoon && (
            <span className="text-xs text-gray-400 font-medium">Coming soon</span>
          )}
        </div>
      </div>
      <p className="text-sm text-gray-500 mb-4">{description}</p>
      <Button
        size="sm"
        variant={isConnected ? "outline" : "default"}
        className={`w-full ${
          isConnected
            ? "border-red-200 text-red-500 hover:bg-red-50"
            : isComingSoon
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-[#22C55E] hover:bg-[#16A34A] text-white"
        }`}
        disabled={isComingSoon}
        onClick={isConnected ? onDisconnect : onConnect}
      >
        {isComingSoon ? "Coming Soon" : isConnected ? "Disconnect" : "Connect"}
      </Button>
    </div>
  );
}
