import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export const settingsInputClass =
  "w-full h-10 px-3 rounded-lg border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-[#22C55E]/20 focus:border-[#22C55E] disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed";

export function SettingsPageContent({ children }: { children: React.ReactNode }) {
  return <div className="space-y-6">{children}</div>;
}

export function SettingsCard({
  children,
  className,
  variant = "default",
}: {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "danger";
}) {
  return (
    <section
      data-page-tour="section"
      className={cn(
        "rounded-xl border shadow-sm overflow-hidden",
        variant === "danger"
          ? "bg-red-50/40 border-red-100 dark:bg-red-950/30 dark:border-red-900/40"
          : "bg-card border-border",
        className
      )}
    >
      {children}
    </section>
  );
}

export function SettingsCardHeader({
  icon: Icon,
  title,
  description,
  variant = "default",
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  variant?: "default" | "danger";
  action?: React.ReactNode;
}) {
  const bindTourMeta = (node: HTMLDivElement | null) => {
    const section = node?.closest("section[data-page-tour='section']");
    if (!section) return;
    const id = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    section.setAttribute("data-page-tour-id", id || "section");
    section.setAttribute("data-page-tour-title", title);
    section.setAttribute(
      "data-page-tour-body",
      description || `Review and update settings in ${title}.`
    );
  };

  return (
    <div
      ref={bindTourMeta}
      className={cn(
        "px-6 py-4 border-b flex items-center justify-between gap-4",
        variant === "danger" ? "border-red-100 dark:border-red-900/40" : "border-border"
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        {Icon && (
          <div
            className={cn(
              "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
              variant === "danger" ? "bg-red-100 dark:bg-red-900/40" : "bg-[#22C55E]/10"
            )}
          >
            <Icon className={cn("h-4 w-4", variant === "danger" ? "text-red-600 dark:text-red-400" : "text-[#22C55E]")} />
          </div>
        )}
        <div className="min-w-0">
          <h2 className={cn("text-sm font-semibold", variant === "danger" ? "text-red-900 dark:text-red-200" : "text-foreground")}>
            {title}
          </h2>
          {description && (
            <p className={cn("text-xs mt-0.5", variant === "danger" ? "text-red-700/80 dark:text-red-300/80" : "text-muted-foreground")}>
              {description}
            </p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function SettingsCardBody({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("p-6", className)}>{children}</div>;
}

export function SettingsField({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">{label}</label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function SettingsSwitch({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <label className="relative inline-flex items-center cursor-pointer shrink-0">
      <input
        type="checkbox"
        className="sr-only peer"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
      />
      <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#22C55E] peer-disabled:opacity-50 peer-disabled:cursor-not-allowed" />
    </label>
  );
}

export function SettingsToggleRow({
  title,
  description,
  checked,
  onChange,
  disabled,
  icon: Icon,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  icon?: LucideIcon;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-border/60 last:border-0">
      <div className="flex items-center gap-3 min-w-0">
        {Icon && (
          <div className="hidden sm:flex w-9 h-9 items-center justify-center rounded-lg bg-muted text-muted-foreground shrink-0">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
      </div>
      <SettingsSwitch checked={checked} onChange={onChange} disabled={disabled} />
    </div>
  );
}

export function SettingsNotice({
  children,
  variant = "info",
}: {
  children: React.ReactNode;
  variant?: "info" | "warning" | "success";
}) {
  const styles = {
    info: "bg-blue-50 border-blue-100 text-blue-900 dark:bg-blue-950/40 dark:border-blue-900/50 dark:text-blue-100",
    warning: "bg-amber-50 border-amber-100 text-amber-900 dark:bg-amber-950/40 dark:border-amber-900/50 dark:text-amber-100",
    success: "bg-emerald-50 border-emerald-100 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-900/50 dark:text-emerald-100",
  };

  return (
    <div className={cn("rounded-xl border px-4 py-3 text-sm", styles[variant])}>
      {children}
    </div>
  );
}
