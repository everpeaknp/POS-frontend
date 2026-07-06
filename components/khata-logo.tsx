"use client";

// Brand color: #22C55E (Khata green) — used everywhere

interface KhataLogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function KhataLogo({ size = "md", className = "" }: KhataLogoProps) {
  const iconSize = size === "sm" ? 22 : size === "lg" ? 44 : 30;
  const textSize = size === "sm" ? "text-base" : size === "lg" ? "text-3xl" : "text-xl";
  const color = "#22C55E";

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg width={iconSize} height={iconSize} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 2L28 10V22L16 30L4 22V10L16 2Z" fill={color} />
        <path d="M16 8L22 12V20L16 24L10 20V12L16 8Z" fill="white" opacity="0.2" />
        <path d="M16 6L26 12V20L16 26L6 20V12L16 6Z" fill={color} />
        <path d="M16 10L22 14V18L16 22L10 18V14L16 10Z" fill="white" opacity="0.45" />
      </svg>
      <span className={`font-bold tracking-tight ${textSize}`} style={{ color }}>Khata</span>
    </div>
  );
}
