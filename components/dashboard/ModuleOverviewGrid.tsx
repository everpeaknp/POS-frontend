"use client";

import Link from "next/link";
import { ChevronRight, TrendingDown, TrendingUp } from "lucide-react";
import { dashboardCardClass } from "@/components/dashboard/DashboardPageShell";
import type { DashboardModuleSection } from "@/lib/dashboard/types";
import type { OrgModuleDefinition } from "@/lib/modules/catalog";

interface ModuleOverviewGridProps {
  modules: DashboardModuleSection[];
  catalogById: Map<string, OrgModuleDefinition>;
}

export function ModuleOverviewGrid({ modules, catalogById }: ModuleOverviewGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
      {modules.map((module) => {
        const catalog = catalogById.get(module.id);
        const Icon = catalog?.icon;

        return (
          <Link key={module.id} href={module.href} className="group block cursor-pointer">
            <div
              className={`${dashboardCardClass} h-full transition-all duration-200 hover:border-[#22C55E]/30 hover:shadow-md`}
            >
              <div className="border-b border-gray-100 px-4 py-3.5 dark:border-border">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    {Icon ? (
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#22C55E]/10">
                        <Icon className="h-[18px] w-[18px] text-[#22C55E]" />
                      </div>
                    ) : null}
                    <h3 className="truncate text-sm font-medium text-gray-900 dark:text-foreground">
                      {module.title}
                    </h3>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-gray-400 transition-colors group-hover:text-[#22C55E]" />
                </div>
              </div>

              <div className="px-4 py-4">
                {module.stats.length > 0 ? (
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                    {module.stats.slice(0, 4).map((stat) => (
                      <div key={stat.label} className="min-w-0">
                        <p className="truncate text-xs font-medium text-gray-500 dark:text-muted-foreground">
                          {stat.label}
                        </p>
                        <div className="mt-1 flex items-baseline gap-1.5">
                          <p className="truncate text-lg font-medium tabular-nums text-gray-900 dark:text-foreground">
                            {stat.value}
                          </p>
                          {typeof stat.change === "number" ? (
                            <span
                              className={`inline-flex shrink-0 items-center gap-0.5 text-[11px] font-medium ${
                                stat.change >= 0 ? "text-[#22C55E]" : "text-red-500"
                              }`}
                            >
                              {stat.change >= 0 ? (
                                <TrendingUp className="h-3 w-3" />
                              ) : (
                                <TrendingDown className="h-3 w-3" />
                              )}
                              {Math.abs(stat.change)}%
                            </span>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-muted-foreground">View module</p>
                )}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
