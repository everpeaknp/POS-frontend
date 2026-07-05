"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, TrendingDown, TrendingUp } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DashboardModuleSection } from "@/lib/dashboard/types";
import type { OrgModuleDefinition } from "@/lib/modules/catalog";

const statusStyle: Record<string, string> = {
  Paid: "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300",
  Pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-300",
  Cancelled: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
  Draft: "bg-gray-100 text-gray-700 dark:bg-muted dark:text-muted-foreground",
  Confirmed: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  Delivered: "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300",
  critical: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
  low: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
};

const tileTone: Record<string, string> = {
  success: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/20",
  warning: "bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/20",
  danger: "bg-red-500/15 text-red-600 dark:text-red-300 border-red-500/20",
  info: "bg-blue-500/15 text-blue-600 dark:text-blue-300 border-blue-500/20",
};

interface ModuleOverviewSectionProps {
  module: DashboardModuleSection;
  catalog?: OrgModuleDefinition;
  isDark: boolean;
  showChart?: boolean;
  headerExtra?: ReactNode;
}

export function ModuleOverviewSection({
  module,
  catalog,
  isDark,
  showChart = false,
  headerExtra,
}: ModuleOverviewSectionProps) {
  const Icon = catalog?.icon;

  return (
    <section className="bg-white dark:bg-card rounded-xl border border-gray-100 dark:border-border shadow-sm overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-gray-100 dark:border-border">
        <div className="flex items-center gap-3 min-w-0">
          {Icon ? (
            <div className="w-10 h-10 rounded-lg bg-[#22C55E]/15 flex items-center justify-center shrink-0">
              <Icon className="h-5 w-5 text-[#22C55E]" />
            </div>
          ) : null}
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-gray-900 dark:text-foreground truncate">
              {module.title}
            </h2>
            <p className="text-xs text-gray-500 dark:text-muted-foreground">Module overview</p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {headerExtra}
          <Link
            href={module.href}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#22C55E] hover:text-[#16A34A] transition-colors"
          >
            Open module
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {module.stats.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {module.stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-lg border border-gray-100 dark:border-border bg-gray-50/50 dark:bg-muted/30 p-3"
              >
                <p className="text-lg font-bold text-gray-900 dark:text-foreground truncate">
                  {stat.value}
                </p>
                <p className="text-xs text-gray-500 dark:text-muted-foreground mt-0.5">{stat.label}</p>
                {typeof stat.change === "number" ? (
                  <div
                    className={`inline-flex items-center gap-0.5 text-xs font-medium mt-1 ${
                      stat.change >= 0 ? "text-green-600" : "text-red-500"
                    }`}
                  >
                    {stat.change >= 0 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {Math.abs(stat.change)}%
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}

        {showChart && module.chart?.data?.length ? (
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-foreground mb-3">
              Revenue trend
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={module.chart.data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={`chart-${module.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22C55E" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "oklch(1 0 0 / 8%)" : "#F3F4F6"} />
                <XAxis dataKey="time" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: "#9CA3AF" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: isDark ? "1px solid oklch(1 0 0 / 12%)" : "1px solid #E5E7EB",
                    background: isDark ? "oklch(0.205 0 0)" : "#ffffff",
                    color: isDark ? "oklch(0.985 0 0)" : "#111827",
                    fontSize: "12px",
                  }}
                  formatter={(v) => [`Rs. ${Number(v).toLocaleString()}`, "Revenue"] as [string, string]}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#22C55E"
                  strokeWidth={2}
                  fill={`url(#chart-${module.id})`}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : null}

        {module.tiles?.length ? (
          <div className="grid grid-cols-2 gap-3">
            {module.tiles.map((tile) => (
              <div
                key={tile.label}
                className={`rounded-xl border p-4 ${tileTone[tile.tone ?? "info"] ?? tileTone.info}`}
              >
                <p className="text-2xl font-bold">{tile.value}</p>
                <p className="text-xs font-medium mt-0.5 opacity-80">{tile.label}</p>
              </div>
            ))}
          </div>
        ) : null}

        {module.lists?.length ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {module.lists.map((list) => (
              <div key={list.title}>
                <h3 className="text-sm font-medium text-gray-900 dark:text-foreground mb-3">
                  {list.title}
                </h3>
                {list.items.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-muted-foreground py-4 text-center">
                    No data yet
                  </p>
                ) : (
                  <div className="space-y-2">
                    {list.items.map((item, index) => (
                      <div
                        key={`${item.primary}-${index}`}
                        className="flex items-center gap-3 rounded-lg border border-gray-100 dark:border-border px-3 py-2.5"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-foreground truncate">
                            {item.primary}
                          </p>
                          {item.secondary ? (
                            <p className="text-xs text-gray-500 dark:text-muted-foreground truncate">
                              {item.secondary}
                            </p>
                          ) : null}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {item.meta ? (
                            <span className="text-xs text-gray-500 dark:text-muted-foreground">
                              {item.meta}
                            </span>
                          ) : null}
                          {item.status ? (
                            <span
                              className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                                statusStyle[item.status] ?? "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {item.status}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
